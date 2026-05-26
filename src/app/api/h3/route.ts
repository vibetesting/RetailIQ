import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const resolution = parseInt(searchParams.get("resolution") ?? "7");
  const companyId = searchParams.get("company_id");

  // Accept a comma-separated list of h3_index values to fetch
  const cells = searchParams.get("cells");

  if (!cells) {
    return NextResponse.json(
      { error: "Missing required param: cells (comma-separated H3 indexes)" },
      { status: 400 }
    );
  }

  const cellList = cells.split(",").filter(Boolean);

  if (cellList.length === 0 || cellList.length > 500) {
    return NextResponse.json(
      { error: "cells must be between 1 and 500 values" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  let query = supabase
    .from("h3_insights")
    .select(
      "id, h3_index, resolution, store_count, avg_rating, dominant_category, brand_penetration, category_mix, whitespace_score"
    )
    .in("h3_index", cellList)
    .eq("resolution", resolution);

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
