"use client";

import { useState } from "react";
import {
  MonitorSmartphone,
  Apple,
  Monitor,
  Loader2,
  LogOut,
} from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { requireFunctions } from "@/lib/firebase";
import { useLicenses, useDevices } from "@/lib/useAccount";
import { Activation } from "@/lib/types";
import {
  PageHeader,
  EmptyState,
  fmtTsTime,
} from "@/components/account/ui";

export default function DevicesPage() {
  const { licenses } = useLicenses();
  const { devices, loading } = useDevices(licenses);

  const active = devices.filter((d) => d.active);
  const inactive = devices.filter((d) => !d.active);

  return (
    <>
      <PageHeader
        title="Devices"
        subtitle="Computers activated with your keys. Release a device to free up a slot."
      />

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-black/[0.06] bg-white"
            />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <EmptyState
          Icon={MonitorSmartphone}
          title="No devices activated"
          body="When you enter a key in Yemame OPOS on a computer, it shows up here."
          cta={{ label: "Download the app", href: "/download" }}
        />
      ) : (
        <div className="space-y-6">
          <DeviceGroup title="Active" devices={active} canRelease />
          {inactive.length > 0 && (
            <DeviceGroup title="Released" devices={inactive} />
          )}
        </div>
      )}
    </>
  );
}

function DeviceGroup({
  title,
  devices,
  canRelease,
}: {
  title: string;
  devices: Activation[];
  canRelease?: boolean;
}) {
  if (devices.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/40">
        {title} ({devices.length})
      </p>
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
        {devices.map((d, i) => (
          <DeviceRow
            key={d.id}
            device={d}
            canRelease={canRelease}
            last={i === devices.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function DeviceRow({
  device,
  canRelease,
  last,
}: {
  device: Activation;
  canRelease?: boolean;
  last: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [released, setReleased] = useState(false);
  const [err, setErr] = useState("");

  const release = async () => {
    if (!confirm("Release this device? It frees a slot; the app will need to re-activate.")) {
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const fn = httpsCallable(requireFunctions(), "deactivateDevice");
      await fn({ licenseId: device.licenseId, deviceId: device.deviceId });
      setReleased(true);
    } catch {
      setErr("Couldn't release this device. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-3 px-4 py-3.5 ${
        last ? "" : "border-b border-black/[0.05]"
      } ${released ? "opacity-50" : ""}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/[0.03]">
        {device.platform === "macos" ? (
          <Apple className="h-5 w-5 text-ink/60" />
        ) : (
          <Monitor className="h-5 w-5 text-ink/60" />
        )}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {device.deviceLabel || device.deviceId}
        </p>
        <p className="text-xs text-ink/45">
          {device.platform || "—"}
          {device.appVersion ? ` · v${device.appVersion}` : ""} · activated{" "}
          {fmtTsTime(device.activatedAt)}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <code className="hidden text-xs text-ink/35 sm:block">
          {device.licenseKey}
        </code>
        {canRelease && !released && (
          <button
            onClick={release}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-ink/70 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Release
          </button>
        )}
        {released && <span className="text-xs text-teal-600">Released ✓</span>}
      </div>
      {err && <p className="w-full text-xs text-red-600">{err}</p>}
    </div>
  );
}
