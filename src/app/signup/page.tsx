"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { Brand } from "@/components/Brand";

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      await signUp(name, email, password);
      router.push("/buy");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setError(
        code === "auth/email-already-in-use"
          ? "That email already has an account. Try logging in."
          : "Couldn't create your account. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="card w-full max-w-sm p-7">
        <Link href="/" className="block text-center">
          <Brand className="text-xl" />
        </Link>
        <h1 className="mt-5 text-center text-xl font-bold">Create your account</h1>
        <p className="mt-1 text-center text-sm text-ink/60">
          Buy and manage your OPOS licenses.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Your name</label>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-ink/50">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="font-medium text-teal-600">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-teal-600">
            Privacy Policy
          </Link>
          . Buy activation keys only from Yemame.
        </p>
        <p className="mt-5 text-center text-sm text-ink/60">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-teal-600">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
