// functions/src/webhooks/paystack/handlers/chargeSuccess.ts
//
// On a verified `charge.success`, mint an OPOS license. Mirrors yemame-pos's
// charge-success discipline:
//   1. IDEMPOTENCY — skip if payments/{reference} already exists.
//   2. AMOUNT VALIDATION — recompute the expected price from
//      adminConfig/general.packages server-side; a mismatch is a security
//      incident → log + reject (never trust the client-sent amount).
//   3. DUAL RECORD — global payments/{ref} (audit) + users/{uid}/payments/{ref}.
//   4. ISSUE — generate the key + write the license (per-user + global mirror).
//
// Prices live in adminConfig/general.packages[].priceMinor (minor units),
// admin-managed via Hub. A 0-price package is "not sellable" and never mints.

import * as admin from "firebase-admin";
import { PaystackWebhookEvent } from "../types";
import { getDb, logAdmin } from "../../../utils/db";
import { getPackage } from "../../../config/packages";
import { issueLicense } from "../../../licensing/issueLicense";
import { notifyHub, reportServerError } from "../../../services/hubNotify";

export async function handleChargeSuccess(
  event: PaystackWebhookEvent,
): Promise<void> {
  const { data } = event;
  const { reference, amount, metadata, customer, paid_at } = data;

  // OPOS only mints licenses; ignore any other product's events that might share
  // the webhook (defensive — this project is standalone, but be explicit).
  if (metadata?.type && metadata.type !== "opos_license") {
    console.log(`[Paystack] Ignoring non-OPOS event type: ${metadata.type}`);
    return;
  }

  // Defense in depth: only a truly successful charge mints a license. The event
  // name is charge.success, but confirm the data status too — never issue on a
  // non-success payload.
  if (data.status !== "success") {
    console.warn(`[Paystack] Non-success status '${data.status}' for ${reference}`);
    return;
  }

  const db = getDb();

  try {
    const uid = metadata?.uid;
    const packageId = metadata?.packageId;
    if (!uid || !packageId) {
      console.error("[Paystack] Missing uid/packageId in metadata", {
        reference,
      });
      await logAdmin("security", "missing_metadata", {
        reference,
        email: customer.email,
        metadata: metadata || {},
      });
      return;
    }

    // ---------- 1. IDEMPOTENCY ----------
    const paymentRef = db.collection("payments").doc(reference);
    if ((await paymentRef.get()).exists) {
      console.warn(`[Paystack] Duplicate payment ${reference} — skipping`);
      return;
    }

    // ---------- 2. AMOUNT VALIDATION (server-side price from adminConfig) ----------
    const pkg = await getPackage(packageId);
    if (!pkg) {
      console.error(`[Paystack] Unknown package ${packageId}`);
      await logAdmin("security", "unknown_package", { reference, packageId });
      return;
    }
    const expectedMinor = Number(pkg.priceMinor) || 0;
    const activations = Number(pkg.activations) || 0;

    // Never mint for an unpriced (placeholder) package, even if a 0 charge
    // somehow arrived — a 0-price package must not yield a free license.
    if (expectedMinor <= 0) {
      console.error(`[Paystack] Package ${packageId} has no price set`);
      await logAdmin("security", "package_unpriced", { reference, packageId });
      return;
    }

    // Allow 1 minor-unit tolerance for rounding (matches POS).
    if (Math.abs(amount - expectedMinor) > 1) {
      console.error("[Paystack] SECURITY: amount mismatch", {
        reference,
        expectedMinor,
        received: amount,
        packageId,
      });
      await logAdmin("security", "payment_amount_mismatch", {
        reference,
        uid,
        packageId,
        expectedMinor,
        receivedMinor: amount,
      });
      return; // reject — do NOT issue
    }

    if (activations <= 0) {
      console.error(`[Paystack] Package ${packageId} has no activations`);
      await logAdmin("security", "package_misconfigured", {
        reference,
        packageId,
      });
      return;
    }

    // ---------- 4. ISSUE LICENSE ----------
    // Bind the buyer's email to the license; activation requires it + the key.
    const issued = await issueLicense({
      ownerUid: uid,
      packageId,
      maxActivations: activations,
      buyerEmail: customer.email,
      paymentRef: reference,
      source: "purchase",
    });

    // ---------- 3. RECORD PAYMENT (dual write) ----------
    const paymentData = {
      reference,
      ownerUid: uid,
      email: customer.email,
      amountMinor: amount,
      currency: data.currency,
      channel: data.channel,
      status: "success" as const,
      paidAt: admin.firestore.Timestamp.fromDate(new Date(paid_at)),
      packageId,
      licenseId: issued.licenseId,
      type: "opos_license",
      paystackCustomerCode: customer.customer_code,
      gatewayResponse: data.gateway_response ?? "",
      feesMinor: data.fees ?? 0,
      validated: true,
      expectedMinor,
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
    });

    // Best-effort admin alert (no-ops until Hub key is set).
    void notifyHub({
      title: "OPOS license sold",
      body: `${customer.email} bought ${activations} activations.`,
      type: "payment",
      data: { reference, licenseId: issued.licenseId, packageId },
    });

    console.log(
      `[Paystack] Issued license ${issued.licenseId} for ${uid} (${reference})`,
    );
  } catch (error) {
    console.error("[Paystack] chargeSuccess error:", error);
    reportServerError("Paystack chargeSuccess", error, {
      reference,
      email: customer.email,
    });
    throw error; // let the entry return 500 so Paystack retries
  }
}
