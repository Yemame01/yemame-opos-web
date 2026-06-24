// functions/src/services/email/send.ts
// Core Resend email sender for OPOS auth emails. Mirrors yemame-pos emailService.
// RESEND_API_KEY is a Secret Manager secret (declared in config/options.ts).

const FROM_AUTH = "Yemame OPOS <auth@yemame.com>";

interface SendResult {
  success: boolean;
  error?: string;
}

function getApiKey(): string {
  const key = process.env.RESEND_API_KEY || "";
  if (!key) throw new Error("RESEND_API_KEY is not configured.");
  return key;
}

/** Send one HTML email via Resend. Never throws — returns {success,error}. */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from: string = FROM_AUTH,
): Promise<SendResult> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      console.error("[email] Resend error:", err);
      return { success: false, error: err.message || "Failed to send email" };
    }
    console.log(`[email] sent "${subject}" to ${to}`);
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to send email";
    console.error("[email] send failed:", msg);
    return { success: false, error: msg };
  }
}

export { FROM_AUTH };
