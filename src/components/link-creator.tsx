"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Copy,
  Download,
  ExternalLink,
  Github,
  Link2,
  Loader2,
  LockKeyhole,
  QrCode,
  RotateCcw,
  Sparkles,
  Zap
} from "lucide-react";
import { ChainBackdrop3D } from "@/components/chain-backdrop-3d";
import { Navbar } from "@/components/navbar";
import { getCachedNavbarUser, loadNavbarUser, type NavbarUser } from "@/lib/navbar-user";
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

const contributeUrl = "https://github.com/TGuiDev/link";
const portfolioUrl = "https://guidev.site";

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
  const [targetLinksCount, setTargetLinksCount] = useState<number | null>(null);
  const [displayedLinksCount, setDisplayedLinksCount] = useState(0);
  const displayedLinksCountRef = useRef(0);

  const canSubmit = useMemo(() => {
    return url.trim().length > 3 && (mode === "random" || slug.trim().length >= 3);
  }, [mode, slug, url]);

  const createdQrCodeUrl = useMemo(() => {
    if (!createdLink) return "";

    return createQrCodeUrl(`${createdLink.shortUrl}?src=qr`, {
      size: 280,
      foreground: theme === "dark" ? "FFFFFF" : "18181B",
      background: theme === "dark" ? "18181B" : "FFFFFF",
      margin: 10
    });
  }, [createdLink, theme]);

  useEffect(() => {
    if (cachedNavbarUser === undefined) {
      loadNavbarUser().then((user) => {
        setNavbarUser(user);
      });
    }

    fetchPublicStats().then((nextStats) => {
      if (nextStats) {
        setTargetLinksCount(nextStats.links);
      }
    });
  }, [cachedNavbarUser]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchPublicStats().then((nextStats) => {
          if (nextStats) {
            setTargetLinksCount(nextStats.links);
          }
        });
      }
    }, 8000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (targetLinksCount === null) return;

    const startValue = displayedLinksCountRef.current;
    const change = targetLinksCount - startValue;

    if (change === 0) return;

    let animationFrame = 0;
    const startedAt = window.performance.now();
    const duration = 800;

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
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || isLoading) return;

    setIsLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: url.trim(),
          slug: mode === "custom" && slug.trim() ? slug.trim() : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível encurtar o link.");
      }

      setCreatedLink(data);
      setTargetLinksCount((currentCount) => (currentCount === null ? currentCount : currentCount + 1));
      await navigator.clipboard.writeText(data.shortUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
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
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function downloadQrCode(qrDataUrl: string, linkSlug: string) {
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `qrcode-${linkSlug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(qrDataUrl, "_blank");
    }
  }

  function resetForm() {
    setCreatedLink(null);
    setUrl("");
    setSlug("");
    setError("");
  }

  return (
    <main className={theme === "dark" ? "dark" : ""} suppressHydrationWarning>
      <section className="relative min-h-screen overflow-hidden bg-zinc-50/70 text-zinc-950 transition-colors duration-200 ease-out dark:bg-zinc-950 dark:text-white">
        <ChainBackdrop3D theme={theme} />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 md:px-8">
          <Navbar theme={theme} onToggleTheme={toggleTheme} user={navbarUser} />

          <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.1fr_450px] lg:py-16">
            {/* Lado Esquerdo: Hero Elegante e Charmoso */}
            <div className="max-w-2xl space-y-6">
              {/* Badge com Brilho Suave e Contador Animado */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-zinc-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span>
                  <strong className="font-extrabold text-zinc-950 dark:text-white">
                    {targetLinksCount === null ? "..." : formatCompact(displayedLinksCount)}
                  </strong>{" "}
                  links criados em tempo real
                </span>
              </div>

              {/* Título com Tipografia Imponente e Toque Charmoso */}
              <h1 className="text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Links curtos.{" "}
                <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                  Controle total.
                </span>
              </h1>

              {/* Descrição Suave */}
              <p className="max-w-xl text-base sm:text-lg font-medium leading-relaxed text-zinc-600 dark:text-zinc-300">
                Encurte links em segundos, personalize seus slugs, acompanhe métricas geolocalizadas em tempo real e integre diretamente com a sua aplicação via API REST.
              </p>

              {/* 3 Cards de Vantagens com Visual Premium */}
              <div className="grid gap-3 pt-2 sm:grid-cols-3">
                <FeatureCard
                  icon={<Zap size={15} className="text-emerald-500" />}
                  title="Sem login"
                  description="Encurte instantâneo em 1 clique"
                />
                <FeatureCard
                  icon={<LockKeyhole size={15} className="text-emerald-500" />}
                  title="Slugs custom"
                  description="Crie links com a sua marca"
                />
                <FeatureCard
                  icon={<BarChart3 size={15} className="text-emerald-500" />}
                  title="Analytics & QR"
                  description="Métricas e QR Code em PNG"
                />
              </div>
            </div>

            {/* Lado Direito: Card do Encurtador Elegante com Vidro e Sombras */}
            <div className="relative group">
              <div className="rounded-2xl border border-zinc-200/90 bg-white/90 p-6 shadow-xl backdrop-blur-xl transition duration-300 hover:shadow-2xl dark:border-white/10 dark:bg-zinc-900/90 sm:p-7">
                {!createdLink ? (
                  <form className="space-y-4" onSubmit={onSubmit}>
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <Link2 size={16} className="text-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                          Encurtador de Link
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-zinc-400">Rápido & Seguro</span>
                    </div>

                    {/* Input de URL Original */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        URL de Destino
                      </label>
                      <input
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3.5 text-xs font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10"
                        placeholder="https://meusite.com/sua-pagina"
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        inputMode="url"
                        required
                      />
                    </div>

                    {/* Alternador de Modo: Aleatório vs Personalizado */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        Formato do Link
                      </label>
                      <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-950">
                        <ModeButton
                          active={mode === "random"}
                          onClick={() => setMode("random")}
                          icon={<Sparkles size={14} />}
                        >
                          Aleatório
                        </ModeButton>
                        <ModeButton
                          active={mode === "custom"}
                          onClick={() => setMode("custom")}
                          icon={<LockKeyhole size={14} />}
                        >
                          Personalizado
                        </ModeButton>
                      </div>
                    </div>

                    {/* Slug Personalizado */}
                    {mode === "custom" && (
                      <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          Slug Personalizado
                        </label>
                        <div className="flex h-11 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/70 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950/70 dark:focus-within:border-emerald-400 dark:focus-within:ring-emerald-400/10">
                          <span className="flex h-full items-center border-r border-zinc-200 px-3 text-xs font-semibold text-zinc-400 dark:border-zinc-800">
                            link.guidev.site/
                          </span>
                          <input
                            className="h-full min-w-0 flex-1 bg-transparent px-3 text-xs font-semibold text-zinc-950 outline-none dark:text-white"
                            placeholder="meu-slug"
                            value={slug}
                            onChange={(event) => setSlug(event.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-950/30 dark:text-red-300 animate-in fade-in duration-150">
                        {error}
                      </div>
                    )}

                    {/* Botão Encurtar */}
                    <button
                      type="submit"
                      disabled={!canSubmit || isLoading}
                      className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-xs font-bold text-white shadow-md transition hover:bg-zinc-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                      )}
                      <span>Encurtar Link Agora</span>
                    </button>
                  </form>
                ) : (
                  /* Card de Resultado Sucesso Bonito e Limpo */
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                          <Check size={12} />
                        </span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                          Link criado com sucesso!
                        </span>
                      </div>
                      <button
                        onClick={resetForm}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        type="button"
                      >
                        <RotateCcw size={11} />
                        <span>Novo</span>
                      </button>
                    </div>

                    {/* Campo de URL Curta */}
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1.5 dark:border-zinc-800 dark:bg-zinc-950">
                      <input
                        readOnly
                        className="h-9 min-w-0 flex-1 bg-transparent px-3 font-mono text-xs font-bold text-zinc-900 outline-none dark:text-white select-all"
                        value={createdLink.shortUrl}
                      />
                      <button
                        type="button"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-xs font-bold text-white transition hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                        onClick={copyLink}
                      >
                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copied ? "Copiado" : "Copiar"}</span>
                      </button>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col sm:flex-row items-center gap-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                      <div className="grid h-28 w-28 flex-none place-items-center rounded-lg border border-zinc-200 bg-white p-1.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className="h-full w-full object-contain"
                          src={createdQrCodeUrl}
                          alt={`QR Code para ${createdLink.shortUrl}`}
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
                        <div>
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                            <QrCode size={14} className="text-emerald-500" />
                            <span>QR Code Rastreável</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Pronto para download ou compartilhamento em artes.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                          <button
                            onClick={() => downloadQrCode(createdQrCodeUrl, createdLink.slug)}
                            className="inline-flex h-7 items-center gap-1 rounded-md bg-zinc-900 px-2.5 text-[11px] font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                            type="button"
                          >
                            <Download size={11} />
                            <span>Baixar PNG</span>
                          </button>
                          <a
                            href={createdLink.shortUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            <span>Testar Link</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rodapé Elegante */}
          <footer className="flex flex-col gap-4 border-t border-zinc-200/80 py-6 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold text-zinc-900 dark:text-white">Link</span>
              <span>•</span>
              <span>
                Feito com carinho por{" "}
                <a
                  className="font-bold text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:text-emerald-600 dark:text-white dark:decoration-white/20 dark:hover:text-emerald-300"
                  href={portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  GUI.DEV
                </a>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-semibold">
              <Link
                className="inline-flex items-center gap-1.5 transition hover:text-zinc-950 dark:hover:text-white"
                href="/documentacao"
              >
                <BookOpen size={13} />
                <span>Documentação</span>
              </Link>
              <a
                className="inline-flex items-center gap-1.5 transition hover:text-zinc-950 dark:hover:text-white"
                href={contributeUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Github size={13} />
                <span>Código Aberto</span>
              </a>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-3.5 shadow-2xs backdrop-blur-xs transition hover:border-zinc-300 hover:bg-white dark:border-white/10 dark:bg-zinc-900/60 dark:hover:border-white/20 dark:hover:bg-zinc-900">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
      </div>
      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
        {description}
      </p>
    </div>
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
      className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition ${
        active
          ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-white font-semibold"
          : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
      }`}
      onClick={onClick}
    >
      {icon}
      <span>{children}</span>
    </button>
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
