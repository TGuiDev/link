import Link from "next/link";
import { Compass, Home, LinkIcon } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_12%,rgba(52,211,153,0.28),transparent_28rem),radial-gradient(circle_at_92%_8%,rgba(56,189,248,0.16),transparent_25rem),linear-gradient(135deg,#f8faf3_0%,#eef7f1_52%,#f5f0e8_100%)] px-5 py-6 text-zinc-950">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col items-center justify-center text-center">
        <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-zinc-950 text-emerald-300 shadow-[0_18px_55px_rgba(16,185,129,0.24)]">
          <Compass size={32} strokeWidth={2.2} />
        </div>

        <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-emerald-700">404</p>
        <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
          Esse link nao foi encontrado.
        </h1>
        <p className="mt-4 max-w-xl text-lg font-medium leading-8 text-zinc-700">
          O endereco pode ter sido digitado errado, removido ou ainda nao foi criado no Link.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-black text-white shadow-lg shadow-zinc-950/10 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            <Home size={18} />
            Voltar ao inicio
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white/75 px-5 text-sm font-black text-zinc-900 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700"
          >
            <LinkIcon size={18} />
            Criar um link
          </Link>
        </div>
      </section>
    </main>
  );
}
