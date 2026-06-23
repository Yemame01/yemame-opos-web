// functions/src/utils/rateLimit.ts
//
// A small Firestore-backed fixed-window rate limiter. Used to throttle the
// unauthenticated activation endpoint so the (astronomically large) key space
// can't be brute-forced, and to blunt abuse of any public endpoint.
//
// Keyed by an arbitrary string (e.g. an IP). Each window is a doc with a count;
// a transaction increments it and rejects once the limit is exceeded. Windows
// are coarse (per-minute) so the write volume stays tiny. Fails OPEN on a
// limiter error — we never block a legitimate user because the limiter hiccupped.

import * as admin from "firebase-admin";
import { getDb } from "./db";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Consume one unit against `key`. Allows up to `max` per `windowSeconds`.
 * Returns allowed=false once the window's count exceeds `max`.
 */
export async function consumeRateLimit(
  key: string,
  max: number,
  windowSeconds: number,
  now: number,
): Promise<RateLimitResult> {
  const windowId = Math.floor(now / (windowSeconds * 1000));
  const safeKey = key.replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 200);
  const ref = getDb().collection("rateLimits").doc(`${safeKey}__${windowId}`);
  try {
    return await getDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const count = snap.exists ? Number(snap.get("count")) || 0 : 0;
      if (count >= max) {
        return { allowed: false, remaining: 0 };
      }
      tx.set(
        ref,
        {
          count: admin.firestore.FieldValue.increment(1),
          // TTL hint: Firestore can auto-delete via a TTL policy on expireAt.
          expireAt: admin.firestore.Timestamp.fromMillis(
            (windowId + 2) * windowSeconds * 1000,
          ),
        },
        { merge: true },
      );
      return { allowed: true, remaining: Math.max(0, max - count - 1) };
    });
  } catch {
    // Fail open — never block a real user on a limiter error.
    return { allowed: true, remaining: max };
  }
}

/** Best-effort client IP from a Cloud Functions request. */
export function clientIp(req: { headers: Record<string, unknown>; ip?: string }): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0]!.trim();
  }
  return req.ip || "unknown";
}
