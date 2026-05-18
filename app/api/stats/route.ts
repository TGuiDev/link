import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data: stats, error: statsError } = await supabase.from("app_stats").select("total_links").eq("id", "global").single();

  if (statsError) {
    const { count: linksCount, error: linksError } = await supabase.from("links").select("id", { count: "exact", head: true });

    if (linksError) {
      return NextResponse.json({ error: linksError.message }, { status: 500 });
    }

    return NextResponse.json({ links: linksCount ?? 0 }, { headers: cacheHeaders });
  }

  return NextResponse.json({ links: stats.total_links ?? 0 }, { headers: cacheHeaders });
}

const cacheHeaders = {
  "Cache-Control": "public, max-age=30, stale-while-revalidate=120"
};
