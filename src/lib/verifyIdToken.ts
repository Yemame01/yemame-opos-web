// src/lib/verifyIdToken.ts
//
// Server-side verification of a Firebase ID token WITHOUT the Admin SDK (no
// service account needed in the Next.js runtime). We call Google's Identity
// Toolkit accounts:lookup with the token; it returns the user record only if the
// token is genuine, unexpired, and issued for THIS project's API key. We then
// confirm the returned localId/email — so the caller can't spoof someone else's
// uid in a request body.
//
// This is the trust anchor for "mint the license to the RIGHT account".

interface VerifiedUser {
  uid: string;
  email: string;
}

export async function verifyIdToken(
  idToken: string | undefined | null,
): Promise<VerifiedUser | null> {
  if (!idToken) return null;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const user = Array.isArray(data.users) ? data.users[0] : null;
    if (!user?.localId) return null;
    return { uid: user.localId as string, email: (user.email ?? "") as string };
  } catch {
    return null;
  }
}

/** Pull a Bearer token from the Authorization header. */
export function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}
