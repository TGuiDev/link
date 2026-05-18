import { NextResponse } from "next/server";
import { getPublicBaseUrl, toLinkResponse } from "@/lib/links";
import { getSupabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("links")
      .select("slug,url,clicks")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Link nao encontrado." }, { status: 404 });
    }

    return NextResponse.json(toLinkResponse(data.slug, data.url, data.clicks));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message, baseUrl: getPublicBaseUrl() }, { status: 500 });
  }
}
