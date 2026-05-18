"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FormEvent, useState } from "react";
import { Github, LinkIcon, Loader2, LockKeyhole, Mail, MessageCircle } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type AuthMode = "login" | "signup" | "forgot" | "update-password";

type AuthCardProps = {
  mode: AuthMode;
};

const copyByMode = {
  login: {
    title: "Entrar",
    subtitle: "Acesse seu painel de links.",
    button: "Entrar"
  },
  signup: {
    title: "Criar conta",
    subtitle: "Confirme seu email depois do cadastro.",
    button: "Criar conta"
  },
  forgot: {
    title: "Recuperar senha",
    subtitle: "Receba um link seguro por email.",
    button: "Enviar email"
  },
  "update-password": {
    title: "Nova senha",
    subtitle: "Defina uma nova senha para sua conta.",
    button: "Salvar senha"
  }
};

const field =
  "h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-4 focus:ring-zinc-100";

export function AuthCard({ mode }: AuthCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [canResendConfirmation, setCanResendConfirmation] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");
    setCanResendConfirmation(false);

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
        setCanResendConfirmation(true);
        setMessage("Cadastro criado. Confira seu email para confirmar a conta. Veja tambem spam e promoções.");
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
      setMessage("Senha atualizada. Redirecionando...");
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

    if (oauthError) setError(oauthError.message);
  }

  async function resendConfirmation() {
    if (!email) {
      setError("Informe o email usado no cadastro antes de reenviar.");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const supabase = getSupabaseBrowser();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (resendError) throw resendError;
      setCanResendConfirmation(true);
      setMessage("Email de confirmacao reenviado. Confira sua caixa de entrada e spam.");
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Nao foi possivel reenviar a confirmacao.");
    } finally {
      setIsLoading(false);
    }
  }

  const copy = copyByMode[mode];
  const needsPassword = mode !== "forgot";
  const showSocial = mode === "login" || mode === "signup";

  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-6 text-zinc-950">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <Link href="/" className="mb-8 inline-flex items-center gap-3 font-black">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-950 text-white">
            <LinkIcon size={21} />
          </span>
          Link
        </Link>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black tracking-normal">{copy.title}</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-zinc-500">{copy.subtitle}</p>

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
            <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase text-zinc-400">
              <span className="h-px flex-1 bg-zinc-200" />
              ou
              <span className="h-px flex-1 bg-zinc-200" />
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

            {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}
            {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</div> : null}

            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-black text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <LockKeyhole size={18} />}
              {copy.button}
            </button>

            {mode === "signup" && canResendConfirmation ? (
              <button
                className="flex h-11 w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950 disabled:cursor-not-allowed disabled:text-zinc-300"
                disabled={isLoading}
                onClick={resendConfirmation}
                type="button"
              >
                Reenviar email de confirmacao
              </button>
            ) : null}
          </form>

          <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm font-bold text-zinc-500">
            {mode === "login" ? <Link href="/cadastro">Criar conta</Link> : <Link href="/login">Entrar</Link>}
            {mode !== "forgot" && mode !== "update-password" ? <Link href="/recuperar-senha">Esqueci minha senha</Link> : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function SocialButton({ children, icon, onClick }: { children: ReactNode; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      className="flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-sm font-bold transition hover:border-zinc-400 hover:bg-zinc-50"
      onClick={onClick}
      type="button"
    >
      {icon}
      {children}
    </button>
  );
}
