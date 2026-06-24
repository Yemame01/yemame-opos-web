"use client";

// Landing page for Firebase email action links (verify email, reset password).
// Firebase appends ?mode=...&oobCode=... — we apply or forward accordingly.

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { applyActionCode } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { requireAuth, requireFunctions } from "@/lib/firebase";
import { Brand } from "@/components/Brand";
import { AuthShell } from "@/components/AuthShell";

function ActionContent() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");

  const [state, setState] = useState<"working" | "verified" | "error">(
    "working",
  );
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    // Password reset → hand off to the reset page (it verifies the code there).
    if (mode === "resetPassword" && oobCode) {
      router.replace(`/reset-password?oobCode=${encodeURIComponent(oobCode)}`);
      return;
    }
    if (mode === "verifyEmail" && oobCode) {
      (async () => {
        try {
          await applyActionCode(requireAuth(), oobCode);
          // Refresh the local user so emailVerified flips, then send welcome.
          await requireAuth().currentUser?.reload();
          try {
            const fn = httpsCallable(requireFunctions(), "sendWelcomeEmail");
            await fn({});
          } catch {
            /* welcome email is best-effort */
          }
          setState("verified");
        } catch {
          setState("error");
        }
      })();
      return;
    }
    setState("error");
  }, [mode, oobCode, router]);

  // Auto-redirect after a successful verification.
  useEffect(() => {
    if (state !== "verified") return;
    if (countdown <= 0) {
      router.push("/buy");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [state, countdown, router]);

  let body: React.ReactNode;
  if (state === "working") {
    body = (
      <div className="mt-8 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600" />
        <p className="mt-3 text-sm text-ink/60">Confirming…</p>
      </div>
    );
  } else if (state === "verified") {
    body = (
      <div className="mt-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
          <CheckCircle className="h-7 w-7 text-teal-600" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Email verified 🎉</h1>
        <p className="mt-2 text-sm text-ink/60">
          You&apos;re all set. Let&apos;s get you a license.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Taking you to plans in {countdown}s…
        </div>
        <Link href="/buy" className="btn-primary mt-5 w-full justify-center">
          Choose a plan
        </Link>
      </div>
    );
  } else {
    body = (
      <div className="mt-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-7 w-7 text-red-600" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Link expired or invalid</h1>
        <p className="mt-2 text-sm text-ink/60">
          This link may have already been used or expired. Sign in and resend
          the verification email.
        </p>
        <Link href="/login" className="btn-primary mt-6 w-full justify-center">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <AuthShell>
      <div className="card w-full max-w-sm p-7">
        <Link href="/" className="block text-center">
          <Brand className="text-xl" />
        </Link>
        {body}
      </div>
    </AuthShell>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <div className="card w-full max-w-sm p-7 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600" />
          </div>
        </AuthShell>
      }
    >
      <ActionContent />
    </Suspense>
  );
}
