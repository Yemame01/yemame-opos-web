"use client";

import { Suspense } from "react";
import Link from "next/link";
import {
  KeyRound,
  MonitorSmartphone,
  Zap,
  Wallet,
  ShoppingCart,
  Download,
  ArrowRight,
  Activity as ActivityIcon,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useLicenses, usePayments, useDevices } from "@/lib/useAccount";
import { formatMoneyMinor } from "@/lib/types";
import {
  PageHeader,
  StatCard,
  fmtTsTime,
} from "@/components/account/ui";
import { PaymentSuccess } from "@/components/account/PaymentSuccess";

export default function DashboardPage() {
  const { user } = useAuth();
  const { licenses, loading: lLoading } = useLicenses();
  const { payments } = usePayments();
  const { devices } = useDevices(licenses);

  const activeLicenses = licenses.filter((l) => l.status !== "revoked");
  const totalActivations = licenses.reduce((s, l) => s + l.maxActivations, 0);
  const usedActivations = licenses.reduce((s, l) => s + l.activationsUsed, 0);
  const activeDevices = devices.filter((d) => d.active).length;
  const totalSpent = payments
    .filter((p) => p.status === "success")
    .reduce((s, p) => s + (p.amountMinor || 0), 0);

  const firstName = (user?.displayName || "").split(" ")[0];

  // Build a small recent-activity feed (activations + purchases).
  const feed = [
    ...devices.map((d) => ({
      kind: "device" as const,
      ts: d.activatedAt?.seconds ?? 0,
      label: `Activated ${d.deviceLabel || d.deviceId} ${d.platform ? `(${d.platform})` : ""}`,
    })),
    ...payments.map((p) => ({
      kind: "payment" as const,
      ts: p.paidAt?.seconds ?? 0,
      label: `Purchased a key · ${formatMoneyMinor(p.amountMinor, p.currency)}`,
    })),
  ]
    .filter((x) => x.ts)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5);

  return (
    <>
      <Suspense fallback={null}>
        <PaymentSuccess />
      </Suspense>

      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Dashboard"}
        subtitle="Your licenses, devices and purchases at a glance."
        action={
          <Link href="/buy" className="btn-primary">
            <ShoppingCart className="h-4 w-4" /> Buy keys
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Licenses"
          value={lLoading ? "—" : activeLicenses.length}
          sub={`${licenses.length} total`}
          Icon={KeyRound}
          tone="teal"
          href="/licenses"
        />
        <StatCard
          label="Active devices"
          value={activeDevices}
          sub="currently activated"
          Icon={MonitorSmartphone}
          tone="indigo"
          href="/devices"
        />
        <StatCard
          label="Activations"
          value={`${usedActivations} / ${totalActivations}`}
          sub={`${Math.max(0, totalActivations - usedActivations)} remaining`}
          Icon={Zap}
          tone="amber"
        />
        <StatCard
          label="Total spent"
          value={formatMoneyMinor(totalSpent)}
          sub={`${payments.length} purchase${payments.length === 1 ? "" : "s"}`}
          Icon={Wallet}
          tone="rose"
          href="/purchases"
        />
      </div>

      {/* Quick actions + recent activity */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Quick actions */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 lg:col-span-1">
          <h2 className="font-semibold">Quick actions</h2>
          <div className="mt-4 space-y-2">
            <QuickLink href="/buy" Icon={ShoppingCart} label="Buy more keys" />
            <QuickLink href="/download" Icon={Download} label="Download the app" />
            <QuickLink href="/licenses" Icon={KeyRound} label="View my licenses" />
            <QuickLink href="/devices" Icon={MonitorSmartphone} label="Manage devices" />
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent activity</h2>
            <Link
              href="/activity"
              className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {feed.length === 0 ? (
            <div className="mt-6 flex flex-col items-center py-6 text-center">
              <ActivityIcon className="h-8 w-8 text-ink/20" />
              <p className="mt-2 text-sm text-ink/50">
                No activity yet. Buy a key and activate the app to get started.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {feed.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                      f.kind === "payment" ? "bg-rose-400" : "bg-teal-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink/80">{f.label}</p>
                    <p className="text-xs text-ink/40">
                      {fmtTsTime({ seconds: f.ts })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function QuickLink({
  href,
  Icon,
  label,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-black/[0.06] px-3.5 py-3 text-sm font-medium text-ink/75 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
    >
      <Icon className="h-5 w-5" />
      {label}
      <ArrowRight className="ml-auto h-4 w-4 text-ink/30" />
    </Link>
  );
}
