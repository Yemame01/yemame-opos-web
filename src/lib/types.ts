// src/lib/types.ts — shared store types.

export interface Package {
  id: string;
  name: string;
  activations: number;
  priceMinor: number; // GHS pesewas
  currency: string;
  active: boolean;
  sortOrder: number;
}

export interface License {
  id: string;
  key: string;
  ownerUid: string;
  productCode: string;
  tier: string;
  maxActivations: number;
  activationsUsed: number;
  status: "active" | "revoked";
  packageId: string;
  paymentRef?: string | null;
  source?: "purchase" | "manual";
  createdAt?: { seconds: number } | null;
  revokedReason?: string;
}

export interface Activation {
  id: string;
  deviceId: string;
  deviceLabel?: string;
  appVersion?: string;
  platform?: string;
  active: boolean;
  activatedAt?: { seconds: number } | null;
}

/** Format minor units (pesewas) as a GHS amount. */
export function formatMoneyMinor(minor: number, currency = "GHS"): string {
  const major = (Number(minor) || 0) / 100;
  const symbol = currency === "GHS" ? "₵" : "";
  return `${symbol}${major.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
