"use client";

// Shared account data for the signed-in buyer: licenses, devices (activations
// across all keys), and payments. All owner-scoped reads allowed by the rules.
import { useEffect, useState } from "react";
import {
  collection,
  collectionGroup,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { firebaseReady, requireDb } from "./firebase";
import { useAuth } from "./useAuth";
import { License, Activation, Payment } from "./types";

export function useLicenses() {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !firebaseReady) return;
    const unsub = onSnapshot(
      query(
        collection(requireDb(), "users", user.uid, "licenses"),
        orderBy("createdAt", "desc"),
      ),
      (snap) => {
        setLicenses(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as License));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [user]);

  return { licenses, loading };
}

export function usePayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !firebaseReady) return;
    const unsub = onSnapshot(
      query(
        collection(requireDb(), "users", user.uid, "payments"),
        orderBy("paidAt", "desc"),
      ),
      (snap) => {
        setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [user]);

  return { payments, loading };
}

/**
 * Devices across ALL of the user's licenses. Activations live under the global
 * mirror (licenses/{id}/activations); a collectionGroup query with an ownerUid
 * filter on the parent isn't directly possible, so we read activations per
 * license. We get the license list first, then subscribe to each one's devices.
 */
export function useDevices(licenses: License[]) {
  const [devices, setDevices] = useState<Activation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseReady || licenses.length === 0) {
      setDevices([]);
      setLoading(false);
      return;
    }
    const byLicense = new Map<string, Activation[]>();
    const unsubs = licenses.map((lic) =>
      onSnapshot(
        collection(requireDb(), "licenses", lic.id, "activations"),
        (snap) => {
          byLicense.set(
            lic.id,
            snap.docs.map(
              (d) =>
                ({
                  id: d.id,
                  ...d.data(),
                  licenseId: lic.id,
                  licenseKey: lic.key,
                }) as Activation,
            ),
          );
          // Flatten all licenses' devices, newest first.
          const all = Array.from(byLicense.values()).flat();
          all.sort(
            (a, b) =>
              (b.activatedAt?.seconds ?? 0) - (a.activatedAt?.seconds ?? 0),
          );
          setDevices(all);
          setLoading(false);
        },
        () => setLoading(false),
      ),
    );
    return () => unsubs.forEach((u) => u());
  }, [licenses]);

  return { devices, loading };
}

// Re-export so pages can import from one place.
export { collectionGroup, where };
