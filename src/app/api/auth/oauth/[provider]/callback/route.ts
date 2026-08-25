import { NextRequest, NextResponse } from "next/server";
import { getUsersCollection, ensureMongoIndexes } from "@/lib/mongodb";
import { exchangeOAuthCodeForProfile, OAuthProvider } from "@/lib/oauth-providers";
import { signSessionToken, getSessionCookieOptions } from "@/lib/jwt";

type RouteContext = {
  params: Promise<{
    provider: string;
  }>;
};

const VALID_PROVIDERS = new Set<OAuthProvider>(["google", "github", "discord"]);

export async function GET(request: NextRequest, context: RouteContext) {
  const { provider } = await context.params;
  const cookieOrigin = request.cookies.get(`oauth_origin_${provider}`)?.value;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  const currentOrigin = host ? `${proto}://${host}` : request.nextUrl.origin;

  const baseUrl = (
    cookieOrigin ??
    process.env.APP_URL ??
    (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_APP_URL
      : null) ??
    (currentOrigin.includes("localhost") ? currentOrigin : null) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    currentOrigin
  ).replace(/\/$/, "");

  if (!VALID_PROVIDERS.has(provider as OAuthProvider)) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent("Provedor inválido.")}`);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error_description") ?? searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent("Código de autorização não recebido.")}`);
  }

  try {
    await ensureMongoIndexes();
    const profile = await exchangeOAuthCodeForProfile(provider as OAuthProvider, code, baseUrl);
    const users = await getUsersCollection();
    const now = new Date();

    // 1. Procura se o usuário já existe pela conta OAuth ou pelo email
    let user = await users.findOne({
      $or: [
        { "accounts.provider": profile.provider, "accounts.providerAccountId": profile.providerAccountId },
        { email: profile.email }
      ]
    });

    if (!user) {
      // Cria novo usuário
      const insertResult = await users.insertOne({
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        passwordHash: null,
        accounts: [
          {
            provider: profile.provider,
            providerAccountId: profile.providerAccountId
          }
        ],
        createdAt: now,
        updatedAt: now
      });

      user = {
        _id: insertResult.insertedId,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        createdAt: now,
        updatedAt: now
      };
    } else {
      // Atualiza e vincula conta se necessário
      const accountExists = user.accounts?.some(
        (acc) => acc.provider === profile.provider && acc.providerAccountId === profile.providerAccountId
      );

      const updateOps: Record<string, unknown> = {
        updatedAt: now
      };

      if (profile.avatarUrl) {
        updateOps.avatarUrl = profile.avatarUrl;
      }
      if (profile.name) {
        updateOps.name = profile.name;
      }

      await users.updateOne(
        { _id: user._id },
        {
          $set: updateOps,
          ...(!accountExists
            ? {
                $push: {
                  accounts: {
                    provider: profile.provider,
                    providerAccountId: profile.providerAccountId
                  }
                }
              }
            : {})
        }
      );
    }

    const userId = user._id!.toString();
    const sessionToken = await signSessionToken({
      userId,
      email: user.email,
      name: profile.name || user.name || null,
      avatarUrl: profile.avatarUrl || user.avatarUrl || null
    });

    const response = NextResponse.redirect(`${baseUrl}/dashboard`);
    const cookieOptions = getSessionCookieOptions();
    response.cookies.set(cookieOptions.name, sessionToken, cookieOptions);

    return response;
  } catch (oauthError) {
    console.error("Erro no callback OAuth:", oauthError);
    const message = oauthError instanceof Error ? oauthError.message : "Falha na autenticação social.";
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(message)}`);
  }
}
