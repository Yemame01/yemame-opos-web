// functions/src/licensing/deactivateDevice.ts
// Lets a license OWNER release a device (frees an activation slot) from the
// account dashboard. Server-only write (clients can't touch activations/licenses
// directly per the rules). Verifies ownership, marks the activation inactive,
// and decrements activationsUsed on BOTH license copies.

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { lightHttpOptions } from "../config/options";
import { getDb, logAdmin } from "../utils/db";
import { reportServerError } from "../services/hubNotify";
import {
  mirrorLicenseRef,
  userLicenseRef,
  activationsCol,
} from "./licenseRefs";

export const deactivateDevice = onCall(lightHttpOptions, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");

  const licenseId = String(req.data?.licenseId || "").trim();
  const deviceId = String(req.data?.deviceId || "").trim();
  if (!licenseId || !deviceId) {
    throw new HttpsError("invalid-argument", "licenseId and deviceId required.");
  }

  try {
    const db = getDb();
    const mirrorSnap = await mirrorLicenseRef(licenseId).get();
    if (!mirrorSnap.exists) {
      throw new HttpsError("not-found", "License not found.");
    }
    const lic = mirrorSnap.data()!;
    if (lic.ownerUid !== uid) {
      throw new HttpsError("permission-denied", "Not your license.");
    }

    const actRef = activationsCol(licenseId).doc(deviceId);
    const actSnap = await actRef.get();
    if (!actSnap.exists || actSnap.data()?.active === false) {
      // Already inactive / never existed — nothing to free.
      return { ok: true, changed: false };
    }

    const batch = db.batch();
    batch.update(actRef, {
      active: false,
      deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deactivatedBy: "owner",
    });
    const dec = admin.firestore.FieldValue.increment(-1);
    batch.update(mirrorLicenseRef(licenseId), { activationsUsed: dec });
    batch.update(userLicenseRef(uid, licenseId), { activationsUsed: dec });
    await batch.commit();

    await logAdmin("licenses", "device_released", {
      licenseId,
      key: lic.key,
      deviceId,
      ownerUid: uid,
      by: "owner",
    });

    return { ok: true, changed: true };
  } catch (err) {
    // HttpsError = expected client outcome (not found / not yours) — don't alert.
    if (!(err instanceof HttpsError)) {
      reportServerError("deactivateDevice", err, { licenseId, deviceId, uid });
    }
    throw err instanceof HttpsError
      ? err
      : new HttpsError("internal", "Couldn't release the device.");
  }
});
