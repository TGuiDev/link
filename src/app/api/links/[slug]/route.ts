import { NextResponse } from "next/server";
import { getPublicBaseUrl, toLinkResponse } from "@/lib/links";
import { getLinksCollection } from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;

  try {
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
