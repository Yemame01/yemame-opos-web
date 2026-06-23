import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "./Brand";

/** Chrome for auth pages: a slim top bar (logo → home, back-to-home link) over
 * the brand's soft background, with the page card centered below. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* soft brand glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-amber-300/15 blur-3xl" />
      </div>

      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="transition hover:opacity-80">
          <Brand className="text-lg" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-3.5 py-2 text-sm font-medium text-ink/70 backdrop-blur transition hover:border-black/20 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </header>

      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-5 pb-12">
        {children}
      </main>
    </div>
  );
}
