import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
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
    <title>Link não encontrado | Link</title>
    <style>
      * { box-sizing: border-box; }
      body {
        min-height: 100vh;
        margin: 0;
        font-family: "Nunito Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #ffffff;
        background: #09090b;
      }
      main {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      section {
        width: min(100%, 1040px);
        display: grid;
        grid-template-columns: 0.95fr 1fr;
        align-items: center;
        gap: 56px;
      }
      .media {
        width: min(100%, 420px);
        margin: 0 auto;
      }
      .logo {
        width: 56px;
        height: 56px;
        margin: 0 0 28px;
        border-radius: 14px;
        object-fit: contain;
      }
      .illustration {
        width: 100%;
        color: #d4d4d8;
      }
      .copy {
        text-align: left;
      }
      .illustration {
        color: #d4d4d8;
      }
      .illustration svg {
        width: 100%;
        height: auto;
        display: block;
      }
      .eyebrow {
        margin: 0 0 12px;
        color: #71717a;
        font-size: 14px;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      h1 {
        max-width: 720px;
        margin: 0;
        font-size: clamp(2.5rem, 8vw, 4.5rem);
        line-height: 0.98;
        letter-spacing: 0;
      }
      p {
        max-width: 560px;
        margin: 18px 0 0;
        color: #a1a1aa;
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
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        background: #18181b;
        color: #e4e4e7;
        font-size: 14px;
        font-weight: 800;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        gap: 12px;
        margin-top: 32px;
      }
      a {
        display: inline-flex;
        min-height: 48px;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        padding: 0 20px;
        color: #09090b;
        background: #ffffff;
        font-size: 14px;
        font-weight: 900;
        text-decoration: none;
        transition: background 180ms ease, transform 180ms ease;
      }
      a:hover {
        transform: translateY(-2px);
        background: #e4e4e7;
      }
      @media (max-width: 840px) {
        section {
          grid-template-columns: 1fr;
          gap: 32px;
          text-align: center;
        }
        .media {
          max-width: 340px;
        }
        .logo {
          margin-inline: auto;
        }
        .copy {
          text-align: center;
        }
        h1,
        p {
          margin-left: auto;
          margin-right: auto;
        }
        .actions {
          justify-content: center;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section>
        <div class="media">
          <img class="logo" src="/Dark_Theme_Logo.svg" alt="Link" loading="eager" fetchpriority="high" />
          <div class="illustration" aria-hidden="true">
            <svg viewBox="0 0 360 260" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="40" y="48" width="280" height="150" rx="24" fill="#18181B" stroke="#3F3F46"/>
              <path d="M98 126h164" stroke="#71717A" stroke-width="14" stroke-linecap="round"/>
              <path d="M128 91h104" stroke="#52525B" stroke-width="12" stroke-linecap="round"/>
              <path d="M112 164h132" stroke="#27272A" stroke-width="12" stroke-linecap="round"/>
              <path d="M67 33 43 9M293 33l24-24M72 227l-31 12M288 227l31 12" stroke="#52525B" stroke-width="8" stroke-linecap="round"/>
              <circle cx="51" cy="111" r="10" fill="#27272A"/>
              <circle cx="315" cy="130" r="8" fill="#27272A"/>
              <circle cx="180" cy="126" r="45" fill="#09090B" stroke="#A1A1AA" stroke-width="9"/>
              <path d="m203 103-46 46M157 103l46 46" stroke="#F4F4F5" stroke-width="10" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
        <div class="copy">
          <p class="eyebrow">404</p>
          <h1>Esse link não foi encontrado.</h1>
          <p>O endereço pode ter sido digitado errado, removido ou ainda não foi criado no Link.</p>
          <span class="slug">link.guidev.site/${safeSlug}</span>
          <div class="actions">
            <a href="/">Voltar ao início</a>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>`;
}
