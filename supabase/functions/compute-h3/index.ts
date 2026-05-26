import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// h3-js works in Deno via esm.sh with no installation needed
import { latLngToCell } from "https://esm.sh/h3-js@4.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, store_id } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "latitude and longitude are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const h3_r5 = latLngToCell(lat, lng, 5);
    const h3_r7 = latLngToCell(lat, lng, 7);
    const h3_r9 = latLngToCell(lat, lng, 9);

    return new Response(
      JSON.stringify({ store_id, h3_r5, h3_r7, h3_r9 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
