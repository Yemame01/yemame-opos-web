"use client";

import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink/55">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  Icon,
  tone = "teal",
  href,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone?: "teal" | "amber" | "indigo" | "rose";
  href?: string;
}) {
  const tones: Record<string, string> = {
    teal: "bg-teal-50 text-teal-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
    rose: "bg-rose-50 text-rose-600",
  };
  const card = (
    <div className="h-full rounded-2xl border border-black/[0.06] bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/55">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink/45">{sub}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}

export function EmptyState({
  Icon,
  title,
  body,
  cta,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center">
      <Icon className="mx-auto h-10 w-10 text-ink/25" />
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink/55">{body}</p>
      {cta && (
        <Link href={cta.href} className="btn-primary mt-5 inline-flex">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-teal-50 text-teal-700",
    success: "bg-teal-50 text-teal-700",
    revoked: "bg-red-50 text-red-700",
    exhausted: "bg-amber-50 text-amber-700",
    pending: "bg-amber-50 text-amber-700",
    failed: "bg-red-50 text-red-700",
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        map[status] ?? "bg-black/5 text-ink/60"
      }`}
    >
      {label}
    </span>
  );
}

export function fmtTs(ts?: { seconds: number } | null): string {
  if (!ts?.seconds) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtTsTime(ts?: { seconds: number } | null): string {
  if (!ts?.seconds) return "—";
  return new Date(ts.seconds * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
