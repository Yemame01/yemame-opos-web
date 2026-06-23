// scripts/generate_signing_key.mjs
//
// Generate the Ed25519 license-signing keypair. Run ONCE.
//   node scripts/generate_signing_key.mjs
//
// Outputs:
//   • PRIVATE key (PKCS#8 PEM)  → set as the LICENSE_SIGNING_PRIVATE_KEY secret:
//       firebase functions:secrets:set LICENSE_SIGNING_PRIVATE_KEY --project yemame-opos
//     (paste the PEM including the BEGIN/END lines)
//   • PUBLIC key  (raw 32 bytes, base64) → embed in the OPOS Flutter app
//       (lib/src/core/licensing/license_keys.dart kLicensePublicKeyB64).
//
// The PRIVATE key must NEVER be committed or shipped. The PUBLIC key is safe to
// commit — it can only verify, never sign.

import { generateKeyPairSync } from "node:crypto";

const { privateKey, publicKey } = generateKeyPairSync("ed25519");

const privatePem = privateKey.export({ type: "pkcs8", format: "pem" });

// Raw 32-byte Ed25519 public key (what the Dart `cryptography` package wants):
// DER SPKI for Ed25519 is a fixed 44-byte structure whose last 32 bytes are the
// raw key, so slice them off. Export straight from the public KeyObject.
const spki = publicKey.export({ type: "spki", format: "der" });
const rawPublic = spki.subarray(spki.length - 32);

console.log("=== LICENSE_SIGNING_PRIVATE_KEY (secret — DO NOT COMMIT) ===\n");
console.log(privatePem);
console.log("=== PUBLIC KEY (raw 32 bytes, base64 — embed in OPOS app) ===\n");
console.log(rawPublic.toString("base64"));
console.log(
  "\nNext: set the private key as a secret, and paste the public base64 into",
  "\nlib/src/core/licensing/license_keys.dart (kLicensePublicKeyB64).",
);
