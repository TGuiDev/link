"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Github, Loader2, LockKeyhole, Mail, MessageCircle, Moon, Sun } from "lucide-react";

type AuthMode = "login" | "signup" | "forgot" | "update-password";

type AuthCardProps = {
  mode: AuthMode;
};

type Theme = "light" | "dark";

const copyByMode = {
  login: {
    title: "Entrar",
    subtitle: "Acesse seu painel de links.",
    button: "Entrar"
  },
  signup: {
    title: "Criar conta",
    subtitle: "Cadastre-se para gerenciar seus links.",
    button: "Criar conta"
  },
  forgot: {
    title: "Recuperar senha",
    subtitle: "Receba instruções por email.",
    button: "Enviar"
  },
  "update-password": {
    title: "Nova senha",
    subtitle: "Defina uma nova senha para sua conta.",
    button: "Salvar senha"
  }
};

const field =
  "h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 text-zinc-950 outline-none transition-colors duration-200 ease-out focus:border-zinc-950 focus:ring-4 focus:ring-zinc-100 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-emerald-300 dark:focus:ring-emerald-300/10";

export function AuthCard({ mode }: AuthCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";

    const savedTheme = window.localStorage.getItem("link-theme");
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;

    return "dark";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error");
      if (urlError) {
        setError(decodeURIComponent(urlError));
      }
    }
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    window.localStorage.setItem("link-theme", nextTheme);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      if (mode === "login") {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Não foi possível realizar o login.");
        }

        window.location.href = "/dashboard";
        return;
      }

      if (mode === "signup") {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Não foi possível criar a conta.");
        }

        window.location.href = "/dashboard";
        return;
      }

      if (mode === "forgot") {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Não foi possível processar a recuperação.");
        }

        setMessage(data.message ?? "Instruções processadas com sucesso.");
        return;
      }

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível atualizar a senha.");
      }

      setMessage("Senha atualizada. Redirecionando...");
      window.setTimeout(() => {
        window.location.href = "/dashboard";
      }, 900);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Não foi possível concluir a ação.");
    } finally {
      setIsLoading(false);
    }
  }

  function oauth(provider: "google" | "github" | "discord") {
    setError("");
    window.location.href = `/api/auth/oauth/${provider}`;
  }

  const copy = copyByMode[mode];
  const needsPassword = mode !== "forgot";
  const showSocial = mode === "login" || mode === "signup";

  return (
    <main className={theme === "dark" ? "dark" : ""}>
      <section className="min-h-screen bg-zinc-50 px-5 py-6 text-zinc-950 transition-colors duration-200 ease-out dark:bg-zinc-950 dark:text-white">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-3 font-black">
              <Image
                className="h-10 w-10 rounded-lg object-contain"
                src={theme === "dark" ? "/Dark_Theme_Logo.svg" : "/Light_Theme_Logo.svg"}
                alt="Link"
                width={40}
                height={40}
                loading="eager"
              />
              Link
            </Link>
            <button
              className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/30 dark:hover:text-white"
              onClick={toggleTheme}
              title="Alternar tema"
              aria-label="Alternar tema"
              type="button"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors duration-200 ease-out dark:border-white/10 dark:bg-zinc-900">
            <Link
              className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
              href="/"
            >
              <ArrowLeft size={16} />
              Voltar
            </Link>
            <h1 className="text-3xl font-black tracking-normal">{copy.title}</h1>
            <p className="mt-2 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">{copy.subtitle}</p>

            {showSocial ? (
              <div className="mt-6 grid gap-2">
                <SocialButton icon={<Mail size={17} />} onClick={() => oauth("google")}>
                  Continuar com Google
                </SocialButton>
                <SocialButton icon={<Github size={17} />} onClick={() => oauth("github")}>
                  Continuar com GitHub
                </SocialButton>
                <SocialButton icon={<MessageCircle size={17} />} onClick={() => oauth("discord")}>
                  Continuar com Discord
                </SocialButton>
              </div>
            ) : null}

            {showSocial ? (
              <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">
                <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
                ou
                <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
              </div>
            ) : null}

            <form className={showSocial ? "space-y-4" : "mt-6 space-y-4"} onSubmit={submit}>
              {mode !== "update-password" ? (
                <label className="block space-y-2">
                  <span className="text-sm font-bold">Email</span>
                  <input
                    className={field}
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@email.com"
                    required
                  />
                </label>
              ) : null}

              {needsPassword ? (
                <label className="block space-y-2">
                  <span className="text-sm font-bold">Senha</span>
                  <input
                    className={field}
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    required
                  />
                </label>
              ) : null}

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-200">
                  {error}
                </div>
              ) : null}
              {message ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-950/30 dark:text-emerald-100">
                  {message}
                </div>
              ) : null}

              <button
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-black text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <LockKeyhole size={18} />}
                {copy.button}
              </button>
            </form>

            <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm font-bold text-zinc-500 dark:text-zinc-400">
              {mode === "login" ? <Link href="/cadastro">Criar conta</Link> : <Link href="/login">Entrar</Link>}
              {mode !== "forgot" && mode !== "update-password" ? <Link href="/recuperar-senha">Esqueci minha senha</Link> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SocialButton({ children, icon, onClick }: { children: ReactNode; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      className="flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-sm font-bold transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-white/30 dark:hover:bg-zinc-900"
      onClick={onClick}
      type="button"
    >
      {icon}
      {children}
    </button>
  );
}
