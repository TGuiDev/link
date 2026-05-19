"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  LinkIcon,
  Loader2,
  LogOut,
  MapPin,
  MousePointerClick,
  Moon,
  Palette,
  Plus,
  QrCode,
  Search,
  Settings,
  Shield,
  Sparkles,
  ScanLine,
  Sun,
  KeyRound,
  Type,
  UserRound,
  Wand2,
  X
} from "lucide-react";
import type { RealtimeChannel, User } from "@supabase/supabase-js";
import { clearCachedNavbarUser, getCachedNavbarUser, primeCachedNavbarUser, type NavbarUser } from "@/lib/navbar-user";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { createQrCodeUrl, normalizeHex } from "@/lib/qrcode";

type DashboardData = {
  user: {
    id: string;
    email?: string;
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
  countries: Array<{ label: string; value: number }>;
  locations: Array<{ label: string; value: number }>;
  referrers: Array<{ label: string; value: number }>;
  recentEvents: Array<{
    id: string;
    linkId: string;
    country: string;
    region: string | null;
    city: string | null;
    referrer: string | null;
    createdAt: string;
  }>;
};

type Theme = "light" | "dark";
type DashboardSection = "overview" | "links" | "api" | "account";
type QrCustomization = {
  foreground: string;
  background: string;
  frame: string;
  size: number;
  margin: number;
  framePadding: number;
  frameRadius: number;
  label: string;
  labelColor: string;
  labelSize: number;
  labelPosition: "top" | "bottom";
  logoUrl: string;
  logoSize: number;
  logoPadding: number;
  logoRadius: number;
};

type QrPreset = {
  name: string;
  foreground: string;
  background: string;
  frame: string;
  margin: number;
  label: string;
  labelColor: string;
  labelPosition: "top" | "bottom";
  framePadding: number;
  frameRadius: number;
};

const qrPresets: QrPreset[] = [
  { name: "Classico", foreground: "#18181B", background: "#FFFFFF", frame: "#FFFFFF", margin: 12, label: "", labelColor: "#18181B", labelPosition: "bottom", framePadding: 28, frameRadius: 18 },
  { name: "Noite", foreground: "#FFFFFF", background: "#18181B", frame: "#09090B", margin: 14, label: "Escaneie o QR Code", labelColor: "#FFFFFF", labelPosition: "bottom", framePadding: 30, frameRadius: 22 },
  { name: "Esmeralda", foreground: "#064E3B", background: "#ECFDF5", frame: "#D1FAE5", margin: 16, label: "Acesse pelo QR Code", labelColor: "#065F46", labelPosition: "bottom", framePadding: 34, frameRadius: 24 },
  { name: "Link Pro", foreground: "#111827", background: "#F8FAFC", frame: "#FFFFFF", margin: 18, label: "link.guidev.site", labelColor: "#111827", labelPosition: "top", framePadding: 36, frameRadius: 28 }
];

const card = "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors duration-200 ease-out dark:border-white/10 dark:bg-zinc-900";
const input =
  "h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 text-zinc-950 outline-none transition-colors duration-200 ease-out focus:border-zinc-950 focus:ring-4 focus:ring-zinc-100 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-emerald-300 dark:focus:ring-emerald-300/10";

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [custom, setCustom] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState("");
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";

    const savedTheme = window.localStorage.getItem("link-theme");
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;

    return "dark";
  });
  const [dashboardUser, setDashboardUser] = useState<NavbarUser | null>(() => getCachedNavbarUser() ?? null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [qrCustomization, setQrCustomization] = useState<QrCustomization>({
    foreground: "#18181B",
    background: "#FFFFFF",
    frame: "#FFFFFF",
    size: 260,
    margin: 12,
    framePadding: 28,
    frameRadius: 18,
    label: "",
    labelColor: "#18181B",
    labelSize: 22,
    labelPosition: "bottom",
    logoUrl: "",
    logoSize: 54,
    logoPadding: 8,
    logoRadius: 10
  });

  const canSubmit = useMemo(() => url.trim().length > 3 && (!custom || slug.trim().length >= 3), [custom, slug, url]);
  const filteredLinks = useMemo(() => {
    const links = data?.links ?? [];
    const query = search.trim().toLowerCase();

    if (!query) return links;

    return links.filter((link) => {
      return (
        link.slug.toLowerCase().includes(query) ||
        link.shortUrl.toLowerCase().includes(query) ||
        link.url.toLowerCase().includes(query)
      );
    });
  }, [data?.links, search]);
  const selectedLink = useMemo(() => {
    if (!selectedLinkId) return null;
    return data?.links.find((link) => link.id === selectedLinkId) ?? null;
  }, [data?.links, selectedLinkId]);
  const selectedLinkEvents = useMemo(() => {
    if (!selectedLinkId) return [];
    return (data?.recentEvents ?? []).filter((event) => event.linkId === selectedLinkId);
  }, [data?.recentEvents, selectedLinkId]);
  const selectedQrCodeUrl = useMemo(() => {
    if (!selectedLink) return "";

    return createQrCodeUrl(selectedLink.shortUrl, {
      size: qrCustomization.size,
      foreground: normalizeHex(qrCustomization.foreground),
      background: normalizeHex(qrCustomization.background, "FFFFFF"),
      margin: Math.max(qrCustomization.margin, 8)
    });
  }, [qrCustomization, selectedLink]);
  const qrReadability = useMemo(() => getQrReadability(qrCustomization), [qrCustomization]);

  useEffect(() => {
    let refreshTimeout: number | null = null;
    let channel: RealtimeChannel | null = null;
    const supabase = getSupabaseBrowser();

    async function subscribeToDashboardChanges() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user ?? null;

      if (!user) return;

      hydrateDashboardUser(user);

      channel = supabase
        .channel(`dashboard-links-${user.id}-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "links",
            filter: `user_id=eq.${user.id}`
          },
          () => {
            if (refreshTimeout) {
              window.clearTimeout(refreshTimeout);
            }

            refreshTimeout = window.setTimeout(() => {
              loadDashboard({ silent: true });
            }, 250);
          }
        )
        .subscribe();
    }

    loadDashboard();
    subscribeToDashboardChanges();

    return () => {
      if (refreshTimeout) {
        window.clearTimeout(refreshTimeout);
      }

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (qrCustomization.logoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(qrCustomization.logoUrl);
      }
    };
  }, [qrCustomization.logoUrl]);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    window.localStorage.setItem("link-theme", nextTheme);
  }

  async function getAccessToken() {
    const supabase = getSupabaseBrowser();
    const { data: sessionData } = await supabase.auth.getSession();
    hydrateDashboardUser(sessionData.session?.user ?? null);

    return sessionData.session?.access_token ?? null;
  }

  function hydrateDashboardUser(user: User | null) {
    if (!user) {
      setDashboardUser(null);
      clearCachedNavbarUser();
      return;
    }

    primeCachedNavbarUser(user);
    setDashboardUser(getCachedNavbarUser() ?? null);
  }

  async function loadDashboard(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsLoading(true);
    }

    setError("");

    const token = await getAccessToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const response = await fetch("/api/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Nao foi possivel carregar o painel.");
      if (!options?.silent) {
        setIsLoading(false);
      }

      return;
    }

    setData(payload);

    if (!options?.silent) {
      setIsLoading(false);
    }
  }

  async function createLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError("");

    const token = await getAccessToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const response = await fetch("/api/links", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url,
        slug: custom ? slug : undefined
      })
    });

    const payload = await response.json();
    setIsCreating(false);

    if (!response.ok) {
      setError(payload.error ?? "Nao foi possivel criar o link.");
      return;
    }

    setUrl("");
    setSlug("");
    await loadDashboard({ silent: true });
    await copy(payload.shortUrl);
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(""), 1600);
  }

  function applyQrPreset(preset: QrPreset) {
    setQrCustomization((current) => ({
      ...current,
      foreground: preset.foreground,
      background: preset.background,
      frame: preset.frame,
      margin: preset.margin,
      framePadding: preset.framePadding,
      frameRadius: preset.frameRadius,
      label: preset.label,
      labelColor: preset.labelColor,
      labelPosition: preset.labelPosition
    }));
  }

  function uploadQrLogo(file: File | null) {
    if (!file) return;

    const nextLogoUrl = URL.createObjectURL(file);
    setQrCustomization((current) => {
      if (current.logoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(current.logoUrl);
      }

      return {
        ...current,
        logoUrl: nextLogoUrl
      };
    });
  }

  function fixQrReadability() {
    setQrCustomization((current) => ({
      ...current,
      foreground: "#18181B",
      background: "#FFFFFF",
      frame: current.frame,
      margin: Math.max(current.margin, 12),
      logoSize: Math.min(current.logoSize, Math.floor(current.size * 0.2)),
      logoPadding: Math.min(current.logoPadding, 10)
    }));
  }

  async function downloadCustomQrCode() {
    if (!selectedLink) return;

    try {
      const canvas = document.createElement("canvas");
      const qrSize = qrCustomization.size;
      const labelHeight = qrCustomization.label.trim() ? qrCustomization.labelSize + 30 : 0;
      const padding = qrCustomization.framePadding;
      canvas.width = qrSize + padding * 2;
      canvas.height = qrSize + padding * 2 + labelHeight;

      const context = canvas.getContext("2d");
      if (!context) return;

      context.fillStyle = toColorInputValue(qrCustomization.frame, "#FFFFFF");
      roundedRect(context, 0, 0, canvas.width, canvas.height, qrCustomization.frameRadius);
      context.fill();

      const qrImage = await loadImage(selectedQrCodeUrl);
      const qrY = padding + (qrCustomization.label.trim() && qrCustomization.labelPosition === "top" ? labelHeight : 0);
      context.drawImage(qrImage, padding, qrY, qrSize, qrSize);

      if (qrCustomization.logoUrl) {
        const logoImage = await loadImage(qrCustomization.logoUrl);
        const logoSize = Math.min(qrCustomization.logoSize, qrSize * 0.2);
        const logoX = padding + qrSize / 2 - logoSize / 2;
        const logoY = qrY + qrSize / 2 - logoSize / 2;

        context.fillStyle = toColorInputValue(qrCustomization.background, "#FFFFFF");
        roundedRect(context, logoX - qrCustomization.logoPadding, logoY - qrCustomization.logoPadding, logoSize + qrCustomization.logoPadding * 2, logoSize + qrCustomization.logoPadding * 2, qrCustomization.logoRadius + qrCustomization.logoPadding);
        context.fill();
        context.save();
        roundedRect(context, logoX, logoY, logoSize, logoSize, qrCustomization.logoRadius);
        context.clip();
        context.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
        context.restore();
      }

      if (qrCustomization.label.trim()) {
        context.fillStyle = toColorInputValue(qrCustomization.labelColor, "#18181B");
        context.font = `800 ${qrCustomization.labelSize}px Nunito Sans, Arial, sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        const labelY = qrCustomization.labelPosition === "top" ? labelHeight / 2 + 2 : qrY + qrSize + labelHeight / 2;
        context.fillText(qrCustomization.label.trim(), canvas.width / 2, labelY, canvas.width - padding * 2);
      }

      const link = document.createElement("a");
      link.download = `qrcode-${selectedLink.slug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      window.open(selectedQrCodeUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function signOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    clearCachedNavbarUser();
    window.location.href = "/";
  }

  return (
    <main className={theme === "dark" ? "dark" : ""}>
      <section className="min-h-screen bg-zinc-50 text-zinc-950 transition-colors duration-200 ease-out dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-6 md:px-8">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image
              className="h-10 w-10 rounded-lg object-contain"
              src={theme === "dark" ? "/Dark_Theme_Logo.svg" : "/Light_Theme_Logo.svg"}
              alt="Link"
              width={40}
              height={40}
              loading="eager"
            />
            <div>
              <p className="text-xl font-black">Link</p>
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Dashboard</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              className="hidden h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-700 transition hover:border-zinc-400 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/30 sm:inline-flex"
              href="/documentacao"
            >
              <BookOpen size={15} />
              Documenta&ccedil;&atilde;o
            </Link>
            <div className="relative">
              <button
                className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 pr-3 text-sm font-bold text-zinc-700 transition hover:border-zinc-400 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/30"
                onClick={() => setIsMenuOpen((current) => !current)}
                type="button"
              >
                {dashboardUser?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="h-7 w-7 rounded-full object-cover" src={dashboardUser.avatarUrl} alt="" />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-100 text-xs font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                    {(dashboardUser?.name ?? data?.user.email ?? "L").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="hidden max-w-[160px] truncate sm:block">
                  {dashboardUser?.name ?? data?.user.email ?? "Minha conta"}
                </span>
                <ChevronDown size={15} />
              </button>

              {isMenuOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-zinc-900">
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    onClick={signOut}
                    type="button"
                  >
                    <LogOut size={15} />
                    Sair
                  </button>
                </div>
              ) : null}
            </div>
            <button
              className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/30 dark:hover:text-white"
              onClick={toggleTheme}
              title="Alternar tema"
              aria-label="Alternar tema"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                <div>
                  <p className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-300">Painel</p>
                  <h1 className="mt-1 text-3xl font-black tracking-normal">Central de controle</h1>
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                    Gerencie links, acompanhe métricas, copie sua API key e revise as configurações da conta em um so lugar.
                  </p>
                </div>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-black text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                  onClick={() => setActiveSection("links")}
                  type="button"
                >
                  <Plus size={17} />
                  Novo link
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Metric icon={<LinkIcon size={18} />} label="Links" value={data?.summary.links ?? 0} />
                <Metric icon={<MousePointerClick size={18} />} label="Cliques" value={data?.summary.clicks ?? 0} />
                <Metric icon={<BarChart3 size={18} />} label="Eventos" value={data?.summary.trackedEvents ?? 0} />
              </div>
            </div>

            <div className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-zinc-900 sm:grid-cols-4">
              <SectionButton active={activeSection === "overview"} icon={<BarChart3 size={16} />} onClick={() => setActiveSection("overview")}>
                Visão geral
              </SectionButton>
              <SectionButton active={activeSection === "links"} icon={<LinkIcon size={16} />} onClick={() => setActiveSection("links")}>
                Links
              </SectionButton>
              <SectionButton active={activeSection === "api"} icon={<Code2 size={16} />} onClick={() => setActiveSection("api")}>
                API
              </SectionButton>
              <SectionButton active={activeSection === "account"} icon={<Settings size={16} />} onClick={() => setActiveSection("account")}>
                Conta
              </SectionButton>
            </div>

            {activeSection === "overview" ? (
              <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                <div className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Ranking title="Localidades" icon={<MapPin size={18} />} items={data?.locations ?? data?.countries ?? []} />
                    <Ranking title="Origem" icon={<ExternalLink size={18} />} items={data?.referrers ?? []} />
                  </div>

                  <div className={card}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase text-zinc-400">Atividade</p>
                        <h2 className="text-xl font-black">Últimos acessos</h2>
                      </div>
                      <span className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {(data?.recentEvents ?? []).length} eventos
                      </span>
                    </div>
                    <div className="space-y-2">
                      {(data?.recentEvents ?? []).length ? (
                        (data?.recentEvents ?? []).slice(0, 8).map((event) => (
                          <div className="grid gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950 sm:grid-cols-[1fr_auto]" key={event.id}>
                            <span className="truncate font-bold text-zinc-600 dark:text-zinc-300">{formatLocation(event)}</span>
                            <span className="text-xs font-bold text-zinc-400">{new Date(event.createdAt).toLocaleDateString("pt-BR")}</span>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-5 text-sm font-medium text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
                          Ainda nao ha eventos rastreados.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className={card}>
                  <div className="mb-4 flex items-center gap-2 text-lg font-black">
                    <Shield size={18} />
                    Operação
                  </div>
                  <div className="space-y-3">
                    <MiniStat label="Base URL" value={data?.baseUrl ?? "link.guidev.site"} />
                    <MiniStat label="Links ativos" value={data?.summary.links ?? 0} />
                    <MiniStat label="Eventos analisados" value={data?.summary.trackedEvents ?? 0} />
                  </div>
                  <button
                    className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 text-xs font-black text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white"
                    onClick={() => setActiveSection("api")}
                    type="button"
                  >
                    <Code2 size={15} />
                    Configurar API
                  </button>
                </div>
              </div>
            ) : null}

            {activeSection === "links" ? (
              <div className="grid min-w-0 gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-5">
                  <div className={card}>
                    <h2 className="text-2xl font-black tracking-normal">Novo link</h2>
                    <p className="mt-2 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                      Crie um link vínculado a sua conta para acompanhar as métricas.
                    </p>

                    <form className="mt-5 space-y-4" onSubmit={createLink}>
                      <label className="block space-y-2">
                        <span className="text-sm font-bold">URL original</span>
                        <input className={input} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://guidev.site" inputMode="url" />
                      </label>

                      <label className="block space-y-3">
                        <span className="flex items-center justify-between gap-4">
                          <span className="text-sm font-bold">Slug</span>
                          <span className="flex items-center gap-1 text-sm font-bold">
                            <input
                              className="h-4 w-4 rounded-md border-zinc-300 accent-zinc-950 dark:border-white/20 dark:accent-white"
                              type="checkbox"
                              checked={custom}
                              onChange={(event) => setCustom(event.target.checked)}
                            />
                            Customizado
                          </span>
                        </span>
                        <input className={input} disabled={!custom} value={custom ? slug : ""} onChange={(event) => setSlug(event.target.value)} placeholder={custom ? "batata" : "random"} />
                      </label>

                      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

                      <button
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-black text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                        disabled={!canSubmit || isCreating}
                      >
                        {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                        Criar e copiar
                      </button>
                    </form>
                  </div>

                </div>

                <div className={`${card} min-w-0`}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase text-zinc-400">Biblioteca</p>
                      <h2 className="text-xl font-black">Seus links</h2>
                    </div>
                    <span className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {filteredLinks.length} de {data?.links.length ?? 0}
                    </span>
                  </div>

                  <label className="mb-4 flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950">
                    <Search size={17} className="text-zinc-400" />
                    <input className="min-w-0 flex-1 bg-transparent font-medium text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-white" placeholder="Pesquisar por slug, link curto ou URL" value={search} onChange={(event) => setSearch(event.target.value)} />
                  </label>

                  <div className="space-y-3">
                    {filteredLinks.length ? (
                      filteredLinks.map((link) => (
                        <div
                          className={`min-w-0 rounded-xl border bg-white p-4 transition dark:bg-zinc-950 ${
                            selectedLinkId === link.id ? "border-emerald-300 ring-4 ring-emerald-100 dark:border-emerald-400/40 dark:ring-emerald-400/10" : "border-zinc-200 hover:border-zinc-400 dark:border-white/10 dark:hover:border-white/30"
                          }`}
                          key={link.id}
                        >
                          <div className="flex min-w-0 flex-col justify-between gap-3 md:flex-row md:items-center">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black">{link.shortUrl}</p>
                              <p className="mt-1 max-w-full truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">{link.url}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 md:flex-none md:flex-nowrap">
                              <span className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{link.clicks} cliques</span>
                              <button className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white" onClick={() => setSelectedLinkId(link.id)} title="Gerar QR Code" aria-label="Gerar QR Code" type="button">
                                <QrCode size={17} />
                              </button>
                              <button className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-950 text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200" onClick={() => copy(link.shortUrl)} title="Copiar" aria-label="Copiar">
                                {copied === link.shortUrl ? <Check size={17} /> : <Copy size={17} />}
                              </button>
                              <button className="h-10 rounded-lg border border-zinc-200 px-3 text-xs font-black text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white" onClick={() => setSelectedLinkId(link.id)} type="button">
                                Ver
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-white/10 dark:bg-zinc-950">
                        <Wand2 className="mx-auto mb-3 text-zinc-500 dark:text-zinc-400" />
                        <p className="text-sm font-black">{search ? "Nenhum link encontrado para essa busca." : "Crie seu primeiro link para ver metricas aqui."}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {activeSection === "api" ? (
              <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className={`${card} min-w-0`}>
                  <div className="mb-4 flex items-center gap-2 text-xl font-black">
                    <KeyRound size={19} />
                    API key
                  </div>
                  <p className="max-w-2xl text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                    Use esta chave para criar links e consultar metricas pela API. Ela representa sua conta, então trate como segredo.
                  </p>
                  <div className="mt-5 flex min-w-0 flex-col gap-2 sm:flex-row">
                    <input className="h-12 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 font-mono text-xs font-bold text-zinc-700 outline-none dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200" readOnly value={data?.apiKey ?? ""} />
                    <button className="grid h-12 w-full flex-none place-items-center rounded-lg bg-zinc-950 text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 sm:w-12" onClick={() => data?.apiKey && copy(data.apiKey)} title="Copiar API key" aria-label="Copiar API key" type="button">
                      {copied === data?.apiKey ? <Check size={17} /> : <Copy size={17} />}
                    </button>
                  </div>
                  <div className="mt-5 max-w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 dark:border-white/10">
                    <div className="border-b border-white/10 px-4 py-2 text-xs font-black text-zinc-400">cURL</div>
                    <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words p-4 text-sm font-bold leading-6 text-zinc-100">
                      <code>{`curl -X POST ${data?.baseUrl ?? "https://link.guidev.site"}/api/links \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${data?.apiKey ?? "link_sua_api_key"}" \\
  -d "{\\"url\\":\\"https://guidev.site\\",\\"slug\\":\\"portfolio\\"}"`}</code>
                    </pre>
                  </div>
                </div>

                <div className={`${card} min-w-0`}>
                  <div className="mb-4 flex items-center gap-2 text-lg font-black">
                    <BookOpen size={18} />
                    Referencia
                  </div>
                  <div className="space-y-3">
                    <MiniStat label="Criar link" value="POST /api/links" />
                    <MiniStat label="Consultar link" value="GET /api/links/{slug}" />
                    <MiniStat label="Dashboard" value="GET /api/dashboard" />
                  </div>
                  <Link className="mt-4 flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 text-xs font-black text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white" href="/documentacao">
                    <BookOpen size={15} />
                    Abrir documentacao
                  </Link>
                </div>
              </div>
            ) : null}

            {activeSection === "account" ? (
              <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-5">
                  <div className={card}>
                    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        {dashboardUser?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="h-16 w-16 flex-none rounded-xl object-cover" src={dashboardUser.avatarUrl} alt="" />
                        ) : (
                          <span className="grid h-16 w-16 flex-none place-items-center rounded-xl bg-zinc-100 text-2xl font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                            {(dashboardUser?.name ?? data?.user.email ?? "L").slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-2xl font-black">{dashboardUser?.name ?? data?.user.email ?? "Minha conta"}</p>
                          <p className="truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">{dashboardUser?.email ?? data?.user.email}</p>
                        </div>
                      </div>
                      <span className="w-fit rounded-lg bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
                        Conta ativa
                      </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <MiniStat label="ID do usuário" value={data?.user.id.slice(0, 8) ?? "--"} />
                      <MiniStat label="Links criados" value={data?.summary.links ?? 0} />
                      <MiniStat label="Cliques totais" value={data?.summary.clicks ?? 0} />
                    </div>
                  </div>

                  <div className={card}>
                    <div className="mb-4 flex items-center gap-2 text-lg font-black">
                      <Shield size={18} />
                      Seguranca e acesso
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <AccountSetting
                        title="API key"
                        description="Disponível na aba API para integrações server-side."
                        action="Abrir API"
                        onClick={() => setActiveSection("api")}
                      />
                      <AccountSetting
                        title="Sessão"
                        description="Sair da sessão atual."
                        action="Sair"
                        onClick={signOut}
                        danger
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className={`${card} min-w-0`}>
                    <div className="mb-4 flex items-center gap-2 text-lg font-black">
                      <UserRound size={18} />
                      Preferências
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-950">
                        <p className="text-xs font-black uppercase text-zinc-400">Aparência</p>
                        <p className="mt-1 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                          Tema {theme === "dark" ? "escuro" : "claro"}
                        </p>
                        <button className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm font-black text-zinc-700 transition hover:border-zinc-400 dark:border-white/10 dark:text-zinc-200 dark:hover:border-white/30" onClick={toggleTheme} type="button">
                          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                          Alternar tema
                        </button>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-950">
                        <p className="text-xs font-black uppercase text-zinc-400">Workspace</p>
                        <p className="mt-1 truncate text-sm font-bold text-zinc-700 dark:text-zinc-200">{data?.baseUrl ?? "link.guidev.site"}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`${card} min-w-0`}>
                    <div className="mb-4 flex items-center gap-2 text-lg font-black">
                      <Settings size={18} />
                      Ações da conta
                    </div>
                    <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 text-sm font-black text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200" onClick={signOut} type="button">
                      <LogOut size={16} />
                      Sair da conta
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedLink ? (
              <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
                <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900">
                  <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-200 bg-white/95 p-5 backdrop-blur dark:border-white/10 dark:bg-zinc-900/95">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase text-zinc-400">Detalhes do link</p>
                      <h2 className="mt-1 truncate text-2xl font-black">{selectedLink.shortUrl}</h2>
                      <p className="mt-1 truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">{selectedLink.url}</p>
                    </div>
                    <button
                      className="grid h-10 w-10 flex-none place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:hover:text-white"
                      onClick={() => setSelectedLinkId(null)}
                      type="button"
                      aria-label="Fechar"
                      title="Fechar"
                    >
                      <X size={17} />
                    </button>
                  </div>

                  <div className="grid gap-5 p-5 lg:grid-cols-[360px_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-950">
                        <div className={`mb-4 rounded-lg border px-3 py-2 text-sm font-bold ${
                          qrReadability.ok
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-950/20 dark:text-emerald-100"
                            : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/20 dark:bg-amber-950/20 dark:text-amber-100"
                        }`}>
                          <div className="flex items-start justify-between gap-3">
                            <span className="flex min-w-0 items-start gap-2">
                              <ScanLine className="mt-0.5 flex-none" size={16} />
                              <span>{qrReadability.message}</span>
                            </span>
                            {!qrReadability.ok ? (
                              <button className="flex-none text-xs font-black underline underline-offset-2" onClick={fixQrReadability} type="button">
                                Corrigir
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div className="relative mx-auto grid aspect-square w-full max-w-[320px] place-items-center rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10">
                          <div
                            className="flex h-full w-full flex-col items-center justify-center"
                            style={{
                              background: toColorInputValue(qrCustomization.frame, "#FFFFFF"),
                              borderRadius: qrCustomization.frameRadius,
                              padding: Math.max(10, qrCustomization.framePadding / 2)
                            }}
                          >
                            {qrCustomization.label.trim() && qrCustomization.labelPosition === "top" ? (
                              <p className="mb-3 max-w-full truncate text-center font-black" style={{ color: toColorInputValue(qrCustomization.labelColor, "#18181B"), fontSize: Math.max(12, qrCustomization.labelSize * 0.72) }}>
                                {qrCustomization.label}
                              </p>
                            ) : null}
                            <div className="relative grid min-h-0 flex-1 place-items-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img className="h-full w-full object-contain" src={selectedQrCodeUrl} alt={`QR Code para ${selectedLink.shortUrl}`} />
                              {qrCustomization.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  className="absolute border object-cover shadow-sm"
                                  src={qrCustomization.logoUrl}
                                  alt=""
                                  style={{
                                    width: qrCustomization.logoSize,
                                    height: qrCustomization.logoSize,
                                    borderColor: toColorInputValue(qrCustomization.background, "#FFFFFF"),
                                    borderRadius: qrCustomization.logoRadius,
                                    borderWidth: qrCustomization.logoPadding
                                  }}
                                />
                              ) : null}
                            </div>
                            {qrCustomization.label.trim() && qrCustomization.labelPosition === "bottom" ? (
                              <p className="mt-3 max-w-full truncate text-center font-black" style={{ color: toColorInputValue(qrCustomization.labelColor, "#18181B"), fontSize: Math.max(12, qrCustomization.labelSize * 0.72) }}>
                                {qrCustomization.label}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <button
                          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 text-xs font-black text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                          onClick={downloadCustomQrCode}
                          type="button"
                        >
                          <Download size={15} />
                          Baixar PNG
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <MiniStat label="Cliques" value={selectedLink.clicks} />
                        <MiniStat label="Eventos" value={selectedLink.trackedEvents} />
                        <MiniStat label="Slug" value={`/${selectedLink.slug}`} />
                      </div>
                    </div>

                    <div className="min-w-0 space-y-5">
                      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                        <div className="mb-4 flex items-center gap-2 text-lg font-black">
                          <Sparkles size={18} />
                          Modelos
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {qrPresets.map((preset) => (
                            <button
                              className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-left transition hover:border-zinc-400 dark:border-white/10 dark:hover:border-white/30"
                              key={preset.name}
                              onClick={() => applyQrPreset(preset)}
                              type="button"
                            >
                              <span>
                                <span className="block text-sm font-black">{preset.name}</span>
                                <span className="block text-xs font-bold text-zinc-400">{preset.label || "Sem legenda"}</span>
                              </span>
                              <span className="grid h-8 w-8 place-items-center rounded-lg border" style={{ background: preset.background, borderColor: preset.foreground }}>
                                <span className="h-3 w-3 rounded-sm" style={{ background: preset.foreground }} />
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                        <div className="mb-4 flex items-center gap-2 text-lg font-black">
                          <Palette size={18} />
                          Aparencia
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <ColorField label="Cor do QR" value={qrCustomization.foreground} onChange={(value) => setQrCustomization((current) => ({ ...current, foreground: value }))} />
                          <ColorField label="Fundo" value={qrCustomization.background} onChange={(value) => setQrCustomization((current) => ({ ...current, background: value }))} />
                          <ColorField label="Moldura" value={qrCustomization.frame} onChange={(value) => setQrCustomization((current) => ({ ...current, frame: value }))} />
                          <RangeField label="Tamanho" max={520} min={180} step={20} value={qrCustomization.size} unit="px" onChange={(value) => setQrCustomization((current) => ({ ...current, size: value }))} />
                          <RangeField label="Margem segura" max={32} min={8} step={2} value={Math.max(qrCustomization.margin, 8)} unit="px" onChange={(value) => setQrCustomization((current) => ({ ...current, margin: value }))} />
                          <RangeField label="Padding externo" max={64} min={8} step={2} value={qrCustomization.framePadding} unit="px" onChange={(value) => setQrCustomization((current) => ({ ...current, framePadding: value }))} />
                          <RangeField label="Raio da moldura" max={48} min={0} step={2} value={qrCustomization.frameRadius} unit="px" onChange={(value) => setQrCustomization((current) => ({ ...current, frameRadius: value }))} />
                        </div>
                      </div>

                      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                        <div className="mb-4 flex items-center gap-2 text-lg font-black">
                          <ImageIcon size={18} />
                          Logo central
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-center transition hover:border-zinc-400 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-white/30">
                            <ImageIcon className="mb-2 text-zinc-400" size={20} />
                            <span className="text-sm font-black">Enviar imagem</span>
                            <span className="mt-1 text-xs font-bold text-zinc-400">PNG, JPG ou SVG</span>
                            <input className="hidden" type="file" accept="image/*" onChange={(event) => uploadQrLogo(event.target.files?.[0] ?? null)} />
                          </label>
                          <div className="space-y-3">
                            <RangeField label="Logo seguro" max={Math.floor(qrCustomization.size * 0.2)} min={28} step={2} value={Math.min(qrCustomization.logoSize, Math.floor(qrCustomization.size * 0.2))} unit="px" onChange={(value) => setQrCustomization((current) => ({ ...current, logoSize: value }))} />
                            <RangeField label="Respiro" max={18} min={0} step={1} value={qrCustomization.logoPadding} unit="px" onChange={(value) => setQrCustomization((current) => ({ ...current, logoPadding: value }))} />
                            <RangeField label="Raio" max={48} min={0} step={2} value={qrCustomization.logoRadius} unit="px" onChange={(value) => setQrCustomization((current) => ({ ...current, logoRadius: value }))} />
                            <button
                              className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-xs font-black text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white"
                              onClick={() => setQrCustomization((current) => ({ ...current, logoUrl: "" }))}
                              type="button"
                            >
                              Remover imagem
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                        <div className="mb-4 flex items-center gap-2 text-lg font-black">
                          <Type size={18} />
                          Escrita
                        </div>
                        <input
                          className={input}
                          maxLength={32}
                          placeholder="Escaneie o QR Code"
                          value={qrCustomization.label}
                          onChange={(event) => setQrCustomization((current) => ({ ...current, label: event.target.value }))}
                        />
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <ColorField label="Cor do texto" value={qrCustomization.labelColor} onChange={(value) => setQrCustomization((current) => ({ ...current, labelColor: value }))} />
                          <RangeField label="Tamanho do texto" max={36} min={12} step={1} value={qrCustomization.labelSize} unit="px" onChange={(value) => setQrCustomization((current) => ({ ...current, labelSize: value }))} />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
                          <ToggleButton active={qrCustomization.labelPosition === "top"} onClick={() => setQrCustomization((current) => ({ ...current, labelPosition: "top" }))}>
                            Em cima
                          </ToggleButton>
                          <ToggleButton active={qrCustomization.labelPosition === "bottom"} onClick={() => setQrCustomization((current) => ({ ...current, labelPosition: "bottom" }))}>
                            Embaixo
                          </ToggleButton>
                        </div>
                      </div>

                      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                        <p className="mb-3 text-sm font-black">Acessos recentes</p>
                        <div className="space-y-2">
                          {selectedLinkEvents.length ? (
                            selectedLinkEvents.slice(0, 5).map((event) => (
                              <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900" key={event.id}>
                                <span className="truncate font-bold text-zinc-600 dark:text-zinc-300">{formatLocation(event)}</span>
                                <span className="text-xs font-bold text-zinc-400">{new Date(event.createdAt).toLocaleDateString("pt-BR")}</span>
                              </div>
                            ))
                          ) : (
                            <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm font-medium text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
                              Sem eventos recentes para este link.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
      </section>
    </main>
  );
}

function SectionButton({
  active,
  children,
  icon,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black transition ${
        active
          ? "bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {children}
    </button>
  );
}

function ColorField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="flex h-11 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900">
        <input className="h-11 w-12 cursor-pointer border-0 bg-transparent p-1" type="color" value={toColorInputValue(value, "#18181B")} onChange={(event) => onChange(event.target.value)} />
        <input className="min-w-0 flex-1 bg-transparent px-3 text-sm font-bold outline-none dark:text-white" value={value} onChange={(event) => onChange(event.target.value)} />
      </span>
    </label>
  );
}

function RangeField({
  label,
  max,
  min,
  onChange,
  step,
  unit,
  value
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  unit: string;
  value: number;
}) {
  return (
    <label className="space-y-2">
      <span className="flex items-center justify-between gap-3 text-xs font-black text-zinc-500 dark:text-zinc-400">
        {label}
        <span>
          {value}
          {unit}
        </span>
      </span>
      <input className="w-full accent-zinc-950 dark:accent-white" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function ToggleButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      className={`h-9 rounded-md text-sm font-black transition ${
        active
          ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white"
          : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function AccountSetting({
  action,
  danger,
  description,
  onClick,
  title
}: {
  action: string;
  danger?: boolean;
  description: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-950">
      <p className="text-sm font-black text-zinc-900 dark:text-white">{title}</p>
      <p className="mt-1 min-h-10 text-sm font-medium leading-5 text-zinc-500 dark:text-zinc-400">{description}</p>
      <button
        className={`mt-4 flex h-10 w-full items-center justify-center rounded-lg px-3 text-xs font-black transition ${
          danger
            ? "border border-red-200 text-red-700 hover:border-red-300 dark:border-red-400/20 dark:text-red-200 dark:hover:border-red-300/40"
            : "border border-zinc-200 text-zinc-700 hover:border-zinc-400 dark:border-white/10 dark:text-zinc-200 dark:hover:border-white/30"
        }`}
        onClick={onClick}
        type="button"
      >
        {action}
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <div className="space-y-5">
        <div className={card}>
          <div className="h-7 w-32 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          <div className="mt-3 h-4 w-64 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          <div className="mt-6 space-y-4">
            <div className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[0, 1, 2].map((item) => (
            <div className={card} key={item}>
              <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              <div className="mt-4 h-8 w-20 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              <div className="mt-2 h-4 w-24 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1].map((item) => (
            <div className={card} key={item}>
              <div className="h-6 w-28 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              <div className="mt-5 space-y-3">
                <div className="h-5 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-5 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-5 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
        <div className={card}>
          <div className="h-7 w-28 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          <div className="mt-4 h-11 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          <div className="mt-4 space-y-3">
            <div className="h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-950">
      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 truncate text-lg font-black">{value}</p>
    </div>
  );
}

function toColorInputValue(value: string, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function getQrReadability(customization: QrCustomization) {
  const contrast = getContrastRatio(customization.foreground, customization.background);
  const maxLogoSize = customization.size * 0.2;
  const issues: string[] = [];

  if (contrast < 4.5) {
    issues.push("aumente o contraste entre QR e fundo");
  }

  if (customization.logoUrl && customization.logoSize > maxLogoSize) {
    issues.push("reduza o logo central");
  }

  if (customization.margin < 8) {
    issues.push("use margem maior");
  }

  if (!issues.length) {
    return {
      ok: true,
      message: `Legibilidade segura. Contraste ${contrast.toFixed(1)}:1.`
    };
  }

  return {
    ok: false,
    message: `Pode ficar dificil de ler: ${issues.join(", ")}.`
  };
}

function getContrastRatio(firstColor: string, secondColor: string) {
  const first = getRelativeLuminance(firstColor);
  const second = getRelativeLuminance(secondColor);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(color: string) {
  const hex = toColorInputValue(color, "#000000").replace("#", "");
  const channels = [0, 2, 4].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function formatLocation(event: { city: string | null; region: string | null; country: string }) {
  if (event.city && event.region) return `${event.city}, ${event.region}`;
  if (event.city) return event.city;
  if (event.region) return `${event.region}, ${event.country}`;
  return event.country;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className={card}>
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{icon}</div>
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

function Ranking({ title, icon, items }: { title: string; icon: ReactNode; items: Array<{ label: string; value: number }> }) {
  return (
    <div className={card}>
      <div className="mb-4 flex items-center gap-2 text-lg font-black">
        {icon}
        {title}
      </div>
      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div className="flex items-center justify-between gap-3" key={item.label}>
              <span className="truncate text-sm font-bold text-zinc-600 dark:text-zinc-300">{item.label}</span>
              <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{item.value}</span>
            </div>
          ))
        ) : (
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Sem dados ainda.</p>
        )}
      </div>
    </div>
  );
}
