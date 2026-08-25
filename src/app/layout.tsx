import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
  description: "Crie links curtos randômicos ou personalizados, acompanhe métricas e use a API.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://link.guidev.site"),
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png"
  },
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: "Link",
    description: "Crie links curtos randômicos ou personalizados, acompanhe métricas e use a API.",
    url: "/",
    siteName: "Link",
    images: [
      {
        url: "/meta-banner/link.png",
        width: 1500,
        height: 500,
        type: "image/png",
        alt: "Banner do Link"
      }
    ],
    locale: "pt_BR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Link",
    description: "Crie links curtos randômicos ou personalizados, acompanhe métricas e use a API.",
    images: ["/meta-banner/link.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={nunitoSans.variable}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
