"use client";

import { useEffect, useState } from "react";

// Public read of the OPOS release history written by the Hub admin to the
// yemame-opos Storage bucket (releases/opos/history.json). Public-read by
// storage rules, so no auth needed — works straight from the browser.

const BUCKET = "yemame-opos.firebasestorage.app";
const HISTORY_URL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(
  "releases/opos/history.json",
)}?alt=media`;

export interface PlatformFile {
  url: string;
  sizeBytes: number;
  sha256: string;
  fileName: string;
  uploadedAt: string;
}

export interface Release {
  version: string;
  releaseDate: string;
  summary: string;
  whatsNew: string[];
  fixes: string[];
  improvements: string[];
  macos?: PlatformFile;
  windows?: PlatformFile;
  updatedAt: string;
}

export function useReleases() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(HISTORY_URL, { cache: "no-store" });
        if (!res.ok) {
          // 404 = no releases published yet — not an error state to shout about.
          if (res.status === 404) {
            setReleases([]);
            return;
          }
          throw new Error(String(res.status));
        }
        const data = (await res.json()) as Release[];
        // Defensive: ensure newest-first by semver.
        const sorted = [...(data ?? [])].sort((a, b) => {
          const pa = a.version.split(".").map(Number);
          const pb = b.version.split(".").map(Number);
          for (let i = 0; i < 3; i++) {
            if ((pb[i] || 0) !== (pa[i] || 0)) return (pb[i] || 0) - (pa[i] || 0);
          }
          return 0;
        });
        setReleases(sorted);
      } catch {
        setError("Couldn't load releases. Please refresh.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { releases, latest: releases[0], loading, error };
}

/** Best-effort OS detection for the primary download button. */
export function detectOS(): "macos" | "windows" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = `${navigator.userAgent} ${navigator.platform}`.toLowerCase();
  if (ua.includes("mac") || ua.includes("iphone") || ua.includes("ipad"))
    return "macos";
  if (ua.includes("win")) return "windows";
  return "other";
}

export function fmtBytes(b?: number): string {
  if (!b) return "";
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function fmtDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
