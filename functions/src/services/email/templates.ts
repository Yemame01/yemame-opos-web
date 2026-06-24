// functions/src/services/email/templates.ts
// OPOS transactional email templates. Mirrors the yemame-pos email design
// (Inter font, teal gradient header, white card, rounded CTA, footer) but with
// Yemame OPOS branding. One self-contained base template wraps every email.

// OPOS brand palette (matches the store UI: teal primary, amber accent, ink).
const COLORS = {
  primary: "#05696B",
  primaryDark: "#034041",
  accent: "#F9B233",
  white: "#ffffff",
  ink: "#1E1E1E",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray500: "#6B7280",
  gray400: "#9CA3AF",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
};

// The OPOS logo (served from the store origin; flattened PNG with rounded look).
const LOGO_URL = "https://opos.yemame.com/icon-192.png";
const SITE = "https://opos.yemame.com";

interface BaseParams {
  title: string;
  preheader?: string;
  content: string;
}

/** Shared shell: gradient header with logo, white body, footer. */
function baseTemplate({ title, preheader, content }: BaseParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${preheader ? `<meta name="description" content="${preheader}" />` : ""}
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:'Inter','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:${COLORS.gray50};">
  ${
    preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>`
      : ""
  }
  <div style="background-color:#f1f5f5;padding:24px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:${COLORS.white};border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(3,64,65,0.08);">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,${COLORS.primary} 0%,${COLORS.primaryDark} 100%);padding:36px 30px 30px;text-align:center;">
                <img src="${LOGO_URL}" alt="Yemame OPOS" width="64" height="64" style="width:64px;height:64px;border-radius:16px;display:inline-block;margin-bottom:14px;" />
                <h1 style="margin:0;color:${COLORS.white};font-size:26px;font-weight:800;letter-spacing:-0.4px;">${title}</h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:36px 32px;">
                ${content}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background-color:#f8fafa;padding:26px 32px;text-align:center;border-top:1px solid #e8edec;">
                <p style="margin:0 0 6px;color:${COLORS.gray500};font-size:13px;line-height:1.6;">
                  <strong>Yemame OPOS</strong><br/>Sell offline. Never miss a sale.
                </p>
                <p style="margin:14px 0 0;">
                  <a href="${SITE}" style="color:${COLORS.primary};text-decoration:none;margin:0 8px;font-size:13px;font-weight:500;">Website</a>
                  <a href="mailto:support@yemame.com" style="color:${COLORS.primary};text-decoration:none;margin:0 8px;font-size:13px;font-weight:500;">Support</a>
                </p>
                <p style="margin:16px 0 0;color:${COLORS.gray400};font-size:12px;">
                  © ${new Date().getFullYear()} Yemame. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

function ctaButton(url: string, label: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0;">
    <tr><td align="center">
      <a href="${url}" style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg,${COLORS.primary} 0%,${COLORS.primaryDark} 100%);color:${COLORS.white};text-decoration:none;font-weight:700;font-size:16px;border-radius:12px;box-shadow:0 8px 20px rgba(5,105,107,0.3);">${label}</a>
    </td></tr>
  </table>`;
}

function fallbackLink(url: string): string {
  return `<p style="margin:18px 0 6px;color:${COLORS.gray500};font-size:13px;">Button not working? Copy and paste this link:</p>
  <p style="margin:0;padding:12px;background-color:${COLORS.gray100};border-radius:8px;word-break:break-all;font-size:12px;"><a href="${url}" style="color:${COLORS.primary};text-decoration:underline;">${url}</a></p>`;
}

// ==================== VERIFY EMAIL ====================
export function verifyEmailTemplate(name: string, verifyUrl: string): string {
  const greeting = name ? `Hi <strong>${name}</strong>,` : "Hi there,";
  const content = `
    <p style="margin:0 0 18px;color:${COLORS.ink};font-size:16px;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 8px;color:${COLORS.ink};font-size:16px;line-height:1.6;">
      Welcome to Yemame OPOS — the offline point of sale for shops. Confirm your email to secure your account and start buying activation keys.
    </p>
    ${ctaButton(verifyUrl, "Verify my email")}
    ${fallbackLink(verifyUrl)}
    <div style="margin:26px 0 0;padding:14px 16px;background-color:${COLORS.warningBg};border-radius:8px;border-left:4px solid ${COLORS.warning};">
      <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
        <strong>Note:</strong> This link expires in a few days. If you didn't create a Yemame OPOS account, you can safely ignore this email.
      </p>
    </div>`;
  return baseTemplate({
    title: "Confirm your email 🏪",
    preheader: "Verify your email to start using Yemame OPOS.",
    content,
  });
}

// ==================== PASSWORD RESET ====================
export function passwordResetTemplate(email: string, resetUrl: string): string {
  const content = `
    <p style="margin:0 0 18px;color:${COLORS.ink};font-size:16px;line-height:1.6;">Hello,</p>
    <p style="margin:0 0 8px;color:${COLORS.ink};font-size:16px;line-height:1.6;">
      We received a request to reset the password for your Yemame OPOS account (<strong>${email}</strong>). Click below to choose a new one.
    </p>
    ${ctaButton(resetUrl, "Reset my password")}
    ${fallbackLink(resetUrl)}
    <div style="margin:26px 0 0;padding:14px 16px;background-color:${COLORS.warningBg};border-radius:8px;border-left:4px solid ${COLORS.warning};">
      <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
        <strong>⚠️ Security reminder:</strong> This link expires in <strong>1 hour</strong>. If you didn't request a reset, ignore this email — your password stays the same.
      </p>
    </div>`;
  return baseTemplate({
    title: "Reset your password",
    preheader: "Use this secure link to reset your Yemame OPOS password.",
    content,
  });
}

// ==================== WELCOME (post-verification) ====================
export function welcomeTemplate(name: string): string {
  const greeting = name ? `Hi <strong>${name}</strong>,` : "Hi there,";
  const content = `
    <p style="margin:0 0 18px;color:${COLORS.ink};font-size:16px;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 18px;color:${COLORS.ink};font-size:16px;line-height:1.6;">
      Your email is verified — welcome aboard! 🎉 Here's how to get selling with Yemame OPOS:
    </p>
    <ol style="margin:0 0 8px;padding-left:20px;color:${COLORS.ink};font-size:15px;line-height:1.9;">
      <li>Buy an activation key for the plan that fits your shop.</li>
      <li>Download Yemame OPOS for macOS or Windows.</li>
      <li>Enter your key once to activate — then sell with or without internet.</li>
    </ol>
    ${ctaButton(`${SITE}/buy`, "Choose a plan")}
    <p style="margin:26px 0 0;color:${COLORS.gray500};font-size:14px;line-height:1.6;">
      Questions? Just reply to this email or reach us at <a href="mailto:support@yemame.com" style="color:${COLORS.primary};">support@yemame.com</a>.
    </p>`;
  return baseTemplate({
    title: "Welcome to Yemame OPOS! 🎉",
    preheader: "Your account is verified — here's how to get started.",
    content,
  });
}
