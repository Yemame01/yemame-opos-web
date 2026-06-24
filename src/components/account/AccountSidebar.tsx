"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  KeyRound,
  MonitorSmartphone,
  ShoppingCart,
  Receipt,
  Activity,
  User,
  Download,
  LogOut,
  X,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { useAuth } from "@/lib/useAuth";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Licenses",
    items: [
      { name: "My Licenses", href: "/licenses", icon: KeyRound },
      { name: "Devices", href: "/devices", icon: MonitorSmartphone },
      { name: "Buy more keys", href: "/buy", icon: ShoppingCart },
    ],
  },
  {
    title: "History",
    items: [
      { name: "Purchases", href: "/purchases", icon: Receipt },
      { name: "Activity", href: "/activity", icon: Activity },
    ],
  },
  {
    title: "Account",
    items: [{ name: "Profile", href: "/profile", icon: User }],
  },
];

export function AccountSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(href);

  const logout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-black/[0.06] bg-white transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-black/[0.06] px-5">
          <Link href="/dashboard" onClick={onClose}>
            <Brand className="text-base" />
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink/60 transition hover:bg-black/5 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink/40">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20"
                        : "text-ink/70 hover:bg-teal-50 hover:text-teal-700"
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Download app */}
          <div className="space-y-1 border-t border-black/[0.06] pt-5">
            <Link
              href="/download"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:bg-teal-50 hover:text-teal-700"
            >
              <Download className="h-5 w-5 flex-shrink-0" />
              Download app
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              Sign out
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
