import { NextRequest, NextResponse } from "next/server";
import { generateSlug, normalizeUrl, assertValidCustomSlug, toLinkResponse } from "@/lib/links";
import { getSupabaseAdmin } from "@/lib/supabase";

type CreateLinkPayload = {
  url?: string;
  slug?: string;
  customSlug?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateLinkPayload;
    const originalUrl = normalizeUrl(body.url ?? "");
    const requestedSlug = (body.customSlug ?? body.slug ?? "").trim();
    const supabase = getSupabaseAdmin();

    if (requestedSlug) {
      assertValidCustomSlug(requestedSlug);

      const { data, error } = await supabase
        .from("links")
        .insert({ slug: requestedSlug, url: originalUrl })
        .select("slug,url,clicks")
        .single();

      if (error?.code === "23505") {
        return NextResponse.json({ error: "Esse link customizado ja esta em uso." }, { status: 409 });
      }

      if (error || !data) {
        throw error ?? new Error("Nao foi possivel criar o link.");
      }

      return NextResponse.json(toLinkResponse(data.slug, data.url, data.clicks), { status: 201 });
    }

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const slug = generateSlug(attempt > 3 ? 9 : 7);
      const { data, error } = await supabase
        .from("links")
        .insert({ slug, url: originalUrl })
        .select("slug,url,clicks")
        .single();

      if (error?.code === "23505") {
        continue;
      }

      if (error || !data) {
        throw error ?? new Error("Nao foi possivel criar o link.");
      }

      return NextResponse.json(toLinkResponse(data.slug, data.url, data.clicks), { status: 201 });
    }

    return NextResponse.json({ error: "Nao foi possivel gerar um link unico. Tente novamente." }, { status: 503 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    const status = message.includes("Invalid URL") || message.includes("URL") || message.includes("link customizado") ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
