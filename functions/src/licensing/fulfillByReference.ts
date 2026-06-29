// functions/src/licensing/fulfillByReference.ts
//
// Fallback fulfillment by Paystack reference — covers the case where the
// charge.success webhook never arrived (so a buyer paid but got no license).
//
//   fulfillPaymentByReference  — buyer self-service. Auth-gated; the caller may
//     only fulfill a payment whose metadata.uid is THEIR OWN uid. Re-verifies
//     with Paystack server-side, then runs the shared idempotent fulfillment.
//   adminReissueByReference    — admin tool to make a tester whole: fulfill any
//     reference regardless of caller (still re-verified with Paystack).
//
// Both are idempotent via fulfillLicensePurchase (skip if payments/{ref} exists),
// so they're safe to run even if the webhook later/also fires.

import { HttpsError, onCall, CallableRequest } from "firebase-functions/v2/https";
import { heavyHttpOptions } from "../config/options";
import { withErrorReport } from "../services/hubNotify";
import { verifyPaystackTransaction } from "../webhooks/paystack/verifyTransaction";
import { fulfillLicensePurchase } from "./fulfillPurchase";
import { logAdmin } from "../utils/db";

/** Buyer-facing: fulfill MY payment by reference (e.g. webhook was missed). */
export const fulfillPaymentByReference = onCall(
  heavyHttpOptions,
  withErrorReport(
    "fulfillPaymentByReference",
    async (request: CallableRequest) => {
      const uid = request.auth?.uid;
      if (!uid) {
        throw new HttpsError("unauthenticated", "Sign in to continue.");
      }
      const reference = String(
        (request.data as { reference?: string })?.reference ?? "",
      ).trim();
      if (!reference) {
        throw new HttpsError("invalid-argument", "reference is required.");
      }

      const data = await verifyPaystackTransaction(reference);

      // The caller may only fulfill their OWN payment (uid baked into metadata
      // at checkout from the verified ID token — can't be spoofed).
      if (data.metadata?.uid && data.metadata.uid !== uid) {
        throw new HttpsError(
          "permission-denied",
          "This payment doesn't belong to your account.",
        );
      }

      const outcome = await fulfillLicensePurchase(data, "callback");
      if (outcome.status === "rejected") {
        // Don't leak internal reasons to the buyer; log for admins.
        await logAdmin("payments", "fulfill_rejected", {
          reference,
          uid,
          reason: outcome.reason,
        });
        throw new HttpsError(
          "failed-precondition",
          "We couldn't confirm this purchase. Please contact support.",
        );
      }
      return outcome; // { issued | duplicate }
    },
  ),
);

/** Admin: reissue/fulfill any reference (make a tester whole). */
export const adminReissueByReference = onCall(
  heavyHttpOptions,
  withErrorReport(
    "adminReissueByReference",
    async (request: CallableRequest) => {
      const adminUid = request.auth?.uid;
      if (!adminUid || request.auth?.token?.admin !== true) {
        throw new HttpsError("permission-denied", "Admin access required.");
      }
      const reference = String(
        (request.data as { reference?: string })?.reference ?? "",
      ).trim();
      if (!reference) {
        throw new HttpsError("invalid-argument", "reference is required.");
      }

      const data = await verifyPaystackTransaction(reference);
      const outcome = await fulfillLicensePurchase(data, "admin");
      await logAdmin("licenses", "admin_reissue_by_reference", {
        reference,
        adminUid,
        outcome: outcome.status,
        licenseId: "licenseId" in outcome ? outcome.licenseId : null,
      });
      if (outcome.status === "rejected") {
        throw new HttpsError(
          "failed-precondition",
          `Could not fulfill: ${outcome.reason}`,
        );
      }
      return outcome;
    },
  ),
);
