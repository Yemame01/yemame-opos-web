// functions/src/admin/adminLicenses.ts
//
// Admin-only license management, callable by Yemame Hub (and an OPOS admin UI).
// Every function requires the caller's auth token to carry an `admin: true`
// custom claim — the OPOS desktop app and ordinary buyers can never call these.
//
// Set the claim once per admin (e.g. from a trusted script / Hub):
//   admin.auth().setCustomUserClaims(uid, { admin: true })

import * as admin from "firebase-admin";
import { HttpsError, onCall, CallableRequest } from "firebase-functions/v2/https";
import { heavyHttpOptions } from "../config/options";
import { getDb, logAdmin } from "../utils/db";
import { issueLicense } from "../licensing/issueLicense";

function assertAdmin(request: CallableRequest): string {
  const uid = request.auth?.uid;
  if (!uid || request.auth?.token?.admin !== true) {
    throw new HttpsError("permission-denied", "Admin access required.");
  }
  return uid;
}

/** List licenses, optionally filtered by owner or status. */
export const adminListLicenses = onCall(heavyHttpOptions, async (request) => {
  assertAdmin(request);
  const { ownerUid, status, limit } = (request.data ?? {}) as {
    ownerUid?: string;
    status?: string;
    limit?: number;
  };
  let q: FirebaseFirestore.Query = getDb().collection("licenses");
  if (ownerUid) q = q.where("ownerUid", "==", ownerUid);
  if (status) q = q.where("status", "==", status);
  q = q.orderBy("createdAt", "desc").limit(Math.min(Number(limit) || 100, 500));
  const snap = await q.get();
  return {
    licenses: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
});

/** Revoke a license. Blocks NEW activations; already-activated devices keep
 * running offline (validate-once model). */
export const adminRevokeLicense = onCall(heavyHttpOptions, async (request) => {
  const adminUid = assertAdmin(request);
  const { licenseId, reason } = (request.data ?? {}) as {
    licenseId?: string;
    reason?: string;
  };
  if (!licenseId) throw new HttpsError("invalid-argument", "licenseId required.");
  const ref = getDb().collection("licenses").doc(licenseId);
  if (!(await ref.get()).exists) {
    throw new HttpsError("not-found", "License not found.");
  }
  await ref.update({
    status: "revoked",
    revokedAt: admin.firestore.FieldValue.serverTimestamp(),
    revokedReason: (reason || "").slice(0, 200),
    revokedBy: adminUid,
  });
  await logAdmin("licenses", "revoked", { licenseId, adminUid, reason });
  return { ok: true };
});

/** Restore a revoked license. */
export const adminRestoreLicense = onCall(heavyHttpOptions, async (request) => {
  const adminUid = assertAdmin(request);
  const { licenseId } = (request.data ?? {}) as { licenseId?: string };
  if (!licenseId) throw new HttpsError("invalid-argument", "licenseId required.");
  const ref = getDb().collection("licenses").doc(licenseId);
  if (!(await ref.get()).exists) {
    throw new HttpsError("not-found", "License not found.");
  }
  await ref.update({
    status: "active",
    revokedAt: admin.firestore.FieldValue.delete(),
    revokedReason: admin.firestore.FieldValue.delete(),
  });
  await logAdmin("licenses", "restored", { licenseId, adminUid });
  return { ok: true };
});

/** Adjust a license's activation allowance (e.g. goodwill, support fix). */
export const adminAdjustActivations = onCall(
  heavyHttpOptions,
  async (request) => {
    const adminUid = assertAdmin(request);
    const { licenseId, maxActivations } = (request.data ?? {}) as {
      licenseId?: string;
      maxActivations?: number;
    };
    const n = Number(maxActivations);
    if (!licenseId || !Number.isInteger(n) || n < 0) {
      throw new HttpsError(
        "invalid-argument",
        "licenseId and a non-negative integer maxActivations are required.",
      );
    }
    const ref = getDb().collection("licenses").doc(licenseId);
    const doc = await ref.get();
    if (!doc.exists) throw new HttpsError("not-found", "License not found.");
    const used = Number(doc.get("activationsUsed")) || 0;
    if (n < used) {
      throw new HttpsError(
        "failed-precondition",
        `Cannot set max (${n}) below activations already used (${used}).`,
      );
    }
    await ref.update({ maxActivations: n });
    await logAdmin("licenses", "adjusted_activations", {
      licenseId,
      adminUid,
      maxActivations: n,
    });
    return { ok: true };
  },
);

/** Manually issue a license (off-platform / invoice sale). */
export const adminIssueLicense = onCall(heavyHttpOptions, async (request) => {
  const adminUid = assertAdmin(request);
  const { ownerUid, packageId, maxActivations, buyerEmail } = (request.data ??
    {}) as {
    ownerUid?: string;
    packageId?: string;
    maxActivations?: number;
    buyerEmail?: string;
  };
  const n = Number(maxActivations);
  if (!ownerUid || !packageId || !buyerEmail || !Number.isInteger(n) || n <= 0) {
    throw new HttpsError(
      "invalid-argument",
      "ownerUid, packageId, buyerEmail and a positive integer maxActivations are required.",
    );
  }
  const issued = await issueLicense({
    ownerUid,
    packageId,
    maxActivations: n,
    buyerEmail,
    source: "manual",
  });
  await logAdmin("licenses", "manually_issued", {
    ...issued,
    ownerUid,
    packageId,
    adminUid,
  });
  return issued;
});
