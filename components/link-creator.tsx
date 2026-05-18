"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, Code2, Copy, LinkIcon, Loader2, LockKeyhole, Moon, Sparkles, Sun, Wand2 } from "lucide-react";

type ShortenedLink = {
  slug: string;
  url: string;
  shortUrl: string;
  clicks?: number;
};

type Mode = "random" | "custom";
type Theme = "light" | "dark";

const themeTransition = "transition-[background,color,border-color,box-shadow,transform] duration-500 ease-out";

export function LinkCreator() {
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [mode, setMode] = useState<Mode>("random");
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const savedTheme = window.localStorage.getItem("link-theme");

    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }

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
      <section
        className={`relative min-h-screen overflow-hidden bg-[#f7f4ec] text-zinc-950 dark:bg-[#080b0d] dark:text-zinc-50 ${themeTransition}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(52,211,153,0.32),transparent_28rem),radial-gradient(circle_at_92%_8%,rgba(56,189,248,0.18),transparent_25rem),linear-gradient(135deg,rgba(255,255,255,0.72),rgba(236,253,245,0.44)_48%,rgba(250,245,235,0.86))] opacity-100 transition-opacity duration-700 dark:opacity-0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_14%,rgba(16,185,129,0.24),transparent_30rem),radial-gradient(circle_at_88%_0%,rgba(59,130,246,0.16),transparent_24rem),linear-gradient(135deg,#080b0d_0%,#111827_52%,#17130f_100%)] opacity-0 transition-opacity duration-700 dark:opacity-100" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-6 md:px-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`grid h-11 w-11 place-items-center rounded-lg bg-zinc-950 text-emerald-300 shadow-[0_18px_55px_rgba(16,185,129,0.22)] dark:bg-emerald-400 dark:text-zinc-950 ${themeTransition}`}
              >
                <LinkIcon size={24} strokeWidth={2.4} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 transition-colors duration-500 dark:text-emerald-300">
                  link.guidev.site
                </p>
                <p className="text-2xl font-black">Link</p>
              </div>
            </div>

            <button
              type="button"
              className={`relative h-11 w-[5.25rem] rounded-full border border-zinc-200 bg-white/75 p-1 shadow-sm backdrop-blur hover:border-emerald-300 dark:border-white/10 dark:bg-white/10 dark:hover:border-emerald-400 ${themeTransition}`}
              onClick={toggleTheme}
              aria-label="Alternar tema"
              title="Alternar tema"
            >
              <span className="absolute inset-y-0 left-3 flex items-center text-amber-500">
                <Sun size={16} />
              </span>
              <span className="absolute inset-y-0 right-3 flex items-center text-sky-300">
                <Moon size={16} />
              </span>
              <span
                className={`relative z-10 grid h-9 w-9 place-items-center rounded-full bg-zinc-950 text-white shadow-md transition-transform duration-500 ease-out dark:translate-x-9 dark:bg-emerald-300 dark:text-zinc-950`}
              >
                {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
              </span>
            </button>
          </header>

          <div className="grid flex-1 items-center gap-8 pb-8 md:grid-cols-[1fr_0.92fr] md:pb-10">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1.5 text-sm font-bold text-emerald-800 shadow-sm backdrop-blur transition-colors duration-500 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                <Sparkles size={15} />
                Encurtador simples para web e API
              </div>

              <div className="max-w-2xl space-y-5">
                <h1 className="text-5xl font-black leading-[0.96] tracking-normal sm:text-7xl">
                  Links curtos, bonitos e direto ao ponto.
                </h1>
                <p className="max-w-xl text-lg font-medium leading-8 text-zinc-700 transition-colors duration-500 sm:text-xl dark:text-zinc-300">
                  Crie URLs curtas com slugs aleatorios ou personalizados. Sem conta, sem painel confuso, pronto para
                  usar no navegador ou integrar em qualquer projeto.
                </p>
              </div>

              <div className="grid gap-3 text-sm font-bold text-zinc-700 sm:grid-cols-3 dark:text-zinc-200">
                {["Sem login", "Random ou custom", "API pronta"].map((item) => (
                  <div
                    className={`rounded-lg border border-zinc-200 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.07] ${themeTransition}`}
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div
                className={`rounded-lg border border-zinc-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.07] ${themeTransition}`}
              >
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-zinc-900 dark:text-white">
                  <Code2 size={17} />
                  API em uma chamada
                </div>
                <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs font-semibold leading-6 text-emerald-100 shadow-inner">
                  <code>{`POST /api/links
{
  "url": "https://guidev.site",
  "slug": "portfolio"
}`}</code>
                </pre>
              </div>
            </div>

            <div
              className={`rounded-[1.25rem] border border-white/80 bg-white/82 p-3 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/72 dark:shadow-black/40 ${themeTransition}`}
            >
              <div className="rounded-2xl border border-zinc-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04] sm:p-5">
                <form className="space-y-4" onSubmit={onSubmit}>
                  <label className="block space-y-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">URL original</span>
                    <input
                      className={`h-12 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-4 text-zinc-950 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-emerald-400 dark:focus:bg-white/15 dark:focus:ring-emerald-400/20 ${themeTransition}`}
                      placeholder="https://guidev.site"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      inputMode="url"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-100 p-1 transition-colors duration-500 dark:bg-white/10">
                    <button
                      type="button"
                      className={`flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold transition duration-300 ${
                        mode === "random"
                          ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-900 dark:text-white"
                          : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                      }`}
                      onClick={() => setMode("random")}
                    >
                      <Wand2 size={17} />
                      Random
                    </button>
                    <button
                      type="button"
                      className={`flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold transition duration-300 ${
                        mode === "custom"
                          ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-900 dark:text-white"
                          : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                      }`}
                      onClick={() => setMode("custom")}
                    >
                      <LockKeyhole size={17} />
                      Custom
                    </button>
                  </div>

                  {mode === "custom" ? (
                    <label className="block space-y-2">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Slug</span>
                      <div
                        className={`flex h-12 overflow-hidden rounded-lg border border-zinc-300 bg-zinc-50 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-white/10 dark:bg-white/10 dark:focus-within:border-emerald-400 dark:focus-within:bg-white/15 dark:focus-within:ring-emerald-400/20 ${themeTransition}`}
                      >
                        <span className="hidden items-center border-r border-zinc-200 px-3 text-sm font-semibold text-zinc-500 transition-colors duration-500 sm:flex dark:border-white/10 dark:text-zinc-400">
                          link.guidev.site/
                        </span>
                        <input
                          className="min-w-0 flex-1 bg-transparent px-4 text-zinc-950 outline-none transition-colors duration-500 dark:text-white dark:placeholder:text-zinc-500"
                          placeholder="meu-link"
                          value={slug}
                          onChange={(event) => setSlug(event.target.value)}
                        />
                      </div>
                    </label>
                  ) : null}

                  {error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition-colors duration-500 dark:border-red-400/30 dark:bg-red-950/40 dark:text-red-200">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={!canSubmit || isLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-black text-white shadow-lg shadow-zinc-950/10 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none disabled:hover:translate-y-0 dark:bg-emerald-400 dark:text-zinc-950 dark:hover:bg-emerald-300 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <LinkIcon size={18} />}
                    Encurtar
                  </button>
                </form>

                {createdLink ? (
                  <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 transition-colors duration-500 dark:border-emerald-400/30 dark:bg-emerald-950/30">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-black text-emerald-900 dark:text-emerald-100">Link criado</span>
                      <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-white/10 dark:text-emerald-200">
                        /{createdLink.slug}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        className="h-11 min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-bold text-zinc-950 outline-none transition-colors duration-500 dark:border-emerald-400/20 dark:bg-zinc-950 dark:text-white"
                        value={createdLink.shortUrl}
                      />
                      <button
                        type="button"
                        className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-emerald-600 text-white transition duration-300 hover:bg-emerald-700 dark:bg-emerald-400 dark:text-zinc-950 dark:hover:bg-emerald-300"
                        onClick={copyLink}
                        aria-label="Copiar link"
                        title="Copiar link"
                      >
                        {copied ? <Check size={19} /> : <Copy size={19} />}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
