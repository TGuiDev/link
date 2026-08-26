"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  Github,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  Sparkles,
  Sun,
  User as UserIcon
} from "lucide-react";
import { clearCachedNavbarUser, loadNavbarUser, type NavbarUser } from "@/lib/navbar-user";
import { useAppTheme, type Theme } from "@/lib/theme";

type NavbarProps = {
  theme?: Theme;
  onToggleTheme?: () => void;
  user?: NavbarUser | null;
};

const contributeUrl = "https://github.com/TGuiDev/link";

export function Navbar({ theme: parentTheme, onToggleTheme, user: parentUser }: NavbarProps) {
  const pathname = usePathname();
  const [internalUser, setInternalUser] = useState<NavbarUser | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(parentUser === undefined);
  const [hookTheme, toggleHookTheme] = useAppTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Determinar o tema e usuário ativos
  const currentTheme = parentTheme ?? hookTheme;
  const user = parentUser !== undefined ? parentUser : internalUser;

  useEffect(() => {
    if (parentUser !== undefined) return;

    let isMounted = true;
    loadNavbarUser()
      .then((loadedUser) => {
        if (isMounted) {
          setInternalUser(loadedUser);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingUser(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [parentUser]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  function handleToggleTheme() {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      toggleHookTheme();
    }
  }

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      clearCachedNavbarUser();
      setInternalUser(null);
      setIsMenuOpen(false);
      window.location.href = "/login";
    }
  }

  return (
    <header className="sticky top-4 z-50 w-full">
      <nav
        className="flex h-14 w-full items-center justify-between gap-3 rounded-full border border-zinc-200/80 bg-white/70 px-3.5 py-2 shadow-lg shadow-zinc-950/5 backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-zinc-900/70 dark:shadow-black/20 sm:px-5"
        aria-label="Navegação principal"
      >
        {/* Logo & Marca */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <div className="relative h-8 w-8 overflow-hidden rounded-lg transition group-hover:scale-105">
            <Image
              className="object-contain"
              src={currentTheme === "dark" ? "/Dark_Theme_Logo.svg" : "/Light_Theme_Logo.svg"}
              alt="Link"
              width={32}
              height={32}
              priority
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black tracking-tight text-zinc-950 dark:text-white">Link</span>
            <span className="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 sm:inline-block">
              v2.0
            </span>
          </div>
        </Link>

        {/* Links Centrais Limpos */}
        <div className="hidden items-center gap-1.5 md:flex">
          <NavLink href="/" active={pathname === "/"}>
            Início
          </NavLink>

          <NavLink href="/documentacao" active={pathname === "/documentacao"}>
            Documentação
          </NavLink>

          <NavLink href="/changelog" active={pathname === "/changelog"}>
            Changelog
          </NavLink>
        </div>

        {/* Ações à Direita */}
        <div className="flex items-center gap-2">
          {/* Link para Contribuir */}
          <a
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 bg-white/50 text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white sm:flex"
            href={contributeUrl}
            target="_blank"
            rel="noreferrer"
            title="Repositório no GitHub"
            aria-label="Repositório no GitHub"
          >
            <Github size={16} />
          </a>

          {/* Alternador de Tema */}
          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200/80 bg-white/50 text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white"
            onClick={handleToggleTheme}
            title={currentTheme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
            aria-label="Alternar tema"
            type="button"
          >
            {currentTheme === "dark" ? (
              <Sun size={16} className="transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon size={16} className="transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* Estado de Usuário / Autenticação */}
          {isCheckingUser && parentUser === undefined ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 animate-pulse" />
          ) : user ? (
            /* Usuário Logado - Menu Capsule Dropdown Enxuto */
            <div className="relative" ref={menuRef}>
              <button
                className="flex h-9 items-center gap-2 rounded-full border border-zinc-200/80 bg-white/80 py-1 pl-1 pr-2.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:bg-white dark:border-white/10 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:border-white/30 dark:hover:bg-zinc-800"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                type="button"
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="h-7 w-7 rounded-full object-cover ring-1 ring-emerald-500/30" src={user.avatarUrl} alt="" />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[11px] font-black text-white shadow-sm">
                    {(user.name || user.email).slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="hidden max-w-[100px] truncate sm:inline-block font-black">{user.name}</span>
                <ChevronDown size={13} className={`transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2.5 w-56 origin-top-right rounded-2xl border border-zinc-200/80 bg-white/95 p-2 shadow-2xl backdrop-blur-2xl transition-all dark:border-white/10 dark:bg-zinc-900/95">
                  {/* Identificação do Usuário */}
                  <div className="px-3 py-2">
                    <p className="text-xs font-black text-zinc-950 dark:text-white truncate">{user.name}</p>
                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                  </div>

                  <div className="my-1 h-px bg-zinc-100 dark:bg-white/5" />

                  {/* Links (Exibidos apenas no mobile quando os links centrais estiverem ocultos) */}
                  <div className="space-y-0.5 md:hidden">
                    <DropdownLink href="/" icon={<Sparkles size={14} />} onClick={() => setIsMenuOpen(false)}>
                      Início
                    </DropdownLink>
                    <DropdownLink href="/documentacao" icon={<BookOpen size={14} />} onClick={() => setIsMenuOpen(false)}>
                      Documentação
                    </DropdownLink>
                    <DropdownLink href="/changelog" icon={<History size={14} />} onClick={() => setIsMenuOpen(false)}>
                      Changelog
                    </DropdownLink>
                    <div className="my-1 h-px bg-zinc-100 dark:bg-white/5" />
                  </div>

                  {/* Ação Principal da Conta */}
                  <div className="space-y-0.5">
                    <DropdownLink href="/dashboard" icon={<LayoutDashboard size={14} />} onClick={() => setIsMenuOpen(false)}>
                      Meu Painel
                    </DropdownLink>
                  </div>

                  <div className="my-1 h-px bg-zinc-100 dark:bg-white/5" />

                  {/* Botão Sair */}
                  <button
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    onClick={handleSignOut}
                    type="button"
                  >
                    <LogOut size={14} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Usuário Deslogado - Botão Único e Direto */
            <Link
              href="/login"
              className="flex h-9 items-center gap-1.5 rounded-full bg-zinc-950 px-4 text-xs font-black text-white shadow-md shadow-zinc-950/10 transition hover:bg-zinc-800 hover:scale-105 active:scale-95 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              <UserIcon size={13} />
              <span>Entrar</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
        active
          ? "bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950"
          : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

function DropdownLink({
  href,
  icon,
  onClick,
  children
}: {
  href: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
