// functions/src/licensing/activateCore.ts
//
// Shared activation logic, exposed two ways (see activateLicense.ts):
//   • as an HTTPS endpoint the OPOS desktop app calls with a plain `http` POST
//     (no Firebase SDK on the desktop — smallest possible network surface)
//   • as a callable (handy for any future web/admin use)
//
// All user-facing conditions throw ActivationError with a stable `code` so the
// HTTP layer can map to a status and the app can show a friendly message.

import * as admin from "firebase-admin";
import { getDb, logAdmin } from "../utils/db";
import { normalizeLicenseKey } from "./keygen";
import { signLicenseToken } from "./tokenSigner";

export type ActivationCode =
  | "invalid_argument"
  | "not_found"
  | "email_mismatch"
  | "revoked"
  | "exhausted"
  | "internal";

export class ActivationError extends Error {
  constructor(
    readonly code: ActivationCode,
    message: string,
  ) {
    super(message);
    this.name = "ActivationError";
  }
}

export interface ActivateRequest {
  key: string;
  /** The email used to PURCHASE the key — must match the license's buyerEmail. */
  email: string;
  deviceId: string;
  deviceLabel?: string;
  appVersion?: string;
  platform?: string;
}

export interface ActivateResult {
  token: string;
  licenseId: string;
  tier: string;
  maxActivations: number;
  activationsUsed: number;
  reactivated: boolean;
}

export async function activateCore(
  input: Partial<ActivateRequest>,
): Promise<ActivateResult> {
  const rawKey = typeof input.key === "string" ? input.key : "";
  const email =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const deviceId = typeof input.deviceId === "string" ? input.deviceId : "";
  const deviceLabel =
    typeof input.deviceLabel === "string" ? input.deviceLabel.slice(0, 120) : "";
  const appVersion =
    typeof input.appVersion === "string" ? input.appVersion.slice(0, 40) : "";
  const platform =
    typeof input.platform === "string" ? input.platform.slice(0, 40) : "";

  if (!rawKey || !deviceId || !email) {
    throw new ActivationError(
      "invalid_argument",
      "Your purchase email, license key, and device are required.",
    );
  }
  const key = normalizeLicenseKey(rawKey);
  const db = getDb();

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(
      db.collection("licenses").where("key", "==", key).limit(1),
    );
    if (snap.empty) {
      throw new ActivationError(
        "not_found",
        "We couldn't find that license key. Please check it and try again.",
      );
    }
    const licenseRef = snap.docs[0]!.ref;
    const license = snap.docs[0]!.data() as {
      status?: string;
      maxActivations?: number;
      activationsUsed?: number;
      tier?: string;
      productCode?: string;
      buyerEmail?: string;
    };

    // The purchase email must match the key. A leaked/shared key alone can't be
    // activated without the email it was bought with. (Legacy licenses with no
    // buyerEmail recorded skip this check.)
    const buyerEmail = (license.buyerEmail || "").trim().toLowerCase();
    if (buyerEmail && buyerEmail !== email) {
      throw new ActivationError(
        "email_mismatch",
        "That email doesn't match this license key. Enter the email you used to buy the key.",
      );
    }

    if (license.status === "revoked") {
      throw new ActivationError(
        "revoked",
        "This license has been revoked. Please contact support.",
      );
    }

    const maxActivations = Number(license.maxActivations) || 0;
    const activationsUsed = Number(license.activationsUsed) || 0;

    const existing = await tx.get(
      licenseRef
        .collection("activations")
        .where("deviceId", "==", deviceId)
        .where("active", "==", true)
        .limit(1),
    );
    const isReactivation = !existing.empty;

    if (!isReactivation && activationsUsed >= maxActivations) {
      throw new ActivationError(
        "exhausted",
        "This license has no activations left. Buy another package or contact support.",
      );
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    if (isReactivation) {
      tx.update(existing.docs[0]!.ref, {
        appVersion,
        platform,
        deviceLabel: deviceLabel || existing.docs[0]!.get("deviceLabel") || "",
        reactivatedAt: now,
      });
    } else {
      const activationRef = licenseRef.collection("activations").doc();
      tx.set(activationRef, {
        deviceId,
        deviceLabel,
        appVersion,
        platform,
        active: true,
        activatedAt: now,
      });
      tx.update(licenseRef, {
        activationsUsed: admin.firestore.FieldValue.increment(1),
        lastActivatedAt: now,
      });
    }

    const token = signLicenseToken({
      licenseId: licenseRef.id,
      key,
      deviceId,
      productCode: license.productCode || "OPOS",
      tier: license.tier || "standard",
      issuedAt: new Date().toISOString(),
    });

    return {
      token,
      licenseId: licenseRef.id,
      tier: license.tier || "standard",
      maxActivations,
      activationsUsed: isReactivation ? activationsUsed : activationsUsed + 1,
      reactivated: isReactivation,
    };
  });

  await logAdmin("licenses", result.reactivated ? "reactivated" : "activated", {
    licenseId: result.licenseId,
    deviceId,
    platform,
    appVersion,
  });

  return result;
}
