const { Telegraf } = require("telegraf");
const logger = require("firebase-functions/logger");

module.exports = (db, token) => {
  if (!token) {
    logger.warn("Bot token not provided");
    return null;
  }

  const bot = new Telegraf(token);

  // Handle /start command with deep link parameter
  bot.start(async (ctx) => {
    try {
      const startPayload = ctx.startPayload; // Extract parameter after /start
      const telegramId = ctx.from.id;
      const firstName = ctx.from.first_name || "";
      const username = ctx.from.username || "";

      logger.info("Bot /start command received", {
        telegramId,
        username,
        startPayload,
      });

      if (!startPayload) {
        // No deep link parameter - show welcome message
        await ctx.reply(
          `Salom ${firstName}! 👋\n\n` +
            `Bu ConsultingUZ botiga xush kelibsiz.\n\n` +
            `Ro'yxatdan o'tish uchun maxsus link orqali botni ishga tushiring.`
        );
        return;
      }

      // Extract major code from deep link (e.g., kfz_mechatroniker_2026)
      const majorCode = startPayload.trim();

      // Generate the registration link with major and teId (telegram ID)
      const registrationLink = `https://admin.consultinguz.de/create?major=${encodeURIComponent(
        majorCode
      )}&teId=${telegramId}`;

      logger.info("Generated registration link", {
        telegramId,
        majorCode,
        registrationLink,
      });

      // Send the registration link to the user
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

      // Optionally store the interaction in Firestore
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
