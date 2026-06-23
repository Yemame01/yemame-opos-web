"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { Brand } from "@/components/Brand";
import { AuthShell } from "@/components/AuthShell";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch {
      setError("Wrong email or password. Please try again.");
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
        <h1 className="mt-5 text-center text-xl font-bold">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-ink/55">
          Log in to manage your licenses.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-ink/60">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-teal-600">
            Create an account
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-ink/50">
          <Link href="/terms" className="hover:text-teal-600">
            Terms
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="hover:text-teal-600">
            Privacy
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
