"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ShieldCheck, WifiOff } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { usePackages } from "@/lib/usePackages";
import { formatMoneyMinor } from "@/lib/types";
import { PageHeader } from "@/components/account/ui";

export default function BuyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { packages, loading: pkgLoading } = usePackages();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const buy = async (packageId: string) => {
    if (!user) return;
    setError("");
    setBusyId(packageId);
    try {
      // The SERVER initializes the transaction (verifies the buyer's ID token,
      // re-derives the price, tags metadata.uid) and returns an access_code. We
      // resume that exact transaction in an inline popup — no redirect, and the
      // amount/uid can't be tampered with client-side.
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

      const reference: string = data.reference;

      if (typeof window === "undefined" || !window.PaystackPop) {
        // Inline SDK unavailable (e.g. blocked script) — fall back to the
        // hosted page so checkout still works.
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
          return;
        }
        throw new Error("Checkout couldn't start. Please refresh and try again.");
      }

      // Resume the server-created transaction in the inline dialog. We pass
      // email + amount + currency alongside access_code — Paystack's inline SDK
      // validates these in its OWN config and errors "Please enter a valid email
      // address" when they're absent (yemame-pos passes the same three).
      const setupConfig: PaystackPopupOptions = {
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
        access_code: data.access_code,
        currency: "GHS",
        callback: () => {
          // Paid — hand off to the dashboard, which shows the confetti success
          // overlay and waits for the webhook to mint the key.
          router.push(
            `/dashboard?payment=success&ref=${encodeURIComponent(reference)}`,
          );
        },
        onClose: () => {
          // User dismissed the dialog without paying.
          setBusyId(null);
        },
      };
      // The email comes from the server-verified token (data.email); fall back to
      // the signed-in user's email so it's never blank.
      const email = data.email || user.email || "";
      if (email) setupConfig.email = email;
      if (data.amount) setupConfig.amount = data.amount;

      const handler = window.PaystackPop.setup(setupConfig);
      handler.openIframe();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Buy more keys"
        subtitle="Pick a plan. After payment, your key appears under My Licenses instantly."
      />

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {pkgLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-black/[0.06] bg-white"
            />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center text-ink/55">
          Plans are being set up. Please check back shortly.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-6 transition-shadow hover:shadow-sm"
            >
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
                  <Check className="h-4 w-4 shrink-0 text-teal-500" /> Activate on{" "}
                  {p.activations} device{p.activations === 1 ? "" : "s"}
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-teal-500" /> Same-device
                  reinstall is free
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-teal-500" /> Works fully
                  offline
                </li>
              </ul>
              <button
                className="btn-primary mt-6 w-full justify-center"
                disabled={busyId !== null || p.priceMinor <= 0}
                onClick={() => buy(p.id)}
              >
                {busyId === p.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Starting…
                  </>
                ) : (
                  "Buy now"
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-ink/55">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-teal-500" /> Buy once, no monthly fees
        </span>
        <span className="inline-flex items-center gap-1.5">
          <WifiOff className="h-4 w-4 text-teal-500" /> Runs fully offline
        </span>
        <span>Secure checkout via Paystack</span>
      </div>
    </>
  );
}
