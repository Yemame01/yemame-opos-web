// src/lib/paystackServer.ts — server-side Paystack helpers (initialize + verify).
// Secret key is server-only; never import this from a client component.

const PAYSTACK_API = "https://api.paystack.co";

function secret(): string {
  const k = process.env.PAYSTACK_SECRET_KEY;
  if (!k) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  return k;
}

export interface InitializeParams {
  email: string;
  amountMinor: number; // pesewas
  metadata: Record<string, unknown>;
  callbackUrl: string;
  /**
   * Optional caller-supplied reference. When omitted, Paystack auto-generates
   * one. Provide a suite-standard `<prefix>_<type>_<ts>_<rand>` reference so the
   * charge is self-describing in Paystack/gateway logs.
   */
  reference?: string;
}

export interface InitializeResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

/** Create a Paystack transaction; returns the hosted checkout URL + reference. */
export async function initializeTransaction(
  params: InitializeParams,
): Promise<InitializeResult> {
  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountMinor, // Paystack expects minor units
      currency: "GHS",
      metadata: params.metadata,
      callback_url: params.callbackUrl,
      channels: ["card", "mobile_money", "bank"],
      ...(params.reference ? { reference: params.reference } : {}),
    }),
  });
  const json = await res.json();
  if (!json.status) {
    throw new Error(json.message || "Failed to initialize payment");
  }
  return json.data as InitializeResult;
}

/** Verify a transaction by reference (used by the callback page as a fast-path). */
export async function verifyTransaction(reference: string): Promise<{
  status: string;
  amount: number;
  metadata: Record<string, unknown>;
}> {
  const res = await fetch(
    `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret()}` } },
  );
  const json = await res.json();
  if (!json.status) throw new Error(json.message || "Verification failed");
  return json.data;
}
