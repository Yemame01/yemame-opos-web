"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { AccountHeader } from "@/components/account/AccountHeader";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard: must be signed in. Unverified users go verify first.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (!user.emailVerified) {
      router.replace("/verify-email");
    }
  }, [loading, user, router]);

  if (loading || !user || !user.emailVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7faf9]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf9]">
      <AccountSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AccountHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
