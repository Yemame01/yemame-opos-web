// src/proxy.ts - Production Security Middleware
// Mirrors POS/Serve's proxy.ts: security headers + best-effort rate limiting.
// CSP tuned to opos-web's external deps (Paystack, Firebase, Firebase Storage,
// Sentry, Google Analytics, Google Fonts).
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Best-effort in-memory limiter (per serverless instance, not shared). Real
// enforcement is server-side; this curbs repeated abuse within one instance.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100;

// Payment initialization is the sensitive route here.
const RATE_LIMITED_ROUTES = ["/api/payment/initialize"];

function getRateLimitKey(request: NextRequest): string {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `${ip}:${request.nextUrl.pathname}`;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const rateLimitData = rateLimitMap.get(key);

  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (rateLimitData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  rateLimitData.count++;
  rateLimitMap.set(key, rateLimitData);
  return true;
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // ==================== SECURITY HEADERS ====================

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains",
  );

  const isDev = process.env.NODE_ENV === "development";
  const csp = isDev
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://www.googletagmanager.com https://js.paystack.co https://apis.google.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://paystack.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' data: blob: https://*.firebaseio.com https://*.googleapis.com https://*.cloudfunctions.net https://*.firebasestorage.googleapis.com https://*.firebasestorage.app wss://*.firebaseio.com https://api.paystack.co https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://www.google-analytics.com",
        "worker-src 'self' blob:",
        "frame-src 'self' https://*.firebaseapp.com https://checkout.paystack.com",
      ].join("; ")
    : [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' blob: https://www.googletagmanager.com https://js.paystack.co https://apis.google.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://paystack.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' data: blob: https://*.firebaseio.com https://*.googleapis.com https://*.cloudfunctions.net https://*.firebasestorage.googleapis.com https://*.firebasestorage.app wss://*.firebaseio.com https://api.paystack.co https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://www.google-analytics.com",
        "worker-src 'self' blob:",
        "frame-src 'self' https://*.firebaseapp.com https://checkout.paystack.com",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // ==================== RATE LIMITING ====================

  const needsRateLimit = RATE_LIMITED_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  if (needsRateLimit && process.env.NODE_ENV === "production") {
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(RATE_LIMIT_WINDOW / 1000)),
          },
        },
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
