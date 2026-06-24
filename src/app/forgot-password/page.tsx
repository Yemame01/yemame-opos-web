"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { Brand } from "@/components/Brand";
import { AuthShell } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await resetPassword(email);
      // Always succeeds (enumeration-safe) — show the same screen regardless.
      setSent(true);
    } catch {
      setError("Couldn't send the reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <div className="card w-full max-w-sm p-7">
        <Link href="/" className="block text-center">
          <Brand className="text-xl" />
        </Link>

        {sent ? (
          <div className="mt-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
              <CheckCircle className="h-7 w-7 text-teal-600" />
            </div>
            <h1 className="mt-4 text-xl font-bold">Check your email</h1>
            <p className="mt-2 text-sm text-ink/60">
              If an account exists for{" "}
              <span className="font-semibold">{email}</span>, we&apos;ve sent a
              link to reset your password. It expires in 1 hour.
            </p>
            <Link href="/login" className="btn-primary mt-6 w-full justify-center">
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mt-5 text-center text-xl font-bold">
              Forgot your password?
            </h1>
            <p className="mt-1 text-center text-sm text-ink/60">
              Enter your email and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/35" />
                  <input
                    type="email"
                    className="field pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={busy}
                    required
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button className="btn-primary w-full justify-center" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </button>
            </form>
            <Link
              href="/login"
              className="mt-5 inline-flex w-full items-center justify-center gap-1.5 text-sm text-ink/60 hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
