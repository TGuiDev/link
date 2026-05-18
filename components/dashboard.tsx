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

const card = "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm";
const input =
  "h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-4 focus:ring-zinc-100";

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
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="mx-auto w-full max-w-7xl px-5 py-6 md:px-8">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-950 text-white">
              <LinkIcon size={21} />
            </span>
            <div>
              <p className="text-xl font-black">Link</p>
              <p className="text-xs font-bold text-zinc-500">Dashboard</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="max-w-[220px] truncate rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-500">
              {data?.user.email ?? "Carregando..."}
            </span>
            <button
              className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950"
              onClick={signOut}
              title="Sair"
              aria-label="Sair"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="grid min-h-[60vh] place-items-center">
            <Loader2 className="animate-spin text-zinc-500" size={30} />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
            <div className="space-y-5">
              <div className={card}>
                <h1 className="text-2xl font-black tracking-normal">Novo link</h1>
                <p className="mt-2 text-sm font-medium leading-6 text-zinc-500">
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

                  <label className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold">
                    Slug customizado
                    <input
                      className="h-5 w-5 accent-zinc-950"
                      type="checkbox"
                      checked={custom}
                      onChange={(event) => setCustom(event.target.checked)}
                    />
                  </label>

                  {custom ? (
                    <label className="block space-y-2">
                      <span className="text-sm font-bold">Slug</span>
                      <input
                        className={input}
                        value={slug}
                        onChange={(event) => setSlug(event.target.value)}
                        placeholder="portfolio"
                      />
                    </label>
                  ) : null}

                  {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

                  <button
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-black text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
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
                <Ranking title="Paises" icon={<MapPin size={18} />} items={data?.countries ?? []} />
                <Ranking title="Origem" icon={<ExternalLink size={18} />} items={data?.referrers ?? []} />
              </div>

              <div className={card}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black">Seus links</h2>
                  <span className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600">
                    {data?.links.length ?? 0} total
                  </span>
                </div>

                <div className="space-y-3">
                  {data?.links.length ? (
                    data.links.map((link) => (
                      <div className="rounded-xl border border-zinc-200 bg-white p-4" key={link.id}>
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black">{link.shortUrl}</p>
                            <p className="mt-1 truncate text-xs font-medium text-zinc-500">{link.url}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-black text-zinc-600">
                              {link.clicks} cliques
                            </span>
                            <button
                              className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-950 text-white transition hover:bg-zinc-700"
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
                    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
                      <Wand2 className="mx-auto mb-3 text-zinc-500" />
                      <p className="text-sm font-black">Crie seu primeiro link para ver metricas aqui.</p>
                    </div>
                  )}
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
    <div className={card}>
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-zinc-100 text-zinc-600">{icon}</div>
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-bold text-zinc-500">{label}</p>
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
              <span className="truncate text-sm font-bold text-zinc-600">{item.label}</span>
              <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-black text-zinc-600">{item.value}</span>
            </div>
          ))
        ) : (
          <p className="text-sm font-medium text-zinc-500">Sem dados ainda.</p>
        )}
      </div>
    </div>
  );
}
