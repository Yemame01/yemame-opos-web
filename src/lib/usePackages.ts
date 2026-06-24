"use client";

import { useEffect, useState } from "react";
import { Package } from "./types";

// The project id is public (it's in every Firestore URL). Fall back to the
// constant so the store's pricing always loads even if the env var is missing
// from a deploy — packages are a public read and must never silently vanish.
const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "yemame-opos";

// One Firestore REST value (map field) → a Package.
function pkgFromMap(m: Record<string, Record<string, unknown>>): Package {
  const num = (v?: Record<string, unknown>) =>
    v ? Number((v.integerValue ?? v.doubleValue ?? 0) as string) : 0;
  return {
    id: (m.id?.stringValue as string) ?? "",
    name: (m.name?.stringValue as string) ?? "",
    activations: num(m.activations),
    priceMinor: num(m.priceMinor),
    currency: (m.currency?.stringValue as string) ?? "GHS",
    active: m.active?.booleanValue === true,
    sortOrder: num(m.sortOrder),
  };
}

/**
 * Load active store packages from adminConfig/general.packages via the Firestore
 * REST API (public read; no auth, no client-SDK streaming transport — works on
 * any network). Sorted in JS.
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
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/adminConfig/general`;
    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as {
          fields?: {
            packages?: {
              arrayValue?: {
                values?: { mapValue?: { fields?: Record<string, Record<string, unknown>> } }[];
              };
            };
          };
        };
        const values = data.fields?.packages?.arrayValue?.values ?? [];
        const rows = values
          .map((v) => pkgFromMap(v.mapValue?.fields ?? {}))
          .filter((p) => p.id && p.active)
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
