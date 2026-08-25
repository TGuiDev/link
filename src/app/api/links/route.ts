import { NextRequest, NextResponse } from "next/server";
import { generateSlug, normalizeUrl, assertValidCustomSlug, toLinkResponse } from "@/lib/links";
import { getLinksCollection, getAppStatsCollection, ensureMongoIndexes } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/auth";

type CreateLinkPayload = {
  url?: string;
  slug?: string;
  customSlug?: string;
};

export async function POST(request: NextRequest) {
  try {
    await ensureMongoIndexes();
    const body = (await request.json()) as CreateLinkPayload;
    const originalUrl = normalizeUrl(body.url ?? "");
    const requestedSlug = (body.customSlug ?? body.slug ?? "").trim();
    const user = await getAuthenticatedUser(request);
    const userId = user?.id ?? null;
    const links = await getLinksCollection();
    const appStats = await getAppStatsCollection();
    const now = new Date();

    if (requestedSlug) {
      assertValidCustomSlug(requestedSlug);

      try {
        const result = await links.insertOne({
          userId,
          slug: requestedSlug,
          url: originalUrl,
          clicks: 0,
          createdAt: now,
          updatedAt: now
        });

        await appStats.updateOne(
          { _id: "global" },
          { $inc: { totalLinks: 1 }, $set: { updatedAt: now } },
          { upsert: true }
        );

        return NextResponse.json(
          { ...toLinkResponse(requestedSlug, originalUrl, 0), id: result.insertedId.toString() },
          { status: 201 }
        );
      } catch (error: unknown) {
        if (typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 11000) {
          return NextResponse.json({ error: "Esse link customizado já está em uso." }, { status: 409 });
        }
        throw error;
      }
    }

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const slug = generateSlug(attempt > 3 ? 9 : 7);

      try {
        const result = await links.insertOne({
          userId,
          slug,
          url: originalUrl,
          clicks: 0,
          createdAt: now,
          updatedAt: now
        });

        await appStats.updateOne(
          { _id: "global" },
          { $inc: { totalLinks: 1 }, $set: { updatedAt: now } },
          { upsert: true }
        );

        return NextResponse.json(
          { ...toLinkResponse(slug, originalUrl, 0), id: result.insertedId.toString() },
          { status: 201 }
        );
      } catch (error: unknown) {
        if (typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 11000) {
          continue;
        }
        throw error;
      }
    }

    return NextResponse.json({ error: "Não foi possível gerar um link único. Tente novamente." }, { status: 503 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    const status = message.includes("Invalid URL") || message.includes("URL") || message.includes("link customizado") ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
