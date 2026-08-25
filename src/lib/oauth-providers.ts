export type OAuthProvider = "google" | "github" | "discord";

export type OAuthUserProfile = {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

export function getOAuthRedirectUri(provider: OAuthProvider, customBaseUrl?: string): string {
  const baseUrl = (
    customBaseUrl ??
    process.env.APP_URL ??
    (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_APP_URL
      : null) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://link.guidev.site"
  ).replace(/\/$/, "");
  return `${baseUrl}/api/auth/oauth/${provider}/callback`;
}

export function getOAuthAuthorizationUrl(
  provider: OAuthProvider,
  state: string,
  customBaseUrl?: string
): string {
  const redirectUri = getOAuthRedirectUri(provider, customBaseUrl);

  switch (provider) {
    case "google": {
      const clientId = process.env.AUTH_GOOGLE_ID;
      if (!clientId) throw new Error("AUTH_GOOGLE_ID não está configurado.");
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state,
        access_type: "offline",
        prompt: "select_account"
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    case "github": {
      const clientId = process.env.AUTH_GITHUB_ID;
      if (!clientId) throw new Error("AUTH_GITHUB_ID não está configurado.");
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "read:user user:email",
        state
      });
      return `https://github.com/login/oauth/authorize?${params.toString()}`;
    }

    case "discord": {
      const clientId = process.env.AUTH_DISCORD_ID;
      if (!clientId) throw new Error("AUTH_DISCORD_ID não está configurado.");
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "identify email",
        state
      });
      return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    }

    default:
      throw new Error(`Provedor OAuth não suportado: ${provider}`);
  }
}

export async function exchangeOAuthCodeForProfile(
  provider: OAuthProvider,
  code: string,
  customBaseUrl?: string
): Promise<OAuthUserProfile> {
  const redirectUri = getOAuthRedirectUri(provider, customBaseUrl);

  switch (provider) {
    case "google": {
      const clientId = process.env.AUTH_GOOGLE_ID;
      const clientSecret = process.env.AUTH_GOOGLE_SECRET;
      if (!clientId || !clientSecret) throw new Error("Credenciais do Google não configuradas.");

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description ?? "Erro ao obter token do Google.");
      }

      const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const userData = await userRes.json();

      if (!userData.email) throw new Error("Google não retornou email do usuário.");

      return {
        provider: "google",
        providerAccountId: userData.sub,
        email: userData.email.toLowerCase(),
        name: userData.name ?? userData.email.split("@")[0],
        avatarUrl: userData.picture ?? null
      };
    }

    case "github": {
      const clientId = process.env.AUTH_GITHUB_ID;
      const clientSecret = process.env.AUTH_GITHUB_SECRET;
      if (!clientId || !clientSecret) throw new Error("Credenciais do GitHub não configuradas.");

      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri
        })
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description ?? "Erro ao obter token do GitHub.");
      }

      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "User-Agent": "Link-App"
        }
      });
      const userData = await userRes.json();

      let email = userData.email;
      if (!email) {
        const emailsRes = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "User-Agent": "Link-App"
          }
        });
        const emails = (await emailsRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
        const primary = emails.find((e) => e.primary && e.verified) ?? emails[0];
        email = primary?.email;
      }

      if (!email) throw new Error("GitHub não retornou email verificado para a conta.");

      return {
        provider: "github",
        providerAccountId: String(userData.id),
        email: email.toLowerCase(),
        name: userData.name ?? userData.login,
        avatarUrl: userData.avatar_url ?? null
      };
    }

    case "discord": {
      const clientId = process.env.AUTH_DISCORD_ID;
      const clientSecret = process.env.AUTH_DISCORD_SECRET;
      if (!clientId || !clientSecret) throw new Error("Credenciais do Discord não configuradas.");

      const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "LinkApp (https://link.guidev.site, 1.0.0)"
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri
        })
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        const errorDetail = tokenData.error_description || tokenData.error || tokenData.message || JSON.stringify(tokenData);
        console.error("Erro Discord OAuth:", tokenData);
        throw new Error(`Discord OAuth: ${errorDetail}`);
      }

      const userRes = await fetch("https://discord.com/api/v10/users/@me", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "User-Agent": "LinkApp (https://link.guidev.site, 1.0.0)"
        }
      });
      const userData = await userRes.json();

      if (!userData.email) throw new Error("Discord não retornou email do usuário.");

      let avatarUrl: string | null = null;
      if (userData.avatar) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
      } else {
        const defaultIndex = Number(BigInt(userData.id) >> BigInt(22)) % 6;
        avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
      }

      return {
        provider: "discord",
        providerAccountId: userData.id,
        email: userData.email.toLowerCase(),
        name: userData.global_name ?? userData.username,
        avatarUrl
      };
    }

    default:
      throw new Error(`Provedor não suportado: ${provider}`);
  }
}
