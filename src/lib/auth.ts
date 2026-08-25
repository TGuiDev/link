import { NextRequest } from "next/server";
import { getUserFromApiKey, isApiKey, AuthUser } from "@/lib/api-keys";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/jwt";

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;
  const apiKey = request.headers.get("x-api-key") ?? (isApiKey(bearerToken) ? bearerToken : null);

  // 1. Autenticação via API Key
  if (apiKey) {
    return getUserFromApiKey(apiKey);
  }

  // 2. Autenticação via Bearer Token (JWT)
  if (bearerToken && !isApiKey(bearerToken)) {
    const payload = await verifySessionToken(bearerToken);
    if (payload) {
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name ?? null,
        avatarUrl: payload.avatarUrl ?? null
      };
    }
  }

  // 3. Autenticação via Cookie de Sessão HTTP-Only
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) {
    const payload = await verifySessionToken(sessionCookie);
    if (payload) {
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name ?? null,
        avatarUrl: payload.avatarUrl ?? null
      };
    }
  }

  return null;
}
