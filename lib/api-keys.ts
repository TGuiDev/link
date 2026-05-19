import { createHmac, timingSafeEqual } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase";

const API_KEY_PREFIX = "link_";

type ApiKeyPayload = {
  userId: string;
  signature: string;
};

export function createApiKeyForUser(userId: string) {
  const payload = `${userId}.${signUserId(userId)}`;
  return `${API_KEY_PREFIX}${Buffer.from(payload, "utf8").toString("base64url")}`;
}

export async function getUserFromApiKey(apiKey: string): Promise<User | null> {
  const payload = parseApiKey(apiKey);

  if (!payload || !isValidSignature(payload.userId, payload.signature)) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.getUserById(payload.userId);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export function isApiKey(value: string | null | undefined) {
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

function signUserId(userId: string) {
  return createHmac("sha256", getApiKeySecret()).update(userId).digest("base64url");
}

function isValidSignature(userId: string, signature: string) {
  const expected = signUserId(userId);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);
}

function getApiKeySecret() {
  return process.env.API_KEY_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "local-development-api-key-secret";
}
