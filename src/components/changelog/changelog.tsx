"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Github,
  History,
  Layers,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Wrench,
  Zap
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { getCachedNavbarUser, loadNavbarUser, type NavbarUser } from "@/lib/navbar-user";
import { useAppTheme } from "@/lib/theme";

type ChangeType = "feat" | "improvement" | "security" | "fix" | "governance";

interface ChangeItem {
  type: ChangeType;
  title: string;
  description: string;
  details?: string[];
  scope?: string;
}

interface Release {
  version: string;
  title: string;
  date: string;
  badge?: string;
  isLatest?: boolean;
  isUpcoming?: boolean;
  summary: string;
  changes: ChangeItem[];
  githubReleaseUrl?: string;
}

const releasesData: Release[] = [
  {
    version: "v2.0.0",
    title: "Link v2.0 - Lançamento da Nova Geração & Governança",
    date: "26 de Agosto de 2026",
    badge: "Versão Atual",
    isLatest: true,
    summary:
      "Lançamento da nova geração (v2.0) do Link, incluindo encurtador rápido com slugs personalizados, dashboard analítico, autenticação JWT/OAuth, gerador de QR Code interativo e governança de repositório robusta.",
    githubReleaseUrl: "https://github.com/TGuiDev/link/releases/tag/v2.0.0",
    changes: [
      {
        type: "feat",
        title: "Encurtamento de Links com Slugs Customizados",
        description:
          "Criação ágil de URLs curtas tanto de forma pública pela página inicial quanto vinculadas à conta do usuário autenticado com suporte a slugs personalizados.",
        details: [
          "Geração automática de slugs aleatórios de 6 caracteres",
          "Validação de integridade e unicidade de slugs customizados (3 a 48 caracteres)",
          "Redirecionamento HTTP com baixíssima latência"
        ],
        scope: "links"
      },
      {
        type: "feat",
        title: "Dashboard de Métricas e Geolocalização em Tempo Real",
        description:
          "Painel completo para visualização de cliques, links mais acessados, taxa de cliques por dispositivo, geolocalização e referrers.",
        scope: "dashboard"
      },
      {
        type: "feat",
        title: "Personalizador Avançado de QR Code",
        description:
          "Editor integrado de QR Codes com presets de cores, molduras, inclusão de logo/texto e download direto em PNG de alta definição.",
        scope: "qr-code"
      },
      {
        type: "security",
        title: "Autenticação Segura JWT e Provedores OAuth",
        description:
          "Sistema de login e cadastro com hash de senhas via bcryptjs, sessões baseadas em tokens JWT assinados via biblioteca jose e login social via Google, GitHub e Discord.",
        scope: "auth"
      },
      {
        type: "governance",
        title: "Estruturação de Repositório & Licença GNU AGPLv3",
        description:
          "Definição de regras estritas de governança, Conventional Commits, esteiras de CI/CD automatizadas e adoção da licença GNU AGPLv3 para proteção contra derivados comerciais fechados.",
        details: [
          "Workflows GitHub Actions: CI (Lint + Typecheck + Build), Security Audit e CodeQL",
          "Documentos normativos: CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, ARCHITECTURE.md, COMMIT_CONVENTION.md",
          "Templates estruturados de PRs e Issues com badges oficiais"
        ],
        scope: "governance"
      },
      {
        type: "feat",
        title: "API REST com Chaves de Autenticação",
        description:
          "Endpoints RESTful para desenvolvedores integrarem a criação e consulta de links em seus próprios serviços usando headers X-API-Key ou Bearer token.",
        scope: "api"
      }
    ]
  }
];

const categoryLabels: Record<ChangeType, { label: string; icon: typeof Sparkles; color: string; badgeClass: string }> = {
  feat: {
    label: "Novo Recurso",
    icon: Rocket,
    color: "text-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20"
  },
  improvement: {
    label: "Melhoria",
    icon: Zap,
    color: "text-blue-500",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400 dark:border-blue-400/20"
  },
  security: {
    label: "Segurança",
    icon: ShieldCheck,
    color: "text-purple-500",
    badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-400/10 dark:text-purple-400 dark:border-purple-400/20"
  },
  fix: {
    label: "Correção",
    icon: Wrench,
    color: "text-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20"
  },
  governance: {
    label: "Governança & DevOps",
    icon: Layers,
    color: "text-indigo-500",
    badgeClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-400/10 dark:text-indigo-400 dark:border-indigo-400/20"
  }
};

export function Changelog() {
  const cachedNavbarUser = getCachedNavbarUser();
  const [theme, toggleTheme] = useAppTheme();
  const [navbarUser, setNavbarUser] = useState<NavbarUser | null>(cachedNavbarUser ?? null);

  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (cachedNavbarUser === undefined) {
      loadNavbarUser().then((user) => {
        setNavbarUser(user);
      });
    }
  }, [cachedNavbarUser]);

  const filteredReleases = useMemo(() => {
    return releasesData
      .map((release) => {
        const matchingChanges = release.changes.filter((change) => {
          const matchesCategory =
            selectedFilter === "all" || change.type === selectedFilter;
          const matchesSearch =
            searchQuery.trim() === "" ||
            change.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            change.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (change.scope && change.scope.toLowerCase().includes(searchQuery.toLowerCase())) ||
            release.version.toLowerCase().includes(searchQuery.toLowerCase());

          return matchesCategory && matchesSearch;
        });

        return {
          ...release,
          matchingChanges
        };
      })
      .filter((release) => release.matchingChanges.length > 0 || (searchQuery === "" && selectedFilter === "all"));
  }, [selectedFilter, searchQuery]);

  const totalChangesCount = useMemo(() => {
    return releasesData.reduce((acc, curr) => acc + curr.changes.length, 0);
  }, []);

  return (
    <main className={theme === "dark" ? "dark" : ""} suppressHydrationWarning>
      <section className="relative min-h-screen overflow-hidden bg-zinc-50/70 text-zinc-950 transition-colors duration-200 ease-out dark:bg-zinc-950 dark:text-zinc-100 font-sans">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 md:px-8">
          {/* Navbar Superior */}
          <Navbar theme={theme} onToggleTheme={toggleTheme} user={navbarUser} />

          <div className="relative mx-auto w-full max-w-4xl pt-8 pb-20">
            {/* Glow de fundo */}
            <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 -z-10 h-72 w-full max-w-3xl rounded-full bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl" />

            {/* Cabeçalho Principal da Página */}
            <div className="text-center space-y-4 pb-12 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 shadow-2xs">
                <History size={13} />
                <span>Histórico de Atualizações</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-950 dark:text-white">
                Novidades & Changelog
              </h1>

              <p className="mx-auto max-w-2xl text-sm sm:text-base font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Acompanhe o ciclo de evolução contínua, lançamentos de novos recursos, otimizações de performance e atualizações de segurança do <span className="font-bold text-zinc-950 dark:text-white">Link</span>.
              </p>

              {/* Métricas Rápidas */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-bold text-zinc-700 shadow-2xs backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
                  <Tag size={13} className="text-emerald-500" />
                  <span>Versão Atual: <strong>v2.0.0</strong></span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-bold text-zinc-700 shadow-2xs backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
                  <Layers size={13} className="text-blue-500" />
                  <span>{totalChangesCount} Atualizações Registradas</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-bold text-zinc-700 shadow-2xs backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
                  <ShieldCheck size={13} className="text-purple-500" />
              <span>Licença: <strong>GNU AGPLv3</strong></span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="my-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Categorias / Filtros */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedFilter("all")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                selectedFilter === "all"
                  ? "bg-zinc-950 text-white shadow-xs dark:bg-white dark:text-zinc-950"
                  : "bg-white/70 text-zinc-600 border border-zinc-200/80 hover:bg-zinc-100 hover:text-zinc-950 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              }`}
            >
              Todos
            </button>
            {(["feat", "improvement", "security", "governance"] as ChangeType[]).map((type) => {
              const meta = categoryLabels[type];
              const Icon = meta.icon;
              const isActive = selectedFilter === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedFilter(type)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    isActive
                      ? "bg-zinc-950 text-white shadow-xs dark:bg-white dark:text-zinc-950"
                      : "bg-white/70 text-zinc-600 border border-zinc-200/80 hover:bg-zinc-100 hover:text-zinc-950 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                  }`}
                >
                  <Icon size={12} className={isActive ? "" : meta.color} />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar no changelog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-full border border-zinc-200 bg-white pl-9 pr-3 text-xs font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10"
            />
          </div>
        </div>

        {/* Timeline de Lançamentos */}
        <div className="relative space-y-10 before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800 sm:before:left-6">
          {filteredReleases.map((release) => {
            const changesToRender = release.matchingChanges || release.changes;

            return (
              <div key={release.version} className="relative pl-10 sm:pl-16">
                {/* Marcador na Linha do Tempo */}
                <div
                  className={`absolute left-2.5 sm:left-4.5 top-2.5 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white dark:bg-zinc-950 ${
                    release.isLatest
                      ? "border-emerald-500 shadow-md shadow-emerald-500/20 ring-4 ring-emerald-500/10"
                      : release.isUpcoming
                      ? "border-blue-500 border-dashed"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      release.isLatest ? "bg-emerald-500 animate-pulse" : release.isUpcoming ? "bg-blue-500" : "bg-zinc-400"
                    }`}
                  />
                </div>

                {/* Card da Release */}
                <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700">
                  {/* Topo do Card */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white">
                          {release.version}
                        </h2>
                        {release.badge && (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                              release.isLatest
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-400/10 dark:text-emerald-400"
                                : release.isUpcoming
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-400/10 dark:text-blue-400"
                                : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                            }`}
                          >
                            {release.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        {release.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        <Calendar size={13} />
                        <span>{release.date}</span>
                      </div>

                      {release.githubReleaseUrl && (
                        <a
                          href={release.githubReleaseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-bold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                        >
                          <Github size={12} />
                          <span>Release</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Resumo do Lançamento */}
                  <p className="mt-4 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {release.summary}
                  </p>

                  {/* Lista de Modificações */}
                  <div className="mt-6 space-y-3.5">
                    {changesToRender.map((change, idx) => {
                      const meta = categoryLabels[change.type] || categoryLabels.feat;
                      const Icon = meta.icon;

                      return (
                        <div
                          key={idx}
                          className="group rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 transition hover:border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-950/40 dark:hover:border-zinc-700/60 dark:hover:bg-zinc-950/70"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${meta.badgeClass}`}
                            >
                              <Icon size={13} />
                            </div>

                            <div className="flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white">
                                  {change.title}
                                </h3>
                                {change.scope && (
                                  <span className="font-mono text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 bg-zinc-200/50 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded">
                                    {change.scope}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs font-normal text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                {change.description}
                              </p>

                              {change.details && change.details.length > 0 && (
                                <ul className="mt-2 space-y-1 pl-1">
                                  {change.details.map((detail, detailIdx) => (
                                    <li
                                      key={detailIdx}
                                      className="flex items-start gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
                                    >
                                      <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                                      <span>{detail}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé e CTA de Comunidade */}
        <div className="mt-16 rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-white to-zinc-100/60 p-8 text-center shadow-xs backdrop-blur-md dark:border-zinc-800 dark:from-zinc-900/90 dark:to-zinc-950/80 sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 mb-4 shadow-2xs">
            <Sparkles size={22} />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white">
            Tem uma sugestão de recurso ou encontrou um problema?
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">
            O Link é um projeto de código aberto protegido sob a licença GNU AGPLv3. Você pode participar sugerindo melhorias, relatando bugs ou enviando um Pull Request.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://github.com/TGuiDev/link"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-full bg-zinc-950 px-5 text-xs font-black text-white shadow-sm transition hover:bg-zinc-800 hover:scale-105 active:scale-95 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              <Github size={14} />
              <span>Ver no GitHub</span>
            </a>

            <Link
              href="/documentacao"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 text-xs font-bold text-zinc-800 shadow-2xs transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <span>Explorar a API</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Rodapé da Página */}
      <footer className="mt-16 flex flex-col gap-4 border-t border-zinc-200/80 pt-6 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-zinc-900 dark:text-white">Link</span>
          <span>•</span>
          <span>
            Licenciado sob{" "}
            <Link href="/LICENSE" className="font-bold underline hover:text-emerald-500">
              GNU AGPLv3
            </Link>
          </span>
        </div>

        <div className="flex items-center gap-4 font-semibold">
          <Link href="/" className="transition hover:text-zinc-950 dark:hover:text-white">
            Início
          </Link>
          <Link href="/documentacao" className="transition hover:text-zinc-950 dark:hover:text-white">
            Documentação
          </Link>
          <a
            href="https://github.com/TGuiDev/link"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-zinc-950 dark:hover:text-white"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  </section>
</main>
);
}
