import { auth } from "../firebase/config";

function getFunctionsBaseUrl() {
  const env = import.meta.env || {};
  const explicit = String(env.VITE_FUNCTIONS_BASE || "").trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }
  const projectId = String(env.VITE_FIREBASE_PROJECT_ID || "").trim();
  if (projectId) {
    return `https://us-central1-${projectId}.cloudfunctions.net`;
  }
  return "https://us-central1-consulting-bdb74.cloudfunctions.net";
}

/**
 * Remove a user from all Telegram groups where bot is admin
 * @param {string} telegramId - Telegram user ID
 * @returns {Promise<{ok: boolean, total: number, removed: number, failed: number, results: Array}>}
 */
export async function removeUserFromTelegramGroups(telegramId) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    const url = `${getFunctionsBaseUrl()}/removeUserFromTelegramGroups`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ telegramId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.details || errorData.error || `HTTP ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}
