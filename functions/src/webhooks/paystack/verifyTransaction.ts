// functions/src/webhooks/paystack/verifyTransaction.ts
//
// Server-side Paystack transaction verification (functions side). Used by the
// fallback-mint paths (callback-triggered fulfill + admin reissue) to confirm a
// payment directly with Paystack before issuing a license — so minting never
// depends on trusting client input, only on Paystack's own record.
import { VerifiedPaystackData } from "../../licensing/fulfillPurchase";

const PAYSTACK_API = "https://api.paystack.co";

/** Fetch the authoritative transaction record from Paystack by reference. */
export async function verifyPaystackTransaction(
  reference: string,
): Promise<VerifiedPaystackData> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY not configured");

  const res = await fetch(
    `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: VerifiedPaystackData;
  };
  if (!json.status || !json.data) {
    throw new Error(json.message || "Paystack verification failed");
  }
  return json.data;
}
