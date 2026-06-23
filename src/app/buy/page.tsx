"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { usePackages } from "@/lib/usePackages";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { formatMoneyMinor } from "@/lib/types";

export default function BuyPage() {
  const { user, loading } = useRequireAuth();
  const { packages, loading: pkgLoading } = usePackages();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const buy = async (packageId: string) => {
    if (!user) return;
    setError("");
    setBusyId(packageId);
    try {
      // Send the Firebase ID token so the server binds the purchase to THIS
      // verified account (the server ignores any client-sent uid).
      const idToken = await user.getIdToken();
      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't start checkout.");
      window.location.href = data.authorization_url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusyId(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <p className="mt-20 text-center text-ink/50">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <h1 className="text-2xl font-bold">Buy a license</h1>
        <p className="mt-2 text-ink/60">
          After payment, your key appears on your dashboard instantly.
        </p>
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {pkgLoading ? (
          <p className="mt-10 text-ink/50">Loading packages…</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((p) => (
              <div key={p.id} className="card flex flex-col p-6">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 text-3xl font-bold text-teal-600">
                  {p.activations}
                  <span className="ml-1 text-base font-medium text-ink/50">
                    activation{p.activations === 1 ? "" : "s"}
                  </span>
                </p>
                <p className="mt-3 text-2xl font-bold">
                  {p.priceMinor > 0
                    ? formatMoneyMinor(p.priceMinor, p.currency)
                    : "—"}
                </p>
                <ul className="mt-4 space-y-1.5 text-sm text-ink/70">
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-teal-500" /> Activate on{" "}
                    {p.activations} device{p.activations === 1 ? "" : "s"}
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-teal-500" /> Same-device
                    reinstall is free
                  </li>
                </ul>
                <button
                  className="btn-primary mt-6"
                  disabled={busyId !== null || p.priceMinor <= 0}
                  onClick={() => buy(p.id)}
                >
                  {busyId === p.id ? "Starting…" : "Buy now"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
