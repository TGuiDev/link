import { NextRequest, NextResponse } from "next/server";
import { createApiKeyForUser } from "@/lib/api-keys";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPublicBaseUrl, toLinkResponse } from "@/lib/links";
import { getSupabaseAdmin } from "@/lib/supabase";

type LinkRecord = {
  id: string;
  slug: string;
  url: string;
  clicks: number;
  created_at: string;
};

type ClickEvent = {
  id: string;
  link_id: string;
  country: string | null;
  region: string | null;
  city: string | null;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
};

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: links, error: linksError } = await supabase
    .from("links")
    .select("id,slug,url,clicks,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (linksError) {
    return NextResponse.json({ error: linksError.message }, { status: 500 });
  }

  const linkRows = (links ?? []) as LinkRecord[];
  const linkIds = linkRows.map((link) => link.id);
  let events: ClickEvent[] = [];

  if (linkIds.length > 0) {
    const { data: clickEvents, error: eventsError } = await supabase
      .from("link_click_events")
      .select("id,link_id,country,region,city,referrer,user_agent,created_at")
      .in("link_id", linkIds)
      .order("created_at", { ascending: false })
      .limit(500);

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    events = (clickEvents ?? []) as ClickEvent[];
  }

  const eventCountByLink = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const locationCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();

  for (const event of events) {
    eventCountByLink.set(event.link_id, (eventCountByLink.get(event.link_id) ?? 0) + 1);
    countryCounts.set(event.country ?? "Desconhecido", (countryCounts.get(event.country ?? "Desconhecido") ?? 0) + 1);
    locationCounts.set(getLocationLabel(event), (locationCounts.get(getLocationLabel(event)) ?? 0) + 1);

    const referrer = getReferrerLabel(event.referrer);
    referrerCounts.set(referrer, (referrerCounts.get(referrer) ?? 0) + 1);
  }

  const totalClicks = linkRows.reduce((sum, link) => sum + link.clicks, 0);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email
    },
    apiKey: createApiKeyForUser(user.id),
    summary: {
      links: linkRows.length,
      clicks: totalClicks,
      trackedEvents: events.length
    },
    links: linkRows.map((link) => ({
      ...toLinkResponse(link.slug, link.url, link.clicks),
      id: link.id,
      createdAt: link.created_at,
      trackedEvents: eventCountByLink.get(link.id) ?? 0
    })),
    countries: toRanking(countryCounts),
    locations: toRanking(locationCounts),
    referrers: toRanking(referrerCounts),
    recentEvents: events.slice(0, 20).map((event) => ({
      id: event.id,
      linkId: event.link_id,
      country: event.country ?? "Desconhecido",
      region: event.region,
      city: event.city,
      referrer: event.referrer,
      userAgent: event.user_agent,
      createdAt: event.created_at
    })),
    baseUrl: getPublicBaseUrl()
  });
}

function getLocationLabel(event: ClickEvent) {
  if (event.city && event.region) {
    return `${event.city}, ${event.region}`;
  }

  if (event.city) {
    return event.city;
  }

  if (event.region && event.country) {
    return `${event.region}, ${event.country}`;
  }

  return event.country ?? "Desconhecido";
}

function toRanking(map: Map<string, number>) {
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

function getReferrerLabel(referrer: string | null) {
  if (!referrer) {
    return "Direto";
  }

  try {
    return new URL(referrer).hostname;
  } catch {
    return "Outro";
  }
}
