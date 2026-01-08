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
      // Add timeout to prevent hanging on first request
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

      // Member statuses: 'creator', 'administrator', 'member', 'restricted', 'left', 'kicked'
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
        errorCode: error.code,
        errorResponse: error.response?.description,
      });
      // If error is due to user not being found or other API issues,
      // throw the error so it can be handled properly in the main handler
      throw error;
    }
  }

  // Handle /start command with deep link parameter
  bot.start(async (ctx) => {
    try {
      // Parse startPayload from ctx.startPayload or manually from message text
      let startPayload = ctx.startPayload;

      // Fallback: parse manually from message text if ctx.startPayload is empty
      if (!startPayload && ctx.message && ctx.message.text) {
        const messageText = ctx.message.text;
        const match = messageText.match(/^\/start\s+(.+)$/);
        if (match && match[1]) {
          startPayload = match[1].trim();
          logger.info("Parsed startPayload manually from message text", {
            messageText,
            startPayload,
          });
        }
      }

      const telegramId = ctx.from.id;
      const firstName = ctx.from.first_name || "";
      const username = ctx.from.username || "";

      logger.info("Bot /start command received", {
        telegramId,
        username,
        startPayload,
        startPayloadType: typeof startPayload,
        startPayloadLength: startPayload ? startPayload.length : 0,
        messageText: ctx.message?.text,
        ctxStartPayload: ctx.startPayload,
      });

      // Delete any old pending registration for this user to avoid conflicts
      try {
        await db
          .collection("pending_registrations")
          .doc(String(telegramId))
          .delete();
        logger.info("Deleted old pending registration", { telegramId });
      } catch (e) {
        logger.warn("Could not delete old pending registration", e);
      }

      // Show loading message while checking membership
      let loadingMsg = null;
      try {
        loadingMsg = await ctx.reply("Tekshirilmoqda... ⏳");
      } catch (e) {
        logger.warn("Could not send loading message", e);
      }

      // Check channel membership first
      let isMember = false;
      let membershipCheckFailed = false;
      try {
        isMember = await checkChannelMembership(telegramId);
      } catch (membershipError) {
        // Log the error but continue - we'll show the channel join message
        logger.warn("Channel membership check failed, assuming not a member", {
          telegramId,
          error: membershipError.message,
        });
        isMember = false;
        membershipCheckFailed = true;
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
        // Store startPayload in user's context for later retrieval
        const checkData =
          startPayload && startPayload.length < 50
            ? `check:${startPayload}`
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

        // Store the startPayload in Firestore for later retrieval
        if (startPayload) {
          try {
            await db
              .collection("pending_registrations")
              .doc(String(telegramId))
              .set({
                telegramId,
                startPayload,
                timestamp: new Date(),
              });
          } catch (e) {
            logger.warn("Could not store pending registration", e);
          }
        }

        return;
      }

      if (!startPayload) {
        // No deep link parameter - show welcome message
        await ctx.reply(
          `Salom ${firstName}! 👋\n\n` +
            `Bu ConsultingUZ botiga xush kelibsiz.\n\n` +
            `Ro'yxatdan o'tish uchun maxsus link orqali botni ishga tushiring.`
        );
        return;
      }

      // User is a member - proceed with registration
      // Parse startPayload to extract major and lead parameters
      // Format: "major" or "major__lead__leadName" (double underscore as separator)
      const payload = startPayload.trim();
      const parts = payload.split("__lead__");
      const majorCode = parts[0];
      const leadParam = parts.length > 1 ? parts[1] : null;

      logger.info("Parsing startPayload for registration", {
        telegramId,
        startPayload,
        payload,
        parts,
        majorCode,
        leadParam,
      });

      let registrationLink = `https://admin.consultinguz.de/create?major=${encodeURIComponent(
        majorCode
      )}&teId=${telegramId}`;

      if (leadParam) {
        registrationLink += `&lead=${encodeURIComponent(leadParam)}`;
      }

      logger.info("Generated registration link", {
        telegramId,
        majorCode,
        registrationLink,
      });

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

      // Store the interaction in Firestore
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

      // Extract startPayload from callback_data or Firestore
      let startPayload = null;
      const callbackData = ctx.callbackQuery.data;

      logger.info("Callback query received", {
        telegramId,
        callbackData,
      });

      if (callbackData.startsWith("check:")) {
        // Short payload embedded in callback_data
        startPayload = callbackData.substring(6);
        logger.info("StartPayload from callback_data", {
          startPayload,
          length: startPayload.length,
        });
      } else {
        // Long payload - retrieve from Firestore
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
            logger.warn("No pending registration found in Firestore", {
              telegramId,
            });
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
        // Still not a member
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
        // No deep link - just show welcome
        await ctx.reply(
          `Ajoyib! ✅\n\n` +
            `Siz kanalga a'zo bo'ldingiz va endi botdan foydalanishingiz mumkin.\n\n` +
            `Ro'yxatdan o'tish uchun maxsus link orqali botni ishga tushiring.`
        );
        return;
      }

      // Generate registration link
      // Parse startPayload to extract major and lead parameters
      // Format: "major" or "major__lead__leadName" (double underscore as separator)
      const payload = startPayload.trim();
      const parts = payload.split("__lead__");
      const majorCode = parts[0];
      const leadParam = parts.length > 1 ? parts[1] : null;

      logger.info("Parsing payload in callback for registration link", {
        telegramId,
        startPayload,
        payload,
        parts,
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

  // Also handle /start as a regular command to catch cases where bot.start doesn't work
  bot.command("start", async (ctx) => {
    try {
      const messageText = ctx.message?.text || "";
      const match = messageText.match(/^\/start(?:\s+(.+))?$/);
      const startPayload = match && match[1] ? match[1].trim() : "";

      logger.info("Bot command /start received", {
        telegramId: ctx.from.id,
        messageText,
        startPayload,
        hasPayload: !!startPayload,
      });

      // If there's a payload, trigger the start handler logic
      if (startPayload) {
        // Call the start handler manually
        ctx.startPayload = startPayload;
      }
    } catch (error) {
      logger.error("Error in command handler", error);
    }
  });

  // Auto-save groups to Firestore when bot receives messages
  bot.on("message", async (ctx) => {
    try {
      const chat = ctx.chat;
      if (chat && ["group", "supergroup"].includes(chat.type)) {
        const chatId = String(chat.id);
        const chatTitle = chat.title || chatId;

        // Check if group already exists in Firestore
        const groupsRef = db.collection("telegram_groups");
        const snapshot = await groupsRef
          .where("chat_id", "==", chatId)
          .limit(1)
          .get();

        if (snapshot.empty) {
          // Add new group
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
          logger.info("New group auto-saved to Firestore", {
            chatId,
            chatTitle,
          });
        } else {
          // Update last message time
          const doc = snapshot.docs[0];
          await doc.ref.update({
            name: chatTitle,
            lastMessageAt: new Date(),
          });
        }
      }
    } catch (error) {
      logger.error("Error auto-saving group", error);
    }
  });

  // Handle /stop command to reset session
  bot.command("stop", async (ctx) => {
    try {
      const telegramId = ctx.from.id;

      // Delete pending registration
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

  // Handle other commands
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
