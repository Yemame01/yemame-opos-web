// functions/src/licensing/issueLicense.ts
//
// Creates a license. Used by the Paystack webhook (after a verified payment) and
// by manual/admin issuance. The license is written to BOTH the per-user path
// (users/{uid}/licenses/{id}) and the global mirror (licenses/{id}) so each
// buyer's data lives under their own account while activation/admin can still
// look it up by key. Generates a unique key (retry on the astronomical clash).

import { getDb } from "../utils/db";
import { generateLicenseKey } from "./keygen";
import { writeLicenseBoth } from "./licenseRefs";

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

/** Create a new license (nested + global mirror) and return its id + key. */
export async function issueLicense(
  params: IssueLicenseParams,
): Promise<IssuedLicense> {
  const db = getDb();

  // Generate a key, ensuring global uniqueness. Collisions are effectively
  // impossible (32^16 space) but we guard anyway.
  let key = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateLicenseKey();
    const clash = await db
      .collection("licenses")
      .where("key", "==", candidate)
      .limit(1)
      .get();
    if (clash.empty) {
      key = candidate;
      break;
    }
  }
  if (!key) {
    throw new Error("Could not generate a unique license key after 5 attempts.");
  }

  // One id shared by both copies (auto-generated from the global collection).
  const licenseId = db.collection("licenses").doc().id;

  const batch = db.batch();
  writeLicenseBoth(batch, {
    id: licenseId,
    key,
    ownerUid: params.ownerUid,
    buyerEmail: (params.buyerEmail || "").trim().toLowerCase(),
    productCode: "OPOS",
    tier: params.tier || "standard",
    maxActivations: params.maxActivations,
    activationsUsed: 0,
    status: "active",
    packageId: params.packageId,
    paymentRef: params.paymentRef ?? null,
    source: params.source,
  });
  await batch.commit();

  return { licenseId, key };
}
