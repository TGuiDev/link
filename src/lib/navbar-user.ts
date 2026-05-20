import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type NavbarUser = {
  email: string;
  name: string;
  avatarUrl: string | null;
};

let cachedNavbarUser: NavbarUser | null | undefined;
let pendingNavbarUserLoad: Promise<NavbarUser | null> | null = null;

function mapUser(user: User): NavbarUser {
  return {
    email: user.email ?? "",
    name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Usuario",
    avatarUrl: user.user_metadata?.avatar_url ?? null
  };
}

export function getCachedNavbarUser() {
  return cachedNavbarUser;
}

export function clearCachedNavbarUser() {
  cachedNavbarUser = null;
  pendingNavbarUserLoad = null;
}

export function primeCachedNavbarUser(user: User | null) {
  cachedNavbarUser = user ? mapUser(user) : null;
}

export async function loadNavbarUser(): Promise<NavbarUser | null> {
  if (cachedNavbarUser !== undefined) {
    return cachedNavbarUser;
  }

  if (pendingNavbarUserLoad) {
    return pendingNavbarUserLoad;
  }

  pendingNavbarUserLoad = (async () => {
    try {
      const supabase = getSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user ?? null;
      cachedNavbarUser = user ? mapUser(user) : null;
      return cachedNavbarUser;
    } catch {
      cachedNavbarUser = null;
      return null;
    } finally {
      pendingNavbarUserLoad = null;
    }
  })();

  return pendingNavbarUserLoad;
}
