// functions/src/config/options.ts
// Shared Cloud Function deployment options.
// All secrets are declared here so adding a new key propagates everywhere.
//
// Mirrors the yemame-pos options pattern. Secrets live in Google Secret Manager
// (set with `firebase functions:secrets:set <NAME> --project yemame-opos`) — never
// as plain env vars. Until real values are provided, use placeholder/test secrets.

const SHARED_SECRETS = [
  // Paystack secret key (also used as the webhook-signature HMAC key).
  "PAYSTACK_SECRET_KEY",
  // Ed25519 PRIVATE key (PEM) used ONLY to sign license tokens. Server-only.
  "LICENSE_SIGNING_PRIVATE_KEY",
  // Cross-project Hub notifier key (admin alerts). Optional in dev.
  "HUB_NOTIFY_KEY",
];

// ==================== HTTP / onCall OPTIONS ====================

/** Light callable / webhook — 60s, 256 MiB. */
export const lightHttpOptions = {
  region: "us-central1" as const,
  invoker: "public" as const,
  cors: true,
  timeoutSeconds: 60,
  memory: "256MiB" as const,
  secrets: SHARED_SECRETS,
};

/** Heavy callable — 300s, 512 MiB (bulk admin ops). */
export const heavyHttpOptions = {
  region: "us-central1" as const,
  invoker: "public" as const,
  cors: true,
  timeoutSeconds: 300,
  memory: "512MiB" as const,
  secrets: SHARED_SECRETS,
};

// ==================== SCHEDULED OPTIONS ====================

/** Light scheduled — 256 MiB. */
export const lightScheduledOptions = {
  region: "us-central1" as const,
  memory: "256MiB" as const,
  secrets: SHARED_SECRETS,
};
