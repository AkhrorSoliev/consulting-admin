const { onRequest } = require("firebase-functions/v2/https");
const { onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { Telegraf } = require("telegraf");
const {
  createOneTimeChatInviteLink,
  getTelegramChatsFromUpdates,
  removeChatMember,
  getChatMembers,
  removeUserFromAllGroups,
} = require("../services/telegram");
const { getDb } = require("../utils/admin");
const { setCors } = require("../utils/http");
const { verifyFirebaseIdToken, assertAdminLikeClaims } = require("../utils/auth");

const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");
const initBot = require("../bot/index");

// POST /generateInvite
exports.generateInvite = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const db = getDb();
      const groupId = String(req.body?.groupId || "").trim();
      if (!groupId) {
        return res.status(400).json({ ok: false, error: "missing-groupId" });
      }

      const snap = await db.collection("telegram_groups").doc(groupId).get();
      if (!snap.exists) {
        return res.status(404).json({ ok: false, error: "group-not-found" });
      }
      const data = snap.data() || {};
      if (data.active === false) {
        return res.status(403).json({ ok: false, error: "group-inactive" });
      }
      const chatId = String(data.chat_id || "").trim();
      if (!chatId) {
        return res
          .status(500)
          .json({ ok: false, error: "group-missing-chat_id" });
      }

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      const { invite_link } = await createOneTimeChatInviteLink({
        botToken,
        chatId,
        expireSeconds: null,
        memberLimit: 1,
      });

      try {
        const admin = require("firebase-admin");
        await db
          .collection("telegram_groups")
          .doc(groupId)
          .set(
            {
              linksSentCount: admin.firestore.FieldValue.increment(1),
              linksSentLastAt: admin.firestore.FieldValue.serverTimestamp(),
              linksGeneratedCount: admin.firestore.FieldValue.increment(1),
              linksGeneratedLastAt:
                admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      } catch (e) {
        logger.warn("generateInvite stats update failed", {
          groupId,
          err: String(e?.message || e),
        });
      }

      return res.status(200).json({ ok: true, invite_link });
    } catch (err) {
      logger.error("generateInvite error", err);
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      let details;
      if (err?.details && typeof err.details === "object") {
        const tg = err.details.telegram;
        if (tg?.description) {
          details = `${tg.description} (error_code: ${tg.error_code || "unknown"})`;
        } else {
          details = JSON.stringify(err.details);
        }
      } else {
        details = String(err?.message || err);
      }
      return res
        .status(status)
        .json({ ok: false, error: code, details: details || undefined });
    }
  },
);

// POST /generateChannelInvite
exports.generateChannelInvite = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const db = getDb();
      const channelId = String(req.body?.channelId || "").trim();
      if (!channelId) {
        return res.status(400).json({ ok: false, error: "missing-channelId" });
      }

      const snap = await db
        .collection("telegram_channels")
        .doc(channelId)
        .get();
      if (!snap.exists) {
        return res.status(404).json({ ok: false, error: "channel-not-found" });
      }
      const data = snap.data() || {};
      if (data.active === false) {
        return res.status(403).json({ ok: false, error: "channel-inactive" });
      }
      const chatId = String(data.chat_id || "").trim();
      if (!chatId) {
        return res
          .status(500)
          .json({ ok: false, error: "channel-missing-chat_id" });
      }

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      const { invite_link } = await createOneTimeChatInviteLink({
        botToken,
        chatId,
        expireSeconds: null,
        memberLimit: 1,
      });

      try {
        const admin = require("firebase-admin");
        await db
          .collection("telegram_channels")
          .doc(channelId)
          .set(
            {
              linksSentCount: admin.firestore.FieldValue.increment(1),
              linksSentLastAt: admin.firestore.FieldValue.serverTimestamp(),
              linksGeneratedCount: admin.firestore.FieldValue.increment(1),
              linksGeneratedLastAt:
                admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      } catch (e) {
        logger.warn("generateChannelInvite stats update failed", {
          channelId,
          err: String(e?.message || e),
        });
      }

      return res.status(200).json({ ok: true, invite_link });
    } catch (err) {
      logger.error("generateChannelInvite error", err);
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      let details;
      if (err?.details && typeof err.details === "object") {
        const tg = err.details.telegram;
        if (tg?.description) {
          details = `${tg.description} (error_code: ${tg.error_code || "unknown"})`;
        } else {
          details = JSON.stringify(err.details);
        }
      } else {
        details = String(err?.message || err);
      }
      return res
        .status(status)
        .json({ ok: false, error: code, details: details || undefined });
    }
  },
);

// POST /trackInviteSent
exports.trackInviteSent = onRequest(async (req, res) => {
  try {
    setCors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "method-not-allowed" });
    }

    const decoded = await verifyFirebaseIdToken(req);
    assertAdminLikeClaims(decoded);

    const db = getDb();
    const admin = require("firebase-admin");
    const groupId = String(req.body?.groupId || "").trim();
    if (!groupId) {
      return res.status(400).json({ ok: false, error: "missing-groupId" });
    }

    const countRaw = Number(req.body?.count);
    const count = Number.isFinite(countRaw) ? Math.floor(countRaw) : 1;
    if (count <= 0 || count > 1000) {
      return res.status(400).json({ ok: false, error: "invalid-count" });
    }

    const ref = db.collection("telegram_groups").doc(groupId);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "group-not-found" });
    }

    await ref.set(
      {
        linksDispatchedCount: admin.firestore.FieldValue.increment(count),
        linksDispatchedLastAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    logger.error("trackInviteSent error", err);
    setCors(req, res);
    const status = Number(err?.status) || 500;
    const code = String(err?.code || "internal");
    const details =
      status >= 500
        ? String(err?.message || err)
        : String(err?.details || err?.message || "");
    return res
      .status(status)
      .json({ ok: false, error: code, details: details || undefined });
  }
});

// GET /telegramGroupsFromUpdates
exports.telegramGroupsFromUpdates = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN], timeoutSeconds: 60 },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "GET") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        logger.error("Bot token is missing or empty");
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      const limitRaw = Number(req.query?.limit);
      const limit = Number.isFinite(limitRaw)
        ? Math.max(1, Math.min(100, Math.floor(limitRaw)))
        : 100;

      logger.info("Fetching Telegram groups from updates", {
        limit,
        tokenLength: botToken.length,
        tokenPrefix: botToken.substring(0, 10) + "...",
      });

      const testUrl = `https://api.telegram.org/bot${botToken}/getMe`;
      try {
        const testRes = await fetch(testUrl);
        const testJson = await testRes.json();
        logger.info("Telegram bot getMe test", {
          ok: testJson.ok,
          botUsername: testJson?.result?.username,
        });
      } catch (testErr) {
        logger.error("Telegram bot getMe test failed", {
          error: String(testErr),
        });
      }

      const chats = await getTelegramChatsFromUpdates({ botToken, limit });
      logger.info("Successfully fetched Telegram groups", {
        count: chats.length,
      });
      return res.status(200).json({ ok: true, chats });
    } catch (err) {
      logger.error("telegramGroupsFromUpdates error", {
        error: err,
        message: err?.message,
        code: err?.code,
        details: err?.details,
        stack: err?.stack,
      });
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      const details = err?.details || {};
      return res.status(status).json({
        ok: false,
        error: code,
        message: String(err?.message || "Unknown error"),
        details: typeof details === "object" ? details : String(details),
      });
    }
  },
);

// POST /removeTelegramGroupMember
exports.removeTelegramGroupMember = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const db = getDb();
      const groupId = String(req.body?.groupId || "").trim();
      const userId = String(req.body?.userId || "").trim();

      if (!groupId) {
        return res.status(400).json({ ok: false, error: "missing-groupId" });
      }
      if (!userId) {
        return res.status(400).json({ ok: false, error: "missing-userId" });
      }

      const snap = await db.collection("telegram_groups").doc(groupId).get();
      if (!snap.exists) {
        return res.status(404).json({ ok: false, error: "group-not-found" });
      }
      const data = snap.data() || {};
      const chatId = String(data.chat_id || "").trim();
      if (!chatId) {
        return res
          .status(500)
          .json({ ok: false, error: "group-missing-chat_id" });
      }

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      await removeChatMember({ botToken, chatId, userId });

      return res.status(200).json({ ok: true });
    } catch (err) {
      logger.error("removeTelegramGroupMember error", err);
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      const details =
        status >= 500
          ? String(err?.message || err)
          : String(err?.details || err?.message || "");
      return res
        .status(status)
        .json({ ok: false, error: code, details: details || undefined });
    }
  },
);

// GET /getTelegramGroupMembers
exports.getTelegramGroupMembers = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "GET") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const db = getDb();
      const groupId = String(req.query?.groupId || "").trim();
      if (!groupId) {
        return res.status(400).json({ ok: false, error: "missing-groupId" });
      }

      const snap = await db.collection("telegram_groups").doc(groupId).get();
      if (!snap.exists) {
        return res.status(404).json({ ok: false, error: "group-not-found" });
      }
      const data = snap.data() || {};
      const chatId = String(data.chat_id || "").trim();
      if (!chatId) {
        return res
          .status(500)
          .json({ ok: false, error: "group-missing-chat_id" });
      }

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      const members = await getChatMembers({ botToken, chatId });

      return res.status(200).json({ ok: true, members });
    } catch (err) {
      logger.error("getTelegramGroupMembers error", err);
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      return res.status(status).json({
        ok: false,
        error: code,
        details:
          status >= 500
            ? String(err?.message || err)
            : String(err?.details || ""),
      });
    }
  },
);

// POST /removeUserFromTelegramGroups
exports.removeUserFromTelegramGroups = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const db = getDb();
      const telegramId = String(req.body?.telegramId || "").trim();
      if (!telegramId) {
        return res.status(400).json({ ok: false, error: "missing-telegramId" });
      }

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      const callerEmail = decoded?.email || decoded?.uid || "unknown";
      const callerIp = req.headers["x-forwarded-for"] || req.ip || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";

      logger.info("Removing user from all Telegram groups", {
        telegramId,
        callerEmail,
        callerIp,
        userAgent,
      });

      const result = await removeUserFromAllGroups({
        botToken,
        userId: telegramId,
        db,
      });

      logger.info("User removal result", {
        telegramId,
        total: result.total,
        removed: result.removed,
        failed: result.failed,
        results: result.results,
      });

      return res.status(200).json({ ok: true, ...result });
    } catch (err) {
      logger.error("removeUserFromTelegramGroups error", err);
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      return res.status(status).json({
        ok: false,
        error: code,
        details:
          status >= 500
            ? String(err?.message || err)
            : String(err?.details || ""),
      });
    }
  },
);

// Bot webhook endpoint
exports.telegramBotWebhook = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      const db = getDb();
      const bot = initBot(db, botToken);
      if (!bot) {
        return res.status(500).json({ ok: false, error: "bot-init-failed" });
      }

      await bot.handleUpdate(req.body, res);
    } catch (err) {
      logger.error("telegramBotWebhook error", err);
      if (!res.headersSent) {
        return res.status(500).json({
          ok: false,
          error: "internal",
          details: String(err?.message || err),
        });
      }
    }
  },
);

// Admin: Send one-time invite link to a specific candidate
exports.sendInviteToCandidate = onCall(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (request) => {
    const role = String(request.auth?.token?.role || "");
    if (role !== "admin" && role !== "super_admin") {
      const { HttpsError } = require("firebase-functions/v2/https");
      throw new HttpsError("permission-denied", "Admins only.");
    }

    const { candidateId, collectionName, groupId } = request.data || {};
    if (!candidateId || !collectionName || !groupId) {
      const { HttpsError } = require("firebase-functions/v2/https");
      throw new HttpsError(
        "invalid-argument",
        "Missing candidateId, collectionName, or groupId",
      );
    }

    const db = getDb();
    const docSnap = await db.collection(collectionName).doc(candidateId).get();
    if (!docSnap.exists) {
      const { HttpsError } = require("firebase-functions/v2/https");
      throw new HttpsError("not-found", "Candidate not found");
    }
    const data = docSnap.data();
    const telegramChatId = data.telegramChatId;

    if (!telegramChatId) {
      const { HttpsError } = require("firebase-functions/v2/https");
      throw new HttpsError(
        "failed-precondition",
        "Bu kandidat Telegram orqali ro'yxatdan o'tmagan (Chat ID yo'q).",
      );
    }

    const token = TELEGRAM_BOT_TOKEN.value();
    const bot = new Telegraf(token);

    const groupSnap = await db.collection("telegram_groups").doc(groupId).get();
    if (!groupSnap.exists) {
      const { HttpsError } = require("firebase-functions/v2/https");
      throw new HttpsError("not-found", "Telegram group not found in DB");
    }
    const groupChatId = groupSnap.data().chat_id;
    if (!groupChatId) {
      const { HttpsError } = require("firebase-functions/v2/https");
      throw new HttpsError("failed-precondition", "Group has no chat_id");
    }

    let inviteLink;
    try {
      const result = await createOneTimeChatInviteLink({
        botToken: token,
        chatId: groupChatId,
        memberLimit: 1,
      });
      inviteLink = result.invite_link;
    } catch (e) {
      logger.error("Invite generation failed:", e);
      const { HttpsError } = require("firebase-functions/v2/https");
      throw new HttpsError(
        "internal",
        "invite-generation-failed: " + e.message,
      );
    }

    try {
      await bot.telegram.sendMessage(
        telegramChatId,
        `🎉 Sizning arizangiz qabul qilindi!\n\nQuyidagi link orqali guruhga qo'shilishingiz mumkin (Link faqat 1 marta ishlaydi):\n${inviteLink}`,
      );
    } catch (e) {
      logger.error("Sending message to user failed:", e);
      const { HttpsError } = require("firebase-functions/v2/https");
      throw new HttpsError(
        "unavailable",
        "Link yaratildi, lekin foydalanuvchiga yuborishda xatolik: " +
          e.message,
        { inviteLink },
      );
    }

    return { ok: true, sent: true };
  },
);

// Admin: Kick (Ban/Unban) a candidate from a group
exports.kickCandidate = onCall(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (request) => {
    const { HttpsError } = require("firebase-functions/v2/https");
    const role = String(request.auth?.token?.role || "");
    if (role !== "admin" && role !== "super_admin") {
      throw new HttpsError("permission-denied", "Admins only.");
    }

    const { candidateId, collectionName, groupId } = request.data || {};

    const db = getDb();
    const docSnap = await db.collection(collectionName).doc(candidateId).get();
    if (!docSnap.exists)
      throw new HttpsError("not-found", "Candidate not found");
    const telegramChatId = docSnap.data().telegramChatId;
    if (!telegramChatId)
      throw new HttpsError("failed-precondition", "No Telegram Chat ID");

    const groupSnap = await db.collection("telegram_groups").doc(groupId).get();
    if (!groupSnap.exists) throw new HttpsError("not-found", "Group not found");
    const groupChatId = groupSnap.data().chat_id;

    const token = TELEGRAM_BOT_TOKEN.value();
    const bot = new Telegraf(token);

    try {
      await bot.telegram.banChatMember(groupChatId, telegramChatId);
      await bot.telegram.unbanChatMember(groupChatId, telegramChatId);
    } catch (e) {
      logger.error("Kick failed:", e);
      throw new HttpsError("internal", "Kick failed: " + e.message);
    }

    return { ok: true, kicked: true };
  },
);

// POST /sendTelegramMessage
exports.sendTelegramMessage = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const telegramId = String(req.body?.telegramId || "").trim();
      const message = String(req.body?.message || "").trim();
      const parseMode = String(req.body?.parseMode || "HTML").trim();
      const keyboard = req.body?.keyboard || null;

      if (!telegramId) {
        return res.status(400).json({ ok: false, error: "missing-telegramId" });
      }
      if (!message) {
        return res.status(400).json({ ok: false, error: "missing-message" });
      }

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      const bot = new Telegraf(botToken);

      try {
        const options = { parse_mode: parseMode };
        if (keyboard && Array.isArray(keyboard) && keyboard.length > 0) {
          options.reply_markup = { inline_keyboard: keyboard };
        }
        await bot.telegram.sendMessage(telegramId, message, options);
        return res.status(200).json({ ok: true, sent: true });
      } catch (sendError) {
        logger.error("Failed to send Telegram message", {
          telegramId,
          error: String(sendError?.message || sendError),
        });
        return res.status(500).json({
          ok: false,
          error: "send-failed",
          details: String(sendError?.message || sendError),
        });
      }
    } catch (err) {
      logger.error("sendTelegramMessage error", err);
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      const details =
        status >= 500
          ? String(err?.message || err)
          : String(err?.details || err?.message || "");
      return res
        .status(status)
        .json({ ok: false, error: code, details: details || undefined });
    }
  },
);
