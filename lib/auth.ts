import { NextRequest } from "next/server";
import { getUserFromApiKey, isApiKey } from "@/lib/api-keys";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function getAuthenticatedUser(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;
  const apiKey = request.headers.get("x-api-key") ?? (isApiKey(bearerToken) ? bearerToken : null);

  if (apiKey) {
    return getUserFromApiKey(apiKey);
  }

  if (!bearerToken) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(bearerToken);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}
