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
  signature: string;
};

export function createApiKeyForUser(userId: string): string {
  const payload = `${userId}.${signUserId(userId)}`;
  return `${API_KEY_PREFIX}${Buffer.from(payload, "utf8").toString("base64url")}`;
}

export async function getUserFromApiKey(apiKey: string): Promise<AuthUser | null> {
  const payload = parseApiKey(apiKey);

  if (!payload || !isValidSignature(payload.userId, payload.signature)) {
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
    const separatorIndex = decoded.indexOf(".");

    if (separatorIndex <= 0) {
      return null;
    }

    return {
      userId: decoded.slice(0, separatorIndex),
      signature: decoded.slice(separatorIndex + 1)
    };
  } catch {
    return null;
  }
}

function signUserId(userId: string): string {
  return createHmac("sha256", getApiKeySecret()).update(userId).digest("base64url");
}

function isValidSignature(userId: string, signature: string): boolean {
  const expected = signUserId(userId);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);
}

function getApiKeySecret(): string {
  return process.env.API_KEY_SECRET ?? process.env.AUTH_SECRET ?? "link-local-development-api-key-secret";
}
