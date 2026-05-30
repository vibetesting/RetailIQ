import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { CachedStore } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("company_id");
  const supabase = createServiceClient();

  let storeQuery = supabase
    .from("stores")
    .select(
      "id, store_name, latitude, longitude, city, state, avg_rating, reviews_count, " +
      "phone, website, place_id, h3_r5, h3_r7, h3_r9, company_id",
    )
    .limit(5000);

  if (companyId) storeQuery = storeQuery.eq("company_id", companyId);

  const { data: rawData, error: storeError } = await storeQuery;
  if (storeError) return NextResponse.json({ error: storeError.message }, { status: 500 });
  if (!rawData?.length) return NextResponse.json([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawStores = rawData as any[];
  const storeIds: string[] = rawStores.map((s) => s.id);

  const [typeResult, insightResult] = await Promise.all([
    supabase
      .from("store_type_analysis")
      .select("store_id, store_type, raw_store_type, weighted_scores, confidence")
      .in("store_id", storeIds),
    supabase
      .from("store_insights")
      .select("store_id, categories, brands, dominant_category, confidence, image_count, assets")
      .in("store_id", storeIds),
  ]);

  const typeMap = new Map(
    (typeResult.data ?? []).map((r: Record<string, unknown>) => [r.store_id as string, r]),
  );
  const insightMap = new Map(
    (insightResult.data ?? []).map((r: Record<string, unknown>) => [r.store_id as string, r]),
  );

  const result: CachedStore[] = (rawStores as Record<string, unknown>[]).map((s) => {
    const typeRow = typeMap.get(s.id as string);
    const insightRow = insightMap.get(s.id as string);
    return {
      ...(s as unknown as CachedStore),
      storeType: typeRow
        ? {
            id: typeRow.store_id as string,
            store_id: typeRow.store_id as string,
            store_type: typeRow.store_type as string,
            raw_store_type: (typeRow.raw_store_type as string | null) ?? null,
            weighted_scores: (typeRow.weighted_scores as Record<string, number>) ?? {},
            confidence: (typeRow.confidence as number) ?? 0,
          }
        : undefined,
      insight: insightRow
        ? {
            categories: (insightRow.categories as Record<string, string[]>) ?? {},
            brands: (insightRow.brands as Record<string, string[]>) ?? {},
            dominant_category: (insightRow.dominant_category as string | null) ?? null,
            confidence: (insightRow.confidence as string | null) ?? null,
            image_count: (insightRow.image_count as number) ?? 0,
            assets: (insightRow.assets as Record<string, unknown>) ?? {},
          }
        : undefined,
    };
  });

  return NextResponse.json(result);
}
