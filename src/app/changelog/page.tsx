import type { Metadata } from "next";
import { Changelog } from "@/components/changelog";

export const metadata: Metadata = {
  title: "Novidades & Changelog",
  description:
    "Acompanhe o histórico de lançamentos, novos recursos, melhorias e correções de segurança do Link.",
  openGraph: {
    title: "Novidades & Changelog | Link",
    description:
      "Acompanhe o histórico de lançamentos, novos recursos, melhorias e correções de segurança do Link.",
    url: "/changelog"
  }
};

export default function ChangelogPage() {
  return <Changelog />;
}
