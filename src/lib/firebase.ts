// src/lib/firebase.ts — Firebase web client for the OPOS store (yemame-opos project).
//
// Init is guarded so the module can be imported during SSR/prerender without a
// configured key: if the apiKey is absent (e.g. a build with placeholder env),
// the exports are null and client code simply waits. In the browser with real
// env vars, these are live instances. All real usage is client-side.

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";

// The Firebase WEB config is public by design — it ships in the browser bundle
// and is safe to commit (security comes from Firestore/Storage rules + App
// Check, not from hiding these). We hardcode it as a fallback so the app never
// breaks if a deploy is missing the NEXT_PUBLIC_* env vars (which silently broke
// signup before). Env vars still take precedence if set. Mirrors yemame-website.
const FALLBACK = {
  apiKey: "AIzaSyCZ3nxVIkMPy-Ah24RyEh-bXKJtZFHdXwU",
  authDomain: "yemame-opos.firebaseapp.com",
  projectId: "yemame-opos",
  storageBucket: "yemame-opos.firebasestorage.app",
  messagingSenderId: "148234079401",
  appId: "1:148234079401:web:aee00c9665985bf7006db8",
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || FALLBACK.apiKey,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || FALLBACK.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || FALLBACK.projectId,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || FALLBACK.storageBucket,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    FALLBACK.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || FALLBACK.appId,
};

// A real key looks like "AIza...". A placeholder/empty key means "not configured"
// — don't initialize (avoids auth/invalid-api-key crashing a prerender build).
const isConfigured =
  typeof firebaseConfig.apiKey === "string" &&
  firebaseConfig.apiKey.startsWith("AIza");

const app: FirebaseApp | null = isConfigured
  ? getApps().length
    ? getApps()[0]!
    : initializeApp(firebaseConfig)
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const functions: Functions | null = app
  ? getFunctions(app, "us-central1")
  : null;

/** True when Firebase is configured (real env present, i.e. in the browser). */
export const firebaseReady = app !== null;

// Non-null accessors for client code. These run only after firebaseReady is
// confirmed (client-side), so the throw is a guard that never fires in practice.
export function requireAuth(): Auth {
  if (!auth) throw new Error("Firebase auth is not configured.");
  return auth;
}
export function requireDb(): Firestore {
  if (!db) throw new Error("Firestore is not configured.");
  return db;
}
export function requireFunctions(): Functions {
  if (!functions) throw new Error("Firebase functions are not configured.");
  return functions;
}
