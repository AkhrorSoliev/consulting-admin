const { Telegraf } = require("telegraf");
const logger = require("firebase-functions/logger");

// Required channel ID - users must join this channel to use the bot
const REQUIRED_CHANNEL_ID = "-1001561510642"; // https://t.me/Consulting_UZB

module.exports = (db, token) => {
  if (!token) {
    logger.warn("Bot token not provided");
    return null;
  }

  const bot = new Telegraf(token);

  // Helper function to check if user is a member of the required channel
  async function checkChannelMembership(userId) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout checking membership")),
          10000
        );
      });

      const memberPromise = bot.telegram.getChatMember(
        REQUIRED_CHANNEL_ID,
        userId
      );
      const member = await Promise.race([memberPromise, timeoutPromise]);

      const isMember = ["creator", "administrator", "member"].includes(
        member.status
      );
      logger.info("Channel membership check result", {
        userId,
        status: member.status,
        isMember,
      });
      return isMember;
    } catch (error) {
      logger.error("Error checking channel membership", {
        userId,
        channelId: REQUIRED_CHANNEL_ID,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  // Main handler for processing registration
  async function handleRegistration(ctx, startPayload) {
    const telegramId = ctx.from.id;
    const firstName = ctx.from.first_name || "";
    const username = ctx.from.username || "";

    // Normalize payload: convert ss back to ß for database lookup
    // This allows both straßenbau and strassenbau to work
    const normalizedPayload = startPayload
      ? String(startPayload).replace(/strassenbau/g, "straßenbau")
      : startPayload;

    logger.info("Processing registration", {
      telegramId,
      username,
      startPayload,
      normalizedPayload,
    });

    // Delete any old pending registration
    try {
      await db
        .collection("pending_registrations")
        .doc(String(telegramId))
        .delete();
    } catch (e) {
      logger.warn("Could not delete old pending registration", e);
    }

    // Show loading message
    let loadingMsg = null;
    try {
      loadingMsg = await ctx.reply("Tekshirilmoqda... ⏳");
    } catch (e) {
      logger.warn("Could not send loading message", e);
    }

    // Check channel membership
    let isMember = false;
    try {
      isMember = await checkChannelMembership(telegramId);
    } catch (membershipError) {
      logger.warn("Channel membership check failed", {
        telegramId,
        error: membershipError.message,
      });
      isMember = false;
    }

    // Delete loading message
    if (loadingMsg) {
      try {
        await ctx.deleteMessage(loadingMsg.message_id);
      } catch (e) {
        logger.warn("Could not delete loading message", e);
      }
    }

    if (!isMember) {
      // User is not a member - show channel join requirement
      const checkData =
        normalizedPayload && normalizedPayload.length < 50
          ? `check:${normalizedPayload}`
          : "check_membership";

      await ctx.reply(
        `Salom ${firstName}! 👋\n\n` +
          `Botdan foydalanish uchun avval rasmiy kanalimizga a'zo bo'lishingiz kerak.\n\n` +
          `Kanalga a'zo bo'lgandan so'ng "✅ Tekshirish" tugmasini bosing.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📢 Kanalga a'zo bo'lish",
                  url: "https://t.me/Consulting_UZB",
                },
              ],
              [
                {
                  text: "✅ Tekshirish",
                  callback_data: checkData,
                },
              ],
            ],
          },
        }
      );

      // Store the normalized payload in Firestore
      if (normalizedPayload) {
        try {
          await db
            .collection("pending_registrations")
            .doc(String(telegramId))
            .set({
              telegramId,
              startPayload: normalizedPayload,
              timestamp: new Date(),
            });
          logger.info("Stored pending registration", {
            telegramId,
            startPayload: normalizedPayload,
          });
        } catch (e) {
          logger.warn("Could not store pending registration", e);
        }
      }

      return;
    }

    if (!normalizedPayload) {
      // No deep link parameter - show simple welcome message
      try {
        await ctx.reply(
          `Salom ${firstName}! 👋\n\n` +
            `Bu ConsultingUZ botiga xush kelibsiz.\n\n` +
            `Ro'yxatdan o'tish uchun maxsus link orqali botni ishga tushiring.`
        );
        logger.info("Welcome message sent successfully", { telegramId });
      } catch (replyError) {
        logger.error("Failed to send welcome message", {
          telegramId,
          error: replyError.message,
        });
      }
      return;
    }

    // User is a member - proceed with registration
    const payload = normalizedPayload.trim();
    const parts = payload.split("__lead__");
    const majorCode = parts[0];
    const leadParam = parts.length > 1 ? parts[1] : null;

    logger.info("Generating registration link", {
      telegramId,
      payload,
      majorCode,
      leadParam,
    });

    let registrationLink = `https://admin.consultinguz.de/create?major=${encodeURIComponent(
      majorCode
    )}&teId=${telegramId}`;

    if (leadParam) {
      registrationLink += `&lead=${encodeURIComponent(leadParam)}`;
    }

    await ctx.reply(
      `Salom ${firstName}! 👋\n\n` +
        `Ro'yxatdan o'tish uchun quyidagi linkni bosing:\n\n` +
        `${registrationLink}\n\n` +
        `Bu link faqat siz uchun yaratilgan va sizning Telegram akkauntingiz bilan bog'langan.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📝 Ro'yxatdan o'tish",
                url: registrationLink,
              },
            ],
          ],
        },
      }
    );

    // Store the interaction
    try {
      await db.collection("bot_interactions").add({
        telegramId,
        username,
        firstName,
        majorCode,
        registrationLink,
        timestamp: new Date(),
      });
    } catch (dbError) {
      logger.error("Failed to store bot interaction", dbError);
    }
  }

  // Handle /start command
  bot.start(async (ctx) => {
    try {
      // Parse startPayload from ctx.startPayload or manually from message text
      let startPayload = ctx.startPayload;

      // Fallback: parse manually from message text
      if (!startPayload && ctx.message && ctx.message.text) {
        const messageText = ctx.message.text;
        const match = messageText.match(/^\/start\s+(.+)$/);
        if (match && match[1]) {
          startPayload = match[1].trim();
          logger.info("Parsed startPayload manually", {
            messageText,
            startPayload,
          });
        }
      }

      logger.info("Bot /start command received", {
        telegramId: ctx.from.id,
        username: ctx.from.username,
        startPayload,
        messageText: ctx.message?.text,
        ctxStartPayload: ctx.startPayload,
      });

      await handleRegistration(ctx, startPayload);
    } catch (error) {
      logger.error("Error in bot /start handler", error);
      await ctx.reply(
        "Kechirasiz, xatolik yuz berdi.\n\n" +
          "Iltimos, /start buyrug'ini qaytadan yuboring yoki linkni qaytadan oching."
      );
    }
  });

  // Handle callback query for membership verification
  bot.action(/^check/, async (ctx) => {
    try {
      const telegramId = ctx.from.id;
      const firstName = ctx.from.first_name || "";
      let startPayload = null;
      const callbackData = ctx.callbackQuery.data;

      logger.info("Callback query received", {
        telegramId,
        callbackData,
      });

      if (callbackData.startsWith("check:")) {
        startPayload = callbackData.substring(6);
        logger.info("StartPayload from callback_data", { startPayload });
      } else {
        // Retrieve from Firestore
        try {
          const doc = await db
            .collection("pending_registrations")
            .doc(String(telegramId))
            .get();
          if (doc.exists) {
            const docData = doc.data();
            startPayload = docData?.startPayload || null;
            logger.info("StartPayload from Firestore", {
              startPayload,
              docData,
            });
          } else {
            logger.warn("No pending registration found", { telegramId });
          }
        } catch (e) {
          logger.warn("Could not retrieve pending registration", e);
        }
      }

      // Show loading indicator
      await ctx.answerCbQuery("Tekshirilmoqda... ⏳");

      // Check if user is now a member
      let isMember = false;
      try {
        isMember = await checkChannelMembership(telegramId);
      } catch (membershipError) {
        logger.warn("Channel membership check failed in callback", {
          telegramId,
          error: membershipError.message,
        });
        await ctx.answerCbQuery(
          "❌ Kanal a'zoligini tekshirishda xatolik. Iltimos, qaytadan urinib ko'ring.",
          { show_alert: true }
        );
        return;
      }

      if (!isMember) {
        await ctx.answerCbQuery("❌ Siz hali kanalga a'zo bo'lmadingiz!", {
          show_alert: true,
        });
        return;
      }

      // User is now a member!
      await ctx.answerCbQuery(
        "✅ Tasdiqlandi! Endi botdan foydalanishingiz mumkin."
      );

      // Delete the old message
      try {
        await ctx.deleteMessage();
      } catch (e) {
        logger.warn("Could not delete message", e);
      }

      if (startPayload === "none" || !startPayload) {
        await ctx.reply(
          `Ajoyib! ✅\n\n` +
            `Siz kanalga a'zo bo'ldingiz va endi botdan foydalanishingiz mumkin.\n\n` +
            `Ro'yxatdan o'tish uchun maxsus link orqali botni ishga tushiring.`
        );
        return;
      }

      // Generate registration link
      const payload = startPayload.trim();
      const parts = payload.split("__lead__");
      const majorCode = parts[0];
      const leadParam = parts.length > 1 ? parts[1] : null;

      logger.info("Parsing payload in callback", {
        telegramId,
        startPayload,
        payload,
        majorCode,
        leadParam,
      });

      let registrationLink = `https://admin.consultinguz.de/create?major=${encodeURIComponent(
        majorCode
      )}&teId=${telegramId}`;

      if (leadParam) {
        registrationLink += `&lead=${encodeURIComponent(leadParam)}`;
      }

      await ctx.reply(
        `Ajoyib! ✅\n\n` +
          `Salom ${firstName}! Ro'yxatdan o'tish uchun quyidagi linkni bosing:\n\n` +
          `${registrationLink}\n\n` +
          `Bu link faqat siz uchun yaratilgan va sizning Telegram akkauntingiz bilan bog'langan.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📝 Ro'yxatdan o'tish",
                  url: registrationLink,
                },
              ],
            ],
          },
        }
      );

      // Store the interaction
      try {
        await db.collection("bot_interactions").add({
          telegramId,
          username: ctx.from.username || "",
          firstName,
          majorCode,
          registrationLink,
          timestamp: new Date(),
          verifiedMembership: true,
        });
      } catch (dbError) {
        logger.error("Failed to store bot interaction", dbError);
      }
    } catch (error) {
      logger.error("Error in callback handler", error);
      await ctx.answerCbQuery("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    }
  });

  // Handle text messages as potential payloads
  bot.on("text", async (ctx) => {
    try {
      const chat = ctx.chat;

      // Auto-save groups to Firestore
      if (chat && ["group", "supergroup"].includes(chat.type)) {
        const chatId = String(chat.id);
        const chatTitle = chat.title || chatId;

        const groupsRef = db.collection("telegram_groups");
        const snapshot = await groupsRef
          .where("chat_id", "==", chatId)
          .limit(1)
          .get();

        if (snapshot.empty) {
          await groupsRef.add({
            chat_id: chatId,
            name: chatTitle,
            type: chat.type,
            active: true,
            linksSentCount: 0,
            linksGeneratedCount: 0,
            linksDispatchedCount: 0,
            createdAt: new Date(),
            lastMessageAt: new Date(),
          });
          logger.info("New group auto-saved", { chatId, chatTitle });
        } else {
          const doc = snapshot.docs[0];
          await doc.ref.update({
            name: chatTitle,
            lastMessageAt: new Date(),
          });
        }
        return;
      }

      // Handle private chat text messages as potential payloads
      if (chat.type === "private") {
        const text = ctx.message?.text || "";

        // Skip if it's a command
        if (text.startsWith("/")) {
          return;
        }

        // Check if text looks like a payload (contains __lead__ or ends with -2026, etc.)
        if (text.includes("__lead__") || /ausbildung-\d{4}/.test(text)) {
          logger.info("Text message received as potential payload", {
            telegramId: ctx.from.id,
            text,
          });

          // Process as registration
          await handleRegistration(ctx, text.trim());
        }
      }
    } catch (error) {
      logger.error("Error in text handler", error);
    }
  });

  // Handle /link command to manually provide payload
  bot.command("link", async (ctx) => {
    try {
      const messageText = ctx.message?.text || "";
      const match = messageText.match(/^\/link\s+(.+)$/);

      if (!match || !match[1]) {
        await ctx.reply(
          "❌ Noto'g'ri format.\n\n" +
            "To'g'ri format:\n" +
            "/link straßenbau-ausbildung-2026__lead__2020"
        );
        return;
      }

      const startPayload = match[1].trim();

      logger.info("Manual link command received", {
        telegramId: ctx.from.id,
        startPayload,
      });

      // Process registration with the provided payload
      await handleRegistration(ctx, startPayload);
    } catch (error) {
      logger.error("Error in link command", error);
      await ctx.reply("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    }
  });

  // Handle /stop command
  bot.command("stop", async (ctx) => {
    try {
      const telegramId = ctx.from.id;

      try {
        await db
          .collection("pending_registrations")
          .doc(String(telegramId))
          .delete();
      } catch (e) {
        logger.warn("Could not delete pending registration", e);
      }

      await ctx.reply(
        "Bot to'xtatildi. ✅\n\n" +
          "Yana ro'yxatdan o'tish uchun maxsus link orqali botni qayta ishga tushiring."
      );

      logger.info("Bot stopped by user", { telegramId });
    } catch (error) {
      logger.error("Error in stop command", error);
    }
  });

  // Handle /help command
  bot.help((ctx) => {
    ctx.reply(
      "ConsultingUZ Bot\n\n" +
        "Bu bot orqali siz ro'yxatdan o'tish linkini olishingiz mumkin.\n\n" +
        "Maxsus link orqali /start buyrug'ini ishga tushiring.\n\n" +
        "Botni qayta boshlash uchun /stop buyrug'ini yuboring."
    );
  });

  // Error handling
  bot.catch((err, ctx) => {
    logger.error("Bot error", { error: err, update: ctx.update });
  });

  return bot;
};
