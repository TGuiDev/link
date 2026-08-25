import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { createApiKeyForUser } from "@/lib/api-keys";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPublicBaseUrl, toLinkResponse } from "@/lib/links";
import { getLinksCollection, getClickEventsCollection, getUsersCollection, ClickEventDocument, ensureMongoIndexes } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    await ensureMongoIndexes();
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
        .limit(1000)
        .toArray();
    }

    const eventCountByLink = new Map<string, number>();
    const countryCounts = new Map<string, number>();
    const referrerCounts = new Map<string, number>();
    const deviceCounts = new Map<string, number>();
    const osCounts = new Map<string, number>();
    const browserCounts = new Map<string, number>();

    for (const event of events) {
      eventCountByLink.set(event.linkId, (eventCountByLink.get(event.linkId) ?? 0) + 1);

      const country = event.country ?? "Desconhecido";
      countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);

      const referrer = event.referrerName || (event.referrer ? getFallbackReferrer(event.referrer) : "Acesso Direto");
      referrerCounts.set(referrer, (referrerCounts.get(referrer) ?? 0) + 1);

      const device = event.device || "Desktop";
      deviceCounts.set(device, (deviceCounts.get(device) ?? 0) + 1);

      const os = event.os || "Outro";
      osCounts.set(os, (osCounts.get(os) ?? 0) + 1);

      const browser = event.browser || "Navegador";
      browserCounts.set(browser, (browserCounts.get(browser) ?? 0) + 1);
    }

    const usersCollection = await getUsersCollection();
    const query = ObjectId.isValid(user.id) ? { _id: new ObjectId(user.id) } : { _id: user.id as unknown as ObjectId };
    const userDoc = await usersCollection.findOne(query);
    const apiKeyVersion = userDoc?.apiKeyVersion ?? 1;

    const totalClicks = userLinks.reduce((sum, link) => sum + link.clicks, 0);

    return NextResponse.json({
      user: {
        id: user.id,
        email: userDoc?.email ?? user.email,
        name: userDoc?.name ?? user.name ?? (user.email ? user.email.split("@")[0] : "Conta"),
        avatarUrl: userDoc?.avatarUrl ?? user.avatarUrl ?? null
      },
      apiKey: createApiKeyForUser(user.id, apiKeyVersion),
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
      referrers: toRanking(referrerCounts),
      devices: toRanking(deviceCounts),
      operatingSystems: toRanking(osCounts),
      browsers: toRanking(browserCounts),
      recentEvents: events.slice(0, 50).map((event) => ({
        id: event._id!.toString(),
        linkId: event.linkId,
        country: event.country ?? "Brasil",
        countryCode: event.countryCode ?? "BR",
        region: event.region,
        city: event.city,
        referrer: event.referrer,
        referrerName: event.referrerName || (event.referrer ? getFallbackReferrer(event.referrer) : "Acesso Direto"),
        device: event.device || "Desktop",
        os: event.os || "Outro",
        browser: event.browser || "Navegador",
        qr: Boolean(event.qr),
        ip: event.ip || null,
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

function toRanking(map: Map<string, number>) {
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

function getFallbackReferrer(referrer: string) {
  try {
    const host = new URL(referrer).hostname.replace(/^www\./i, "");
    if (host.includes("google")) return "Google";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("twitter") || host.includes("t.co") || host.includes("x.com")) return "X / Twitter";
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("whatsapp")) return "WhatsApp";
    if (host.includes("facebook")) return "Facebook";
    if (host.includes("youtube")) return "YouTube";
    return host;
  } catch {
    return "Outro";
  }
}
