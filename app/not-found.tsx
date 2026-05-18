import Link from "next/link";
import Image from "next/image";
import { Home, LinkIcon } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-6 text-white">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center gap-10 py-10 lg:grid-cols-[0.95fr_1fr]">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <Image className="mb-8 h-14 w-14 rounded-xl object-contain" src="/Dark_Theme_Logo.svg" alt="Link" width={56} height={56} loading="eager" />
          <ErrorIllustration />
        </div>

        <div className="text-center lg:text-left">
          <p className="mb-3 text-sm font-black uppercase text-zinc-500">404</p>
          <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
            Esse link não foi encontrado.
          </h1>
          <p className="mt-4 max-w-xl text-lg font-medium leading-8 text-zinc-400">
            O endereco pode ter sido digitado errado, removido ou ainda nao foi criado no Link.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-black text-zinc-950 transition hover:bg-zinc-200"
            >
              <Home size={18} />
              Voltar ao inicio
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-zinc-900 px-5 text-sm font-black text-zinc-200 transition hover:border-white/30 hover:text-white"
            >
              <LinkIcon size={18} />
              Criar um link
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ErrorIllustration() {
  return (
    <svg className="h-auto w-full" viewBox="0 0 360 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="40" y="48" width="280" height="150" rx="24" fill="#18181B" stroke="#3F3F46" />
      <path d="M98 126h164" stroke="#71717A" strokeWidth="14" strokeLinecap="round" />
      <path d="M128 91h104" stroke="#52525B" strokeWidth="12" strokeLinecap="round" />
      <path d="M112 164h132" stroke="#27272A" strokeWidth="12" strokeLinecap="round" />
      <path d="M67 33 43 9M293 33l24-24M72 227l-31 12M288 227l31 12" stroke="#52525B" strokeWidth="8" strokeLinecap="round" />
      <circle cx="51" cy="111" r="10" fill="#27272A" />
      <circle cx="315" cy="130" r="8" fill="#27272A" />
      <circle cx="180" cy="126" r="45" fill="#09090B" stroke="#A1A1AA" strokeWidth="9" />
      <path d="m203 103-46 46M157 103l46 46" stroke="#F4F4F5" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}
