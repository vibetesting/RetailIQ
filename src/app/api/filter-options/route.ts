import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("company_id");

  const supabase = createServiceClient();

  let storesQ = supabase.from("stores").select("state, city");
  if (companyId) storesQ = storesQ.eq("company_id", companyId);

  const [{ data: storeRows }, { data: typeRows }, { data: insightRows }] = await Promise.all([
    storesQ,
    supabase.from("store_type_analysis").select("store_type"),
    supabase.from("store_insights").select("categories, brands"),
  ]);

  const states = [...new Set((storeRows ?? []).map((r: { state: string | null }) => r.state).filter(Boolean) as string[])].sort();
  const cities = [...new Set((storeRows ?? []).map((r: { city: string | null }) => r.city).filter(Boolean) as string[])].sort();
  const storeTypes = [...new Set((typeRows ?? []).map((r: { store_type: string }) => r.store_type).filter(Boolean))].sort();

  const categorySet = new Set<string>();
  const brandSet = new Set<string>();

  for (const row of insightRows ?? []) {
    for (const item of flattenJsonb(row.categories)) categorySet.add(item);
    for (const item of flattenJsonb(row.brands)) brandSet.add(item);
  }

  return NextResponse.json({
    states,
    cities,
    storeTypes,
    categories: [...categorySet].sort(),
    brands: [...brandSet].sort(),
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
