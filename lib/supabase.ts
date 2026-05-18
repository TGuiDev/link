import { createClient } from "@supabase/supabase-js";

export type LinkRow = {
  id: string;
  user_id: string | null;
  slug: string;
  url: string;
  clicks: number;
  created_at: string;
  updated_at: string;
};

export type LinkClickEventRow = {
  id: string;
  link_id: string;
  country: string | null;
  region: string | null;
  city: string | null;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
};

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
