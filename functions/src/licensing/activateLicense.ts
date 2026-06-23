// functions/src/licensing/activateLicense.ts
//
// The ONE thing the OPOS desktop app calls — once, at create-account time.
// Exposed two ways over the SAME activateCore logic:
//   • activateLicenseHttp  — plain HTTPS POST (what the desktop app uses, via the
//     `http` package; no Firebase SDK on the desktop)
//   • activateLicense      — onCall callable (for any future web/admin use)
//
// Given a claim key + device fingerprint, it binds the device (consuming one
// activation) and returns a signed, offline-verifiable license token. After this
// the app never contacts the server again.

import {
  HttpsError,
  FunctionsErrorCode,
  onCall,
  onRequest,
} from "firebase-functions/v2/https";
import { lightHttpOptions } from "../config/options";
import {
  activateCore,
  ActivationError,
  ActivationCode,
} from "./activateCore";
import { reportServerError } from "../services/hubNotify";
import { consumeRateLimit, clientIp } from "../utils/rateLimit";

// Activation is unauthenticated (the key IS the credential), so throttle by IP
// to make key brute-force impractical on top of the huge keyspace.
const ACTIVATE_MAX_PER_MIN = 10;
const ACTIVATE_WINDOW_SEC = 60;

// Map activation codes → HttpsError codes (callable) / HTTP statuses (REST).
const HTTPS_CODE: Record<ActivationCode, FunctionsErrorCode> = {
  invalid_argument: "invalid-argument",
  not_found: "not-found",
  email_mismatch: "permission-denied",
  revoked: "permission-denied",
  exhausted: "resource-exhausted",
  internal: "internal",
};
const HTTP_STATUS: Record<ActivationCode, number> = {
  invalid_argument: 400,
  not_found: 404,
  email_mismatch: 403,
  revoked: 403,
  exhausted: 409,
  internal: 500,
};

// ---- Callable ----
export const activateLicense = onCall(lightHttpOptions, async (request) => {
  try {
    return await activateCore(request.data ?? {});
  } catch (error) {
    if (error instanceof ActivationError) {
      throw new HttpsError(HTTPS_CODE[error.code], error.message);
    }
    reportServerError("activateLicense(callable)", error);
    throw new HttpsError(
      "internal",
      "Something went wrong activating your license. Please try again.",
    );
  }
});

// ---- Plain HTTPS (desktop app) ----
// Body: { key, deviceId, deviceLabel?, appVersion?, platform? }
// Success 200: ActivateResult. Errors: { error: { code, message } } + status.
export const activateLicenseHttp = onRequest(lightHttpOptions, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: { code: "method", message: "POST only" } });
    return;
  }
  // Throttle by IP to make key brute-force impractical.
  const limit = await consumeRateLimit(
    `activate:${clientIp(req)}`,
    ACTIVATE_MAX_PER_MIN,
    ACTIVATE_WINDOW_SEC,
    Date.now(),
  );
  if (!limit.allowed) {
    res.status(429).json({
      error: {
        code: "rate_limited",
        message: "Too many attempts. Please wait a minute and try again.",
      },
    });
    return;
  }
  try {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const result = await activateCore(body);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ActivationError) {
      res
        .status(HTTP_STATUS[error.code])
        .json({ error: { code: error.code, message: error.message } });
      return;
    }
    reportServerError("activateLicenseHttp", error);
    res.status(500).json({
      error: {
        code: "internal",
        message:
          "Something went wrong activating your license. Please try again.",
      },
    });
  }
});
