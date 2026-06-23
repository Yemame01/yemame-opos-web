// functions/src/webhooks/paystack/verification.ts
// Paystack webhook signature verification (mirrors yemame-pos).
import * as crypto from "crypto";

/**
 * Verify a Paystack webhook signature: HMAC-SHA512 of the RAW payload bytes
 * keyed by the Paystack secret, compared to the x-paystack-signature header.
 * Always pass the raw body (not JSON.stringify) so the bytes match what Paystack
 * signed.
 */
export function verifyPaystackSignature(
  payload: string,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature) return false;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(payload)
    .digest("hex");
  // Constant-time compare to avoid timing leaks.
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
