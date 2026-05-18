import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-rounded",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Link",
  description: "Encurtador de links simples, bonito e sem login.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://link.guidev.site"),
  icons: {
    icon: "/Dark_Theme_Logo.svg",
    shortcut: "/Dark_Theme_Logo.svg"
  },
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
      <body className={nunitoSans.variable}>{children}</body>
    </html>
  );
}
