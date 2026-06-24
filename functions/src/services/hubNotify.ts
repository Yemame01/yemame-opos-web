// functions/src/services/hubNotify.ts
//
// Thin, fire-and-forget wrapper around the central Hub notifier (yemame-hub's
// `notifyHub`). Mirrors the yemame-pos helper's surface but trimmed to what OPOS
// needs. A notification failure must NEVER break the flow that triggered it.
//
// Until HUB_NOTIFY_KEY is configured this no-ops silently (logs only), so the
// OPOS backend runs standalone before Hub access is wired.

import * as logger from "firebase-functions/logger";

const HUB_URL = "https://us-central1-yemame-hub.cloudfunctions.net/notifyHub";

/** Expected client/validation error — must NOT raise an admin alert. */
export class ClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientError";
  }
}

/** True when an error is worth alerting an admin (i.e. not a client error). */
export function shouldAlert(error: unknown): boolean {
  if (error instanceof ClientError) return false;
  const code = (error as { code?: string } | null)?.code;
  if (typeof code === "string") {
    return new Set(["internal", "unknown", "data-loss"]).has(code);
  }
  return true;
}

// Hub's notifyHub contract (see yemame-gateway/admin-push-notifications-hander.md):
//   • auth header is `x-notify-key`
//   • the caller identifies itself with the `source` field (NOT `product`)
//   • `type` must be one of Hub's known notification types
//   • `data` values must be strings
// Only Hub's known notification types are valid (it 400s on anything else).
type HubType =
  | "error"
  | "warning"
  | "info"
  | "payment"
  | "request"
  | "support"
  | "subscription"
  | "custom";

interface HubNotifyInput {
  title: string;
  body: string;
  type: HubType;
  data?: Record<string, string | number | null | undefined>;
  link?: string;
}

/** Send an alert to the Hub. Always resolves; never throws. */
export async function notifyHub(input: HubNotifyInput): Promise<boolean> {
  const key = process.env.HUB_NOTIFY_KEY;
  if (!key) {
    logger.info("[hubNotify] skipped (HUB_NOTIFY_KEY not set)", {
      title: input.title,
    });
    return false;
  }
  try {
    // Coerce data values to strings (Hub requires string values).
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(input.data ?? {})) {
      data[k] = v == null ? "" : String(v);
    }
    const res = await fetch(HUB_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-notify-key": key,
      },
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        type: input.type,
        source: "opos",
        data,
        link: input.link,
      }),
      signal: AbortSignal.timeout(2500),
    });
    return res.ok;
  } catch (err) {
    logger.warn("[hubNotify] failed (ignored)", { err: String(err) });
    return false;
  }
}

/** Report an unexpected server error to admins. Fire-and-forget. */
export function reportServerError(
  context: string,
  error: unknown,
  data?: Record<string, string | number | null | undefined>,
): void {
  if (!shouldAlert(error)) return;
  void notifyHub({
    title: `OPOS error: ${context}`,
    body: error instanceof Error ? error.message : String(error),
    type: "error",
    data,
  });
}

/** Like reportServerError but awaitable — use as the last line before a response. */
export async function reportServerErrorAwaitable(
  context: string,
  error: unknown,
  data?: Record<string, string | number | null | undefined>,
): Promise<void> {
  if (!shouldAlert(error)) return;
  await notifyHub({
    title: `OPOS error: ${context}`,
    body: error instanceof Error ? error.message : String(error),
    type: "error",
    data,
  });
}

/** Surface a warning (e.g. bad webhook signature). Fire-and-forget. */
export function reportWarning(title: string, body: string): void {
  void notifyHub({ title: `OPOS: ${title}`, body, type: "warning" });
}

/**
 * Wrap an async handler so any UNEXPECTED error (not an HttpsError / ClientError)
 * is reported to admins before being rethrown. Keeps callable handlers terse
 * while guaranteeing failures alert. Expected client errors pass through silently.
 */
export function withErrorReport<A extends unknown[], R>(
  context: string,
  fn: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return async (...args: A): Promise<R> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (shouldAlert(err)) reportServerError(context, err);
      throw err;
    }
  };
}
