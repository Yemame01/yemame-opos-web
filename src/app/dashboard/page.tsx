"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Copy, Check, Plus, KeyRound } from "lucide-react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { firebaseReady, requireDb } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { License } from "@/lib/types";

function PaymentBanner() {
  const params = useSearchParams();
  const status = params.get("payment");
  if (!status) return null;
  const map: Record<string, { text: string; cls: string }> = {
    success: {
      text: "Payment received — your new license is below. 🎉",
      cls: "border-teal-200 bg-teal-50 text-teal-800",
    },
    pending: {
      text: "Payment is processing — your license will appear here shortly.",
      cls: "border-amber-200 bg-amber-50 text-amber-800",
    },
    failed: {
      text: "That payment didn't go through. You can try again.",
      cls: "border-red-200 bg-red-50 text-red-700",
    },
    missing: {
      text: "We couldn't read that payment. If you were charged, contact support.",
      cls: "border-red-200 bg-red-50 text-red-700",
    },
  };
  const m = map[status] ?? map.pending;
  return (
    <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${m.cls}`}>
      {m.text}
    </div>
  );
}

function LicenseCard({ license }: { license: License }) {
  const [copied, setCopied] = useState(false);
  const exhausted = license.activationsUsed >= license.maxActivations;
  const revoked = license.status === "revoked";

  const copy = async () => {
    await navigator.clipboard.writeText(license.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-teal-500" />
            <code className="truncate font-mono text-lg font-semibold tracking-wide">
              {license.key}
            </code>
          </div>
          <p className="mt-1 text-sm text-ink/50">
            {license.maxActivations} activation
            {license.maxActivations === 1 ? "" : "s"} · created{" "}
            {license.createdAt
              ? new Date(license.createdAt.seconds * 1000).toLocaleDateString()
              : "—"}
          </p>
        </div>
        <button onClick={copy} className="btn-ghost shrink-0 px-3 py-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Usage meter */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink/60">Activations used</span>
          <span className="font-semibold">
            {license.activationsUsed} / {license.maxActivations}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/[0.06]">
          <div
            className={`h-full rounded-full ${exhausted ? "bg-amber-500" : "bg-teal-500"}`}
            style={{
              width: `${Math.min(
                100,
                (license.activationsUsed / Math.max(1, license.maxActivations)) *
                  100,
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {revoked ? (
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
            Revoked
          </span>
        ) : exhausted ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            No activations left
          </span>
        ) : (
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
            Active
          </span>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useRequireAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || !firebaseReady) return;
    // Each buyer's licenses live under their own account doc (POS-style nesting).
    const unsub = onSnapshot(
      query(
        collection(requireDb(), "users", user.uid, "licenses"),
        orderBy("createdAt", "desc"),
      ),
      (snap) => {
        setLicenses(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as License));
        setLoaded(true);
      },
      () => setLoaded(true),
    );
    return () => unsub();
  }, [user]);

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
      <main className="mx-auto max-w-3xl px-5 py-10">
        <PaymentBanner />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My licenses</h1>
            <p className="mt-1 text-ink/60">
              Use a key in Yemame OPOS when creating your account.
            </p>
          </div>
          <Link href="/buy" className="btn-primary">
            <Plus className="h-4 w-4" /> Buy
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {!loaded ? (
            <p className="text-ink/50">Loading your licenses…</p>
          ) : licenses.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-ink/60">You don&apos;t have any licenses yet.</p>
              <Link href="/buy" className="btn-primary mt-4 inline-flex">
                Buy your first license
              </Link>
            </div>
          ) : (
            licenses.map((l) => <LicenseCard key={l.id} license={l} />)
          )}
        </div>
      </main>
    </div>
  );
}
