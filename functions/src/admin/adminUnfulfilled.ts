// functions/src/admin/adminUnfulfilled.ts
//
// Admin tool: find SUCCESSFUL Paystack charges that never minted a license
// (charged-but-no-key). Lists recent successful transactions from Paystack and
// flags any whose reference has no payments/{ref} record on our side — i.e. the
// webhook was missed/mis-routed. Pair with adminReissueByReference to fix each.

import { HttpsError, onCall, CallableRequest } from "firebase-functions/v2/https";
import { heavyHttpOptions } from "../config/options";
import { withErrorReport } from "../services/hubNotify";
import { getDb } from "../utils/db";
import { listSuccessfulTransactions } from "../webhooks/paystack/verifyTransaction";

interface UnfulfilledPayment {
  reference: string;
  email: string;
  amountMinor: number;
  paidAt: string | null;
  /** Whether the txn carries the metadata needed for an automatic reissue. */
  reissuable: boolean;
  uid: string | null;
  packageId: string | null;
}

export const adminListUnfulfilledPayments = onCall(
  heavyHttpOptions,
  withErrorReport(
    "adminListUnfulfilledPayments",
    async (request: CallableRequest) => {
      if (!request.auth?.uid || request.auth?.token?.admin !== true) {
        throw new HttpsError("permission-denied", "Admin access required.");
      }
      const perPage = Math.min(
        Number((request.data as { perPage?: number })?.perPage) || 100,
        200,
      );

      const db = getDb();
      const txns = await listSuccessfulTransactions(perPage);

      // Only consider OPOS license purchases. Older/mis-routed charges may lack
      // metadata entirely — we still surface them (reissuable=false) so an admin
      // can investigate, but skip charges clearly tagged for another product.
      const candidates = txns.filter((t) => {
        const type = t.metadata?.type;
        const product = t.metadata?.product;
        if (product && product !== "opos") return false;
        if (type && type !== "opos_license") return false;
        return true;
      });

      // Check each reference against our minted payments in parallel.
      const checks = await Promise.all(
        candidates.map(async (t) => {
          const exists = (
            await db.collection("payments").doc(t.reference).get()
          ).exists;
          return { t, exists };
        }),
      );

      const unfulfilled: UnfulfilledPayment[] = checks
        .filter((c) => !c.exists)
        .map(({ t }) => ({
          reference: t.reference,
          email: t.customer?.email ?? "",
          amountMinor: t.amount,
          paidAt: t.paid_at ?? null,
          reissuable: Boolean(t.metadata?.uid && t.metadata?.packageId),
          uid: t.metadata?.uid ?? null,
          packageId: t.metadata?.packageId ?? null,
        }));

      return {
        scanned: txns.length,
        candidates: candidates.length,
        unfulfilledCount: unfulfilled.length,
        unfulfilled,
      };
    },
  ),
);
