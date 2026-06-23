// functions/src/licensing/tokenSigner.ts
//
// Signs the offline-verifiable LICENSE TOKEN with the server's Ed25519 PRIVATE
// key. The OPOS desktop app holds only the matching PUBLIC key (embedded in the
// binary) and verifies the token offline — it can never forge one.
//
// Token wire format (compact, dot-separated, both parts base64url):
//   <payloadB64url>.<signatureB64url>
//   • payload  = UTF-8 JSON of LicenseTokenPayload
//   • signature = Ed25519 signature over the RAW payload BYTES (the exact bytes
//                 that were base64url-encoded), so the verifier signs/verifies
//                 the identical byte sequence.
//
// The payload is bound to a deviceId, so a token copied to another machine fails
// the binding check in the app even though its signature is valid.

import * as crypto from "crypto";

export interface LicenseTokenPayload {
  /** Firestore licenses/{id}. */
  licenseId: string;
  /** The claim key (for display/debug; binding is via deviceId). */
  key: string;
  /** Hashed device fingerprint this token is bound to. */
  deviceId: string;
  /** Always "OPOS" for now. */
  productCode: string;
  /** Reserved for future Starter/Pro; "standard" today. */
  tier: string;
  /** ISO-8601 issue time. */
  issuedAt: string;
  /** Token format version, so the app can evolve verification. */
  v: number;
}

const TOKEN_VERSION = 1;

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Load the Ed25519 private key from the LICENSE_SIGNING_PRIVATE_KEY secret.
 * Accepts a PKCS#8 PEM. In dev, if the secret is absent we throw a clear error
 * rather than minting unsigned tokens — never ship a bypass.
 */
function loadPrivateKey(): crypto.KeyObject {
  const pem = process.env.LICENSE_SIGNING_PRIVATE_KEY;
  if (!pem || !pem.includes("PRIVATE KEY")) {
    throw new Error(
      "LICENSE_SIGNING_PRIVATE_KEY is not set (PKCS#8 PEM expected). " +
        "Generate a keypair with scripts/generate_signing_key.mjs and set the secret.",
    );
  }
  return crypto.createPrivateKey(pem);
}

/** Sign a license token and return the compact `payload.signature` string. */
export function signLicenseToken(
  fields: Omit<LicenseTokenPayload, "v">,
): string {
  const payload: LicenseTokenPayload = { ...fields, v: TOKEN_VERSION };
  const payloadBytes = Buffer.from(JSON.stringify(payload), "utf8");
  // Ed25519: algorithm arg MUST be null (the key type selects the hash).
  const signature = crypto.sign(null, payloadBytes, loadPrivateKey());
  return `${b64url(payloadBytes)}.${b64url(signature)}`;
}
