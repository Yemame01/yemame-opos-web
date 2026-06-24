"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, ChevronDown, User, LogOut, ShoppingCart } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

function initials(nameOrEmail: string): string {
  const n = (nameOrEmail || "").trim();
  if (!n) return "U";
  const parts = n.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}

export function AccountHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const name = user?.displayName || "";
  const email = user?.email || "";

  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-ink/60 transition hover:bg-black/5 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* spacer keeps the avatar right-aligned on desktop */}
        <div className="hidden lg:block" />

        <div className="flex items-center gap-2">
          <Link
            href="/buy"
            className="hidden items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 sm:inline-flex"
          >
            <ShoppingCart className="h-4 w-4" /> Buy keys
          </Link>

          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-black/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                {initials(name || email)}
              </span>
              <span className="hidden text-left md:block">
                <span className="block text-sm font-medium leading-tight">
                  {name || "Your account"}
                </span>
                <span className="block max-w-[160px] truncate text-xs text-ink/50">
                  {email}
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 text-ink/50 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-black/[0.06] bg-white py-1 shadow-lg">
                <div className="border-b border-black/[0.06] px-4 py-3">
                  <p className="text-sm font-semibold">{name || "Your account"}</p>
                  <p className="truncate text-xs text-ink/50">{email}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink/75 transition hover:bg-black/5"
                >
                  <User className="h-4 w-4" /> Profile
                </Link>
                <button
                  onClick={async () => {
                    await signOut();
                    router.push("/login");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
