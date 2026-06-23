// functions/src/config/packages.ts
// Pricing lives in adminConfig/general.packages (admin-written via Hub, like POS).
// Single source of truth for reading a package server-side.
import { getDb } from "../utils/db";

export interface OposPackage {
  id: string;
  name: string;
  activations: number;
  priceMinor: number; // GHS pesewas
  currency: string;
  active: boolean;
  sortOrder: number;
}

/** Read all packages from adminConfig/general.packages. */
export async function getPackages(): Promise<OposPackage[]> {
  const snap = await getDb().doc("adminConfig/general").get();
  const arr = (snap.data()?.packages as unknown[]) ?? [];
  return arr
    .map((p) => {
      const o = (p ?? {}) as Record<string, unknown>;
      return {
        id: String(o.id ?? ""),
        name: String(o.name ?? ""),
        activations: Number(o.activations ?? 0),
        priceMinor: Number(o.priceMinor ?? 0),
        currency: String(o.currency ?? "GHS"),
        active: o.active === true,
        sortOrder: Number(o.sortOrder ?? 0),
      };
    })
    .filter((p) => p.id);
}

/** Find one package by id. */
export async function getPackage(id: string): Promise<OposPackage | null> {
  const all = await getPackages();
  return all.find((p) => p.id === id) ?? null;
}
