// src/app/twitter-image.tsx — same card as Open Graph, for Twitter/X.
// Static config must be declared here (Next can't statically read re-exports).
import OgImage from "./opengraph-image";

export const runtime = "edge";
export const alt = "Yemame OPOS — Offline Point of Sale for Shops";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return OgImage();
}
