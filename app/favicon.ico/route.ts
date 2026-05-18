export function GET() {
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#059669"/>
  <path d="M24.5 39.5 39.5 24.5" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
  <path d="M25 25h14v14" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  return new Response(icon, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
