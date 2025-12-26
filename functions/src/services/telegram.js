/**
 * Telegram Bot API integration (server-side only).
 *
 * Requirements:
 * - create one-time invite links (member_limit = 1)
 * - never expose bot token to frontend
 *
 * Docs: https://core.telegram.org/bots/api#createchatinvitelink
 */

function toUnixSeconds(ms) {
  return Math.floor(Number(ms || Date.now()) / 1000);
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function normalizeTelegramBotToken(raw) {
  let s = String(raw ?? "").trim();
  if (!s) return "";

  // If the token exists somewhere inside a longer string, extract it.
  // This can happen if a user mistakenly stores a whole config/text blob as the secret value.
  // Telegram tokens look like: <digits>:<base64url-ish>
  const embedded = s.match(/(\d+:[A-Za-z0-9_-]{20,})/);
  if (embedded && typeof embedded[1] === "string" && embedded[1].trim()) {
    s = embedded[1].trim();
  }

  // If someone accidentally stored a full URL like:
  // https://api.telegram.org/bot<token>/getUpdates
  // Extract <token>.
  const m = s.match(/(?:^|\/)bot([^\/\s\?]+)(?:[\/\?]|$)/i);
  if (m && typeof m[1] === "string" && m[1].trim()) {
    s = m[1].trim();
  }

  // If someone stored "bot<token>" directly.
  if (s.toLowerCase().startsWith("bot") && s.includes(":")) {
    s = s.slice(3).trim();
  }

  // Strip surrounding quotes (common when pasting into CLI).
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }

  // Remove any accidental whitespace anywhere (token should never contain spaces).
  s = s.replace(/\s+/g, "");
  return s;
}

function assertTelegramBotTokenOrThrow(token) {
  // Keep this validation permissive but safe.
  // Telegram tokens must contain ":" and typically start with digits.
  const t = String(token ?? "").trim();
  const ok = /^\d+:[^\s/]+$/.test(t);
  if (ok) return;
  const e = new Error("telegram-token-invalid-format");
  e.code = "telegram-token-invalid-format";
  e.status = 500;
  // Do NOT include token itself in details.
  e.details = { length: t.length, hasColon: t.includes(":") };
  throw e;
}

/**
 * Create a one-time invite link for a Telegram group/supergroup.
 *
 * @param {object} args
 * @param {string} args.botToken Telegram bot token (server secret)
 * @param {string|number} args.chatId Telegram chat_id (string or number)
 * @param {number|null} [args.expireSeconds=null] Optional: expire time (seconds). If null/0, link has no time limit.
 * @param {number} [args.memberLimit=1] Max members who can join via link
 * @returns {Promise<{invite_link: string, expire_date: (number|null)}>}
 */
async function createOneTimeChatInviteLink({
  botToken,
  chatId,
  expireSeconds = null,
  memberLimit = 1,
} = {}) {
  const token = normalizeTelegramBotToken(botToken);
  if (!token) {
    const e = new Error("telegram-token-missing");
    e.code = "telegram-token-missing";
    e.status = 500;
    throw e;
  }

  // Token must NOT be URL-encoded in the API path (":" is required in bot tokens).
  assertTelegramBotTokenOrThrow(token);

  const safeChatId = String(chatId ?? "").trim();
  if (!safeChatId) {
    const e = new Error("telegram-chat_id-missing");
    e.code = "telegram-chat_id-missing";
    e.status = 500;
    throw e;
  }

  const limit = Math.max(1, Math.min(1, Math.floor(Number(memberLimit) || 1))); // enforce 1
  const expiresIn = Number(expireSeconds);
  const includeExpireDate = Number.isFinite(expiresIn) && expiresIn > 0;
  const expire_date = includeExpireDate
    ? toUnixSeconds(Date.now() + Math.max(60, expiresIn) * 1000)
    : null;

  const url = `https://api.telegram.org/bot${token}/createChatInviteLink`;

  const body = {
    chat_id: safeChatId,
    member_limit: limit,
    creates_join_request: false,
    ...(includeExpireDate ? { expire_date } : {}),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await safeJson(res);
  if (!res.ok || json?.ok !== true) {
    const e = new Error("telegram-api-failed");
    e.code = "telegram-api-failed";
    e.status = 502;
    e.details = {
      httpStatus: res.status,
      telegram: json,
    };
    throw e;
  }

  const invite_link = String(json?.result?.invite_link || "").trim();
  if (!invite_link) {
    const e = new Error("telegram-invite-missing");
    e.code = "telegram-invite-missing";
    e.status = 502;
    throw e;
  }

  return { invite_link, expire_date };
}

/**
 * Fetch recent chats from Telegram updates.
 * Note: bot will only see groups/channels that appear in updates (e.g. you send a message, or bot receives a membership update).
 *
 * @param {object} args
 * @param {string} args.botToken
 * @param {number} [args.limit=100]
 * @returns {Promise<Array<{ chat_id: string, name: string, type: string }>>}
 */
async function getTelegramChatsFromUpdates({ botToken, limit = 100 } = {}) {
  const token = normalizeTelegramBotToken(botToken);
  if (!token) {
    const e = new Error("telegram-token-missing");
    e.code = "telegram-token-missing";
    e.status = 500;
    throw e;
  }

  assertTelegramBotTokenOrThrow(token);

  const lim = Math.max(1, Math.min(100, Math.floor(Number(limit) || 100)));
  const url = `https://api.telegram.org/bot${token}/getUpdates?limit=${encodeURIComponent(
    String(lim)
  )}`;

  const res = await fetch(url, { method: "GET" });
  const json = await safeJson(res);
  if (!res.ok || json?.ok !== true) {
    const e = new Error("telegram-updates-failed");
    e.code = "telegram-updates-failed";
    e.status = 502;
    e.details = { httpStatus: res.status, telegram: json };
    throw e;
  }

  const out = new Map(); // chat_id -> {chat_id,name,type}
  const updates = Array.isArray(json?.result) ? json.result : [];
  updates.forEach((u) => {
    const chat =
      u?.message?.chat ||
      u?.channel_post?.chat ||
      u?.my_chat_member?.chat ||
      u?.chat_member?.chat ||
      null;
    if (!chat) return;
    const type = String(chat?.type || "").trim();
    // Accept groups/supergroups/channels only
    if (!["group", "supergroup", "channel"].includes(type)) return;
    const chat_id = String(chat?.id ?? "").trim();
    if (!chat_id) return;
    const name =
      String(chat?.title || "").trim() ||
      (chat?.username ? `@${String(chat.username).trim()}` : "") ||
      chat_id;
    out.set(chat_id, { chat_id, name, type });
  });

  return Array.from(out.values()).sort((a, b) =>
    String(a?.name || "").localeCompare(String(b?.name || ""))
  );
}

module.exports = { createOneTimeChatInviteLink, getTelegramChatsFromUpdates };


