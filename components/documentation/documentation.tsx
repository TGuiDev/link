"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BookOpen, Check, ChevronDown, Copy, KeyRound, LayoutDashboard, Loader2, LogOut, Moon, Sun, Terminal } from "lucide-react";
import { clearCachedNavbarUser, getCachedNavbarUser, loadNavbarUser, type NavbarUser } from "@/lib/navbar-user";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Theme = "light" | "dark";

const sections = [
  { id: "inicio", label: "Início" },
  { id: "autenticacao", label: "Autenticação" },
  { id: "criar-link", label: "Criar link" },
  { id: "consultar-link", label: "Consultar link" },
  { id: "dashboard", label: "Dashboard" },
  { id: "stats", label: "Stats públicas" },
  { id: "redirect", label: "Redirect" },
  { id: "erros", label: "Erros" }
];

const baseUrl = "https://link.guidev.site";

export function Documentation() {
  const cachedNavbarUser = getCachedNavbarUser();
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";

    const savedTheme = window.localStorage.getItem("link-theme");
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;

    return "dark";
  });
  const [copied, setCopied] = useState("");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [navbarUser, setNavbarUser] = useState<NavbarUser | null>(cachedNavbarUser ?? null);
  const [isCheckingUser, setIsCheckingUser] = useState(cachedNavbarUser === undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (cachedNavbarUser !== undefined) {
      return;
    }

    loadNavbarUser()
      .then((user) => {
        setNavbarUser(user);
      })
      .finally(() => {
        setIsCheckingUser(false);
      });
  }, [cachedNavbarUser]);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    window.localStorage.setItem("link-theme", nextTheme);
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(""), 1600);
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
      <section className="doc-page h-screen overflow-y-auto bg-zinc-50 text-zinc-950 transition-colors duration-200 ease-out dark:bg-zinc-950 dark:text-white">
        <div className="mx-auto w-full max-w-7xl px-5 py-6 md:px-8">
          <header className="mb-8 flex items-center justify-between gap-4">
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
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                    <Loader2 className="animate-spin" size={14} />
                  </span>
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
                    <div className="absolute right-0 z-30 mt-2 w-44 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-zinc-900">
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

          <div className="space-y-8">
            <div className="relative z-20 w-full sm:w-80">
              <button
                className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-black text-zinc-800 shadow-sm transition hover:border-zinc-400 dark:border-white/10 dark:bg-black dark:text-zinc-100 dark:hover:border-white/30"
                onClick={() => setIsNavOpen((current) => !current)}
                type="button"
                aria-expanded={isNavOpen}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <BookOpen size={16} />
                  <span className="truncate">Navegar na documenta&ccedil;&atilde;o</span>
                </span>
                <ChevronDown className={`flex-none transition ${isNavOpen ? "rotate-180" : ""}`} size={16} />
              </button>

              {isNavOpen ? (
                <nav className="absolute left-0 right-0 top-12 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-black">
                  {sections.map((section) => (
                    <a
                      className="block rounded-lg px-3 py-2 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
                      href={`#${section.id}`}
                      key={section.id}
                      onClick={() => setIsNavOpen(false)}
                    >
                      {section.label}
                    </a>
                  ))}
                </nav>
              ) : null}
            </div>

            <article className="min-w-0 space-y-8">
              <section id="inicio" className="pb-8">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-bold text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
                  <BookOpen size={15} />
                  API Reference
                </div>
                <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-5xl">
                  Documenta&ccedil;&atilde;o da API Link
                </h1>
                <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-zinc-600 dark:text-zinc-300">
                  Use a API para criar links curtos, consultar links existentes e ler métricas da sua conta. A chave fica no dashboard.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Info label="Base URL" value={baseUrl} />
                  <Info label="Formato" value="JSON" />
                  <Info label="Auth" value="X-API-Key" />
                </div>
              </section>

              <DocSection id="autenticacao" eyebrow="Auth" title="Autenticação">
                <p>
                  As integrações devem enviar a API key gerada no dashboard. A chave pode ir em `X-API-Key` ou no header `Authorization` como Bearer.
                </p>
                <CodeBlock
                  copied={copied}
                  onCopy={copy}
                  value={`curl ${baseUrl}/api/dashboard \\
  -H "X-API-Key: link_sua_api_key"`}
                />
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-950/20 dark:text-amber-100">
                  Guarde sua chave como segredo. Links criados com a API key ficam vinculados à sua conta e aparecem no dashboard.
                </div>
              </DocSection>

              <DocSection id="criar-link" eyebrow="POST" title="/api/links">
                <p>Cria um link curto randômico ou customizado.</p>
                <Endpoint method="POST" path="/api/links" auth="API key recomendada" />
                <FieldTable
                  rows={[
                    ["url", "string", "Sim", "URL original. Se não tiver protocolo, assume https://."],
                    ["slug", "string", "Não", "Slug customizado com 3 a 48 caracteres: letras, números, _ ou -."],
                    ["customSlug", "string", "Não", "Alias de slug para clientes que preferem esse nome."]
                  ]}
                />
                <CodeBlock
                  copied={copied}
                  onCopy={copy}
                  value={`curl -X POST ${baseUrl}/api/links \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: link_sua_api_key" \\
  -d "{\\"url\\":\\"https://guidev.site\\",\\"slug\\":\\"portfolio\\"}"`}
                />
                <JsonBlock
                  copied={copied}
                  onCopy={copy}
                  value={`{
  "id": "4f5b1d1a-7f26-4e49-9f4d-1f6b10e7725d",
  "slug": "portfolio",
  "url": "https://guidev.site/",
  "shortUrl": "https://link.guidev.site/portfolio",
  "clicks": 0
}`}
                />
              </DocSection>

              <DocSection id="consultar-link" eyebrow="GET" title="/api/links/{slug}">
                <p>Consulta os dados públicos de um link pelo slug.</p>
                <Endpoint method="GET" path="/api/links/{slug}" auth="Público" />
                <CodeBlock copied={copied} onCopy={copy} value={`curl ${baseUrl}/api/links/portfolio`} />
                <JsonBlock
                  copied={copied}
                  onCopy={copy}
                  value={`{
  "slug": "portfolio",
  "url": "https://guidev.site/",
  "shortUrl": "https://link.guidev.site/portfolio",
  "clicks": 12,
  "createdAt": "2026-05-18T18:00:00.000Z"
}`}
                />
              </DocSection>

              <DocSection id="dashboard" eyebrow="GET" title="/api/dashboard">
                <p>Retorna resumo, links, rankings de origem/localização e os eventos recentes do usuário autenticado.</p>
                <Endpoint method="GET" path="/api/dashboard" auth="API key obrigatória" />
                <CodeBlock
                  copied={copied}
                  onCopy={copy}
                  value={`curl ${baseUrl}/api/dashboard \\
  -H "X-API-Key: link_sua_api_key"`}
                />
                <JsonBlock
                  copied={copied}
                  onCopy={copy}
                  value={`{
  "user": { "id": "user-id", "email": "voce@email.com" },
  "apiKey": "link_sua_api_key",
  "summary": { "links": 3, "clicks": 42, "trackedEvents": 42 },
  "links": [],
  "countries": [],
  "locations": [],
  "referrers": [],
  "recentEvents": [],
  "baseUrl": "https://link.guidev.site"
}`}
                />
              </DocSection>

              <DocSection id="stats" eyebrow="GET" title="/api/stats">
                <p>Retorna a contagem global de links criados. Este endpoint é público e tem cache curto.</p>
                <Endpoint method="GET" path="/api/stats" auth="Público" />
                <JsonBlock copied={copied} onCopy={copy} value={`{ "links": 128 }`} />
              </DocSection>

              <DocSection id="redirect" eyebrow="GET" title="/{slug}">
                <p>Abre o link encurtado, registra o evento quando possível e redireciona para a URL original.</p>
                <Endpoint method="GET" path="/portfolio" auth="Público" />
                <p>
                  O redirect incrementa `clicks` e tenta salvar país, região, cidade, referrer e user agent com base nos headers da hospedagem.
                </p>
              </DocSection>

              <DocSection id="erros" eyebrow="Reference" title="Erros e limites">
                <StatusTable
                  rows={[
                    ["400", "URL inválida ou slug fora do formato aceito."],
                    ["401", "API key ausente, inválida ou usuário não autenticado."],
                    ["404", "Link ou endpoint não encontrado."],
                    ["409", "Slug customizado já está em uso."],
                    ["500", "Erro inesperado no servidor ou no Supabase."],
                    ["503", "Não foi possível gerar um slug randômico único."]
                  ]}
                />
              </DocSection>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

function DocSection({ children, eyebrow, id, title }: { children: ReactNode; eyebrow: string; id: string; title: string }) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4 pb-8">
      <p className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-300">{eyebrow}</p>
      <h2 className="text-2xl font-black tracking-normal">{title}</h2>
      <div className="space-y-4 text-sm font-medium leading-7 text-zinc-600 dark:text-zinc-300">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
      <p className="text-xs font-black uppercase text-zinc-400">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-black text-zinc-800 dark:text-zinc-100">{value}</p>
    </div>
  );
}

function Endpoint({ auth, method, path }: { auth: string; method: string; path: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="rounded-lg bg-zinc-950 px-2.5 py-1 font-mono text-xs font-black text-white dark:bg-white dark:text-zinc-950">{method}</span>
        <code className="truncate font-mono text-sm font-black text-zinc-900 dark:text-white">{path}</code>
      </div>
      <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        <KeyRound size={14} />
        {auth}
      </span>
    </div>
  );
}

function CodeBlock({ copied, onCopy, value }: { copied: string; onCopy: (value: string) => void; value: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 dark:border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs font-black text-zinc-400">
        <span className="flex items-center gap-2">
          <Terminal size={14} />
          cURL
        </span>
        <button className="grid h-8 w-8 place-items-center rounded-lg text-zinc-300 transition hover:bg-white/10 hover:text-white" onClick={() => onCopy(value)} type="button" aria-label="Copiar" title="Copiar">
          {copied === value ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm font-bold leading-6 text-zinc-100">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function JsonBlock({ copied, onCopy, value }: { copied: string; onCopy: (value: string) => void; value: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 text-xs font-black text-zinc-500 dark:border-white/10 dark:text-zinc-400">
        <span>JSON</span>
        <button className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => onCopy(value)} type="button" aria-label="Copiar" title="Copiar">
          {copied === value ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm font-bold leading-6 text-zinc-700 dark:text-zinc-200">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function FieldTable({ rows }: { rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-zinc-100 text-xs font-black uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3">Campo</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Obrigatório</th>
            <th className="px-4 py-3">Descrição</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell) => (
                <td className="px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300" key={cell}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusTable({ rows }: { rows: string[][] }) {
  return (
    <div className="grid gap-2">
      {rows.map(([status, reason]) => (
        <div className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900 sm:grid-cols-[90px_1fr]" key={status}>
          <code className="font-mono text-sm font-black text-zinc-950 dark:text-white">{status}</code>
          <p className="font-medium text-zinc-600 dark:text-zinc-300">{reason}</p>
        </div>
      ))}
    </div>
  );
}
