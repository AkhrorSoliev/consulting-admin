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

  // Get all updates without offset to see all groups
  const url = `https://api.telegram.org/bot${token}/getUpdates?limit=${encodeURIComponent(
    String(lim)
  )}`;

  let res;
  let json;
  try {
    res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    json = await safeJson(res);
  } catch (fetchError) {
    const e = new Error("telegram-api-fetch-failed");
    e.code = "telegram-api-fetch-failed";
    e.status = 502;
    e.details = {
      message: String(fetchError?.message || fetchError),
      name: fetchError?.name,
    };
    throw e;
  }

  if (!res.ok || json?.ok !== true) {
    const e = new Error("telegram-updates-failed");
    e.code = "telegram-updates-failed";
    e.status = 502;
    e.details = {
      httpStatus: res.status,
      telegram: json,
      description: json?.description || "Unknown error",
      errorCode: json?.error_code,
    };
    throw e;
  }

  const out = new Map(); // chat_id -> {chat_id,name,type}
  const updates = Array.isArray(json?.result) ? json.result : [];

  // If no updates found, return empty array (bot hasn't received any messages yet)
  if (updates.length === 0) {
    return [];
  }

  // Process all updates to find all groups
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

/**
 * Remove a user from a Telegram group/supergroup.
 *
 * @param {object} args
 * @param {string} args.botToken Telegram bot token (server secret)
 * @param {string|number} args.chatId Telegram chat_id (string or number)
 * @param {string|number} args.userId Telegram user_id to remove
 * @returns {Promise<{ok: boolean}>}
 */
async function removeChatMember({ botToken, chatId, userId } = {}) {
  const token = normalizeTelegramBotToken(botToken);
  if (!token) {
    const e = new Error("telegram-token-missing");
    e.code = "telegram-token-missing";
    e.status = 500;
    throw e;
  }

  assertTelegramBotTokenOrThrow(token);

  const safeChatId = String(chatId ?? "").trim();
  if (!safeChatId) {
    const e = new Error("telegram-chat_id-missing");
    e.code = "telegram-chat_id-missing";
    e.status = 500;
    throw e;
  }

  const safeUserId = String(userId ?? "").trim();
  if (!safeUserId) {
    const e = new Error("telegram-user_id-missing");
    e.code = "telegram-user_id-missing";
    e.status = 400;
    throw e;
  }

  const url = `https://api.telegram.org/bot${token}/banChatMember`;

  const body = {
    chat_id: safeChatId,
    user_id: safeUserId,
    revoke_messages: false,
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

  // Unban immediately so user can rejoin later if needed
  const unbanUrl = `https://api.telegram.org/bot${token}/unbanChatMember`;
  const unbanBody = {
    chat_id: safeChatId,
    user_id: safeUserId,
    only_if_banned: true,
  };

  await fetch(unbanUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(unbanBody),
  });

  return { ok: true };
}

/**
 * Get list of chat members (admins only for groups).
 *
 * @param {object} args
 * @param {string} args.botToken Telegram bot token (server secret)
 * @param {string|number} args.chatId Telegram chat_id (string or number)
 * @returns {Promise<Array<{ user_id: string, first_name: string, username: string, status: string }>>}
 */
async function getChatMembers({ botToken, chatId } = {}) {
  const token = normalizeTelegramBotToken(botToken);
  if (!token) {
    const e = new Error("telegram-token-missing");
    e.code = "telegram-token-missing";
    e.status = 500;
    throw e;
  }

  assertTelegramBotTokenOrThrow(token);

  const safeChatId = String(chatId ?? "").trim();
  if (!safeChatId) {
    const e = new Error("telegram-chat_id-missing");
    e.code = "telegram-chat_id-missing";
    e.status = 500;
    throw e;
  }

  // Note: getChatAdministrators is the only reliable way to get members from groups
  // For full member list, the group needs to be a supergroup and bot needs admin rights
  const url = `https://api.telegram.org/bot${token}/getChatAdministrators`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: safeChatId }),
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

  const members = Array.isArray(json?.result) ? json.result : [];
  return members.map((m) => ({
    user_id: String(m?.user?.id ?? "").trim(),
    first_name: String(m?.user?.first_name || "").trim(),
    username: String(m?.user?.username || "").trim(),
    status: String(m?.status || "").trim(),
  }));
}

/**
 * Remove a user from all groups where bot is admin.
 * Fetches all groups from telegram_groups collection and removes user from each.
 *
 * @param {object} args
 * @param {string} args.botToken Telegram bot token (server secret)
 * @param {string|number} args.userId Telegram user_id to remove
 * @param {object} args.db Firestore database instance
 * @returns {Promise<{ total: number, removed: number, failed: number, results: Array }>}
 */
async function removeUserFromAllGroups({ botToken, userId, db } = {}) {
  const token = normalizeTelegramBotToken(botToken);
  if (!token) {
    const e = new Error("telegram-token-missing");
    e.code = "telegram-token-missing";
    e.status = 500;
    throw e;
  }

  assertTelegramBotTokenOrThrow(token);

  const safeUserId = String(userId ?? "").trim();
  if (!safeUserId) {
    const e = new Error("telegram-user_id-missing");
    e.code = "telegram-user_id-missing";
    e.status = 400;
    throw e;
  }

  if (!db) {
    const e = new Error("database-instance-missing");
    e.code = "database-instance-missing";
    e.status = 500;
    throw e;
  }

  // Get all active groups from Firestore
  const groupsSnapshot = await db
    .collection("telegram_groups")
    .where("active", "==", true)
    .get();

  if (groupsSnapshot.empty) {
    return { total: 0, removed: 0, failed: 0, results: [] };
  }

  const results = [];
  let removed = 0;
  let failed = 0;

  // Try to remove user from each group
  for (const doc of groupsSnapshot.docs) {
    const groupData = doc.data();
    const chatId = String(groupData?.chat_id || "").trim();

    if (!chatId) {
      results.push({
        group_id: doc.id,
        group_name: groupData?.name || "Unknown",
        success: false,
        error: "Missing chat_id",
      });
      failed++;
      continue;
    }

    try {
      await removeChatMember({ botToken: token, chatId, userId: safeUserId });
      results.push({
        group_id: doc.id,
        group_name: groupData?.name || chatId,
        chat_id: chatId,
        success: true,
      });
      removed++;
    } catch (err) {
      const errorMsg = String(err?.message || err);
      // Ignore "user not found" or "user not in chat" errors
      const isNotMemberError =
        errorMsg.includes("USER_NOT_PARTICIPANT") ||
        errorMsg.includes("user not found") ||
        errorMsg.includes("PARTICIPANT_NOT_FOUND");

      results.push({
        group_id: doc.id,
        group_name: groupData?.name || chatId,
        chat_id: chatId,
        success: false,
        error: errorMsg,
        was_not_member: isNotMemberError,
      });
      failed++;
    }
  }

  return {
    total: groupsSnapshot.size,
    removed,
    failed,
    results,
  };
}

module.exports = {
  createOneTimeChatInviteLink,
  getTelegramChatsFromUpdates,
  removeChatMember,
  getChatMembers,
  removeUserFromAllGroups,
};
