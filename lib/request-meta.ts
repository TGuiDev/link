import { NextRequest } from "next/server";

export function getClickMetadata(request: NextRequest) {
  return {
    country: normalizeHeader(request.headers.get("x-vercel-ip-country")),
    region: normalizeHeader(request.headers.get("x-vercel-ip-country-region")),
    city: normalizeHeader(request.headers.get("x-vercel-ip-city")),
    referrer: normalizeHeader(request.headers.get("referer")),
    user_agent: normalizeHeader(request.headers.get("user-agent"))
  };
}

function normalizeHeader(value: string | null) {
  if (!value) {
    return null;
  }

  const decoded = decodeURIComponent(value);
  return decoded.slice(0, 500);
}
