// functions/src/licensing/issueLicense.ts
//
// Creates a license document with a fresh key. Used by the Paystack webhook
// (after a verified payment) and by manual/admin issuance. Generates a unique
// key (retrying on the astronomically unlikely collision).

import * as admin from "firebase-admin";
import { getDb } from "../utils/db";
import { generateLicenseKey } from "./keygen";

export interface IssueLicenseParams {
  ownerUid: string;
  packageId: string;
  maxActivations: number;
  /**
   * The email the buyer used to purchase. Stored normalized (lowercased) and
   * checked at activation — the customer must enter THIS email + the key to
   * activate, so a leaked key alone can't be used.
   */
  buyerEmail: string;
  /** Paystack reference when paid; omitted for manual issuance. */
  paymentRef?: string;
  tier?: string;
  source: "purchase" | "manual";
}

export interface IssuedLicense {
  licenseId: string;
  key: string;
}

/** Create a new license and return its id + key. */
export async function issueLicense(
  params: IssueLicenseParams,
): Promise<IssuedLicense> {
  const db = getDb();
  const licenses = db.collection("licenses");

  // Generate a key, ensuring uniqueness. Collisions are effectively impossible
  // (32^16 space) but we guard anyway.
  let key = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateLicenseKey();
    const clash = await licenses.where("key", "==", candidate).limit(1).get();
    if (clash.empty) {
      key = candidate;
      break;
    }
  }
  if (!key) {
    throw new Error("Could not generate a unique license key after 5 attempts.");
  }

  const ref = licenses.doc();
  await ref.set({
    key,
    ownerUid: params.ownerUid,
    // Normalized so activation's email check is case/space-insensitive.
    buyerEmail: (params.buyerEmail || "").trim().toLowerCase(),
    productCode: "OPOS",
    tier: params.tier || "standard",
    maxActivations: params.maxActivations,
    activationsUsed: 0,
    status: "active",
    packageId: params.packageId,
    paymentRef: params.paymentRef ?? null,
    source: params.source,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { licenseId: ref.id, key };
}
