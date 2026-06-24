// functions/src/auth/authEmails.ts
// Auth transactional emails for the OPOS store, sent via Resend with branded
// templates. Verification + password-reset links are minted by the Admin SDK
// (Firebase manages the secure action codes); we deliver them ourselves so the
// emails match Yemame branding (mirrors the yemame-pos approach).

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { lightHttpOptions } from "../config/options";
import { sendEmail } from "../services/email/send";
import {
  verifyEmailTemplate,
  passwordResetTemplate,
  welcomeTemplate,
} from "../services/email/templates";

const SITE = "https://opos.yemame.com";
const ACTION_URL = `${SITE}/auth/action`;

/** Action-code settings (continueUrl must be an authorized domain). */
function actionSettings(): admin.auth.ActionCodeSettings {
  return { url: ACTION_URL, handleCodeInApp: false };
}

// Firebase's generate*Link() returns a link to its hosted handler
// (yemame-opos.firebaseapp.com/__/auth/action). The oobCode inside is portable —
// applyActionCode/confirmPasswordReset accept it on ANY page — so we extract it
// and point users at our OWN branded pages instead (no console action-URL needed).
function extractOob(link: string): string {
  return new URL(link).searchParams.get("oobCode") || "";
}
function verifyUrlFrom(link: string): string {
  const oob = extractOob(link);
  return `${SITE}/auth/action?mode=verifyEmail&oobCode=${encodeURIComponent(oob)}`;
}
function resetUrlFrom(link: string): string {
  const oob = extractOob(link);
  return `${SITE}/reset-password?oobCode=${encodeURIComponent(oob)}`;
}

// ==================== SEND VERIFICATION (callable) ====================
// Called by the client right after signup, and by the verify-email page's
// "resend" button. Mints a verification link and emails it (OPOS template).
export const resendVerificationEmail = onCall(lightHttpOptions, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
  const user = await admin.auth().getUser(uid);
  if (!user.email) throw new HttpsError("failed-precondition", "No email.");
  if (user.emailVerified) return { sent: false, alreadyVerified: true };

  const link = await admin
    .auth()
    .generateEmailVerificationLink(user.email, actionSettings());
  const name = (user.displayName || "").split(" ")[0] || "";
  const r = await sendEmail(
    user.email,
    "Verify your email — Yemame OPOS",
    verifyEmailTemplate(name, verifyUrlFrom(link)),
  );
  if (!r.success) throw new HttpsError("internal", "Could not send email.");
  return { sent: true };
});

// ==================== PASSWORD RESET (callable) ====================
// Enumeration-safe: always returns {ok:true} even when no account exists.
export const requestPasswordReset = onCall(lightHttpOptions, async (req) => {
  const email = String(req.data?.email || "")
    .trim()
    .toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "Enter a valid email.");
  }
  try {
    const link = await admin
      .auth()
      .generatePasswordResetLink(email, actionSettings());
    await sendEmail(
      email,
      "Reset your password — Yemame OPOS",
      passwordResetTemplate(email, resetUrlFrom(link)),
    );
  } catch (e: unknown) {
    // user-not-found etc. → stay silent to prevent enumeration.
    const code = (e as { code?: string })?.code || "";
    if (code !== "auth/user-not-found") {
      console.error("[authEmails] reset send failed:", e);
    }
  }
  return { ok: true };
});

// ==================== WELCOME (callable, post-verification) ====================
// The /auth/action page calls this once it confirms the email is verified.
export const sendWelcomeEmail = onCall(lightHttpOptions, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
  const user = await admin.auth().getUser(uid);
  if (!user.email || !user.emailVerified) {
    return { sent: false };
  }
  // Only send once — track on the user's profile doc.
  const ref = admin.firestore().collection("users").doc(uid);
  const snap = await ref.get();
  if (snap.exists && snap.data()?.welcomeSentAt) return { sent: false };

  const name = (user.displayName || "").split(" ")[0] || "";
  await sendEmail(
    user.email,
    "Welcome to Yemame OPOS! 🎉",
    welcomeTemplate(name),
  );
  await ref.set(
    { welcomeSentAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true },
  );
  return { sent: true };
});
