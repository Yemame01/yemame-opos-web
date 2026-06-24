"use client";

// Post-checkout celebration. Paystack → /api/payment/callback →
// /dashboard?payment=success&ref=…. This overlay fires confetti and waits for
// the WEBHOOK to mint the license (we watch the user's licenses collection for
// the new key to appear), then shows it. Mirrors the POS payment-success UX.

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import {
  CheckCircle,
  Loader2,
  KeyRound,
  Copy,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { firebaseReady, requireDb } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { License } from "@/lib/types";

const TEAL = ["#0d9488", "#14b8a6", "#0f766e", "#F9B233"];

function burst() {
  const end = Date.now() + 1200;
  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.6 },
      colors: TEAL,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.6 },
      colors: TEAL,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

type Phase = "confirming" | "ready" | "pending" | "failed";

export function PaymentSuccess() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const payment = params.get("payment");

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("confirming");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const baselineCount = useRef<number | null>(null);
  const firedConfetti = useRef(false);

  // Open the overlay based on the callback's ?payment= status.
  useEffect(() => {
    if (!payment) return;
    setOpen(true);
    if (payment === "success" || payment === "pending") setPhase("confirming");
    else if (payment === "failed" || payment === "missing") setPhase("failed");
  }, [payment]);

  // Watch the user's licenses; when a new one appears (webhook minted it), reveal it.
  useEffect(() => {
    if (!open || phase === "failed" || !user || !firebaseReady) return;

    const unsub = onSnapshot(
      query(collection(requireDb(), "users", user.uid, "licenses")),
      (snap) => {
        const licenses = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as License,
        );
        const newest = licenses.sort(
          (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0),
        )[0];

        // Establish a baseline on the first snapshot. Two ways to detect the new
        // key: (a) the license count increases after baseline, or (b) the webhook
        // already landed and the newest license was created in the last 2 min.
        if (baselineCount.current === null) {
          baselineCount.current = licenses.length;
          const fresh =
            newest?.createdAt?.seconds &&
            Date.now() / 1000 - newest.createdAt.seconds < 120;
          if (fresh) {
            setNewKey(newest.key);
            setPhase("ready");
          }
          return;
        }
        if (licenses.length > baselineCount.current) {
          setNewKey(newest?.key ?? null);
          setPhase("ready");
        }
      },
      () => {},
    );
    return () => unsub();
  }, [open, phase, user]);

  // The webhook usually lands in seconds; if it's slow, fall back to a softer
  // "it's on its way" message so we never spin forever.
  useEffect(() => {
    if (phase !== "confirming") return;
    const t = setTimeout(() => {
      setPhase((p) => (p === "confirming" ? "pending" : p));
    }, 20000);
    return () => clearTimeout(t);
  }, [phase]);

  // Fire confetti once we reach a happy state.
  useEffect(() => {
    if ((phase === "ready" || phase === "pending") && !firedConfetti.current) {
      firedConfetti.current = true;
      burst();
    }
  }, [phase]);

  const close = () => {
    setOpen(false);
    // Strip the ?payment= params so a refresh doesn't re-open the modal.
    router.replace("/dashboard");
  };

  const copy = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-2xl">
        <button
          onClick={close}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-ink/40 transition hover:bg-black/5 hover:text-ink"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {phase === "confirming" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-600" />
            <h2 className="mt-4 text-xl font-bold">Confirming your purchase…</h2>
            <p className="mt-2 text-sm text-ink/60">
              Payment received. We&apos;re generating your activation key — this
              only takes a moment.
            </p>
          </>
        )}

        {phase === "ready" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
              <CheckCircle className="h-8 w-8 text-teal-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Your key is ready! 🎉</h2>
            <p className="mt-2 text-sm text-ink/60">
              Use this in Yemame OPOS to activate the app.
            </p>
            {newKey && (
              <button
                onClick={copy}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 font-mono text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
              >
                <KeyRound className="h-4 w-4" />
                {newKey}
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            )}
            <button onClick={close} className="btn-primary mt-5 w-full justify-center">
              View my licenses
            </button>
          </>
        )}

        {phase === "pending" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <CheckCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Payment received 🎉</h2>
            <p className="mt-2 text-sm text-ink/60">
              Your key is being issued and will appear under My Licenses within a
              minute. You can safely close this.
            </p>
            <button onClick={close} className="btn-primary mt-5 w-full justify-center">
              Got it
            </button>
          </>
        )}

        {phase === "failed" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Payment didn&apos;t go through</h2>
            <p className="mt-2 text-sm text-ink/60">
              You weren&apos;t charged. You can try again — and if money did leave
              your account, contact support and we&apos;ll sort it out.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setOpen(false);
                  router.replace("/buy");
                }}
                className="btn-primary flex-1 justify-center"
              >
                Try again
              </button>
              <button onClick={close} className="btn-ghost flex-1 justify-center">
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
