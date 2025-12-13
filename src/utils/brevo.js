const DEFAULT_BREVO_URL =
  "https://brevo-project-production.up.railway.app/send-email";

const BREVO_EMAIL_URL =
  import.meta.env?.VITE_BREVO_EMAIL_URL?.trim() || DEFAULT_BREVO_URL;

/**
 * Send transactional email via Brevo bridge.
 * Expects backend to accept POST { email, subject, message, htmlContent? }.
 */
export async function sendBrevoEmail({ to, subject, message, htmlContent }) {
  const recipient = String(to || "").trim();
  if (!recipient) {
    throw new Error("Qabul qiluvchi email topilmadi.");
  }
  if (!subject || !message) {
    throw new Error("Email uchun subject va message zarur.");
  }

  const response = await fetch(BREVO_EMAIL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: recipient,
      message,
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Brevo yuborishda xatolik (${response.status}): ${text || "no detail"}`
    );
  }

  const contentType = String(response.headers.get("content-type") || "");
  if (contentType.toLowerCase().includes("application/json")) {
    return response.json().catch(() => ({}));
  }
  return {};
}

export function getBrevoEndpoint() {
  return BREVO_EMAIL_URL;
}
