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

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
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
