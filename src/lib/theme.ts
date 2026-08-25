"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "link-theme";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("link-theme-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("link-theme-change", callback);
  };
}

function getSnapshot(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "dark" || saved === "light") {
    return saved;
  }
  return "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

export function useAppTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleTheme() {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    window.dispatchEvent(new Event("link-theme-change"));
  }

  return [theme, toggleTheme];
}
