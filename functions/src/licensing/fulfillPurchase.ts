// functions/src/licensing/fulfillPurchase.ts
//
// Single source of truth for turning a VERIFIED Paystack payment into an OPOS
// license. Shared by THREE callers so the security checks live in one place:
//   1. the Paystack webhook (charge.success) — the primary path,
//   2. the payment callback (fallback-mint, so a missed webhook never leaves a
//      paying buyer empty-handed),
//   3. the admin "reissue by reference" tool.
//
// Discipline (mirrors the original chargeSuccess handler):
//   - IDEMPOTENCY: skip if payments/{reference} already exists (so webhook +
//     callback + admin can all run for the same ref with no double-mint).
//   - AMOUNT VALIDATION: recompute the expected price from
//     adminConfig/general.packages server-side; mismatch → reject + log.
//   - DUAL RECORD: global payments/{ref} + users/{uid}/payments/{ref}.
//   - ISSUE: generate the key + write the license (per-user + global mirror).

import * as admin from "firebase-admin";
import { getDb, logAdmin } from "../utils/db";
import { getPackage } from "../config/packages";
import { issueLicense } from "./issueLicense";

/** The subset of a Paystack transaction (webhook event.data OR verify data). */
export interface VerifiedPaystackData {
  status: string;
  reference: string;
  amount: number; // minor units
  paid_at?: string;
  channel?: string;
  currency?: string;
  gateway_response?: string;
  fees?: number;
  metadata?: {
    uid?: string;
    packageId?: string;
    type?: string;
    [key: string]: unknown;
  };
  customer?: { email?: string; customer_code?: string };
}

export type FulfillOutcome =
  | { status: "issued"; licenseId: string; key: string }
  | { status: "duplicate"; licenseId?: string }
  | { status: "rejected"; reason: string };

/**
 * Idempotently fulfill a verified payment. Safe to call from webhook, callback,
 * or admin — only the FIRST caller for a given reference mints; the rest no-op.
 * `caller` is recorded for traceability ("webhook" | "callback" | "admin").
 */
export async function fulfillLicensePurchase(
  data: VerifiedPaystackData,
  caller: "webhook" | "callback" | "admin",
): Promise<FulfillOutcome> {
  const db = getDb();
  const { reference, amount, metadata, customer } = data;
  const email = customer?.email ?? "";

  // Only OPOS license payments.
  if (metadata?.type && metadata.type !== "opos_license") {
    return { status: "rejected", reason: "not_opos_license" };
  }

  // Only a truly successful charge mints.
  if (data.status !== "success") {
    return { status: "rejected", reason: `status_${data.status}` };
  }

  const uid = metadata?.uid;
  const packageId = metadata?.packageId;
  if (!uid || !packageId) {
    await logAdmin("security", "missing_metadata", {
      reference,
      email,
      caller,
      metadata: metadata || {},
    });
    return { status: "rejected", reason: "missing_metadata" };
  }

  // ---------- IDEMPOTENCY ----------
  const paymentRef = db.collection("payments").doc(reference);
  const existing = await paymentRef.get();
  if (existing.exists) {
    return {
      status: "duplicate",
      licenseId: existing.get("licenseId") as string | undefined,
    };
  }

  // ---------- AMOUNT VALIDATION ----------
  const pkg = await getPackage(packageId);
  if (!pkg) {
    await logAdmin("security", "unknown_package", { reference, packageId, caller });
    return { status: "rejected", reason: "unknown_package" };
  }
  const expectedMinor = Number(pkg.priceMinor) || 0;
  const activations = Number(pkg.activations) || 0;
  if (expectedMinor <= 0) {
    await logAdmin("security", "package_unpriced", { reference, packageId, caller });
    return { status: "rejected", reason: "package_unpriced" };
  }
  if (Math.abs(amount - expectedMinor) > 1) {
    await logAdmin("security", "payment_amount_mismatch", {
      reference,
      uid,
      packageId,
      expectedMinor,
      receivedMinor: amount,
      caller,
    });
    return { status: "rejected", reason: "amount_mismatch" };
  }
  if (activations <= 0) {
    await logAdmin("security", "package_misconfigured", {
      reference,
      packageId,
      caller,
    });
    return { status: "rejected", reason: "package_misconfigured" };
  }

  // ---------- ISSUE LICENSE ----------
  const issued = await issueLicense({
    ownerUid: uid,
    packageId,
    maxActivations: activations,
    buyerEmail: email,
    paymentRef: reference,
    source: "purchase",
  });

  // ---------- RECORD PAYMENT (dual write) ----------
  const paymentData = {
    reference,
    ownerUid: uid,
    email,
    amountMinor: amount,
    currency: data.currency ?? "GHS",
    channel: data.channel ?? "",
    status: "success" as const,
    paidAt: data.paid_at
      ? admin.firestore.Timestamp.fromDate(new Date(data.paid_at))
      : admin.firestore.FieldValue.serverTimestamp(),
    packageId,
    licenseId: issued.licenseId,
    type: "opos_license",
    paystackCustomerCode: customer?.customer_code ?? "",
    gatewayResponse: data.gateway_response ?? "",
    feesMinor: data.fees ?? 0,
    validated: true,
    expectedMinor,
    fulfilledBy: caller,
    metadata: metadata || {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const batch = db.batch();
  batch.set(paymentRef, paymentData);
  batch.set(
    db.collection("users").doc(uid).collection("payments").doc(reference),
    paymentData,
  );
  await batch.commit();

  await logAdmin("payments", "license_issued", {
    reference,
    uid,
    packageId,
    licenseId: issued.licenseId,
    amountMinor: amount,
    caller,
  });

  console.log(
    `[fulfill:${caller}] Issued license ${issued.licenseId} for ${uid} (${reference})`,
  );
  return { status: "issued", licenseId: issued.licenseId, key: issued.key };
}
