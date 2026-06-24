"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { requireAuth } from "@/lib/firebase";
import { Brand } from "@/components/Brand";
import { AuthShell } from "@/components/AuthShell";
import { PasswordField } from "@/components/PasswordField";

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const oobCode = params.get("oobCode");

  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Verify the reset code on mount, fetch the email it belongs to.
  useEffect(() => {
    if (!oobCode) {
      setError("This reset link is invalid or has expired.");
      setVerifying(false);
      return;
    }
    (async () => {
      try {
        const e = await verifyPasswordResetCode(requireAuth(), oobCode);
        setEmail(e);
      } catch {
        setError("This reset link is invalid or has expired.");
      } finally {
        setVerifying(false);
      }
    })();
  }, [oobCode]);

  // Redirect to login after success.
  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) {
      router.push("/login");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [success, countdown, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!oobCode) return;
    setBusy(true);
    try {
      await confirmPasswordReset(requireAuth(), oobCode, password);
      setSuccess(true);
    } catch {
      setError("Couldn't reset your password. The link may have expired.");
    } finally {
      setBusy(false);
    }
  };

  let body: React.ReactNode;
  if (verifying) {
    body = (
      <div className="mt-8 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600" />
        <p className="mt-3 text-sm text-ink/60">Verifying your reset link…</p>
      </div>
    );
  } else if (error && !email) {
    body = (
      <div className="mt-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-7 w-7 text-red-600" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Invalid reset link</h1>
        <p className="mt-2 text-sm text-ink/60">{error}</p>
        <Link
          href="/forgot-password"
          className="btn-primary mt-6 w-full justify-center"
        >
          Request a new link
        </Link>
      </div>
    );
  } else if (success) {
    body = (
      <div className="mt-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
          <CheckCircle className="h-7 w-7 text-teal-600" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Password reset</h1>
        <p className="mt-2 text-sm text-ink/60">
          You can now log in with your new password.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Redirecting to login in {countdown}s…
        </div>
        <Link href="/login" className="btn-primary mt-5 w-full justify-center">
          Go to login now
        </Link>
      </div>
    );
  } else {
    body = (
      <>
        <h1 className="mt-5 text-center text-xl font-bold">Set a new password</h1>
        <p className="mt-1 text-center text-sm text-ink/60">
          For <span className="font-semibold">{email}</span>
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">New password</label>
            <PasswordField
              id="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              disabled={busy}
              autoFocus
            />
            <p className="mt-1 text-xs text-ink/50">Must be at least 8 characters</p>
          </div>
          <div>
            <label className="label">Confirm password</label>
            <PasswordField
              id="confirm"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              disabled={busy}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full justify-center" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Resetting…
              </>
            ) : (
              "Reset password"
            )}
          </button>
        </form>
      </>
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

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
