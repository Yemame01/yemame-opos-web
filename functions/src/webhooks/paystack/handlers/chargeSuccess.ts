// functions/src/webhooks/paystack/handlers/chargeSuccess.ts
//
// On a verified `charge.success`, mint an OPOS license. The actual fulfillment
// (idempotency + amount validation + dual payment record + issue) lives in the
// shared fulfillLicensePurchase() so the webhook, the payment callback (fallback)
// and the admin reissue tool all behave identically and can't double-mint.

import { PaystackWebhookEvent } from "../types";
import { fulfillLicensePurchase } from "../../../licensing/fulfillPurchase";
import { reportServerError } from "../../../services/hubNotify";

export async function handleChargeSuccess(
  event: PaystackWebhookEvent,
): Promise<void> {
  const { data } = event;
  try {
    await fulfillLicensePurchase(data, "webhook");
  } catch (error) {
    console.error("[Paystack] chargeSuccess error:", error);
    reportServerError("Paystack chargeSuccess", error, {
      reference: data.reference,
      email: data.customer?.email ?? "",
    });
    throw error; // let the entry return 500 so Paystack retries
  }
}
