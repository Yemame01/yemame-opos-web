// src/app/api/payment/initialize/route.ts
// Start a license purchase. SECURITY: the buyer's identity comes from a VERIFIED
// Firebase ID token (Authorization: Bearer), NOT a client-sent uid — so a caller
// can never mint a license to someone else's account. The SERVER re-reads the
// package price from Firestore (never trusts a client amount), then creates the
// Paystack transaction with the verified uid + packageId in the metadata so the
// webhook can mint the license to the right account.

import { NextRequest, NextResponse } from "next/server";
import { initializeTransaction } from "@/lib/paystackServer";
import { verifyIdToken, bearerToken } from "@/lib/verifyIdToken";
import { siteUrl } from "@/lib/siteUrl";

// Read the package from adminConfig/general.packages via the REST API (the
// config doc is world-readable). Server re-derives the price — never trusts the
// client amount.
async function getPackage(
  packageId: string,
): Promise<{ priceMinor: number; active: boolean } | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/adminConfig/general`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const doc = await res.json();
  const values = doc.fields?.packages?.arrayValue?.values ?? [];
  for (const v of values) {
    const f = v.mapValue?.fields ?? {};
    if (f.id?.stringValue === packageId) {
      return {
        priceMinor: Number(
          f.priceMinor?.integerValue ?? f.priceMinor?.doubleValue ?? 0,
        ),
        active: f.active?.booleanValue === true,
      };
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // ── Authenticate the buyer from the ID token (never trust a body uid) ──
    const user = await verifyIdToken(bearerToken(request));
    if (!user) {
      return NextResponse.json(
        { error: "Please sign in again to continue." },
        { status: 401 },
      );
    }

    const { packageId } = await request.json();
    if (!packageId) {
      return NextResponse.json(
        { error: "packageId is required." },
        { status: 400 },
      );
    }

    const pkg = await getPackage(packageId);
    if (!pkg || !pkg.active) {
      return NextResponse.json(
        { error: "That package is unavailable." },
        { status: 400 },
      );
    }

    // A zero-price package can't be sold (placeholder not yet priced).
    if (pkg.priceMinor <= 0) {
      return NextResponse.json(
        {
          error:
            "This package has no price set yet. Please set a price in the admin before selling.",
        },
        { status: 400 },
      );
    }

    // Suite-standard descriptive reference: yo_opos_license_<ts>_<rand>.
    // Opaque downstream (the webhook keys idempotency on it), but makes the
    // charge self-describing in Paystack/gateway logs.
    const reference = `yo_opos_license_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    const data = await initializeTransaction({
      email: user.email,
      amountMinor: pkg.priceMinor,
      // product:"opos" lets the shared gateway route this charge to yemame-opos.
      // uid is the VERIFIED uid — the webhook mints to exactly this account.
      metadata: { product: "opos", type: "opos_license", uid: user.uid, packageId },
      callbackUrl: `${siteUrl()}/api/payment/callback`,
      reference,
    });

    return NextResponse.json({
      // access_code powers the inline popup (no redirect); authorization_url is
      // kept as a fallback for environments where the inline SDK can't load.
      access_code: data.access_code,
      authorization_url: data.authorization_url,
      reference: data.reference,
      // The inline popup needs email + amount in its OWN config even when
      // resuming via access_code — without them Paystack errors "Please enter a
      // valid email address" (this is exactly what yemame-pos passes too). Both
      // are server-verified/derived, so the client can't tamper with them.
      email: user.email,
      amount: pkg.priceMinor, // pesewas (minor units)
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
