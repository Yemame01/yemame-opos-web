// functions/src/licensing/keygen.ts
//
// License-key generation. A key is a short, human-typeable CLAIM CODE the buyer
// enters in OPOS to activate. It is NOT the cryptographic token — it's just a
// random identifier we look up server-side. The trust comes from the signed
// token the server returns (see tokenSigner.ts).
//
// Format: YMOP-XXXX-XXXX-XXXX-XXXX
//   • "YMOP" product prefix (Yemame OPOS)
//   • 16 random chars in Crockford base32 (no I, L, O, U → no ambiguity when a
//     shop owner reads/types it), grouped in 4s with dashes.

import * as crypto from "crypto";

const PREFIX = "YMOP";
// Crockford base32 alphabet (excludes I, L, O, U).
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const GROUPS = 4;
const GROUP_LEN = 4;

/** Generate a new license key, e.g. "YMOP-7F3A-9C2D-KQ4M-X8VR". */
export function generateLicenseKey(): string {
  const total = GROUPS * GROUP_LEN;
  // Rejection-free, unbiased pick: map each random byte into the 32-char
  // alphabet by masking to 5 bits (0–31), which the alphabet covers exactly.
  const bytes = crypto.randomBytes(total);
  let out = "";
  for (let i = 0; i < total; i++) {
    out += ALPHABET[bytes[i]! & 0x1f];
  }
  const groups: string[] = [];
  for (let i = 0; i < GROUPS; i++) {
    groups.push(out.slice(i * GROUP_LEN, (i + 1) * GROUP_LEN));
  }
  return `${PREFIX}-${groups.join("-")}`;
}

/**
 * Normalize user-entered keys for lookup: uppercase, strip spaces, and map the
 * characters people commonly mistype to their Crockford equivalents
 * (I/L→1, O→0, U→V). Keeps dashes. Lets a buyer type loosely and still match.
 *
 * CRITICAL: only the CODE portion is char-mapped — never the "YMOP" prefix. The
 * prefix legitimately contains an "O", so applying O→0 across the whole string
 * turned "YMOP" into "YM0P" and NO key ever matched (every activation failed).
 */
export function normalizeLicenseKey(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, "");
  const mapCode = (s: string) =>
    s
      .replace(/I|L/g, "1")
      .replace(/O/g, "0")
      .replace(/U/g, "V");

  // Split off the literal product prefix so its "O" is preserved; map only the
  // rest (the random Crockford-base32 code).
  if (cleaned.startsWith(`${PREFIX}-`)) {
    return `${PREFIX}-${mapCode(cleaned.slice(PREFIX.length + 1))}`;
  }
  // No recognizable prefix typed — best-effort map the whole thing.
  return mapCode(cleaned);
}

/** Shape check (does NOT prove the key exists — that's a Firestore lookup). */
export function isPlausibleLicenseKey(key: string): boolean {
  return new RegExp(
    `^${PREFIX}(-[${ALPHABET}]{${GROUP_LEN}}){${GROUPS}}$`,
  ).test(key);
}
