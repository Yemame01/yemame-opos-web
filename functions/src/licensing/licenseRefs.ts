// functions/src/licensing/licenseRefs.ts
//
// Single source of truth for OPOS license storage (POS-style nested + mirror):
//   • CANONICAL (per-user):  users/{uid}/licenses/{licenseId}
//   • GLOBAL MIRROR:         licenses/{licenseId}   (same id) — for key lookup
//                            at activation and Hub admin queries.
//
// Both copies hold the same fields and are written together so they never drift.
// activationsUsed/status changes must update BOTH.

import * as admin from "firebase-admin";
import { getDb } from "../utils/db";

export function userLicenseRef(uid: string, licenseId: string) {
  return getDb().collection("users").doc(uid).collection("licenses").doc(licenseId);
}

export function mirrorLicenseRef(licenseId: string) {
  return getDb().collection("licenses").doc(licenseId);
}

/** Activations are recorded on the GLOBAL mirror (the activation flow only knows
 * the key → mirror; uid is a field on the doc). One sub-collection, one source. */
export function activationsCol(licenseId: string) {
  return mirrorLicenseRef(licenseId).collection("activations");
}

export interface LicenseDoc {
  id: string;
  key: string;
  ownerUid: string;
  buyerEmail: string;
  productCode: string;
  tier: string;
  maxActivations: number;
  activationsUsed: number;
  status: "active" | "revoked";
  packageId: string;
  paymentRef: string | null;
  source: "purchase" | "manual";
}

/** Write the full license doc to BOTH the user-nested path and the global mirror. */
export function writeLicenseBoth(
  batch: FirebaseFirestore.WriteBatch,
  doc: LicenseDoc,
  createdAt: FirebaseFirestore.FieldValue = admin.firestore.FieldValue.serverTimestamp(),
): void {
  const data = {
    id: doc.id,
    key: doc.key,
    ownerUid: doc.ownerUid,
    buyerEmail: doc.buyerEmail,
    productCode: doc.productCode,
    tier: doc.tier,
    maxActivations: doc.maxActivations,
    activationsUsed: doc.activationsUsed,
    status: doc.status,
    packageId: doc.packageId,
    paymentRef: doc.paymentRef,
    source: doc.source,
    createdAt,
  };
  batch.set(userLicenseRef(doc.ownerUid, doc.id), data);
  batch.set(mirrorLicenseRef(doc.id), data);
}
