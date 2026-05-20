import { NextRequest } from "next/server";

export function getClickMetadata(request: NextRequest) {
  return {
    country: getHeader(request, ["x-vercel-ip-country", "cf-ipcountry"]),
    region: getHeader(request, ["x-vercel-ip-country-region", "cf-region", "cf-region-code"]),
    city: getHeader(request, ["x-vercel-ip-city", "cf-ipcity"]),
    referrer: normalizeHeader(request.headers.get("referer")),
    user_agent: normalizeHeader(request.headers.get("user-agent"))
  };
}

function getHeader(request: NextRequest, names: string[]) {
  for (const name of names) {
    const value = normalizeHeader(request.headers.get(name));

    if (value) {
      return value;
    }
  }

  return null;
}

function normalizeHeader(value: string | null) {
  if (!value) {
    return null;
  }

  const decoded = decodeURIComponent(value);
  return decoded.slice(0, 500);
}
