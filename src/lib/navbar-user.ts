export type NavbarUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

let cachedNavbarUser: NavbarUser | null | undefined;
let pendingNavbarUserLoad: Promise<NavbarUser | null> | null = null;

export function getCachedNavbarUser() {
  return cachedNavbarUser;
}

export function clearCachedNavbarUser() {
  cachedNavbarUser = null;
  pendingNavbarUserLoad = null;
}

export function primeCachedNavbarUser(user: NavbarUser | null) {
  cachedNavbarUser = user;
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
      const response = await fetch("/api/auth/me", {
        headers: {
          "Cache-Control": "no-cache"
        }
      });

      if (!response.ok) {
        cachedNavbarUser = null;
        return null;
      }

      const data = await response.json();
      if (!data.user) {
        cachedNavbarUser = null;
        return null;
      }

      cachedNavbarUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || data.user.email.split("@")[0] || "Usuario",
        avatarUrl: data.user.avatarUrl || null
      };

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
