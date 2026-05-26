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

  const supabase = createServiceClient();

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

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
