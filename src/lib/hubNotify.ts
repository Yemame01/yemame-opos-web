// src/lib/hubNotify.ts
//
// SERVER-ONLY admin alerts to the Yemame Hub. Mirrors the Cloud Functions'
// functions/src/utils/notifyHub.ts so app-side (Next.js route handlers, server
// actions, webhooks) integration errors page admins the same way function errors do.
//
// DESIGN:
//  1. FIRE-AND-FORGET — never block, delay, or fail the request that triggered it.
//     The public helpers return void and must not be awaited.
//  2. Best-effort — every failure (missing key, Hub down, timeout) is swallowed.
//     A Hub outage can never cascade into an app failure.
//  3. Errors/warnings/critical events only — never routine successes.
//
// SECURITY: reads HUB_NOTIFY_KEY (a server secret, NOT prefixed NEXT_PUBLIC_ so
// it is never bundled to the browser). Only import this from server code (route
// handlers, server actions, server components) — keep it out of "use client"
// files. If somehow called client-side, the key is undefined and it safely no-ops
// without leaking anything.

const NOTIFY_HUB_URL =
  "https://us-central1-yemame-hub.cloudfunctions.net/notifyHub";

/** This app's source tag in the Hub Alerts UI. */
const SOURCE = "opos-web";
/** Deep-link path inside the Hub for this app's alerts. */
const HUB_LINK = "/opos";
/** Human label used in alert titles, e.g. "Serve error: ...". */
const APP_LABEL = "OPOS Web";

export type HubNotifyType =
  | "payment"
  | "subscription"
  | "request"
  | "support"
  | "error"
  | "warning"
  | "info"
  | "custom";

export interface HubNotifyInput {
  title: string;
  body: string;
  type: HubNotifyType;
  data?: Record<string, string | number | boolean | null | undefined>;
  link?: string;
}

function stringifyData(
  data?: HubNotifyInput["data"],
): Record<string, string> | undefined {
  if (!data) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) continue;
    out[k] = String(v);
  }
  return out;
}

/** Awaitable HTTP send — never throws. Used internally by the fire-and-forget helpers. */
async function sendToHub(input: HubNotifyInput, timeoutMs = 8000): Promise<void> {
  const key = process.env.HUB_NOTIFY_KEY;
  if (!key) {
    console.warn("[hubNotify] HUB_NOTIFY_KEY not configured — skipping alert", {
      title: input.title,
    });
    return;
  }
  try {
    const res = await fetch(NOTIFY_HUB_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-notify-key": key },
      body: JSON.stringify({
        source: SOURCE,
        title: input.title,
        body: input.body,
        type: input.type,
        data: stringifyData(input.data),
        link: input.link ?? HUB_LINK,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      console.warn("[hubNotify] non-OK response", {
        status: res.status,
        title: input.title,
      });
    }
  } catch (err) {
    console.warn("[hubNotify] failed to send alert", {
      title: input.title,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Fire an admin alert and return immediately (background send). Never throws. */
export function fireHubAlert(input: HubNotifyInput): void {
  void sendToHub(input).catch(() => undefined);
}

/**
 * Report a server-side error to admins. Fire-and-forget.
 * @param where  short label of the failing path, e.g. "api/payment/initialize".
 * @param err    the caught error.
 * @param data   extra context (ids, refs) — no secrets/PII beyond what's logged.
 */
export function reportServerError(
  where: string,
  err: unknown,
  data?: HubNotifyInput["data"],
): void {
  const message = err instanceof Error ? err.message : String(err);
  fireHubAlert({
    title: `${APP_LABEL} error: ${where}`,
    body: message.slice(0, 300),
    type: "error",
    data: { where, ...data },
  });
}

/** Report a server-side warning to admins. Fire-and-forget. */
export function reportWarning(
  where: string,
  message: string,
  data?: HubNotifyInput["data"],
): void {
  fireHubAlert({
    title: `${APP_LABEL} warning: ${where}`,
    body: message.slice(0, 300),
    type: "warning",
    data: { where, ...data },
  });
}
