"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Apple,
  Monitor,
  Download,
  ShieldCheck,
  WifiOff,
  Sparkles,
  Wrench,
  Gauge,
  Loader2,
} from "lucide-react";
import {
  useReleases,
  detectOS,
  fmtBytes,
  fmtDate,
  type Release,
  type PlatformFile,
} from "@/lib/useReleases";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";

const PLATFORMS = {
  macos: { label: "macOS", Icon: Apple, hint: ".dmg · macOS 11+" },
  windows: { label: "Windows", Icon: Monitor, hint: ".exe · Windows 10+" },
} as const;

export default function DownloadClient() {
  const { releases, latest, loading, error } = useReleases();
  const [os, setOs] = useState<"macos" | "windows" | "other">("other");

  useEffect(() => {
    setOs(detectOS());
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-28">
      {/* ── Hero ─────────────────────────────────────────── */}
      <Reveal className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-700">
          <WifiOff className="h-3.5 w-3.5" /> Works with no internet
        </span>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Download Yemame OPOS
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-ink/60">
          Install once on your Windows PC or Mac, enter your activation key, and
          start selling — online or completely offline.
        </p>
      </Reveal>

      {/* ── Download cards ───────────────────────────────── */}
      <div className="mt-10">
        {loading ? (
          <div className="flex justify-center py-12 text-ink/50">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {error}
          </p>
        ) : !latest || (!latest.macos && !latest.windows) ? (
          <div className="card p-8 text-center">
            <Download className="mx-auto h-10 w-10 text-ink/30" />
            <p className="mt-3 font-semibold">Downloads are on the way</p>
            <p className="mt-1 text-sm text-ink/60">
              The desktop app is being prepared. Check back shortly — or{" "}
              <Link href="/buy" className="font-medium text-teal-600">
                get your activation key
              </Link>{" "}
              now so you&apos;re ready.
            </p>
          </div>
        ) : (
          <DownloadCards latest={latest} os={os} />
        )}
      </div>

      {/* trust row */}
      {latest && (
        <Reveal className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm text-ink/55">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-teal-500" /> Buy once, no monthly
            fees
          </span>
          <span className="inline-flex items-center gap-1.5">
            <WifiOff className="h-4 w-4 text-teal-500" /> Runs fully offline
          </span>
          <span>Latest: v{latest.version}</span>
        </Reveal>
      )}

      {/* ── Changelog timeline ───────────────────────────── */}
      {releases.length > 0 && (
        <section className="mt-20">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight">What&apos;s new</h2>
            <p className="mt-1 text-ink/55">
              Every version, what changed, and the installers.
            </p>
          </Reveal>

          <div className="mt-8 space-y-5">
            {releases.map((r, i) => (
              <Reveal key={r.version} delay={Math.min(i * 0.05, 0.2)}>
                <ReleaseCard r={r} isLatest={i === 0} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function DownloadCards({
  latest,
  os,
}: {
  latest: Release;
  os: "macos" | "windows" | "other";
}) {
  // Order so the user's detected OS comes first.
  const order: ("macos" | "windows")[] =
    os === "windows" ? ["windows", "macos"] : ["macos", "windows"];

  return (
    <Stagger className="grid gap-4 sm:grid-cols-2">
      {order.map((key) => {
        const file = latest[key];
        const { label, Icon, hint } = PLATFORMS[key];
        const primary = key === os;
        return (
          <StaggerItem key={key}>
            <div
              className={`card flex h-full flex-col p-6 transition-all ${
                primary ? "ring-2 ring-teal-500/60" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                  <Icon className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold">{label}</h3>
                  <p className="text-xs text-ink/50">{hint}</p>
                </div>
                {primary && (
                  <span className="ml-auto rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                    Your device
                  </span>
                )}
              </div>

              {file ? (
                <>
                  <a
                    href={file.url}
                    className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold transition-all hover:-translate-y-0.5 ${
                      primary
                        ? "bg-teal-600 text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700"
                        : "border border-teal-200 text-teal-700 hover:bg-teal-50"
                    }`}
                  >
                    <Download className="h-5 w-5" />
                    Download v{latest.version}
                  </a>
                  <p className="mt-3 text-xs text-ink/45">
                    {[fmtBytes(file.sizeBytes), `released ${fmtDate(latest.releaseDate)}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </>
              ) : (
                <p className="mt-5 rounded-lg bg-black/[0.03] px-4 py-3 text-sm text-ink/50">
                  Not available for {label} yet.
                </p>
              )}
            </div>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

function ReleaseCard({ r, isLatest }: { r: Release; isLatest: boolean }) {
  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-lg font-bold">v{r.version}</span>
        {isLatest && (
          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
            Latest
          </span>
        )}
        <span className="text-sm text-ink/45">{fmtDate(r.releaseDate)}</span>
        <span className="ml-auto flex items-center gap-2 text-ink/40">
          {r.macos && <Apple className="h-4 w-4" />}
          {r.windows && <Monitor className="h-4 w-4" />}
        </span>
      </div>

      {r.summary && (
        <p className="mt-2 font-medium text-ink/80">{r.summary}</p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <ChangeGroup Icon={Sparkles} label="New" tone="text-teal-600" items={r.whatsNew} />
        <ChangeGroup Icon={Wrench} label="Fixes" tone="text-amber-600" items={r.fixes} />
        <ChangeGroup Icon={Gauge} label="Improvements" tone="text-indigo-600" items={r.improvements} />
      </div>

      {/* per-version downloads */}
      {(r.macos || r.windows) && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-black/[0.06] pt-4">
          {r.macos && <VersionDownload Icon={Apple} label="macOS" file={r.macos} />}
          {r.windows && (
            <VersionDownload Icon={Monitor} label="Windows" file={r.windows} />
          )}
        </div>
      )}
    </div>
  );
}

function ChangeGroup({
  Icon,
  label,
  tone,
  items,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: string;
  items: string[];
}) {
  if (!items.length) return null;
  return (
    <div>
      <p className={`flex items-center gap-1.5 text-xs font-semibold ${tone}`}>
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <ul className="mt-1.5 space-y-1 text-sm text-ink/70">
        {items.map((it, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-ink/30">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VersionDownload({
  Icon,
  label,
  file,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  file: PlatformFile;
}) {
  return (
    <a
      href={file.url}
      className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3.5 py-1.5 text-sm font-medium text-ink/70 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
    >
      <Icon className="h-4 w-4" />
      {label}
      <span className="text-xs text-ink/40">{fmtBytes(file.sizeBytes)}</span>
    </a>
  );
}
