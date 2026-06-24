"use client";

import {
  Activity as ActivityIcon,
  MonitorSmartphone,
  Receipt,
  KeyRound,
} from "lucide-react";
import { useLicenses, usePayments, useDevices } from "@/lib/useAccount";
import { formatMoneyMinor } from "@/lib/types";
import { PageHeader, EmptyState, fmtTsTime } from "@/components/account/ui";

type Event = {
  ts: number;
  kind: "device" | "payment" | "license";
  title: string;
  detail: string;
};

export default function ActivityPage() {
  const { licenses, loading: lLoading } = useLicenses();
  const { payments, loading: pLoading } = usePayments();
  const { devices, loading: dLoading } = useDevices(licenses);
  const loading = lLoading || pLoading || dLoading;

  const events: Event[] = [
    ...devices.map((d) => ({
      ts: d.activatedAt?.seconds ?? 0,
      kind: "device" as const,
      title: `Activated ${d.deviceLabel || d.deviceId}`,
      detail: `${d.platform || "device"}${d.appVersion ? ` · v${d.appVersion}` : ""} · key ${d.licenseKey || ""}`,
    })),
    ...payments.map((p) => ({
      ts: p.paidAt?.seconds ?? 0,
      kind: "payment" as const,
      title: `Purchased a key`,
      detail: `${formatMoneyMinor(p.amountMinor, p.currency)} · ${p.channel || "payment"} · ${p.reference}`,
    })),
    ...licenses.map((l) => ({
      ts: l.createdAt?.seconds ?? 0,
      kind: "license" as const,
      title: `License issued`,
      detail: `${l.key} · ${l.maxActivations} activation${l.maxActivations === 1 ? "" : "s"}`,
    })),
  ]
    .filter((e) => e.ts)
    .sort((a, b) => b.ts - a.ts);

  const icon = {
    device: MonitorSmartphone,
    payment: Receipt,
    license: KeyRound,
  };
  const tone = {
    device: "bg-teal-50 text-teal-600",
    payment: "bg-rose-50 text-rose-600",
    license: "bg-amber-50 text-amber-600",
  };

  return (
    <>
      <PageHeader
        title="Activity"
        subtitle="Everything that's happened on your account — purchases and device activations."
      />

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-black/[0.06] bg-white" />
      ) : events.length === 0 ? (
        <EmptyState
          Icon={ActivityIcon}
          title="Nothing here yet"
          body="Buy a key and activate the app — your account activity will appear here."
          cta={{ label: "Buy a key", href: "/buy" }}
        />
      ) : (
        <div className="rounded-2xl border border-black/[0.06] bg-white p-2">
          <ol className="relative">
            {events.map((e, i) => {
              const Icon = icon[e.kind];
              return (
                <li key={i} className="flex gap-4 px-3 py-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${tone[e.kind]}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    {i < events.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-black/[0.06]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pb-2">
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="truncate text-xs text-ink/50">{e.detail}</p>
                    <p className="mt-0.5 text-xs text-ink/35">
                      {fmtTsTime({ seconds: e.ts })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </>
  );
}
