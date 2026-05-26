import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const storeIds: string[] = Array.isArray(body.storeIds) ? body.storeIds : [];

  if (storeIds.length === 0) {
    return NextResponse.json({ error: "storeIds array is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const [{ data: stores }, { data: insights }, { data: typeRows }] = await Promise.all([
    supabase
      .from("stores")
      .select("id, store_name, city, state, avg_rating, reviews_count")
      .in("id", storeIds),
    supabase
      .from("store_insights")
      .select("store_id, categories, brands, assets, confidence, dominant_category")
      .in("store_id", storeIds),
    supabase
      .from("store_type_analysis")
      .select("store_id, store_type")
      .in("store_id", storeIds),
  ]);

  const insightMap = new Map<string, Record<string, unknown>>();
  for (const row of insights ?? []) insightMap.set(row.store_id, row);

  const typeMap = new Map<string, string>();
  for (const row of typeRows ?? []) typeMap.set(row.store_id, row.store_type);

  const rows = (stores ?? []).map((s) => {
    const insight = insightMap.get(s.id);
    const topBrands = topN(flattenJsonb(insight?.brands), 5).join(", ");
    const topCats = topN(flattenJsonb(insight?.categories), 5).join(", ");
    const assets = insight?.assets as Record<string, unknown> | null;
    const assetList = assets
      ? Object.entries(assets)
          .filter(([, v]) => Boolean(v))
          .map(([k]) => k)
          .join(", ")
      : "";

    return {
      "Store Name": s.store_name ?? "",
      City: s.city ?? "",
      State: s.state ?? "",
      "Store Type": typeMap.get(s.id) ?? "",
      "Avg Rating": s.avg_rating ?? "",
      "Reviews Count": s.reviews_count ?? "",
      Confidence: (insight?.confidence as string | null) ?? "",
      "Dominant Category": (insight?.dominant_category as string | null) ?? "",
      "Top Brands": topBrands,
      "Top Categories": topCats,
      Assets: assetList,
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Stores");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="stores-export.xlsx"`,
    },
  });
}

function flattenJsonb(jsonb: unknown): string[] {
  if (!jsonb || typeof jsonb !== "object") return [];
  const result: string[] = [];
  for (const vals of Object.values(jsonb as Record<string, unknown>)) {
    if (Array.isArray(vals)) result.push(...vals.map(String));
  }
  return result;
}

function topN(items: string[], n: number): string[] {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}
