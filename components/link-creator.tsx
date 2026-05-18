"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FormEvent, useMemo, useState } from "react";
import { Check, Copy, LinkIcon, Loader2, LockKeyhole, Moon, Sun, UserRound, Wand2 } from "lucide-react";

type ShortenedLink = {
  slug: string;
  url: string;
  shortUrl: string;
  clicks?: number;
};

type Mode = "random" | "custom";
type Theme = "light" | "dark";

const surface =
  "border border-zinc-200 bg-white shadow-sm transition-colors duration-500 dark:border-white/10 dark:bg-zinc-950";
const input =
  "h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-4 focus:ring-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-emerald-300 dark:focus:ring-emerald-300/10";

export function LinkCreator() {
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [mode, setMode] = useState<Mode>("random");
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";

    const savedTheme = window.localStorage.getItem("link-theme");
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [createdLink, setCreatedLink] = useState<ShortenedLink | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const canSubmit = useMemo(() => {
    return url.trim().length > 3 && (mode === "random" || slug.trim().length >= 3);
  }, [mode, slug, url]);

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
      const response = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
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

  return (
    <main className={theme === "dark" ? "dark" : ""}>
      <section className="min-h-screen bg-zinc-50 text-zinc-950 transition-colors duration-500 dark:bg-zinc-950 dark:text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 md:px-8">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                <LinkIcon size={21} />
              </span>
              <div>
                <p className="text-xl font-black">Link</p>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">link.guidev.site</p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                className="hidden h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-700 transition hover:border-zinc-400 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/30 sm:inline-flex"
                href="/dashboard"
              >
                <UserRound size={16} />
                Painel
              </Link>
              <Link
                className="hidden h-10 items-center rounded-lg bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 sm:inline-flex"
                href="/login"
              >
                Entrar
              </Link>
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
              <div className="mb-5 inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
                Encurtador com API e painel
              </div>
              <h1 className="text-5xl font-black leading-[0.96] tracking-normal sm:text-7xl">
                Links curtos. Sem barulho.
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

                {mode === "custom" ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-bold">Slug</span>
                    <div className="flex overflow-hidden rounded-lg border border-zinc-200 bg-white focus-within:border-zinc-950 focus-within:ring-4 focus-within:ring-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:focus-within:border-emerald-300 dark:focus-within:ring-emerald-300/10">
                      <span className="hidden h-12 items-center border-r border-zinc-200 px-3 text-sm font-bold text-zinc-400 dark:border-white/10 sm:flex">
                        link.guidev.site/
                      </span>
                      <input
                        className="h-12 min-w-0 flex-1 bg-transparent px-4 text-zinc-950 outline-none dark:text-white"
                        placeholder="meu-link"
                        value={slug}
                        onChange={(event) => setSlug(event.target.value)}
                      />
                    </div>
                  </label>
                ) : null}

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
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-200">/{createdLink.slug}</span>
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
