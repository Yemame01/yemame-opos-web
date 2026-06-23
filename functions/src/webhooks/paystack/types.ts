// functions/src/webhooks/paystack/types.ts
// Paystack webhook event shape (subset OPOS uses).

export interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number; // in kobo/pesewas (minor units)
    paid_at: string;
    channel: string;
    currency: string;
    gateway_response?: string;
    fees?: number;
    metadata: {
      /** Buyer's Firebase Auth uid. */
      uid?: string;
      /** packages/{id} being purchased. */
      packageId?: string;
      /** Routing discriminator; OPOS uses "opos_license". */
      type?: string;
      [key: string]: unknown;
    };
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
  };
}
