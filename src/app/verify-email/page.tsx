"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MailCheck, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { requireAuth } from "@/lib/firebase";
import { Brand } from "@/components/Brand";
import { AuthShell } from "@/components/AuthShell";

export default function VerifyEmailPage() {
  const { user, loading, resendVerification, signOut } = useAuth();
  const router = useRouter();
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState("");

  // If they're already verified, move them along.
  useEffect(() => {
    if (!loading && user?.emailVerified) router.replace("/buy");
  }, [loading, user, router]);

  const resend = async () => {
    setResending(true);
    setNotice("");
    try {
      await resendVerification();
      setResent(true);
    } catch {
      setNotice("Couldn't resend right now. Please try again shortly.");
    } finally {
      setResending(false);
    }
  };

  const checkVerified = async () => {
    setChecking(true);
    setNotice("");
    try {
      await requireAuth().currentUser?.reload();
      if (requireAuth().currentUser?.emailVerified) {
        router.replace("/buy");
      } else {
        setNotice("Not verified yet — click the link in your email first.");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <AuthShell>
      <div className="card w-full max-w-sm p-7 text-center">
        <Link href="/" className="block">
          <Brand className="text-xl" />
        </Link>
        <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
          <MailCheck className="h-7 w-7 text-teal-600" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Verify your email</h1>
        <p className="mt-2 text-sm text-ink/60">
          We sent a verification link to
          {user?.email ? (
            <>
              {" "}
              <span className="font-semibold">{user.email}</span>
            </>
          ) : (
            " your inbox"
          )}
          . Click it to activate your account, then come back here.
        </p>

        {resent && (
          <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700">
            Sent! Check your inbox (and spam).
          </p>
        )}
        {notice && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {notice}
          </p>
        )}

        <button
          onClick={checkVerified}
          className="btn-primary mt-6 w-full justify-center"
          disabled={checking}
        >
          {checking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Checking…
            </>
          ) : (
            "I've verified — continue"
          )}
        </button>

        <button
          onClick={resend}
          className="btn-ghost mt-3 w-full justify-center"
          disabled={resending}
        >
          {resending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" /> Resend email
            </>
          )}
        </button>

        <button
          onClick={() => signOut().then(() => router.push("/login"))}
          className="mt-4 text-xs text-ink/50 hover:text-ink"
        >
          Use a different account
        </button>
      </div>
    </AuthShell>
  );
}
