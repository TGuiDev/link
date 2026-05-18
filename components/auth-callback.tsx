"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export function AuthCallback() {
  const [message, setMessage] = useState("Confirmando acesso...");

  useEffect(() => {
    async function finishAuth() {
      const supabase = getSupabaseBrowser();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          return;
        }
      }

      window.location.href = "/dashboard";
    }

    finishAuth();
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f4ec] px-5 text-zinc-950">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-xl">
        <Loader2 className="mx-auto mb-4 animate-spin text-emerald-600" size={28} />
        <p className="text-sm font-black">{message}</p>
      </div>
    </main>
  );
}
