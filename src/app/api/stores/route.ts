import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const north = parseFloat(searchParams.get("north") ?? "");
  const south = parseFloat(searchParams.get("south") ?? "");
  const east = parseFloat(searchParams.get("east") ?? "");
  const west = parseFloat(searchParams.get("west") ?? "");
  const companyId = searchParams.get("company_id");

  if ([north, south, east, west].some(isNaN)) {
    return NextResponse.json(
      { error: "Missing or invalid bbox params: north, south, east, west" },
      { status: 400 }
    );
  }

  const state = searchParams.get("state") ?? "";
  const city = searchParams.get("city") ?? "";
  const minRating = searchParams.get("min_rating") ? parseFloat(searchParams.get("min_rating")!) : null;
  const maxRating = searchParams.get("max_rating") ? parseFloat(searchParams.get("max_rating")!) : null;
  const minReviews = searchParams.get("min_reviews") ? parseInt(searchParams.get("min_reviews")!) : null;

  const storeTypes = (searchParams.get("store_types") ?? "").split(",").filter(Boolean);
  const brandsIdentified = searchParams.get("brands_identified") ?? "any";
  const categoriesIdentified = searchParams.get("categories_identified") ?? "any";
  const selectedCategories = (searchParams.get("categories") ?? "").split(",").filter(Boolean);
  const selectedBrands = (searchParams.get("brands") ?? "").split(",").filter(Boolean);
  const selectedAssets = (searchParams.get("assets") ?? "").split(",").filter(Boolean);
  const selectedConfidence = (searchParams.get("confidence") ?? "").split(",").filter(Boolean);

  const supabase = createServiceClient();

  // Phase 1: bbox + simple column filters
  let query = supabase
    .from("stores")
    .select(
      "id, store_name, latitude, longitude, city, state, avg_rating, reviews_count, h3_r5, h3_r7, h3_r9, company_id"
    )
    .gte("latitude", south)
    .lte("latitude", north)
    .gte("longitude", west)
    .lte("longitude", east)
    .limit(500);

  if (companyId) query = query.eq("company_id", companyId);
  if (state) query = query.eq("state", state);
  if (city) query = query.eq("city", city);
  if (minRating !== null) query = query.gte("avg_rating", minRating);
  if (maxRating !== null) query = query.lte("avg_rating", maxRating);
  if (minReviews !== null) query = query.gte("reviews_count", minReviews);

  const { data: stores, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!stores || stores.length === 0) return NextResponse.json([]);

  // Phase 2: joined-table filtering (only when needed)
  const needsTypeFilter = storeTypes.length > 0;
  const needsInsightFilter =
    brandsIdentified !== "any" ||
    categoriesIdentified !== "any" ||
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    selectedAssets.length > 0 ||
    selectedConfidence.length > 0;

  if (!needsTypeFilter && !needsInsightFilter) {
    return NextResponse.json(stores);
  }

  const storeIds = stores.map((s) => s.id);
  const keepIds = new Set<string>(storeIds);

  if (needsTypeFilter) {
    const { data: typeRows } = await supabase
      .from("store_type_analysis")
      .select("store_id")
      .in("store_id", storeIds)
      .in("store_type", storeTypes);
    const typeSet = new Set((typeRows ?? []).map((r: { store_id: string }) => r.store_id));
    for (const id of Array.from(keepIds)) {
      if (!typeSet.has(id)) keepIds.delete(id);
    }
  }

  if (needsInsightFilter && keepIds.size > 0) {
    const { data: insightRows } = await supabase
      .from("store_insights")
      .select("store_id, categories, brands, assets, confidence")
      .in("store_id", Array.from(keepIds));

    const insightMap = new Map<string, Record<string, unknown>>();
    for (const row of insightRows ?? []) {
      insightMap.set(row.store_id, row);
    }

    for (const id of Array.from(keepIds)) {
      const insight = insightMap.get(id);

      if (brandsIdentified === "yes" && (!insight || !hasBrands(insight.brands))) { keepIds.delete(id); continue; }
      if (brandsIdentified === "no" && insight && hasBrands(insight.brands)) { keepIds.delete(id); continue; }
      if (categoriesIdentified === "yes" && (!insight || !hasCategories(insight.categories))) { keepIds.delete(id); continue; }
      if (categoriesIdentified === "no" && insight && hasCategories(insight.categories)) { keepIds.delete(id); continue; }

      if (selectedConfidence.length > 0) {
        const conf = ((insight?.confidence as string | null) ?? "").toLowerCase();
        if (!selectedConfidence.map((c) => c.toLowerCase()).includes(conf)) { keepIds.delete(id); continue; }
      }

      if (selectedCategories.length > 0) {
        const cats = flattenJsonb(insight?.categories);
        if (!selectedCategories.every((c) => cats.includes(c))) { keepIds.delete(id); continue; }
      }

      if (selectedBrands.length > 0) {
        const brs = flattenJsonb(insight?.brands);
        if (!selectedBrands.every((b) => brs.includes(b))) { keepIds.delete(id); continue; }
      }

      if (selectedAssets.length > 0) {
        const assets = (insight?.assets ?? {}) as Record<string, unknown>;
        if (!selectedAssets.every((a) => Boolean(assets[a]))) { keepIds.delete(id); continue; }
      }
    }
  }

  return NextResponse.json(stores.filter((s) => keepIds.has(s.id)));
}

function flattenJsonb(jsonb: unknown): string[] {
  if (!jsonb || typeof jsonb !== "object") return [];
  const result: string[] = [];
  for (const vals of Object.values(jsonb as Record<string, unknown>)) {
    if (Array.isArray(vals)) result.push(...vals.map(String));
  }
  return result;
}

function hasBrands(brands: unknown): boolean {
  return flattenJsonb(brands).length > 0;
}

function hasCategories(categories: unknown): boolean {
  return flattenJsonb(categories).length > 0;
}
