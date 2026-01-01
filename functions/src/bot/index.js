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
      const member = await bot.telegram.getChatMember(
        REQUIRED_CHANNEL_ID,
        userId
      );
      // Member statuses: 'creator', 'administrator', 'member', 'restricted', 'left', 'kicked'
      return ["creator", "administrator", "member"].includes(member.status);
    } catch (error) {
      logger.error("Error checking channel membership", {
        userId,
        error: error.message,
      });
      return false;
    }
  }

  // Handle /start command with deep link parameter
  bot.start(async (ctx) => {
    try {
      const startPayload = ctx.startPayload;
      const telegramId = ctx.from.id;
      const firstName = ctx.from.first_name || "";
      const username = ctx.from.username || "";

      logger.info("Bot /start command received", {
        telegramId,
        username,
        startPayload,
      });

      // Check channel membership first
      const isMember = await checkChannelMembership(telegramId);

      if (!isMember) {
        // User is not a member - show channel join requirement
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
                    callback_data: `check_membership:${startPayload || "none"}`,
                  },
                ],
              ],
            },
          }
        );
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
        "Kechirasiz, xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."
      );
    }
  });

  // Handle callback query for membership verification
  bot.action(/^check_membership:(.+)$/, async (ctx) => {
    try {
      const startPayload = ctx.match[1];
      const telegramId = ctx.from.id;
      const firstName = ctx.from.first_name || "";

      // Check if user is now a member
      const isMember = await checkChannelMembership(telegramId);

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

  // Handle other commands
  bot.help((ctx) => {
    ctx.reply(
      "ConsultingUZ Bot\n\n" +
        "Bu bot orqali siz ro'yxatdan o'tish linkini olishingiz mumkin.\n\n" +
        "Maxsus link orqali /start buyrug'ini ishga tushiring."
    );
  });

  // Error handling
  bot.catch((err, ctx) => {
    logger.error("Bot error", { error: err, update: ctx.update });
  });

  return bot;
};
