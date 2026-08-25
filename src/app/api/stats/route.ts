import { NextResponse } from "next/server";
import { getAppStatsCollection, getLinksCollection } from "@/lib/mongodb";

export async function GET() {
  try {
    const appStats = await getAppStatsCollection();
    const stats = await appStats.findOne({ _id: "global" });

    if (stats && typeof stats.totalLinks === "number") {
      return NextResponse.json({ links: stats.totalLinks }, { headers: cacheHeaders });
    }

    const links = await getLinksCollection();
    const count = await links.countDocuments();

    return NextResponse.json({ links: count }, { headers: cacheHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar estatísticas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const cacheHeaders = {
  "Cache-Control": "public, max-age=30, stale-while-revalidate=120"
};
