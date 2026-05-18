export type QrCodeOptions = {
  size?: number;
  foreground?: string;
  background?: string;
  margin?: number;
};

const DEFAULT_QR_OPTIONS = {
  size: 220,
  foreground: "18181B",
  background: "FFFFFF",
  margin: 12
};

export function createQrCodeUrl(value: string, options: QrCodeOptions = {}) {
  const size = clampNumber(options.size ?? DEFAULT_QR_OPTIONS.size, 120, 720);
  const margin = clampNumber(options.margin ?? DEFAULT_QR_OPTIONS.margin, 0, 40);
  const foreground = normalizeHex(options.foreground ?? DEFAULT_QR_OPTIONS.foreground, DEFAULT_QR_OPTIONS.foreground);
  const background = normalizeHex(options.background ?? DEFAULT_QR_OPTIONS.background, DEFAULT_QR_OPTIONS.background);
  const params = new URLSearchParams({
    data: value,
    size: `${size}x${size}`,
    color: foreground,
    bgcolor: background,
    margin: String(margin),
    format: "png"
  });

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

export function normalizeHex(value: string, fallback = DEFAULT_QR_OPTIONS.foreground) {
  const cleanedValue = value.replace("#", "").trim();

  if (/^[0-9a-fA-F]{6}$/.test(cleanedValue)) {
    return cleanedValue.toUpperCase();
  }

  return fallback;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
