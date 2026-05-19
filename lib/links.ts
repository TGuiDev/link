const RESERVED_SLUGS = new Set([
  "api",
  "admin",
  "assets",
  "auth",
  "cadastro",
  "dashboard",
  "documentacao",
  "favicon.ico",
  "login",
  "nova-senha",
  "recuperar-senha"
]);
const SLUG_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CUSTOM_SLUG_REGEX = /^[a-zA-Z0-9_-]{3,48}$/;

export function getPublicBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://link.guidev.site").replace(/\/$/, "");
}

export function normalizeUrl(value: string) {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Use apenas URLs com http ou https.");
  }

  return parsed.toString();
}

export function assertValidCustomSlug(slug: string) {
  if (!CUSTOM_SLUG_REGEX.test(slug)) {
    throw new Error("O link customizado deve ter 3 a 48 caracteres e usar letras, numeros, _ ou -.");
  }

  if (RESERVED_SLUGS.has(slug.toLowerCase())) {
    throw new Error("Esse link customizado e reservado.");
  }
}

export function generateSlug(length = 7) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => SLUG_ALPHABET[byte % SLUG_ALPHABET.length]).join("");
}

export function toLinkResponse(slug: string, url: string, clicks?: number) {
  const shortUrl = `${getPublicBaseUrl()}/${slug}`;

  return {
    slug,
    url,
    shortUrl,
    clicks
  };
}
