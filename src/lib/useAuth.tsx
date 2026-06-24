"use client";

// src/lib/useAuth.tsx — auth context for the OPOS store.
// Signup creates the Firebase user + their profile doc; the profile-doc write
// triggers a Cloud Function that emails a verification link (Resend, branded).
// Password reset / resend-verification go through callables so the emails are
// ours (not Firebase's default), matching the yemame-pos approach.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  firebaseReady,
  requireAuth,
  requireDb,
  requireFunctions,
} from "./firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(requireAuth(), (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(requireAuth(), email.trim(), password);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(
      requireAuth(),
      email.trim(),
      password,
    );
    await updateProfile(cred.user, { displayName: name.trim() });
    // Seed the buyer's profile doc (rules allow the owner to create their own).
    await setDoc(doc(requireDb(), "users", cred.user.uid), {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      createdAt: serverTimestamp(),
    });
    // Send the branded verification email via our callable. Best-effort — the
    // user can always resend from the verify-email screen if this hiccups.
    try {
      const fn = httpsCallable(requireFunctions(), "resendVerificationEmail");
      await fn({});
    } catch {
      /* non-fatal; verify-email page offers a resend button */
    }
  };

  const signOut = async () => {
    await fbSignOut(requireAuth());
  };

  const resetPassword = async (email: string) => {
    const fn = httpsCallable(requireFunctions(), "requestPasswordReset");
    await fn({ email: email.trim().toLowerCase() });
  };

  const resendVerification = async () => {
    const fn = httpsCallable(requireFunctions(), "resendVerificationEmail");
    await fn({});
  };

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        resendVerification,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
