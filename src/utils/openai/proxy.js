import { auth } from "../../firebase/config";

export function getMotivationModel() {
  const env = import.meta.env || {};
  const configured = String(env.VITE_OPENAI_MOTIVATION_MODEL || "").trim();
  return configured || "gpt-4o-mini";
}

function getProxyUrl() {
  const env = import.meta.env || {};
  const base = String(env.VITE_FUNCTIONS_BASE || "")
    .trim()
    .replace(/\/+$/, "");
  if (!base) {
    throw new Error("VITE_FUNCTIONS_BASE not configured in .env");
  }
  return `${base}/openaiProxy`;
}

export async function callOpenAIProxy(messages, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();
  const url = getProxyUrl();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messages,
      model: options.model || "gpt-4o-mini",
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI API error: ${errorData.details || errorData.error || response.statusText}`,
    );
  }

  const result = await response.json();
  if (!result.ok) {
    throw new Error(`OpenAI API error: ${result.details || result.error}`);
  }

  return result.data;
}
