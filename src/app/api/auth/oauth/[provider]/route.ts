import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getOAuthAuthorizationUrl, OAuthProvider } from "@/lib/oauth-providers";

type RouteContext = {
  params: Promise<{
    provider: string;
  }>;
};

const VALID_PROVIDERS = new Set<OAuthProvider>(["google", "github", "discord"]);

export async function GET(request: NextRequest, context: RouteContext) {
  const { provider } = await context.params;

  if (!VALID_PROVIDERS.has(provider as OAuthProvider)) {
    return NextResponse.json({ error: "Provedor OAuth inválido." }, { status: 400 });
  }

  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
    const detectedOrigin = host ? `${proto}://${host}` : request.nextUrl.origin;

    const baseUrl = (
      process.env.APP_URL ??
      (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_APP_URL
        : null) ??
      (detectedOrigin.includes("localhost") ? detectedOrigin : null) ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
      detectedOrigin
    ).replace(/\/$/, "");

    const state = randomBytes(16).toString("hex");
    const authUrl = getOAuthAuthorizationUrl(provider as OAuthProvider, state, baseUrl);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set(`oauth_state_${provider}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10 // 10 minutos
    });
    response.cookies.set(`oauth_origin_${provider}`, baseUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao iniciar OAuth.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
