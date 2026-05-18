import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getClickMetadata } from "@/lib/request-meta";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.from("links").select("id,url").eq("slug", slug).single();

  if (error || !data) {
    return new Response(notFoundHtml(slug), {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    });
  }

  await supabase.rpc("increment_link_clicks", { link_slug: slug });
  await supabase.from("link_click_events").insert({
    link_id: data.id,
    ...getClickMetadata(request)
  });

  return NextResponse.redirect(data.url);
}

function notFoundHtml(slug: string) {
  const safeSlug = slug.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Link nao encontrado | Link</title>
    <style>
      * { box-sizing: border-box; }
      body {
        min-height: 100vh;
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #18181b;
        background:
          radial-gradient(circle at 20% 12%, rgba(52, 211, 153, 0.28), transparent 28rem),
          radial-gradient(circle at 92% 8%, rgba(56, 189, 248, 0.16), transparent 25rem),
          linear-gradient(135deg, #f8faf3 0%, #eef7f1 52%, #f5f0e8 100%);
      }
      main {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        text-align: center;
      }
      .icon {
        width: 64px;
        height: 64px;
        display: grid;
        place-items: center;
        margin: 0 auto 24px;
        border-radius: 18px;
        color: #6ee7b7;
        background: #09090b;
        box-shadow: 0 18px 55px rgba(16, 185, 129, 0.24);
      }
      .eyebrow {
        margin: 0 0 12px;
        color: #047857;
        font-size: 14px;
        font-weight: 900;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }
      h1 {
        max-width: 720px;
        margin: 0 auto;
        font-size: clamp(2.5rem, 8vw, 4.5rem);
        line-height: 0.98;
        letter-spacing: 0;
      }
      p {
        max-width: 560px;
        margin: 18px auto 0;
        color: #3f3f46;
        font-size: 18px;
        line-height: 1.75;
        font-weight: 600;
      }
      .slug {
        display: inline-flex;
        max-width: min(100%, 520px);
        margin-top: 18px;
        padding: 10px 14px;
        overflow-wrap: anywhere;
        border: 1px solid rgba(16, 185, 129, 0.26);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.72);
        color: #065f46;
        font-size: 14px;
        font-weight: 800;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 12px;
        margin-top: 32px;
      }
      a {
        display: inline-flex;
        min-height: 48px;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        padding: 0 20px;
        color: #ffffff;
        background: #09090b;
        font-size: 14px;
        font-weight: 900;
        text-decoration: none;
        box-shadow: 0 16px 32px rgba(9, 9, 11, 0.12);
        transition: transform 180ms ease, background 180ms ease;
      }
      a:hover {
        transform: translateY(-2px);
        background: #047857;
      }
    </style>
  </head>
  <body>
    <main>
      <section>
        <div class="icon" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"></path>
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
        </div>
        <p class="eyebrow">404</p>
        <h1>Esse link nao foi encontrado.</h1>
        <p>O endereco pode ter sido digitado errado, removido ou ainda nao foi criado no Link.</p>
        <span class="slug">link.guidev.site/${safeSlug}</span>
        <div class="actions">
          <a href="/">Voltar ao inicio</a>
        </div>
      </section>
    </main>
  </body>
</html>`;
}
