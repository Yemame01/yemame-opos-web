"use client";

import { useState } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Check,
} from "lucide-react";
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/lib/useAuth";
import { requireAuth, requireDb } from "@/lib/firebase";
import { PageHeader } from "@/components/account/ui";
import { PasswordField } from "@/components/PasswordField";

export default function ProfilePage() {
  const { user, resendVerification } = useAuth();

  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your account details." />
      <div className="grid gap-5 lg:grid-cols-2">
        <NameCard />
        <EmailCard onResend={resendVerification} verified={!!user?.emailVerified} email={user?.email || ""} />
        <PasswordCard />
      </div>
    </>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function NameCard() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setDone(false);
    if (!name.trim()) {
      setErr("Name can't be empty.");
      return;
    }
    setBusy(true);
    try {
      const u = requireAuth().currentUser!;
      await updateProfile(u, { displayName: name.trim() });
      await setDoc(
        doc(requireDb(), "users", u.uid),
        { name: name.trim() },
        { merge: true },
      );
      setDone(true);
    } catch {
      setErr("Couldn't save your name. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Your name">
      <form onSubmit={save} className="space-y-3">
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/35" />
          <input
            className="field pl-10"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDone(false);
            }}
            placeholder="Your name"
          />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn-primary" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {done ? "Saved ✓" : "Save name"}
        </button>
      </form>
    </Card>
  );
}

function EmailCard({
  email,
  verified,
  onResend,
}: {
  email: string;
  verified: boolean;
  onResend: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const resend = async () => {
    setBusy(true);
    try {
      await onResend();
      setSent(true);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Email">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-ink/35" />
        <span className="font-medium">{email}</span>
      </div>
      <div className="mt-3">
        {verified ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
            <ShieldCheck className="h-4 w-4" /> Verified
          </span>
        ) : (
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
              <ShieldAlert className="h-4 w-4" /> Not verified
            </span>
            <div>
              <button
                onClick={resend}
                disabled={busy || sent}
                className="btn-ghost"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : sent ? (
                  <Check className="h-4 w-4" />
                ) : null}
                {sent ? "Verification sent" : "Resend verification"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setDone(false);
    if (next.length < 8) {
      setErr("New password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const u = requireAuth().currentUser!;
      // Re-authenticate first (Firebase requires recent login to change password).
      const cred = EmailAuthProvider.credential(u.email!, current);
      await reauthenticateWithCredential(u, cred);
      await updatePassword(u, next);
      setDone(true);
      setCurrent("");
      setNext("");
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code || "";
      setErr(
        code === "auth/wrong-password" || code === "auth/invalid-credential"
          ? "Your current password is incorrect."
          : code === "auth/weak-password"
            ? "New password is too weak."
            : "Couldn't change your password. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Change password">
      <form onSubmit={change} className="space-y-3">
        <div>
          <label className="label">Current password</label>
          <PasswordField
            id="current"
            value={current}
            onChange={setCurrent}
            autoComplete="current-password"
            disabled={busy}
          />
        </div>
        <div>
          <label className="label">New password</label>
          <PasswordField
            id="newpass"
            value={next}
            onChange={setNext}
            autoComplete="new-password"
            disabled={busy}
          />
          <p className="mt-1 text-xs text-ink/50">At least 8 characters</p>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn-primary" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {done ? "Password changed ✓" : "Update password"}
        </button>
      </form>
    </Card>
  );
}
