import { NextRequest, NextResponse } from "next/server";
import { assertValidCustomSlug, getPublicBaseUrl, normalizeUrl, toLinkResponse } from "@/lib/links";
import { getLinksCollection, getClickEventsCollection, getAppStatsCollection, ensureMongoIndexes } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;

  try {
    await ensureMongoIndexes();
    const links = await getLinksCollection();
    const link = await links.findOne({ slug });

    if (!link) {
      return NextResponse.json({ error: "Link não encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      ...toLinkResponse(link.slug, link.url, link.clicks),
      createdAt: link.createdAt.toISOString()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message, baseUrl: getPublicBaseUrl() }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { slug } = await context.params;

  try {
    await ensureMongoIndexes();
    const body = (await request.json()) as { url?: string; slug?: string };
    const newUrl = body.url ? normalizeUrl(body.url) : undefined;
    const newSlug = body.slug ? body.slug.trim() : undefined;

    if (!newUrl && !newSlug) {
      return NextResponse.json({ error: "Informe ao menos a URL ou o novo slug." }, { status: 400 });
    }

    if (newSlug) {
      assertValidCustomSlug(newSlug);
    }

    const links = await getLinksCollection();
    const link = await links.findOne({ slug });

    if (!link) {
      return NextResponse.json({ error: "Link não encontrado." }, { status: 404 });
    }

    if (link.userId && link.userId !== user.id) {
      return NextResponse.json({ error: "Você não tem permissão para editar este link." }, { status: 403 });
    }

    if (newSlug && newSlug !== slug) {
      const existing = await links.findOne({ slug: newSlug });
      if (existing) {
        return NextResponse.json({ error: "Esse novo slug já está em uso." }, { status: 409 });
      }
    }

    const updateFields: { url?: string; slug?: string; updatedAt: Date } = {
      updatedAt: new Date()
    };
    if (newUrl) updateFields.url = newUrl;
    if (newSlug) updateFields.slug = newSlug;

    await links.updateOne({ _id: link._id }, { $set: updateFields });

    const finalSlug = newSlug ?? link.slug;
    const finalUrl = newUrl ?? link.url;

    return NextResponse.json({
      ...toLinkResponse(finalSlug, finalUrl, link.clicks),
      id: link._id!.toString(),
      message: "Link atualizado com sucesso."
    });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 11000) {
      return NextResponse.json({ error: "Esse slug já está em uso." }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Erro ao atualizar link.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { slug } = await context.params;

  try {
    await ensureMongoIndexes();
    const links = await getLinksCollection();
    const clickEvents = await getClickEventsCollection();
    const appStats = await getAppStatsCollection();

    const link = await links.findOne({ slug });
    if (!link) {
      return NextResponse.json({ error: "Link não encontrado." }, { status: 404 });
    }

    if (link.userId && link.userId !== user.id) {
      return NextResponse.json({ error: "Você não tem permissão para excluir este link." }, { status: 403 });
    }

    await links.deleteOne({ _id: link._id });
    if (link._id) {
      await clickEvents.deleteMany({ linkId: link._id.toString() });
    }

    await appStats.updateOne(
      { _id: "global" },
      { $inc: { totalLinks: -1 }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: "Link excluído com sucesso." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir link.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
