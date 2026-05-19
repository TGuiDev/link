import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-rounded",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "Link",
    template: "%s | Link"
  },
  description: "Crie links curtos randomicos ou personalizados, acompanhe metricas e use a API.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://link.guidev.site"),
  icons: {
    icon: "/Dark_Theme_Logo.svg",
    shortcut: "/Dark_Theme_Logo.svg"
  },
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: "Link",
    description: "Crie links curtos randomicos ou personalizados, acompanhe metricas e use a API.",
    url: "/",
    siteName: "Link",
    images: [
      {
        url: "/meta_banner/link.png",
        width: 1200,
        height: 630,
        alt: "Link - encurtador de links"
      }
    ],
    locale: "pt_BR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Link",
    description: "Crie links curtos randomicos ou personalizados, acompanhe metricas e use a API.",
    images: ["/meta_banner/link.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={nunitoSans.variable}>{children}</body>
    </html>
  );
}
