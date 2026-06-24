"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { Brand } from "./Brand";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-black/[0.06] bg-white/85 shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-white/0"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="transition hover:opacity-80">
          <Brand className="text-lg" />
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          <Link href="/#features" className="rounded-lg px-3 py-2 text-ink/65 transition hover:bg-teal-50 hover:text-teal-700">Features</Link>
          <Link href="/#how" className="rounded-lg px-3 py-2 text-ink/65 transition hover:bg-teal-50 hover:text-teal-700">How it works</Link>
          <Link href="/#packages" className="rounded-lg px-3 py-2 text-ink/65 transition hover:bg-teal-50 hover:text-teal-700">Pricing</Link>
          <Link href="/download" className="rounded-lg px-3 py-2 text-ink/65 transition hover:bg-teal-50 hover:text-teal-700">Download</Link>
          <a href="https://www.yemame.com/blog" className="rounded-lg px-3 py-2 text-ink/65 transition hover:bg-teal-50 hover:text-teal-700">Blog</a>
        </nav>

        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="btn-ghost">My licenses</Link>
              <button onClick={() => void signOut()} className="hidden px-3 py-2 text-ink/60 transition hover:text-ink sm:block">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden px-3 py-2 text-ink/70 transition hover:text-ink sm:block">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary !rounded-full">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
