"use client";

import { createClient } from "@supabase/supabase-js";

let supabaseBrowser: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase public environment variables are missing.");
  }

  if (supabaseBrowser) {
    return supabaseBrowser;
  }

  supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true
    }
  });

  return supabaseBrowser;
}
