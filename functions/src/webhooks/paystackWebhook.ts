// functions/src/webhooks/paystackWebhook.ts
// Paystack webhook handler for OPOS license purchases (mirrors yemame-pos).

import { verifyPaystackSignature } from "./paystack/verification";
import { PaystackWebhookEvent } from "./paystack/types";
import { handleChargeSuccess } from "./paystack/handlers/chargeSuccess";
import {
  reportServerErrorAwaitable,
  reportWarning,
} from "../services/hubNotify";

export async function handlePaystackWebhook(req: any, res: any): Promise<void> {
  try {
    const signature = req.headers["x-paystack-signature"];
    const webhookSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!webhookSecret) {
      console.error("[Paystack] Webhook secret not configured");
      res.status(500).json({ error: "Webhook not configured" });
      return;
    }

    // Use rawBody (exact signed bytes); JSON.stringify may reorder keys.
    const payload = req.rawBody
      ? req.rawBody.toString()
      : JSON.stringify(req.body);

    if (!verifyPaystackSignature(payload, signature, webhookSecret)) {
      console.error("[Paystack] Invalid signature");
      reportWarning(
        "Paystack webhook: signature verification failed",
        "Received a Paystack webhook with an invalid/missing signature.",
      );
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const event: PaystackWebhookEvent = req.body;
    console.log(`[Paystack] Received event: ${event.event}`);

    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(event);
        break;
      case "charge.failed":
        console.log(`[Paystack] Charge failed: ${event.data?.reference}`);
        break;
      default:
        console.log(`[Paystack] Unhandled event type: ${event.event}`);
    }

    // Acknowledge receipt so Paystack stops retrying.
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Paystack] Webhook error:", error);
    // A verified event failed to process (lost sale) — admins must know. Await so
    // the alert flushes before the instance may freeze.
    await reportServerErrorAwaitable("Paystack webhook processing", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
