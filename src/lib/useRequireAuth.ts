"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

/** Redirect to /login once we know there's no signed-in user. */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);
  return { user, loading };
}
