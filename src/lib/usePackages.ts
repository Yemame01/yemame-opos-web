"use client";

import { useEffect, useState } from "react";
import { Package } from "./types";

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Firestore REST value → JS. Handles the field shapes we use.
function fromRest(fields: Record<string, Record<string, unknown>>): Partial<Package> {
  const num = (v?: Record<string, unknown>) =>
    v ? Number((v.integerValue ?? v.doubleValue ?? 0) as string) : 0;
  return {
    name: (fields.name?.stringValue as string) ?? "",
    activations: num(fields.activations),
    priceMinor: num(fields.priceMinor),
    currency: (fields.currency?.stringValue as string) ?? "GHS",
    active: fields.active?.booleanValue === true,
    sortOrder: num(fields.sortOrder),
  };
}

/**
 * Load active store packages via the Firestore REST API (a plain fetch).
 * Packages are world-readable, so no auth is needed — and REST avoids the
 * client SDK's streaming transport, so it works on any network (and in
 * headless/SSR contexts). Sorted in JS; no composite index required.
 */
export function usePackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!PROJECT) {
      setLoading(false);
      return;
    }
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/packages?pageSize=100`;
    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as {
          documents?: { name: string; fields: Record<string, Record<string, unknown>> }[];
        };
        const rows: Package[] = (data.documents ?? [])
          .map((d) => ({
            id: d.name.split("/").pop() ?? "",
            ...fromRest(d.fields ?? {}),
          }) as Package)
          .filter((p) => p.active && p.priceMinor >= 0)
          .sort(
            (a, b) =>
              (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
              (a.activations ?? 0) - (b.activations ?? 0),
          );
        setPackages(rows);
      } catch {
        setError("Couldn't load packages. Please refresh.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { packages, loading, error };
}
