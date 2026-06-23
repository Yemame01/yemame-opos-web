// src/lib/siteUrl.ts
// Resolve the public site origin for absolute URLs (Paystack callbacks, etc.).
// Order: explicit NEXT_PUBLIC_SITE_URL → Vercel production URL → known domain.
// Falls back to localhost ONLY in development.

const PROD_URL = "https://opos.yemame.com";

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && /^https?:\/\//.test(explicit)) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  if (process.env.NODE_ENV !== "production") return "http://localhost:3200";
  return PROD_URL;
}
