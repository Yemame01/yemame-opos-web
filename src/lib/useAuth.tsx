"use client";

// src/lib/useAuth.tsx — minimal auth context for the OPOS store.
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
import { firebaseReady, requireAuth, requireDb } from "./firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Without configured Firebase (e.g. a placeholder build) there's no auth to
    // observe — stop loading so the UI can render its signed-out state.
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
      email: email.trim(),
      name: name.trim(),
      createdAt: serverTimestamp(),
    });
  };

  const signOut = async () => {
    await fbSignOut(requireAuth());
  };

  return (
    <AuthCtx.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
