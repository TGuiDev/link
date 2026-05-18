import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Link",
  description: "Encurtador de links simples, bonito e sem login.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://link.guidev.site"),
  openGraph: {
    title: "Link",
    description: "Crie links curtos randomicos ou personalizados.",
    url: "/",
    siteName: "Link",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
