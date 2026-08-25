"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart2,
  BookOpen,
  Check,
  ChevronDown,
  Compass,
  Copy,
  Download,
  ExternalLink,
  Globe2,
  KeyRound,
  Laptop,
  Link2,
  Loader2,
  Monitor,
  MousePointerClick,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search,
  Smartphone,
  Tablet,
  Trash2,
  X
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { getCachedNavbarUser, primeCachedNavbarUser, type NavbarUser } from "@/lib/navbar-user";
import { createQrCodeUrl } from "@/lib/qrcode";

type RankingItem = {
  label: string;
  value: number;
};

type RecentEvent = {
  id: string;
  linkId: string;
  country: string;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  referrer: string | null;
  referrerName: string;
  device?: string;
  os?: string;
  browser?: string;
  qr?: boolean;
  ip?: string | null;
  createdAt: string;
};

type DashboardData = {
  user: {
    id: string;
    email?: string;
    name?: string | null;
    avatarUrl?: string | null;
  };
  apiKey: string;
  baseUrl: string;
  summary: {
    links: number;
    clicks: number;
    trackedEvents: number;
  };
  links: Array<{
    id: string;
    slug: string;
    url: string;
    shortUrl: string;
    clicks: number;
    createdAt: string;
    trackedEvents: number;
  }>;
  countries: RankingItem[];
  referrers: RankingItem[];
  devices?: RankingItem[];
  operatingSystems?: RankingItem[];
  browsers?: RankingItem[];
  recentEvents: RecentEvent[];
};

type Theme = "light" | "dark";
type ViewMode = "links" | "analytics" | "api";
type SortOption = "newest" | "clicks" | "alphabetical";
type CodeLang = "curl" | "javascript" | "python";

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [view, setView] = useState<ViewMode>("links");

  // Links state
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [copied, setCopied] = useState("");
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null);

  // Analytics filter
  const [analyticsLinkFilter, setAnalyticsLinkFilter] = useState<string>("all");

  // API State
  const [showApiKey, setShowApiKey] = useState(false);
  const [codeLang, setCodeLang] = useState<CodeLang>("curl");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createUrl, setCreateUrl] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editModal, setEditModal] = useState<{ id: string; originalSlug: string; url: string; slug: string } | null>(null);
  const [editError, setEditError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [isResetKeyModalOpen, setIsResetKeyModalOpen] = useState(false);
  const [isResettingKey, setIsResettingKey] = useState(false);
  const [resetKeySuccess, setResetKeySuccess] = useState("");

  const [qrModal, setQrModal] = useState<{ shortUrl: string; slug: string; targetUrl: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ slug: string; shortUrl: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const savedTheme = window.localStorage.getItem("link-theme");
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
    return "dark";
  });
  const [dashboardUser, setDashboardUser] = useState<NavbarUser | null>(() => getCachedNavbarUser() ?? null);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) return;
        const result: DashboardData = await response.json();
        if (!isMounted) return;

        setData(result);

        if (result.user.email) {
          const nextUser: NavbarUser = {
            id: result.user.id,
            email: result.user.email ?? "",
            name: result.user.name || (result.user.email ? result.user.email.split("@")[0] : "Conta"),
            avatarUrl: result.user.avatarUrl ?? null
          };
          primeCachedNavbarUser(nextUser);
          setDashboardUser(nextUser);
        }
      } catch {
        // Silencioso em polling
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    fetchDashboard();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchDashboard();
      }
    }, 8000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  async function refreshDashboard() {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const result: DashboardData = await response.json();
        setData(result);
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    window.localStorage.setItem("link-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(""), 1800);
  }

  // Copiar código formatado
  async function copySnippet() {
    const baseUrl = data?.baseUrl ?? "https://link.guidev.site";
    const apiKey = data?.apiKey ?? "sua_chave_aqui";

    let text = "";
    if (codeLang === "curl") {
      text = `# Criar link curto\ncurl -X POST ${baseUrl}/api/links \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: ${apiKey}" \\\n  -d '{"url": "https://meusite.com", "slug": "meu-slug"}'\n\n# Consultar link existente\ncurl -X GET ${baseUrl}/api/links/meu-slug`;
    } else if (codeLang === "javascript") {
      text = `const response = await fetch("${baseUrl}/api/links", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "X-API-Key": "${apiKey}"\n  },\n  body: JSON.stringify({\n    url: "https://meusite.com",\n    slug: "meu-slug"\n  })\n});\n\nconst data = await response.json();\nconsole.log(data.shortUrl);`;
    } else if (codeLang === "python") {
      text = `import requests\n\nresponse = requests.post(\n    "${baseUrl}/api/links",\n    headers={"X-API-Key": "${apiKey}"},\n    json={"url": "https://meusite.com", "slug": "meu-slug"}\n)\n\nprint(response.json())`;
    }

    await navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    window.setTimeout(() => setCopiedSnippet(false), 2000);
  }

  // Download seguro de QR Code sem erro de CORS
  async function downloadQrCode(qrDataUrl: string, slug: string) {
    try {
      const qrUrl = createQrCodeUrl(qrDataUrl, { size: 600, margin: 16 });
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `qrcode-${slug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(createQrCodeUrl(qrDataUrl, { size: 600, margin: 16 }), "_blank");
    }
  }

  // Criação de Link
  async function handleCreateLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createUrl.trim() || isCreating) return;

    setIsCreating(true);
    setCreateError("");

    try {
      const payload: { url: string; slug?: string } = { url: createUrl.trim() };
      if (createSlug.trim()) {
        payload.slug = createSlug.trim();
      }

      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Erro ao encurtar o link.");
      }

      setCreateUrl("");
      setCreateSlug("");
      setIsCreateModalOpen(false);
      await refreshDashboard();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Não foi possível encurtar o link.");
    } finally {
      setIsCreating(false);
    }
  }

  // Edição de Link
  async function handleEditLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editModal || isEditing) return;

    setIsEditing(true);
    setEditError("");

    try {
      const response = await fetch(`/api/links/${encodeURIComponent(editModal.originalSlug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: editModal.url.trim(),
          slug: editModal.slug.trim()
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Erro ao atualizar o link.");
      }

      setEditModal(null);
      await refreshDashboard();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Não foi possível editar o link.");
    } finally {
      setIsEditing(false);
    }
  }

  // Resetar Chave de API
  async function handleResetApiKey() {
    if (isResettingKey) return;
    setIsResettingKey(true);
    setResetKeySuccess("");

    try {
      const response = await fetch("/api/auth/reset-api-key", { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Erro ao resetar chave.");
      }

      setData((prev) => (prev ? { ...prev, apiKey: result.apiKey } : prev));
      setIsResetKeyModalOpen(false);
      setResetKeySuccess("Nova chave gerada com sucesso! A chave antiga foi revogada.");
      window.setTimeout(() => setResetKeySuccess(""), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Não foi possível resetar a chave de API.");
    } finally {
      setIsResettingKey(false);
    }
  }

  // Exclusão de Link
  async function handleDeleteLink() {
    if (!deleteModal || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/links/${encodeURIComponent(deleteModal.slug)}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error ?? "Erro ao excluir link.");
      }

      setDeleteModal(null);
      await refreshDashboard();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao excluir o link.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Links Filtrados e Ordenados
  const filteredAndSortedLinks = useMemo(() => {
    let list = [...(data?.links ?? [])];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (l) =>
          l.slug.toLowerCase().includes(q) ||
          l.shortUrl.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q)
      );
    }

    if (sortBy === "clicks") {
      list.sort((a, b) => b.clicks - a.clicks);
    } else if (sortBy === "alphabetical") {
      list.sort((a, b) => a.slug.localeCompare(b.slug));
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [data?.links, search, sortBy]);

  // Analytics Filtrado
  const activeAnalyticsEvents = useMemo(() => {
    if (analyticsLinkFilter === "all") return data?.recentEvents ?? [];
    return (data?.recentEvents ?? []).filter((e) => e.linkId === analyticsLinkFilter);
  }, [analyticsLinkFilter, data?.recentEvents]);

  const activeAnalyticsSummary = useMemo(() => {
    const events = activeAnalyticsEvents;
    const countryMap = new Map<string, number>();
    const referrerMap = new Map<string, number>();
    const deviceMap = new Map<string, number>();
    const osMap = new Map<string, number>();
    const browserMap = new Map<string, number>();

    for (const e of events) {
      countryMap.set(e.country, (countryMap.get(e.country) ?? 0) + 1);
      const ref = e.referrerName || "Acesso Direto";
      referrerMap.set(ref, (referrerMap.get(ref) ?? 0) + 1);
      const dev = e.device || "Desktop";
      deviceMap.set(dev, (deviceMap.get(dev) ?? 0) + 1);
      const os = e.os || "Outro";
      osMap.set(os, (osMap.get(os) ?? 0) + 1);
      const brw = e.browser || "Navegador";
      browserMap.set(brw, (browserMap.get(brw) ?? 0) + 1);
    }

    const toSortedArray = (map: Map<string, number>) =>
      Array.from(map.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);

    return {
      countries: toSortedArray(countryMap),
      referrers: toSortedArray(referrerMap),
      devices: toSortedArray(deviceMap),
      operatingSystems: toSortedArray(osMap),
      browsers: toSortedArray(browserMap),
      totalClicks: events.length
    };
  }, [activeAnalyticsEvents]);

  const averageClicks =
    data?.summary.links && data?.summary.clicks
      ? (data.summary.clicks / data.summary.links).toFixed(1)
      : "0";

  return (
    <main className={theme === "dark" ? "dark" : ""}>
      <section className="min-h-screen bg-zinc-50/70 text-zinc-900 antialiased transition-colors duration-200 dark:bg-zinc-950 dark:text-zinc-100 overflow-x-hidden">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:px-8 min-w-0">
          <Navbar theme={theme} onToggleTheme={toggleTheme} user={dashboardUser} />

          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <div className="mt-8 space-y-6 min-w-0">
              {/* Header do Painel */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center min-w-0">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
                    Painel
                  </h1>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Gerencie seus links encurtados, analise métricas em tempo real e integre com sua API.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={refreshDashboard}
                    disabled={isRefreshing}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700"
                    title="Atualizar dados"
                    type="button"
                  >
                    <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                  </button>

                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                    type="button"
                  >
                    <Plus size={14} />
                    <span>Criar Link</span>
                  </button>
                </div>
              </div>

              {/* Indicadores Principais */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 min-w-0">
                <MetricBox
                  label="Total de Links"
                  value={data?.summary.links ?? 0}
                  icon={<Link2 size={15} className="text-zinc-400" />}
                />
                <MetricBox
                  label="Total de Cliques"
                  value={data?.summary.clicks ?? 0}
                  icon={<MousePointerClick size={15} className="text-zinc-400" />}
                />
                <MetricBox
                  label="Cliques Rastreados"
                  value={data?.summary.trackedEvents ?? 0}
                  icon={<Globe2 size={15} className="text-zinc-400" />}
                />
                <MetricBox
                  label="Média por Link"
                  value={averageClicks}
                  icon={<BarChart2 size={15} className="text-zinc-400" />}
                />
              </div>

              {/* Barra de Abas de Navegação */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3 min-w-0">
                <div className="flex items-center gap-1 text-xs">
                  <TabButton active={view === "links"} onClick={() => setView("links")}>
                    Links ({data?.links.length ?? 0})
                  </TabButton>
                  <TabButton active={view === "analytics"} onClick={() => setView("analytics")}>
                    Analytics & Tráfego
                  </TabButton>
                  <TabButton active={view === "api"} onClick={() => setView("api")}>
                    API & Integrações
                  </TabButton>
                </div>

                {view === "links" && (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative flex-1 sm:w-64 min-w-0">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Buscar links..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 outline-none hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      <option value="newest">Mais recentes</option>
                      <option value="clicks">Mais clicados</option>
                      <option value="alphabetical">Ordem A-Z</option>
                    </select>
                  </div>
                )}
              </div>

              {/* ABA 1: LINKS */}
              {view === "links" && (
                <div className="rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 min-w-0">
                  {filteredAndSortedLinks.length ? (
                    filteredAndSortedLinks.map((link) => {
                      const isExpanded = expandedLinkId === link.id;
                      const linkEvents = (data?.recentEvents ?? []).filter((e) => e.linkId === link.id);

                      return (
                        <div key={link.id} className="transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-800/20 min-w-0">
                          <div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center min-w-0">
                            {/* Dados do Link */}
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <a
                                  href={link.shortUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-semibold text-zinc-900 hover:text-emerald-600 dark:text-zinc-100 dark:hover:text-emerald-400 truncate flex items-center gap-1"
                                >
                                  <span>{link.shortUrl}</span>
                                  <ArrowUpRight size={13} className="text-zinc-400" />
                                </a>

                                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                  {link.clicks} {link.clicks === 1 ? "clique" : "cliques"}
                                </span>
                              </div>

                              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xl" title={link.url}>
                                {link.url}
                              </p>

                              <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                                <span>
                                  Criado em{" "}
                                  {new Date(link.createdAt).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  })}
                                </span>
                                {link.trackedEvents > 0 && (
                                  <span>• {link.trackedEvents} acessos geolocalizados</span>
                                )}
                              </div>
                            </div>

                            {/* Ações Rápidas */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              {/* Copiar */}
                              <button
                                onClick={() => copy(link.shortUrl)}
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                type="button"
                              >
                                {copied === link.shortUrl ? (
                                  <>
                                    <Check size={13} className="text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400">Copiado</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={13} />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>

                              {/* Editar */}
                              <button
                                onClick={() =>
                                  setEditModal({
                                    id: link.id,
                                    originalSlug: link.slug,
                                    url: link.url,
                                    slug: link.slug
                                  })
                                }
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                title="Editar link"
                                type="button"
                              >
                                <Pencil size={13} />
                                <span>Editar</span>
                              </button>

                              {/* QR Code */}
                              <button
                                onClick={() =>
                                  setQrModal({
                                    shortUrl: link.shortUrl,
                                    slug: link.slug,
                                    targetUrl: `${link.shortUrl}?src=qr`
                                  })
                                }
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                title="QR Code"
                                type="button"
                              >
                                <QrCode size={13} />
                                <span>QR</span>
                              </button>

                              {/* Expansor de Cliques */}
                              <button
                                onClick={() => setExpandedLinkId(isExpanded ? null : link.id)}
                                className={`inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition ${
                                  isExpanded
                                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                                    : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                }`}
                                type="button"
                              >
                                <ChevronDown size={13} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                <span>Cliques</span>
                              </button>

                              {/* Excluir Link */}
                              <button
                                onClick={() => setDeleteModal({ slug: link.slug, shortUrl: link.shortUrl })}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:hover:border-red-900 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                                title="Excluir link"
                                type="button"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Gaveta de Detalhes de Cliques */}
                          {isExpanded && (
                            <div className="bg-zinc-50/70 p-4 border-t border-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 animate-in fade-in duration-200 min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                                Histórico de acessos detalhado para este link
                              </p>
                              {linkEvents.length ? (
                                <div className="space-y-1.5">
                                  {linkEvents.map((evt) => (
                                    <div
                                      key={evt.id}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded-lg bg-white p-2.5 text-xs border border-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
                                    >
                                      <div className="flex items-center gap-2">
                                        <DeviceIcon device={evt.device} />
                                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                          {[evt.city, evt.region, evt.country].filter(Boolean).join(", ") || "Brasil"}
                                        </span>
                                        {evt.qr && (
                                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                            QR Code
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                                        <span>Origem: {evt.referrerName || "Direto"}</span>
                                        <span>{evt.browser || "Navegador"}</span>
                                        <span>{evt.os || ""}</span>
                                        <span>{new Date(evt.createdAt).toLocaleString("pt-BR")}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-zinc-400 italic">Nenhum evento detalhado registrado para este link ainda.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-12 text-center">
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                        {search ? "Nenhum link corresponde à sua busca." : "Nenhum link criado ainda."}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {search ? "Tente buscar por outro termo." : "Clique em 'Criar Link' acima para encurtar sua primeira URL."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 2: ANALYTICS & TRÁFEGO */}
              {view === "analytics" && (
                <div className="space-y-6 min-w-0">
                  {/* Seletor de Filtro de Link */}
                  <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 min-w-0">
                    <div className="flex items-center gap-2">
                      <BarChart2 size={16} className="text-zinc-500" />
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Filtrar por Link:</span>
                    </div>

                    <select
                      value={analyticsLinkFilter}
                      onChange={(e) => setAnalyticsLinkFilter(e.target.value)}
                      className="h-8 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-800 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                    >
                      <option value="all">Todos os links combinados</option>
                      {(data?.links ?? []).map((l) => (
                        <option key={l.id} value={l.id}>
                          /{l.slug} ({l.clicks} cliques)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4 Cards de Métricas Analíticas */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 min-w-0">
                    {/* Top Países */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 min-w-0">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5">
                          <Globe2 size={14} className="text-zinc-500" />
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Países
                          </h3>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {activeAnalyticsSummary.countries.length ? (
                          activeAnalyticsSummary.countries.slice(0, 5).map((c) => {
                            const percent = Math.round((c.value / (activeAnalyticsSummary.totalClicks || 1)) * 100);
                            return (
                              <div key={c.label} className="space-y-1">
                                <div className="flex justify-between text-xs font-medium">
                                  <span className="text-zinc-800 dark:text-zinc-200 truncate">{c.label}</span>
                                  <span className="text-zinc-400 flex-none">{c.value} ({percent}%)</span>
                                </div>
                                <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                  <div className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full" style={{ width: `${percent}%` }} />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-zinc-400 py-3 text-center">Sem dados de país.</p>
                        )}
                      </div>
                    </div>

                    {/* Origens de Tráfego */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 min-w-0">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5">
                          <Compass size={14} className="text-zinc-500" />
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Origens
                          </h3>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {activeAnalyticsSummary.referrers.length ? (
                          activeAnalyticsSummary.referrers.slice(0, 5).map((r) => {
                            const percent = Math.round((r.value / (activeAnalyticsSummary.totalClicks || 1)) * 100);
                            return (
                              <div key={r.label} className="space-y-1">
                                <div className="flex justify-between text-xs font-medium">
                                  <span className="text-zinc-800 dark:text-zinc-200 truncate">{r.label}</span>
                                  <span className="text-zinc-400 flex-none">{r.value} ({percent}%)</span>
                                </div>
                                <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                  <div className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full" style={{ width: `${percent}%` }} />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-zinc-400 py-3 text-center">Sem dados de origem.</p>
                        )}
                      </div>
                    </div>

                    {/* Dispositivos & Sistemas */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 min-w-0">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5">
                          <Smartphone size={14} className="text-zinc-500" />
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Dispositivos & OS
                          </h3>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {activeAnalyticsSummary.devices.length ? (
                          activeAnalyticsSummary.devices.map((d) => {
                            const percent = Math.round((d.value / (activeAnalyticsSummary.totalClicks || 1)) * 100);
                            return (
                              <div key={d.label} className="space-y-1">
                                <div className="flex justify-between text-xs font-medium">
                                  <span className="text-zinc-800 dark:text-zinc-200 truncate">{d.label}</span>
                                  <span className="text-zinc-400 flex-none">{d.value} ({percent}%)</span>
                                </div>
                                <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                  <div className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full" style={{ width: `${percent}%` }} />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-zinc-400 py-3 text-center">Sem dados de dispositivo.</p>
                        )}
                      </div>
                    </div>

                    {/* Navegadores */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 min-w-0">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5">
                          <Monitor size={14} className="text-zinc-500" />
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Navegadores
                          </h3>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {activeAnalyticsSummary.browsers.length ? (
                          activeAnalyticsSummary.browsers.slice(0, 5).map((b) => {
                            const percent = Math.round((b.value / (activeAnalyticsSummary.totalClicks || 1)) * 100);
                            return (
                              <div key={b.label} className="space-y-1">
                                <div className="flex justify-between text-xs font-medium">
                                  <span className="text-zinc-800 dark:text-zinc-200 truncate">{b.label}</span>
                                  <span className="text-zinc-400 flex-none">{b.value} ({percent}%)</span>
                                </div>
                                <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                  <div className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full" style={{ width: `${percent}%` }} />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-zinc-400 py-3 text-center">Sem dados de navegadores.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Log de Atividade em Tempo Real */}
                  <div className="rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 overflow-hidden min-w-0">
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Histórico de Acessos Recentes
                      </h3>
                      <span className="text-xs text-zinc-400">Tempo real</span>
                    </div>

                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {activeAnalyticsEvents.length ? (
                        activeAnalyticsEvents.slice(0, 25).map((evt) => (
                          <div key={evt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3.5 text-xs">
                            <div className="flex items-center gap-2">
                              <DeviceIcon device={evt.device} />
                              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                {[evt.city, evt.region, evt.country].filter(Boolean).join(", ") || "Brasil"}
                              </span>
                              {evt.qr && (
                                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  QR Code
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                              <span>Origem: {evt.referrerName || "Direto"}</span>
                              <span>{evt.browser || "Navegador"}</span>
                              <span>{evt.os || ""}</span>
                              <span>{new Date(evt.createdAt).toLocaleString("pt-BR")}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="p-6 text-center text-xs text-zinc-400">Nenhum evento registrado ainda.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: API & INTEGRAÇÕES */}
              {view === "api" && (
                <div className="space-y-6 min-w-0">
                  {/* Card Direcionando para a Documentação */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 min-w-0">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-zinc-700 dark:text-zinc-200" />
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Documentação da API REST
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Consulte a referência completa com todos os endpoints, parâmetros aceitos, respostas JSON e rate-limits.
                      </p>
                    </div>

                    <Link
                      href="/documentacao"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 flex-none"
                    >
                      <span>Abrir Documentação</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>

                  {/* Chave de API Privada */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4 min-w-0">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <KeyRound size={16} className="text-zinc-600 dark:text-zinc-300" />
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Chave de API Privada
                          </h3>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Envie esta chave no cabeçalho <code className="rounded bg-zinc-100 px-1 py-0.5 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 font-mono">X-API-Key</code>.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsResetKeyModalOpen(true)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 px-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
                        type="button"
                      >
                        <RotateCcw size={12} />
                        <span>Resetar Chave</span>
                      </button>
                    </div>

                    {resetKeySuccess && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-300 animate-in fade-in duration-200">
                        {resetKeySuccess}
                      </div>
                    )}

                    {/* Exibição da chave sem quebrar layout */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0">
                      <div className="h-9 min-w-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 px-3 font-mono text-xs text-zinc-800 flex items-center dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                        <span className="truncate w-full block select-all">
                          {showApiKey ? data?.apiKey : "••••••••••••••••••••••••••••••••••••••••"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-none">
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="h-9 flex-1 sm:flex-none rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          type="button"
                        >
                          {showApiKey ? "Ocultar" : "Revelar"}
                        </button>
                        <button
                          onClick={() => data?.apiKey && copy(data.apiKey)}
                          className="inline-flex h-9 flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                          type="button"
                        >
                          {copied === data?.apiKey ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copied === data?.apiKey ? "Copiado" : "Copiar"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Exemplos de Código por Linguagem com Destaque Colorido */}
                  <div className="rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden min-w-0">
                    <div className="flex items-center justify-between p-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Exemplo de Requisição</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCodeLang("curl")}
                            className={`rounded px-2.5 py-1 text-xs font-medium transition ${codeLang === "curl" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                          >
                            cURL
                          </button>
                          <button
                            onClick={() => setCodeLang("javascript")}
                            className={`rounded px-2.5 py-1 text-xs font-medium transition ${codeLang === "javascript" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                          >
                            JavaScript
                          </button>
                          <button
                            onClick={() => setCodeLang("python")}
                            className={`rounded px-2.5 py-1 text-xs font-medium transition ${codeLang === "python" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                          >
                            Python
                          </button>
                        </div>

                        <button
                          onClick={copySnippet}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                          type="button"
                          title="Copiar código"
                        >
                          {copiedSnippet ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          <span>{copiedSnippet ? "Copiado" : "Copiar"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Bloco de Código com Cores Vivas e Sintaxe Formatada */}
                    <div className="max-w-full overflow-x-auto p-4 font-mono text-xs bg-zinc-950 text-zinc-100 selection:bg-zinc-800 leading-relaxed">
                      <HighlightedCode
                        lang={codeLang}
                        baseUrl={data?.baseUrl ?? "https://link.guidev.site"}
                        apiKey={data?.apiKey ?? "sua_chave_aqui"}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal de Criação de Link com Fundo Blur */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
              <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Criar Novo Link</h2>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    type="button"
                  >
                    <X size={15} />
                  </button>
                </div>

                <form onSubmit={handleCreateLink} className="mt-4 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">URL Original</label>
                    <input
                      type="url"
                      placeholder="https://exemplo.com/pagina"
                      value={createUrl}
                      onChange={(e) => setCreateUrl(e.target.value)}
                      required
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Slug Personalizado <span className="text-zinc-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="meu-slug"
                      value={createSlug}
                      onChange={(e) => setCreateSlug(e.target.value)}
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>

                  {createError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{createError}</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="h-8 rounded-lg px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!createUrl.trim() || isCreating}
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-zinc-900 px-3.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                    >
                      {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      <span>Criar</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal de Edição de Link com Fundo Blur */}
          {editModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
              <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Editar Link</h2>
                  <button
                    onClick={() => setEditModal(null)}
                    className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    type="button"
                  >
                    <X size={15} />
                  </button>
                </div>

                <form onSubmit={handleEditLink} className="mt-4 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">URL de Destino</label>
                    <input
                      type="url"
                      placeholder="https://exemplo.com/pagina"
                      value={editModal.url}
                      onChange={(e) => setEditModal({ ...editModal, url: e.target.value })}
                      required
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Slug</label>
                    <input
                      type="text"
                      placeholder="slug"
                      value={editModal.slug}
                      onChange={(e) => setEditModal({ ...editModal, slug: e.target.value })}
                      required
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>

                  {editError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{editError}</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditModal(null)}
                      className="h-8 rounded-lg px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!editModal.url.trim() || !editModal.slug.trim() || isEditing}
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-zinc-900 px-3.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                    >
                      {isEditing ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      <span>Salvar Alterações</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal de Resetar Chave de API com Fundo Blur */}
          {isResetKeyModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
              <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Resetar Chave de API</h3>
                  <button
                    onClick={() => setIsResetKeyModalOpen(false)}
                    className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    type="button"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="my-4 space-y-2">
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    Tem certeza de que deseja gerar uma nova chave de API?
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Sua chave atual será <strong>imediatamente revogada</strong>. Quaisquer aplicações ou scripts que utilizam a chave antiga precisarão ser atualizados.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsResetKeyModalOpen(false)}
                    className="h-8 rounded-lg px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleResetApiKey}
                    disabled={isResettingKey}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isResettingKey ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                    <span>Confirmar e Resetar</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de QR Code com Fundo Blur */}
          {qrModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
              <div className="w-full max-w-xs rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 text-center animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">QR Code</h3>
                  <button
                    onClick={() => setQrModal(null)}
                    className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    type="button"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="my-4 flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={createQrCodeUrl(qrModal.targetUrl, { size: 220, margin: 8 })}
                    alt={`QR Code ${qrModal.shortUrl}`}
                    className="h-40 w-40 rounded border border-zinc-200 dark:border-zinc-800"
                  />
                  <p className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 truncate max-w-full">
                    {qrModal.shortUrl}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => downloadQrCode(qrModal.targetUrl, qrModal.slug)}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-zinc-900 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                    type="button"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => setQrModal(null)}
                    className="h-8 rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    type="button"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Confirmação de Exclusão com Fundo Blur */}
          {deleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
              <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Excluir Link</h3>
                  <button
                    onClick={() => setDeleteModal(null)}
                    className="rounded p-1 text-zinc-400 hover:text-zinc-600"
                    type="button"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="my-4 space-y-2">
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    Tem certeza que deseja excluir o link <strong className="text-zinc-900 dark:text-white">{deleteModal.shortUrl}</strong>?
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Esta ação não pode ser desfeita. Todos os cliques futuros resultarão em 404.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setDeleteModal(null)}
                    className="h-8 rounded-lg px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteLink}
                    disabled={isDeleting}
                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-600 px-3.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function HighlightedCode({
  lang,
  baseUrl,
  apiKey
}: {
  lang: CodeLang;
  baseUrl: string;
  apiKey: string;
}) {
  if (lang === "curl") {
    return (
      <div className="space-y-1">
        <div className="text-zinc-500 italic">{"# 1. Criar novo link curto"}</div>
        <div>
          <span className="text-amber-400 font-bold">curl</span>{" "}
          <span className="text-cyan-400 font-semibold">-X</span>{" "}
          <span className="text-amber-300 font-semibold">POST</span>{" "}
          <span className="text-emerald-300">{`${baseUrl}/api/links`}</span>{" "}
          <span className="text-zinc-500">\</span>
        </div>
        <div className="pl-4">
          <span className="text-cyan-400 font-semibold">-H</span>{" "}
          <span className="text-emerald-400">&quot;Content-Type: application/json&quot;</span>{" "}
          <span className="text-zinc-500">\</span>
        </div>
        <div className="pl-4">
          <span className="text-cyan-400 font-semibold">-H</span>{" "}
          <span className="text-emerald-400">&quot;X-API-Key: {apiKey}&quot;</span>{" "}
          <span className="text-zinc-500">\</span>
        </div>
        <div className="pl-4">
          <span className="text-cyan-400 font-semibold">-d</span>{" "}
          <span className="text-emerald-400">&apos;&#123;&quot;url&quot;: &quot;https://meusite.com&quot;, &quot;slug&quot;: &quot;meu-slug&quot;&#125;&apos;</span>
        </div>
        <div className="pt-2 text-zinc-500 italic">{"# 2. Consultar link existente"}</div>
        <div>
          <span className="text-amber-400 font-bold">curl</span>{" "}
          <span className="text-cyan-400 font-semibold">-X</span>{" "}
          <span className="text-amber-300 font-semibold">GET</span>{" "}
          <span className="text-emerald-300">{`${baseUrl}/api/links/meu-slug`}</span>
        </div>
      </div>
    );
  }

  if (lang === "javascript") {
    return (
      <div className="space-y-0.5">
        <div className="text-zinc-500 italic">{"// Criar link curto via fetch"}</div>
        <div>
          <span className="text-purple-400 font-semibold">const</span>{" "}
          <span className="text-zinc-100">response</span>{" "}
          <span className="text-pink-400">=</span>{" "}
          <span className="text-purple-400 font-semibold">await</span>{" "}
          <span className="text-blue-400 font-semibold">fetch</span>
          <span className="text-zinc-400">(</span>
          <span className="text-emerald-400">&quot;{baseUrl}/api/links&quot;</span>
          <span className="text-zinc-400">, &#123;</span>
        </div>
        <div className="pl-4">
          <span className="text-sky-300">method</span>
          <span className="text-zinc-400">:</span>{" "}
          <span className="text-emerald-400">&quot;POST&quot;</span>
          <span className="text-zinc-400">,</span>
        </div>
        <div className="pl-4">
          <span className="text-sky-300">headers</span>
          <span className="text-zinc-400">:</span> <span className="text-zinc-400">&#123;</span>
        </div>
        <div className="pl-8">
          <span className="text-emerald-400">&quot;Content-Type&quot;</span>
          <span className="text-zinc-400">:</span>{" "}
          <span className="text-emerald-400">&quot;application/json&quot;</span>
          <span className="text-zinc-400">,</span>
        </div>
        <div className="pl-8">
          <span className="text-emerald-400">&quot;X-API-Key&quot;</span>
          <span className="text-zinc-400">:</span>{" "}
          <span className="text-emerald-400">&quot;{apiKey}&quot;</span>
        </div>
        <div className="pl-4">
          <span className="text-zinc-400">&#125;,</span>
        </div>
        <div className="pl-4">
          <span className="text-sky-300">body</span>
          <span className="text-zinc-400">:</span>{" "}
          <span className="text-amber-300">JSON</span>
          <span className="text-zinc-400">.</span>
          <span className="text-blue-400 font-medium">stringify</span>
          <span className="text-zinc-400">(&#123;</span>
        </div>
        <div className="pl-8">
          <span className="text-sky-300">url</span>
          <span className="text-zinc-400">:</span>{" "}
          <span className="text-emerald-400">&quot;https://meusite.com&quot;</span>
          <span className="text-zinc-400">,</span>
        </div>
        <div className="pl-8">
          <span className="text-sky-300">slug</span>
          <span className="text-zinc-400">:</span>{" "}
          <span className="text-emerald-400">&quot;meu-slug&quot;</span>
        </div>
        <div className="pl-4">
          <span className="text-zinc-400">&#125;)</span>
        </div>
        <div>
          <span className="text-zinc-400">&#125;);</span>
        </div>
        <div className="pt-2">
          <span className="text-purple-400 font-semibold">const</span>{" "}
          <span className="text-zinc-100">data</span>{" "}
          <span className="text-pink-400">=</span>{" "}
          <span className="text-purple-400 font-semibold">await</span>{" "}
          <span className="text-zinc-100">response</span>
          <span className="text-zinc-400">.</span>
          <span className="text-blue-400 font-medium">json</span>
          <span className="text-zinc-400">();</span>
        </div>
        <div>
          <span className="text-amber-300">console</span>
          <span className="text-zinc-400">.</span>
          <span className="text-blue-400 font-medium">log</span>
          <span className="text-zinc-400">(</span>
          <span className="text-zinc-100">data</span>
          <span className="text-zinc-400">.</span>
          <span className="text-sky-300">shortUrl</span>
          <span className="text-zinc-400">);</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="text-zinc-500 italic">{"# Criar link curto via requests"}</div>
      <div>
        <span className="text-purple-400 font-semibold">import</span>{" "}
        <span className="text-zinc-100">requests</span>
      </div>
      <div className="pt-2">
        <span className="text-zinc-100">response</span>{" "}
        <span className="text-pink-400">=</span>{" "}
        <span className="text-zinc-100">requests</span>
        <span className="text-zinc-400">.</span>
        <span className="text-blue-400 font-medium">post</span>
        <span className="text-zinc-400">(</span>
      </div>
      <div className="pl-4">
        <span className="text-emerald-400">&quot;{baseUrl}/api/links&quot;</span>
        <span className="text-zinc-400">,</span>
      </div>
      <div className="pl-4">
        <span className="text-sky-300">headers</span>
        <span className="text-pink-400">=</span>
        <span className="text-zinc-400">&#123;</span>
        <span className="text-emerald-400">&quot;X-API-Key&quot;</span>
        <span className="text-zinc-400">:</span>{" "}
        <span className="text-emerald-400">&quot;{apiKey}&quot;</span>
        <span className="text-zinc-400">&#125;,</span>
      </div>
      <div className="pl-4">
        <span className="text-sky-300">json</span>
        <span className="text-pink-400">=</span>
        <span className="text-zinc-400">&#123;</span>
        <span className="text-emerald-400">&quot;url&quot;</span>
        <span className="text-zinc-400">:</span>{" "}
        <span className="text-emerald-400">&quot;https://meusite.com&quot;</span>
        <span className="text-zinc-400">,</span>{" "}
        <span className="text-emerald-400">&quot;slug&quot;</span>
        <span className="text-zinc-400">:</span>{" "}
        <span className="text-emerald-400">&quot;meu-slug&quot;</span>
        <span className="text-zinc-400">&#125;</span>
      </div>
      <div>
        <span className="text-zinc-400">)</span>
      </div>
      <div className="pt-2">
        <span className="text-blue-400 font-semibold">print</span>
        <span className="text-zinc-400">(</span>
        <span className="text-zinc-100">response</span>
        <span className="text-zinc-400">.</span>
        <span className="text-blue-400 font-medium">json</span>
        <span className="text-zinc-400">())</span>
      </div>
    </div>
  );
}

function DeviceIcon({ device }: { device?: string }) {
  if (device === "Mobile") {
    return <Smartphone size={13} className="text-zinc-400 flex-none" />;
  }
  if (device === "Tablet") {
    return <Tablet size={13} className="text-zinc-400 flex-none" />;
  }
  return <Laptop size={13} className="text-zinc-400 flex-none" />;
}

function MetricBox({
  label,
  value,
  icon
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
        {icon}
      </div>
      <p className="mt-1.5 text-lg font-bold text-zinc-900 dark:text-white sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
        active
          ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white font-semibold"
          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-8 space-y-6 animate-pulse min-w-0">
      <div className="h-10 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="h-9 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-64 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
