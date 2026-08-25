import { NextRequest } from "next/server";

export type EnrichedClickMeta = {
  country: string;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  referrer: string | null;
  referrerName: string;
  device: "Mobile" | "Tablet" | "Desktop" | "Bot";
  os: string;
  browser: string;
  userAgent: string | null;
  qr: boolean;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  ip: string | null;
};

// Cache em memória de GeoIP para resposta instantânea (<0.1ms) e evitar requisições repetidas
const geoCache = new Map<string, { country: string; countryCode: string; region: string | null; city: string | null; exp: number }>();

const COUNTRY_NAMES: Record<string, string> = {
  BR: "Brasil",
  US: "Estados Unidos",
  PT: "Portugal",
  AR: "Argentina",
  CL: "Chile",
  UY: "Uruguai",
  PY: "Paraguai",
  CO: "Colômbia",
  PE: "Peru",
  MX: "México",
  ES: "Espanha",
  FR: "França",
  DE: "Alemanha",
  GB: "Reino Unido",
  UK: "Reino Unido",
  IT: "Itália",
  CA: "Canadá",
  JP: "Japão",
  CN: "China",
  IN: "Índia",
  AU: "Austrália",
  NZ: "Nova Zelândia",
  RU: "Rússia",
  NL: "Holanda",
  BE: "Bélgica",
  CH: "Suíça",
  SE: "Suécia",
  NO: "Noruega",
  DK: "Dinamarca",
  FI: "Finlândia",
  PL: "Polônia",
  IE: "Irlanda",
  AO: "Angola",
  MZ: "Moçambique",
  CV: "Cabo Verde"
};

export async function extractClickMetadata(request: NextRequest): Promise<EnrichedClickMeta> {
  const url = new URL(request.url);
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;
  const rawReferer = request.headers.get("referer")?.slice(0, 500) ?? null;

  // 1. Extração de IP
  const rawIp = extractClientIp(request);
  const maskedIp = rawIp ? maskIp(rawIp) : null;

  // 2. Extração de UTMs e QR Code
  const qrParam = url.searchParams.get("qr") || url.searchParams.get("src") || url.searchParams.get("ref");
  const isQr = qrParam === "qr" || qrParam === "1" || qrParam === "qrcode";
  const utmSource = url.searchParams.get("utm_source")?.slice(0, 100) ?? null;
  const utmMedium = url.searchParams.get("utm_medium")?.slice(0, 100) ?? null;
  const utmCampaign = url.searchParams.get("utm_campaign")?.slice(0, 100) ?? null;

  // 3. User-Agent parsing (Device, OS, Browser)
  const { device, os, browser } = parseUserAgent(userAgent);

  // 4. Referrer recognition
  const referrerName = parseReferrerName(rawReferer, utmSource, isQr);

  // 5. Geolocalização (Headers -> Cache -> Fallback)
  const geo = await resolveGeoLocation(request, rawIp);

  return {
    country: geo.country,
    countryCode: geo.countryCode,
    region: geo.region,
    city: geo.city,
    referrer: rawReferer,
    referrerName,
    device,
    os,
    browser,
    userAgent,
    qr: isQr,
    utmSource,
    utmMedium,
    utmCampaign,
    ip: maskedIp
  };
}

function extractClientIp(request: NextRequest): string | null {
  const headers = [
    "cf-connecting-ip",
    "x-real-ip",
    "x-client-ip",
    "x-forwarded-for"
  ];

  for (const name of headers) {
    const value = request.headers.get(name);
    if (value) {
      const firstIp = value.split(",")[0].trim().replace(/:\d+$/, "");
      if (firstIp && !isPrivateIp(firstIp)) {
        return firstIp;
      }
    }
  }

  return null;
}

function isPrivateIp(ip: string): boolean {
  return (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.3") ||
    ip.startsWith("fc00:") ||
    ip.startsWith("fe80:")
  );
}

function maskIp(ip: string): string {
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
  }
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return parts.slice(0, 3).join(":") + ":****";
  }
  return ip;
}

async function resolveGeoLocation(
  request: NextRequest,
  ip: string | null
): Promise<{ country: string; countryCode: string | null; region: string | null; city: string | null }> {
  // A) Verificação em headers de borda (Cloudflare / Vercel / Nginx)
  const headerCountry =
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("x-country-code") ||
    request.headers.get("x-geo-country");

  const headerCity =
    request.headers.get("cf-ipcity") ||
    request.headers.get("x-vercel-ip-city") ||
    request.headers.get("x-geo-city");

  const headerRegion =
    request.headers.get("cf-region") ||
    request.headers.get("cf-region-code") ||
    request.headers.get("x-vercel-ip-country-region") ||
    request.headers.get("x-geo-region");

  if (headerCountry && headerCountry !== "XX" && headerCountry !== "T1") {
    const code = headerCountry.toUpperCase();
    return {
      country: COUNTRY_NAMES[code] ?? code,
      countryCode: code,
      region: headerRegion ? decodeURIComponent(headerRegion) : null,
      city: headerCity ? decodeURIComponent(headerCity) : null
    };
  }

  // B) Verificação em Cache LRU por IP
  if (ip) {
    const cached = geoCache.get(ip);
    if (cached && cached.exp > Date.now()) {
      return {
        country: cached.country,
        countryCode: cached.countryCode,
        region: cached.region,
        city: cached.city
      };
    }

    // C) Consulta rápida assíncrona (com timeout estrito de 600ms)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 600);

      const res = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: controller.signal,
        headers: { "User-Agent": "link-tracker/1.0" }
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data && data.country_code) {
          const code = data.country_code.toUpperCase();
          const country = COUNTRY_NAMES[code] ?? data.country_name ?? code;
          const region = data.region || null;
          const city = data.city || null;

          // Salva no cache por 24h
          geoCache.set(ip, {
            country,
            countryCode: code,
            region,
            city,
            exp: Date.now() + 24 * 60 * 60 * 1000
          });

          return { country, countryCode: code, region, city };
        }
      }
    } catch {
      // Ignora falhas de timeout para não atrasar o redirecionamento
    }
  }

  return {
    country: "Brasil",
    countryCode: "BR",
    region: null,
    city: null
  };
}

export function parseUserAgent(userAgent: string | null): {
  device: "Mobile" | "Tablet" | "Desktop" | "Bot";
  os: string;
  browser: string;
} {
  if (!userAgent) {
    return { device: "Desktop", os: "Outro", browser: "Outro" };
  }

  const ua = userAgent.toLowerCase();

  // 1. Detecção de Bots
  const isBot =
    ua.includes("bot") ||
    ua.includes("spider") ||
    ua.includes("crawl") ||
    ua.includes("facebookexternalhit") ||
    ua.includes("whatsapp") ||
    ua.includes("discordbot") ||
    ua.includes("telegrambot") ||
    ua.includes("slackbot") ||
    ua.includes("preview");

  if (isBot) {
    return { device: "Bot", os: "Bot / Crawler", browser: "Bot" };
  }

  // 2. Detecção de Dispositivo
  let device: "Mobile" | "Tablet" | "Desktop" | "Bot" = "Desktop";
  if (ua.includes("ipad") || ua.includes("tablet") || ua.includes("kindle") || ua.includes("silk")) {
    device = "Tablet";
  } else if (
    ua.includes("mobile") ||
    ua.includes("android") ||
    ua.includes("iphone") ||
    ua.includes("ipod") ||
    ua.includes("blackberry") ||
    ua.includes("windows phone")
  ) {
    device = "Mobile";
  }

  // 3. Detecção de Sistema Operacional (OS)
  let os = "Outro";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    os = "iOS";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("mac os") || ua.includes("macintosh")) {
    os = "macOS";
  } else if (ua.includes("windows nt 10.0") || ua.includes("windows nt 11.0") || ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("cros")) {
    os = "ChromeOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  }

  // 4. Detecção de Navegador
  let browser = "Navegador";
  if (ua.includes("instagram")) {
    browser = "Instagram";
  } else if (ua.includes("tiktok") || ua.includes("musical_ly")) {
    browser = "TikTok";
  } else if (ua.includes("whatsapp")) {
    browser = "WhatsApp";
  } else if (ua.includes("edg/") || ua.includes("edge/")) {
    browser = "Edge";
  } else if (ua.includes("samsungbrowser/")) {
    browser = "Samsung Internet";
  } else if (ua.includes("opr/") || ua.includes("opera/")) {
    browser = "Opera";
  } else if (ua.includes("brave")) {
    browser = "Brave";
  } else if (ua.includes("chrome/") || ua.includes("crios/")) {
    browser = "Chrome";
  } else if (ua.includes("firefox/") || ua.includes("fxios/")) {
    browser = "Firefox";
  } else if (ua.includes("safari/") && !ua.includes("chrome/")) {
    browser = "Safari";
  }

  return { device, os, browser };
}

export function parseReferrerName(referrer: string | null, utmSource: string | null, isQr: boolean): string {
  if (isQr) {
    return "QR Code";
  }

  if (utmSource) {
    return `UTM: ${utmSource}`;
  }

  if (!referrer) {
    return "Acesso Direto";
  }

  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./i, "");

    // Buscadores
    if (host.includes("google")) return "Google";
    if (host.includes("bing")) return "Bing";
    if (host.includes("duckduckgo")) return "DuckDuckGo";
    if (host.includes("yahoo")) return "Yahoo";

    // Redes Sociais
    if (host.includes("instagram") || host.includes("l.instagram")) return "Instagram";
    if (host.includes("twitter") || host.includes("t.co") || host.includes("x.com")) return "X / Twitter";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("linkedin") || host.includes("lnkd.in")) return "LinkedIn";
    if (host.includes("facebook") || host.includes("fb.com") || host.includes("l.facebook")) return "Facebook";
    if (host.includes("youtube") || host.includes("youtu.be")) return "YouTube";
    if (host.includes("threads.net")) return "Threads";
    if (host.includes("reddit")) return "Reddit";
    if (host.includes("pinterest")) return "Pinterest";

    // Mensageiros
    if (host.includes("whatsapp") || host.includes("wa.me")) return "WhatsApp";
    if (host.includes("t.me") || host.includes("telegram")) return "Telegram";
    if (host.includes("discord")) return "Discord";
    if (host.includes("slack")) return "Slack";

    // Dev
    if (host.includes("github")) return "GitHub";

    return host;
  } catch {
    return "Outro";
  }
}
