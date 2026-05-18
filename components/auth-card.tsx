"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Github, Loader2, LockKeyhole, Mail, MessageCircle } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type AuthMode = "login" | "signup" | "forgot" | "update-password";

type AuthCardProps = {
  mode: AuthMode;
};

const copyByMode = {
  login: {
    title: "Entrar no Link",
    subtitle: "Acesse seu painel para acompanhar links, cliques e origens.",
    button: "Entrar"
  },
  signup: {
    title: "Criar conta",
    subtitle: "Depois do cadastro, confirme seu email para liberar o acesso.",
    button: "Criar conta"
  },
  forgot: {
    title: "Recuperar senha",
    subtitle: "Enviaremos um link seguro para redefinir sua senha.",
    button: "Enviar email"
  },
  "update-password": {
    title: "Nova senha",
    subtitle: "Defina uma nova senha para continuar usando o painel.",
    button: "Salvar senha"
  }
};

export function AuthCard({ mode }: AuthCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const supabase = getSupabaseBrowser();
      const origin = window.location.origin;

      if (mode === "login") {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        window.location.href = "/dashboard";
        return;
      }

      if (mode === "signup") {
        const { error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback`
          }
        });
        if (signupError) throw signupError;
        setMessage("Cadastro criado. Confira seu email para confirmar a conta.");
        return;
      }

      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/nova-senha`
        });
        if (resetError) throw resetError;
        setMessage("Enviamos o link de troca de senha para seu email.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("Senha atualizada. Redirecionando para o painel...");
      window.setTimeout(() => {
        window.location.href = "/dashboard";
      }, 900);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Nao foi possivel concluir a acao.");
    } finally {
      setIsLoading(false);
    }
  }

  async function oauth(provider: "google" | "github" | "discord") {
    setError("");
    const supabase = getSupabaseBrowser();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (oauthError) {
      setError(oauthError.message);
    }
  }

  const copy = copyByMode[mode];
  const needsPassword = mode !== "forgot";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f4ec] px-5 py-6 text-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(52,211,153,0.32),transparent_28rem),radial-gradient(circle_at_92%_8%,rgba(56,189,248,0.18),transparent_25rem),linear-gradient(135deg,rgba(255,255,255,0.72),rgba(236,253,245,0.44)_48%,rgba(250,245,235,0.86))]" />
      <section className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <Link href="/" className="mb-8 inline-flex items-center gap-3 font-black">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-zinc-950 text-emerald-300 shadow-[0_18px_55px_rgba(16,185,129,0.22)]">
            <LockKeyhole size={22} />
          </span>
          Link
        </Link>

        <div className="rounded-[1.25rem] border border-white/80 bg-white/82 p-3 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          <div className="rounded-2xl border border-zinc-100 bg-white p-5">
            <h1 className="text-3xl font-black tracking-normal">{copy.title}</h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">{copy.subtitle}</p>

            {mode === "login" || mode === "signup" ? (
              <div className="mt-5 grid gap-2">
                <button className="flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm font-black transition hover:border-emerald-300 hover:text-emerald-700" onClick={() => oauth("google")}>
                  <Mail size={17} />
                  Google
                </button>
                <button className="flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm font-black transition hover:border-emerald-300 hover:text-emerald-700" onClick={() => oauth("github")}>
                  <Github size={17} />
                  GitHub
                </button>
                <button className="flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm font-black transition hover:border-emerald-300 hover:text-emerald-700" onClick={() => oauth("discord")}>
                  <MessageCircle size={17} />
                  Discord
                </button>
              </div>
            ) : null}

            {mode === "login" || mode === "signup" ? (
              <div className="my-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                <span className="h-px flex-1 bg-zinc-200" />
                email
                <span className="h-px flex-1 bg-zinc-200" />
              </div>
            ) : null}

            <form className="mt-5 space-y-4" onSubmit={submit}>
              {mode !== "update-password" ? (
                <label className="block space-y-2">
                  <span className="text-sm font-bold">Email</span>
                  <input
                    className="h-12 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-4 text-zinc-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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
                    className="h-12 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-4 text-zinc-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    required
                  />
                </label>
              ) : null}

              {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}
              {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</div> : null}

              <button
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-black text-white shadow-lg shadow-zinc-950/10 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none disabled:hover:translate-y-0"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <LockKeyhole size={18} />}
                {copy.button}
              </button>
            </form>

            <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm font-bold text-zinc-600">
              {mode === "login" ? <Link href="/cadastro">Criar conta</Link> : <Link href="/login">Entrar</Link>}
              {mode !== "forgot" && mode !== "update-password" ? <Link href="/recuperar-senha">Esqueci minha senha</Link> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
