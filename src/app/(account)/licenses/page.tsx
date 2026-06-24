"use client";

import { useState } from "react";
import {
  KeyRound,
  Copy,
  Check,
  Plus,
  ChevronDown,
  MonitorSmartphone,
  Apple,
  Monitor,
} from "lucide-react";
import { useLicenses, useDevices } from "@/lib/useAccount";
import { License, Activation } from "@/lib/types";
import {
  PageHeader,
  EmptyState,
  StatusBadge,
  fmtTs,
} from "@/components/account/ui";
import Link from "next/link";

export default function LicensesPage() {
  const { licenses, loading } = useLicenses();
  const { devices } = useDevices(licenses);

  return (
    <>
      <PageHeader
        title="My Licenses"
        subtitle="Your activation keys. Use a key in Yemame OPOS when you set up the app."
        action={
          <Link href="/buy" className="btn-primary">
            <Plus className="h-4 w-4" /> Buy a key
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-black/[0.06] bg-white"
            />
          ))}
        </div>
      ) : licenses.length === 0 ? (
        <EmptyState
          Icon={KeyRound}
          title="No licenses yet"
          body="Buy your first activation key to start using Yemame OPOS on your computer."
          cta={{ label: "Buy your first key", href: "/buy" }}
        />
      ) : (
        <div className="space-y-4">
          {licenses.map((lic) => (
            <LicenseCard
              key={lic.id}
              license={lic}
              devices={devices.filter((d) => d.licenseId === lic.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function LicenseCard({
  license,
  devices,
}: {
  license: License;
  devices: Activation[];
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const exhausted = license.activationsUsed >= license.maxActivations;
  const revoked = license.status === "revoked";
  const pct = Math.min(
    100,
    (license.activationsUsed / Math.max(1, license.maxActivations)) * 100,
  );

  const copy = async () => {
    await navigator.clipboard.writeText(license.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-teal-500" />
            <code className="truncate font-mono text-lg font-semibold tracking-wide">
              {license.key}
            </code>
          </div>
          <p className="mt-1 text-sm text-ink/50">
            {license.tier ? `${license.tier} · ` : ""}
            {license.maxActivations} activation
            {license.maxActivations === 1 ? "" : "s"} · created {fmtTs(license.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {revoked ? (
            <StatusBadge status="revoked" />
          ) : exhausted ? (
            <StatusBadge status="exhausted" />
          ) : (
            <StatusBadge status="active" />
          )}
          <button onClick={copy} className="btn-ghost shrink-0 px-3 py-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
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
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Devices toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 transition-colors hover:text-ink"
      >
        <MonitorSmartphone className="h-4 w-4" />
        {devices.length} device{devices.length === 1 ? "" : "s"} activated
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-2 border-t border-black/[0.06] pt-3">
          {devices.length === 0 ? (
            <p className="text-sm text-ink/45">
              No devices yet. Enter this key in Yemame OPOS to activate.
            </p>
          ) : (
            devices.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg bg-black/[0.02] px-3 py-2 text-sm"
              >
                {d.platform === "macos" ? (
                  <Apple className="h-4 w-4 text-ink/50" />
                ) : (
                  <Monitor className="h-4 w-4 text-ink/50" />
                )}
                <span className="font-medium">{d.deviceLabel || d.deviceId}</span>
                <span className="text-ink/40">
                  {d.platform || "—"}
                  {d.appVersion ? ` · v${d.appVersion}` : ""}
                </span>
                {!d.active && (
                  <span className="ml-auto text-xs text-ink/40">inactive</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
