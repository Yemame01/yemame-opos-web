// functions/src/utils/db.ts
// Shared Firestore helpers (mirrors yemame-pos webhooks/paystack/utils.ts).
import * as admin from "firebase-admin";

export const getDb = () => admin.firestore();

/** Append an entry to an admin audit log: adminLogs/{bucket}/entries/{auto}. */
export async function logAdmin(
  bucket: "payments" | "security" | "licenses",
  action: string,
  details: Record<string, unknown>,
): Promise<void> {
  await getDb()
    .collection("adminLogs")
    .doc(bucket)
    .collection("entries")
    .add({
      action,
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
}
