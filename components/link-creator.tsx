"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, ChevronDown, Copy, Download, LayoutDashboard, LinkIcon, Loader2, LockKeyhole, LogOut, Moon, QrCode, Sun, Wand2 } from "lucide-react";
import { clearCachedNavbarUser, getCachedNavbarUser, loadNavbarUser, type NavbarUser } from "@/lib/navbar-user";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { createQrCodeUrl } from "@/lib/qrcode";

type ShortenedLink = {
  slug: string;
  url: string;
  shortUrl: string;
  clicks?: number;
};

type Mode = "random" | "custom";
type Theme = "light" | "dark";
type PublicStats = {
  links: number;
};

const surface =
  "border border-zinc-200 bg-white shadow-sm transition-colors duration-200 ease-out dark:border-white/10 dark:bg-zinc-950";
const input =
  "h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 text-zinc-950 outline-none transition-colors duration-200 ease-out focus:border-zinc-950 focus:ring-4 focus:ring-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-emerald-300 dark:focus:ring-emerald-300/10";

export function LinkCreator() {
  const cachedNavbarUser = getCachedNavbarUser();
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [mode, setMode] = useState<Mode>("random");
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";

    const savedTheme = window.localStorage.getItem("link-theme");
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;

    return "dark";
  });
  const [createdLink, setCreatedLink] = useState<ShortenedLink | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [navbarUser, setNavbarUser] = useState<NavbarUser | null>(cachedNavbarUser ?? null);
  const [isCheckingUser, setIsCheckingUser] = useState(cachedNavbarUser === undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [targetLinksCount, setTargetLinksCount] = useState<number | null>(null);
  const [displayedLinksCount, setDisplayedLinksCount] = useState(0);
  const displayedLinksCountRef = useRef(0);

  const canSubmit = useMemo(() => {
    return url.trim().length > 3 && (mode === "random" || slug.trim().length >= 3);
  }, [mode, slug, url]);
  const createdQrCodeUrl = useMemo(() => {
    if (!createdLink) return "";

    return createQrCodeUrl(createdLink.shortUrl, {
      size: 220,
      foreground: theme === "dark" ? "FFFFFF" : "18181B",
      background: theme === "dark" ? "18181B" : "FFFFFF",
      margin: 12
    });
  }, [createdLink, theme]);

  useEffect(() => {
    if (cachedNavbarUser !== undefined) {
      setIsCheckingUser(false);
    } else {
      loadNavbarUser()
        .then((user) => {
          setNavbarUser(user);
        })
        .finally(() => {
          setIsCheckingUser(false);
        });
    }

    fetchPublicStats().then((nextStats) => {
      if (nextStats) {
        setTargetLinksCount(nextStats.links);
      }
    });
  }, [cachedNavbarUser]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const channel = supabase
      .channel("public-link-stats")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "app_stats",
          filter: "id=eq.global"
        },
        (payload) => {
          const nextTotal = Number((payload.new as { total_links?: number }).total_links ?? 0);
          setTargetLinksCount(nextTotal);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (targetLinksCount === null) return;

    const startValue = displayedLinksCountRef.current;
    const change = targetLinksCount - startValue;

    if (change === 0) return;

    let animationFrame = 0;
    const startedAt = window.performance.now();
    const duration = 700;

    function animate(now: number) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(startValue + change * easedProgress);

      displayedLinksCountRef.current = nextValue;
      setDisplayedLinksCount(nextValue);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    }

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [targetLinksCount]);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    window.localStorage.setItem("link-theme", nextTheme);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setCopied(false);

    try {
      const supabase = getSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        "Content-Type": "application/json"
      };

      if (sessionData.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }

      const response = await fetch("/api/links", {
        method: "POST",
        headers,
        body: JSON.stringify({
          url,
          slug: mode === "custom" ? slug : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Nao foi possivel encurtar o link.");
      }

      setCreatedLink(data);
      setTargetLinksCount((currentCount) => (currentCount === null ? currentCount : currentCount + 1));
      await navigator.clipboard.writeText(data.shortUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro inesperado.");
      setCreatedLink(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function copyLink() {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink.shortUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function signOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    clearCachedNavbarUser();
    setNavbarUser(null);
    setIsMenuOpen(false);
  }

  return (
    <main className={theme === "dark" ? "dark" : ""}>
      <section className="min-h-screen bg-zinc-50 text-zinc-950 transition-colors duration-200 ease-out dark:bg-zinc-950 dark:text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 md:px-8">
          <header className="flex items-center justify-between gap-4">
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
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">link.guidev.site</p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                className="hidden h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-700 transition hover:border-zinc-400 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/30 md:inline-flex"
                href="/documentacao"
              >
                <BookOpen size={15} />
                Documenta&ccedil;&atilde;o
              </Link>
              {isCheckingUser ? (
                <div className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 pr-3 dark:border-white/10 dark:bg-zinc-900">
                  <span className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                  <span className="hidden h-3 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800 sm:block" />
                </div>
              ) : navbarUser ? (
                <div className="relative">
                  <button
                    className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 pr-3 text-sm font-bold text-zinc-700 transition hover:border-zinc-400 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/30"
                    onClick={() => setIsMenuOpen((current) => !current)}
                    type="button"
                  >
                    {navbarUser.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="h-7 w-7 rounded-full object-cover" src={navbarUser.avatarUrl} alt="" />
                    ) : (
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-100 text-xs font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                        {navbarUser.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="hidden max-w-[140px] truncate sm:block">{navbarUser.name}</span>
                    <ChevronDown size={15} />
                  </button>

                  {isMenuOpen ? (
                    <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-zinc-900">
                      <Link
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        href="/dashboard"
                      >
                        <LayoutDashboard size={15} />
                        Dashboard
                      </Link>
                      <Link
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        href="/documentacao"
                      >
                        <BookOpen size={15} />
                        Documenta&ccedil;&atilde;o
                      </Link>
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
              ) : (
                <Link
                  className="hidden h-10 items-center rounded-lg bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 sm:inline-flex"
                  href="/login"
                >
                  Entrar
                </Link>
              )}
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:border-zinc-400 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/30"
                onClick={toggleTheme}
                aria-label="Alternar tema"
                title="Alternar tema"
              >
                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>
          </header>

          <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1fr_440px]">
            <div className="max-w-2xl">
              <HeroStat value={targetLinksCount === null ? "--" : formatCompact(displayedLinksCount)} />
              <h1 className="text-5xl font-black leading-[0.96] tracking-normal sm:text-7xl">
                Links curtos. Controle total.
              </h1>
              <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-zinc-600 dark:text-zinc-300">
                Crie links aleatorios ou personalizados, acompanhe acessos no painel e use a mesma estrutura via API.
              </p>

              <div className="mt-8 grid gap-3 text-sm font-bold text-zinc-600 sm:grid-cols-3 dark:text-zinc-300">
                {["Sem login", "Slug custom", "Metricas"].map((item) => (
                  <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-900" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-2xl p-5 ${surface}`}>
              <form className="space-y-4" onSubmit={onSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-bold">URL original</span>
                  <input
                    className={input}
                    placeholder="https://guidev.site"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    inputMode="url"
                  />
                </label>

                <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
                  <ModeButton active={mode === "random"} onClick={() => setMode("random")} icon={<Wand2 size={16} />}>
                    Random
                  </ModeButton>
                  <ModeButton active={mode === "custom"} onClick={() => setMode("custom")} icon={<LockKeyhole size={16} />}>
                    Custom
                  </ModeButton>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-bold">Slug</span>
                  <div className="flex overflow-hidden rounded-lg border border-zinc-200 bg-white focus-within:border-zinc-950 focus-within:ring-4 focus-within:ring-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:focus-within:border-emerald-300 dark:focus-within:ring-emerald-300/10">
                    <span className="hidden h-12 items-center border-r border-zinc-200 px-3 text-sm font-bold text-zinc-400 dark:border-white/10 sm:flex">
                      link.guidev.site/
                    </span>
                    <input
                      className="h-12 min-w-0 flex-1 bg-transparent px-4 text-zinc-950 outline-none disabled:text-zinc-400 dark:text-white dark:disabled:text-zinc-500"
                      disabled={mode === "random"}
                      placeholder={mode === "random" ? "random" : "batata"}
                      value={mode === "random" ? "" : slug}
                      onChange={(event) => setSlug(event.target.value)}
                    />
                  </div>
                </label>

                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-200">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canSubmit || isLoading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-black text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <LinkIcon size={18} />}
                  Encurtar
                </button>
              </form>

              {createdLink ? (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-950/20">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-emerald-900 dark:text-emerald-100">Link criado</span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-200">
                      {copied ? "Copiado" : `/${createdLink.slug}`}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      className="h-11 min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-bold text-zinc-950 outline-none dark:border-emerald-400/20 dark:bg-zinc-950 dark:text-white"
                      value={createdLink.shortUrl}
                    />
                    <button
                      type="button"
                      className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-zinc-950 text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950"
                      onClick={copyLink}
                      aria-label="Copiar link"
                      title="Copiar link"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  <div className="mt-4 flex flex-col gap-4 rounded-lg border border-emerald-200 bg-white p-3 dark:border-emerald-400/20 dark:bg-zinc-950 sm:flex-row sm:items-center">
                    <div className="grid h-36 w-36 flex-none place-items-center rounded-lg border border-zinc-200 bg-white p-2 dark:border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="h-full w-full object-contain" src={createdQrCodeUrl} alt={`QR Code para ${createdLink.shortUrl}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-black text-zinc-950 dark:text-white">
                        <QrCode size={17} />
                        QR Code
                      </div>
                      <p className="mt-2 text-sm font-medium leading-6 text-zinc-600 dark:text-zinc-300">
                        Compartilhe o link tambem como imagem escaneavel.
                      </p>
                      <a
                        className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-950 px-3 text-xs font-black text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                        href={createdQrCodeUrl}
                        download={`qrcode-${createdLink.slug}.png`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download size={15} />
                        Baixar PNG
                      </a>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ModeButton({
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
      type="button"
      className={`flex h-10 items-center justify-center gap-2 rounded-md text-sm font-bold transition ${
        active
          ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white"
          : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
      }`}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

function HeroStat({ value }: { value: string }) {
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-bold text-zinc-500 transition-colors duration-200 ease-out dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
      <span className="text-base font-black text-zinc-950 dark:text-white">{value}</span>
      links criados
    </div>
  );
}

function formatCompact(value: number) {
  return Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

async function fetchPublicStats(): Promise<PublicStats | null> {
  try {
    const response = await fetch("/api/stats");
    const payload = await response.json();

    if (!response.ok) return null;

    return {
      links: payload.links ?? 0
    };
  } catch {
    return null;
  }
}
