// src/lib/reportClientError.ts
//
// CLIENT-side error reporter. Safe to import in "use client" components — it
// holds NO secret. It posts to /api/_internal/report-error, which (server-side)
// forwards to the Hub via HUB_NOTIFY_KEY. Fire-and-forget: never awaited, never
// throws, never blocks the UI.
export function reportClientError(
  where: string,
  err: unknown,
  data?: Record<string, string | number | boolean | null | undefined>,
): void {
  try {
    const message = err instanceof Error ? err.message : String(err);
    void fetch("/api/_internal/report-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ where, message, data }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never let reporting break the caller
  }
}
