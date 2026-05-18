"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
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
  Sun,
  Wand2
} from "lucide-react";
import type { RealtimeChannel, User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { createQrCodeUrl, normalizeHex } from "@/lib/qrcode";

type DashboardData = {
  user: {
    id: string;
    email?: string;
  };
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
type DashboardUser = {
  email: string;
  name: string;
  avatarUrl: string | null;
};
type QrCustomization = {
  foreground: string;
  background: string;
  size: number;
  margin: number;
};

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
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";

    const savedTheme = window.localStorage.getItem("link-theme");
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;

    return "dark";
  });
  const [dashboardUser, setDashboardUser] = useState<DashboardUser | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [qrCustomization, setQrCustomization] = useState<QrCustomization>({
    foreground: "#18181B",
    background: "#FFFFFF",
    size: 260,
    margin: 12
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
      margin: qrCustomization.margin
    });
  }, [qrCustomization, selectedLink]);

  useEffect(() => {
    let refreshTimeout: number | null = null;
    let channel: RealtimeChannel | null = null;
    const supabase = getSupabaseBrowser();

    async function subscribeToDashboardChanges() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) return;

      hydrateDashboardUser(user);

      channel = supabase
        .channel(`dashboard-links-${user.id}`)
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
    if (!user) return;

    setDashboardUser({
      email: user.email ?? "",
      name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Usuario",
      avatarUrl: user.user_metadata?.avatar_url ?? null
    });
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

  async function signOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
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
          <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
            <div className="space-y-5">
              <div className={card}>
                <h1 className="text-2xl font-black tracking-normal">Novo link</h1>
                <p className="mt-2 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                  Crie um link vinculado a sua conta para acompanhar as metricas.
                </p>

                <form className="mt-5 space-y-4" onSubmit={createLink}>
                  <label className="block space-y-2">
                    <span className="text-sm font-bold">URL original</span>
                    <input
                      className={input}
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="https://guidev.site"
                      inputMode="url"
                    />
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
                    <input
                      className={input}
                      disabled={!custom}
                      value={custom ? slug : ""}
                      onChange={(event) => setSlug(event.target.value)}
                      placeholder={custom ? "batata" : "random"}
                    />
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

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <Metric icon={<LinkIcon size={18} />} label="Links" value={data?.summary.links ?? 0} />
                <Metric icon={<MousePointerClick size={18} />} label="Cliques" value={data?.summary.clicks ?? 0} />
                <Metric icon={<BarChart3 size={18} />} label="Eventos" value={data?.summary.trackedEvents ?? 0} />
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Ranking title="Localidades" icon={<MapPin size={18} />} items={data?.locations ?? data?.countries ?? []} />
                <Ranking title="Origem" icon={<ExternalLink size={18} />} items={data?.referrers ?? []} />
              </div>

              {selectedLink ? (
                <div className={card}>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase text-zinc-400">Link selecionado</p>
                      <h2 className="mt-1 truncate text-xl font-black">{selectedLink.shortUrl}</h2>
                      <p className="mt-1 truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {selectedLink.url}
                      </p>
                    </div>
                    <button
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:hover:text-white"
                      onClick={() => setSelectedLinkId(null)}
                      type="button"
                    >
                      Limpar
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Cliques" value={selectedLink.clicks} />
                    <MiniStat label="Eventos" value={selectedLink.trackedEvents} />
                    <MiniStat label="Slug" value={`/${selectedLink.slug}`} />
                  </div>

                  <div className="mt-4 grid gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-950 md:grid-cols-[180px_1fr]">
                    <div>
                      <div className="grid aspect-square w-full place-items-center rounded-lg border border-zinc-200 bg-white p-3 dark:border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="h-full w-full object-contain" src={selectedQrCodeUrl} alt={`QR Code para ${selectedLink.shortUrl}`} />
                      </div>
                      <a
                        className="mt-3 flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 text-xs font-black text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                        href={selectedQrCodeUrl}
                        download={`qrcode-${selectedLink.slug}.png`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download size={15} />
                        Baixar PNG
                      </a>
                    </div>

                    <div className="min-w-0">
                      <div className="mb-4 flex items-center gap-2 text-sm font-black">
                        <Palette size={17} />
                        Personalizar QR Code
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">Cor do QR</span>
                          <span className="flex h-11 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900">
                            <input
                              className="h-11 w-12 cursor-pointer border-0 bg-transparent p-1"
                              type="color"
                              value={toColorInputValue(qrCustomization.foreground, "#18181B")}
                              onChange={(event) => setQrCustomization((current) => ({ ...current, foreground: event.target.value }))}
                            />
                            <input
                              className="min-w-0 flex-1 bg-transparent px-3 text-sm font-bold outline-none dark:text-white"
                              value={qrCustomization.foreground}
                              onChange={(event) => setQrCustomization((current) => ({ ...current, foreground: event.target.value }))}
                            />
                          </span>
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">Fundo</span>
                          <span className="flex h-11 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900">
                            <input
                              className="h-11 w-12 cursor-pointer border-0 bg-transparent p-1"
                              type="color"
                              value={toColorInputValue(qrCustomization.background, "#FFFFFF")}
                              onChange={(event) => setQrCustomization((current) => ({ ...current, background: event.target.value }))}
                            />
                            <input
                              className="min-w-0 flex-1 bg-transparent px-3 text-sm font-bold outline-none dark:text-white"
                              value={qrCustomization.background}
                              onChange={(event) => setQrCustomization((current) => ({ ...current, background: event.target.value }))}
                            />
                          </span>
                        </label>

                        <label className="space-y-2">
                          <span className="flex items-center justify-between gap-3 text-xs font-black text-zinc-500 dark:text-zinc-400">
                            Tamanho
                            <span>{qrCustomization.size}px</span>
                          </span>
                          <input
                            className="w-full accent-zinc-950 dark:accent-white"
                            type="range"
                            min="160"
                            max="520"
                            step="20"
                            value={qrCustomization.size}
                            onChange={(event) => setQrCustomization((current) => ({ ...current, size: Number(event.target.value) }))}
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="flex items-center justify-between gap-3 text-xs font-black text-zinc-500 dark:text-zinc-400">
                            Margem
                            <span>{qrCustomization.margin}px</span>
                          </span>
                          <input
                            className="w-full accent-zinc-950 dark:accent-white"
                            type="range"
                            min="0"
                            max="32"
                            step="2"
                            value={qrCustomization.margin}
                            onChange={(event) => setQrCustomization((current) => ({ ...current, margin: Number(event.target.value) }))}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-black">Ultimos acessos rastreados</p>
                    {selectedLinkEvents.length ? (
                      selectedLinkEvents.slice(0, 5).map((event) => (
                        <div
                          className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                          key={event.id}
                        >
                          <span className="truncate font-bold text-zinc-600 dark:text-zinc-300">{formatLocation(event)}</span>
                          <span className="text-xs font-bold text-zinc-400">
                            {new Date(event.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm font-medium text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
                        Ainda nao ha eventos recentes para este link.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              <div className={card}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black">Seus links</h2>
                  <span className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {filteredLinks.length} de {data?.links.length ?? 0}
                  </span>
                </div>

                <label className="mb-4 flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950">
                  <Search size={17} className="text-zinc-400" />
                  <input
                    className="min-w-0 flex-1 bg-transparent font-medium text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-white"
                    placeholder="Pesquisar por slug, link curto ou URL"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>

                <div className="space-y-3">
                  {filteredLinks.length ? (
                    filteredLinks.map((link) => (
                      <div
                        className={`rounded-xl border bg-white p-4 transition dark:bg-zinc-950 ${
                          selectedLinkId === link.id
                            ? "border-emerald-300 ring-4 ring-emerald-100 dark:border-emerald-400/40 dark:ring-emerald-400/10"
                            : "border-zinc-200 hover:border-zinc-400 dark:border-white/10 dark:hover:border-white/30"
                        }`}
                        key={link.id}
                      >
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black">{link.shortUrl}</p>
                            <p className="mt-1 truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">{link.url}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {link.clicks} cliques
                            </span>
                            <button
                              className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white"
                              onClick={() => setSelectedLinkId(link.id)}
                              title="Gerar QR Code"
                              aria-label="Gerar QR Code"
                              type="button"
                            >
                              <QrCode size={17} />
                            </button>
                            <button
                              className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-950 text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                              onClick={() => copy(link.shortUrl)}
                              title="Copiar"
                              aria-label="Copiar"
                            >
                              {copied === link.shortUrl ? <Check size={17} /> : <Copy size={17} />}
                            </button>
                            <button
                              className="h-10 rounded-lg border border-zinc-200 px-3 text-xs font-black text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white"
                              onClick={() => setSelectedLinkId(link.id)}
                              type="button"
                            >
                              Ver
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-white/10 dark:bg-zinc-950">
                      <Wand2 className="mx-auto mb-3 text-zinc-500 dark:text-zinc-400" />
                      <p className="text-sm font-black">
                        {search ? "Nenhum link encontrado para essa busca." : "Crie seu primeiro link para ver metricas aqui."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </section>
    </main>
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
