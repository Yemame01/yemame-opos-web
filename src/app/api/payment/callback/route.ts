// src/app/api/payment/callback/route.ts
// Paystack redirects the buyer here after checkout. The WEBHOOK is the source of
// truth for minting the license (it's signed + server-verified); this callback is
// purely UX — it confirms the charge then sends the buyer to their dashboard,
// where the new license will appear (the webhook usually lands within seconds).

import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystackServer";
import { siteUrl } from "@/lib/siteUrl";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  const base = siteUrl();

  if (!reference) {
    return NextResponse.redirect(`${base}/dashboard?payment=missing`);
  }

  try {
    const data = await verifyTransaction(reference);
    const ok = data.status === "success";
    return NextResponse.redirect(
      `${base}/dashboard?payment=${ok ? "success" : "failed"}&ref=${encodeURIComponent(reference)}`,
    );
  } catch {
    // Even if verify hiccups, the webhook will still mint on success — send the
    // buyer to the dashboard to see their licenses.
    return NextResponse.redirect(`${base}/dashboard?payment=pending`);
  }
}
