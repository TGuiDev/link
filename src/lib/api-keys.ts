import { createHmac, timingSafeEqual } from "node:crypto";
import { ObjectId } from "mongodb";
import { getUsersCollection } from "@/lib/mongodb";

const API_KEY_PREFIX = "link_";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
};

type ApiKeyPayload = {
  userId: string;
  version: number;
  signature: string;
};

export function createApiKeyForUser(userId: string, version = 1): string {
  const v = version || 1;
  const payload = `${userId}.${v}.${signUserVersion(userId, v)}`;
  return `${API_KEY_PREFIX}${Buffer.from(payload, "utf8").toString("base64url")}`;
}

export async function getUserFromApiKey(apiKey: string): Promise<AuthUser | null> {
  const payload = parseApiKey(apiKey);

  if (!payload) {
    return null;
  }

  try {
    const users = await getUsersCollection();
    const query = ObjectId.isValid(payload.userId)
      ? { _id: new ObjectId(payload.userId) }
      : { _id: payload.userId as unknown as ObjectId };

    const user = await users.findOne(query);

    if (!user || !user._id) {
      return null;
    }

    const currentVersion = user.apiKeyVersion ?? 1;
    if (payload.version !== currentVersion) {
      return null;
    }

    if (!isValidSignature(payload.userId, payload.version, payload.signature)) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name ?? null,
      avatarUrl: user.avatarUrl ?? null
    };
  } catch {
    return null;
  }
}

export function isApiKey(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith(API_KEY_PREFIX));
}

function parseApiKey(apiKey: string): ApiKeyPayload | null {
  if (!apiKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  try {
    const decoded = Buffer.from(apiKey.slice(API_KEY_PREFIX.length), "base64url").toString("utf8");
    const parts = decoded.split(".");

    if (parts.length === 3) {
      const [userId, versionStr, signature] = parts;
      const version = parseInt(versionStr, 10);
      if (!userId || isNaN(version) || !signature) return null;
      return { userId, version, signature };
    }

    // Suporte legado
    if (parts.length === 2) {
      const [userId, signature] = parts;
      if (!userId || !signature) return null;
      return { userId, version: 1, signature };
    }

    return null;
  } catch {
    return null;
  }
}

function signUserVersion(userId: string, version: number): string {
  return createHmac("sha256", getApiKeySecret()).update(`${userId}.${version}`).digest("base64url");
}

function isValidSignature(userId: string, version: number, signature: string): boolean {
  const expected = signUserVersion(userId, version);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) {
    // Tenta assinatura legada se version for 1
    if (version === 1) {
      const legacyExpected = createHmac("sha256", getApiKeySecret()).update(userId).digest("base64url");
      const legacyBuffer = Buffer.from(legacyExpected);
      return signatureBuffer.length === legacyBuffer.length && timingSafeEqual(signatureBuffer, legacyBuffer);
    }
    return false;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer);
}

function getApiKeySecret(): string {
  return process.env.API_KEY_SECRET ?? process.env.AUTH_SECRET ?? "link-local-development-api-key-secret";
}
