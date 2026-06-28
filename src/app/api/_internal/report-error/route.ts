// src/app/api/_internal/report-error/route.ts
//
// Internal relay so CLIENT-side error reports reach the Hub without exposing the
// HUB_NOTIFY_KEY secret to the browser. The browser posts a small JSON payload
// here; this server route forwards it via the server-only reportServerError.
//
// Guards: same-origin only + a small per-IP rate limit (best-effort, in-memory)
// so it can't be abused as an open alert spammer.
import { NextRequest, NextResponse } from "next/server";
import { reportServerError } from "@/lib/hubNotify";

const buckets = new Map<string, { count: number; resetTime: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const max = 20;
  const windowMs = 5 * 60 * 1000; // 20 reports / 5 min / IP
  const rec = buckets.get(ip);
  if (!rec || now > rec.resetTime) {
    buckets.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }
  if (rec.count >= max) return true;
  rec.count++;
  return false;
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  if (rateLimited(getClientIP(request))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  try {
    const body = (await request.json()) as {
      where?: unknown;
      message?: unknown;
      data?: unknown;
    };
    const where =
      typeof body.where === "string" ? body.where.slice(0, 120) : "client";
    const message =
      typeof body.message === "string"
        ? body.message.slice(0, 300)
        : "Unknown client error";
    const data =
      body.data && typeof body.data === "object"
        ? (body.data as Record<string, string | number | boolean | null>)
        : undefined;
    reportServerError(`client:${where}`, new Error(message), data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
