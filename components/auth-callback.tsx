"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export function AuthCallback() {
  const [message, setMessage] = useState("Confirmando acesso...");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function finishAuth() {
      try {
        const supabase = getSupabaseBrowser();
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
        const urlError =
          url.searchParams.get("error_description") ??
          url.searchParams.get("error") ??
          hashParams.get("error_description") ??
          hashParams.get("error");

        if (urlError) {
          setHasError(true);
          setMessage(decodeURIComponent(urlError));
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            setHasError(true);
            setMessage(error.message);
            return;
          }
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setHasError(true);
          setMessage(error.message);
          return;
        }

        if (!data.session) {
          setHasError(true);
          setMessage("Login confirmado, mas a sessao nao foi criada no navegador. Verifique as Redirect URLs do Supabase.");
          return;
        }

        window.location.replace("/dashboard");
      } catch (callbackError) {
        setHasError(true);
        setMessage(callbackError instanceof Error ? callbackError.message : "Nao foi possivel concluir o login.");
      }
    }

    finishAuth();
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f4ec] px-5 text-zinc-950">
      <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-xl">
        {hasError ? (
          <AlertCircle className="mx-auto mb-4 text-red-600" size={28} />
        ) : (
          <Loader2 className="mx-auto mb-4 animate-spin text-emerald-600" size={28} />
        )}
        <p className="text-sm font-black">{message}</p>
        {hasError ? (
          <Link
            className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-black text-white"
            href="/login"
          >
            Voltar ao login
          </Link>
        ) : null}
      </div>
    </main>
  );
}
