import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [storeRes, insightRes, typeRes] = await Promise.all([
    supabase
      .from("stores")
      .select(
        "id, store_name, place_id, latitude, longitude, city, state, avg_rating, reviews_count, phone, website, company_id, h3_r5, h3_r7, h3_r9",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("store_insights")
      .select("store_id, categories, brands, dominant_category, confidence, image_count, assets")
      .eq("store_id", id)
      .maybeSingle(),
    supabase
      .from("store_type_analysis")
      .select("store_id, store_type, raw_store_type, weighted_scores, confidence")
      .eq("store_id", id)
      .maybeSingle(),
  ]);

  if (storeRes.error || !storeRes.data) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...storeRes.data,
    insight: insightRes.data ?? undefined,
    storeType: typeRes.data ?? undefined,
  });
}
