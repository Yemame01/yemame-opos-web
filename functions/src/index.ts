// functions/src/index.ts — Yemame OPOS licensing + store Cloud Functions.
// Clean re-export hub; all logic lives in modules (mirrors yemame-pos).

import * as admin from "firebase-admin";
admin.initializeApp();

// ==================== LICENSING (app-facing) ====================
// The ONE endpoint the OPOS desktop app calls — once, at activation.
// activateLicenseHttp = plain HTTPS (desktop); activateLicense = callable.
export {
  activateLicense,
  activateLicenseHttp,
} from "./licensing/activateLicense";

// ==================== WEBHOOKS (billing) ====================
import { onRequest } from "firebase-functions/v2/https";
import { lightHttpOptions } from "./config/options";
import { handlePaystackWebhook } from "./webhooks/paystackWebhook";

export const paystackWebhook = onRequest(lightHttpOptions, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  await handlePaystackWebhook(req, res);
});

// ==================== ADMIN (Hub-facing) ====================
export {
  adminListLicenses,
  adminRevokeLicense,
  adminRestoreLicense,
  adminAdjustActivations,
  adminIssueLicense,
} from "./admin/adminLicenses";
