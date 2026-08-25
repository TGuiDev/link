import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = {
  userId: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
};

export const SESSION_COOKIE_NAME = "link_session";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? process.env.API_KEY_SECRET ?? "link-fallback-jwt-auth-secret-key-32-chars-long";
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload, expiresIn = "30d"): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.userId || !payload.email) {
      return null;
    }

    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: payload.name ? String(payload.name) : null,
      avatarUrl: payload.avatarUrl ? String(payload.avatarUrl) : null
    };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 30 * 24 * 60 * 60 // 30 dias
  };
}
