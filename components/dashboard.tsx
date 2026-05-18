"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  Copy,
  ExternalLink,
  LinkIcon,
  Loader2,
  LogOut,
  MapPin,
  MousePointerClick,
  Plus,
  Wand2
} from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

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

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [custom, setCustom] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState("");

  const canSubmit = useMemo(() => url.trim().length > 3 && (!custom || slug.trim().length >= 3), [custom, slug, url]);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getAccessToken() {
    const supabase = getSupabaseBrowser();
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.access_token ?? null;
  }

  async function loadDashboard() {
    setIsLoading(true);
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
      setIsLoading(false);
      return;
    }

    setData(payload);
    setIsLoading(false);
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
    await loadDashboard();
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
    <main className="relative min-h-screen overflow-hidden bg-[#f7f4ec] text-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(52,211,153,0.32),transparent_28rem),radial-gradient(circle_at_92%_8%,rgba(56,189,248,0.18),transparent_25rem),linear-gradient(135deg,rgba(255,255,255,0.72),rgba(236,253,245,0.44)_48%,rgba(250,245,235,0.86))]" />
      <section className="relative mx-auto w-full max-w-7xl px-5 py-6 md:px-8 lg:px-10">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-zinc-950 text-emerald-300 shadow-[0_18px_55px_rgba(16,185,129,0.22)]">
              <LinkIcon size={24} strokeWidth={2.4} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">dashboard</p>
              <p className="text-2xl font-black">Link</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="max-w-[220px] truncate rounded-lg border border-zinc-200 bg-white/70 px-3 py-2 text-sm font-bold text-zinc-700">
              {data?.user.email ?? "Carregando..."}
            </span>
            <button
              className="grid h-11 w-11 place-items-center rounded-lg border border-zinc-200 bg-white/75 text-zinc-800 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
              onClick={signOut}
              title="Sair"
              aria-label="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="grid min-h-[60vh] place-items-center">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="space-y-5">
              <div className="rounded-[1.25rem] border border-white/80 bg-white/82 p-3 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl">
                <div className="rounded-2xl border border-zinc-100 bg-white p-5">
                  <h1 className="text-3xl font-black tracking-normal">Novo link</h1>
                  <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">
                    Links criados aqui aparecem no painel e recebem metricas de acesso.
                  </p>

                  <form className="mt-5 space-y-4" onSubmit={createLink}>
                    <label className="block space-y-2">
                      <span className="text-sm font-bold">URL original</span>
                      <input
                        className="h-12 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-4 text-zinc-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder="https://guidev.site"
                        inputMode="url"
                      />
                    </label>

                    <label className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold">
                      Slug customizado
                      <input
                        className="h-5 w-5 accent-emerald-600"
                        type="checkbox"
                        checked={custom}
                        onChange={(event) => setCustom(event.target.checked)}
                      />
                    </label>

                    {custom ? (
                      <label className="block space-y-2">
                        <span className="text-sm font-bold">Slug</span>
                        <input
                          className="h-12 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-4 text-zinc-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                          value={slug}
                          onChange={(event) => setSlug(event.target.value)}
                          placeholder="portfolio"
                        />
                      </label>
                    ) : null}

                    {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

                    <button
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-black text-white shadow-lg shadow-zinc-950/10 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none disabled:hover:translate-y-0"
                      disabled={!canSubmit || isCreating}
                    >
                      {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                      Criar e copiar
                    </button>
                  </form>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <Metric icon={<LinkIcon size={18} />} label="Links" value={data?.summary.links ?? 0} />
                <Metric icon={<MousePointerClick size={18} />} label="Cliques" value={data?.summary.clicks ?? 0} />
                <Metric icon={<BarChart3 size={18} />} label="Eventos rastreados" value={data?.summary.trackedEvents ?? 0} />
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Ranking title="Paises" icon={<MapPin size={18} />} items={data?.countries ?? []} />
                <Ranking title="Origem" icon={<ExternalLink size={18} />} items={data?.referrers ?? []} />
              </div>

              <div className="rounded-[1.25rem] border border-white/80 bg-white/82 p-3 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl">
                <div className="rounded-2xl border border-zinc-100 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-black">Seus links</h2>
                    <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                      {data?.links.length ?? 0} total
                    </span>
                  </div>

                  <div className="space-y-3">
                    {data?.links.length ? (
                      data.links.map((link) => (
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4" key={link.id}>
                          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-zinc-950">{link.shortUrl}</p>
                              <p className="mt-1 truncate text-xs font-semibold text-zinc-500">{link.url}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-lg bg-white px-3 py-2 text-xs font-black text-zinc-700">
                                {link.clicks} cliques
                              </span>
                              <button
                                className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-950 text-white transition hover:bg-emerald-700"
                                onClick={() => copy(link.shortUrl)}
                                title="Copiar"
                                aria-label="Copiar"
                              >
                                {copied === link.shortUrl ? <Check size={17} /> : <Copy size={17} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
                        <Wand2 className="mx-auto mb-3 text-emerald-600" />
                        <p className="text-sm font-black">Crie seu primeiro link para ver metricas aqui.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/82 p-5 shadow-sm backdrop-blur-xl">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">{icon}</div>
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-bold text-zinc-500">{label}</p>
    </div>
  );
}

function Ranking({ title, icon, items }: { title: string; icon: ReactNode; items: Array<{ label: string; value: number }> }) {
  return (
    <div className="rounded-[1.25rem] border border-white/80 bg-white/82 p-3 shadow-[0_28px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl">
      <div className="rounded-2xl border border-zinc-100 bg-white p-5">
        <div className="mb-4 flex items-center gap-2 text-lg font-black">
          {icon}
          {title}
        </div>
        <div className="space-y-3">
          {items.length ? (
            items.map((item) => (
              <div className="flex items-center justify-between gap-3" key={item.label}>
                <span className="truncate text-sm font-bold text-zinc-600">{item.label}</span>
                <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-black">{item.value}</span>
              </div>
            ))
          ) : (
            <p className="text-sm font-semibold text-zinc-500">Sem dados ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
