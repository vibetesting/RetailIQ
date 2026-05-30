import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { CachedStore } from "@/types";

// Supabase PostgREST uses HTTP GET for .in() filters, putting all IDs in the URL.
// At 36 chars/UUID + comma = 37 chars × 500 IDs = ~18KB URL → 414 error on most servers.
// Cap at 200 IDs per batch to stay well under the ~8KB safe URL limit.
const BATCH_SIZE = 200;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function inBatches(ids: string[], fetcher: (batch: string[]) => Promise<any[]>): Promise<any[]> {
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    batches.push(ids.slice(i, i + BATCH_SIZE));
  }
  const results = await Promise.all(batches.map(fetcher));
  return results.flat();
}

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

  // Batch both joins in parallel — avoids 414 URL Too Long for large stores tables
  const [typeRows, insightRows] = await Promise.all([
    inBatches(storeIds, async (batch) => {
      const { data } = await supabase
        .from("store_type_analysis")
        .select("store_id, store_type, raw_store_type, weighted_scores, confidence")
        .in("store_id", batch);
      return data ?? [];
    }),
    inBatches(storeIds, async (batch) => {
      const { data } = await supabase
        .from("store_insights")
        .select("store_id, categories, brands, dominant_category, confidence, image_count, assets")
        .in("store_id", batch);
      return data ?? [];
    }),
  ]);

  const typeMap = new Map(typeRows.map((r) => [r.store_id as string, r]));
  const insightMap = new Map(insightRows.map((r) => [r.store_id as string, r]));

  const result: CachedStore[] = rawStores.map((s) => {
    const typeRow = typeMap.get(s.id);
    const insightRow = insightMap.get(s.id);
    return {
      ...s,
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
