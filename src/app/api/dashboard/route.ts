import { NextRequest, NextResponse } from "next/server";
import { createApiKeyForUser } from "@/lib/api-keys";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPublicBaseUrl, toLinkResponse } from "@/lib/links";
import { getLinksCollection, getClickEventsCollection, ClickEventDocument } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const linksCollection = await getLinksCollection();
    const clickEventsCollection = await getClickEventsCollection();

    const userLinks = await linksCollection
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    const linkIds = userLinks.map((l) => l._id!.toString());
    let events: ClickEventDocument[] = [];

    if (linkIds.length > 0) {
      events = await clickEventsCollection
        .find({ linkId: { $in: linkIds } })
        .sort({ createdAt: -1 })
        .limit(500)
        .toArray();
    }

    const eventCountByLink = new Map<string, number>();
    const countryCounts = new Map<string, number>();
    const locationCounts = new Map<string, number>();
    const referrerCounts = new Map<string, number>();

    for (const event of events) {
      eventCountByLink.set(event.linkId, (eventCountByLink.get(event.linkId) ?? 0) + 1);
      countryCounts.set(event.country ?? "Desconhecido", (countryCounts.get(event.country ?? "Desconhecido") ?? 0) + 1);
      locationCounts.set(getLocationLabel(event), (locationCounts.get(getLocationLabel(event)) ?? 0) + 1);

      const referrer = getReferrerLabel(event.referrer);
      referrerCounts.set(referrer, (referrerCounts.get(referrer) ?? 0) + 1);
    }

    const totalClicks = userLinks.reduce((sum, link) => sum + link.clicks, 0);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      },
      apiKey: createApiKeyForUser(user.id),
      summary: {
        links: userLinks.length,
        clicks: totalClicks,
        trackedEvents: events.length
      },
      links: userLinks.map((link) => ({
        ...toLinkResponse(link.slug, link.url, link.clicks),
        id: link._id!.toString(),
        createdAt: link.createdAt.toISOString(),
        trackedEvents: eventCountByLink.get(link._id!.toString()) ?? 0
      })),
      countries: toRanking(countryCounts),
      locations: toRanking(locationCounts),
      referrers: toRanking(referrerCounts),
      recentEvents: events.slice(0, 20).map((event) => ({
        id: event._id!.toString(),
        linkId: event.linkId,
        country: event.country ?? "Desconhecido",
        region: event.region,
        city: event.city,
        referrer: event.referrer,
        userAgent: event.userAgent,
        createdAt: event.createdAt.toISOString()
      })),
      baseUrl: getPublicBaseUrl()
    });
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    const message = error instanceof Error ? error.message : "Erro ao consultar dados.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getLocationLabel(event: ClickEventDocument) {
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
