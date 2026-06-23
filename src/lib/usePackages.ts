"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { firebaseReady, requireDb } from "./firebase";
import { Package } from "./types";

/** Load active packages, ordered for display. */
export function usePackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const snap = await getDocs(
          query(
            collection(requireDb(), "packages"),
            where("active", "==", true),
            orderBy("sortOrder", "asc"),
          ),
        );
        setPackages(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Package),
        );
      } catch {
        setError("Couldn't load packages. Please refresh.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { packages, loading, error };
}
