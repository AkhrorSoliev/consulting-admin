// Bot qaysi guruh va kanallarda admin ekanligini tekshirish
// Ishlatish: node check-bot-chats.cjs YOUR_BOT_TOKEN

const https = require("https");

const botToken = process.argv[2];

if (!botToken) {
  console.error("❌ Bot token kiritilmagan!");
  console.log("Ishlatish: node check-bot-chats.cjs YOUR_BOT_TOKEN");
  process.exit(1);
}

console.log("🔍 Bot ma'lumotlarini olish...\n");

// Avval bot haqida ma'lumot olish
const getMeUrl = `https://api.telegram.org/bot${botToken}/getMe`;

https
  .get(getMeUrl, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const result = JSON.parse(data);

        if (result.ok && result.result) {
          const bot = result.result;
          console.log("🤖 Bot ma'lumotlari:");
          console.log("   ID:", bot.id);
          console.log("   Username: @" + bot.username);
          console.log("   Ism:", bot.first_name);
          console.log("   Bot: ", bot.is_bot ? "✅" : "❌");
          console.log("\n" + "=".repeat(60) + "\n");
        }

        // Endi updates dan guruh va kanallarni olish
        getUpdates(botToken);
      } catch (e) {
        console.error("❌ JSON parse xatolik:", e.message);
      }
    });
  })
  .on("error", (e) => {
    console.error("❌ So'rov xatolik:", e.message);
  });

function getUpdates(token) {
  const updatesUrl = `https://api.telegram.org/bot${token}/getUpdates?limit=100`;

  https
    .get(updatesUrl, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const result = JSON.parse(data);

          if (!result.ok) {
            console.error("❌ Updates olishda xatolik:", result.description);
            return;
          }

          const updates = result.result || [];
          console.log("📊 Jami updates:", updates.length);

          if (updates.length === 0) {
            console.log("\n⚠️  Hech qanday update topilmadi.");
            console.log(
              "   Bot hali hech qanday guruh yoki kanalga qo'shilmagan yoki"
            );
            console.log("   barcha updatelar o'qilgan.\n");
            console.log("💡 Tavsiya:");
            console.log("   1. Botni guruh yoki kanalga admin qilib qo'shing");
            console.log("   2. Guruhda biror xabar yuboring");
            console.log("   3. Qaytadan bu scriptni ishga tushiring\n");
            return;
          }

          // Guruh va kanallarni yig'ish
          const chats = new Map();

          updates.forEach((update) => {
            let chat = null;

            // Turli xil update turlaridan chat olish
            if (update.message?.chat) {
              chat = update.message.chat;
            } else if (update.edited_message?.chat) {
              chat = update.edited_message.chat;
            } else if (update.channel_post?.chat) {
              chat = update.channel_post.chat;
            } else if (update.edited_channel_post?.chat) {
              chat = update.edited_channel_post.chat;
            } else if (update.my_chat_member?.chat) {
              chat = update.my_chat_member.chat;
            } else if (update.chat_member?.chat) {
              chat = update.chat_member.chat;
            }

            if (
              chat &&
              (chat.type === "group" ||
                chat.type === "supergroup" ||
                chat.type === "channel")
            ) {
              chats.set(chat.id, chat);
            }
          });

          if (chats.size === 0) {
            console.log("\n⚠️  Hech qanday guruh yoki kanal topilmadi.");
            console.log("   Faqat shaxsiy chatlar mavjud.\n");
            return;
          }

          console.log("\n📋 Topilgan guruh va kanallar:\n");
          console.log("=".repeat(60));

          let index = 1;
          for (const [chatId, chat] of chats) {
            console.log(
              `\n${index}. ${getChatTypeEmoji(chat.type)} ${
                chat.title || chat.first_name || "Nomsiz"
              }`
            );
            console.log(`   Chat ID: ${chatId}`);
            console.log(`   Turi: ${getChatTypeName(chat.type)}`);
            if (chat.username) {
              console.log(`   Username: @${chat.username}`);
              console.log(`   Link: https://t.me/${chat.username}`);
            }

            // Har bir chat uchun bot admin yoki yo'qligini tekshirish
            checkBotAdmin(token, chatId, chat.title || "Chat");

            index++;
          }

          console.log("\n" + "=".repeat(60));
          console.log(`\n✅ Jami: ${chats.size} ta guruh/kanal topildi\n`);
        } catch (e) {
          console.error("❌ JSON parse xatolik:", e.message);
          console.log("Response:", data);
        }
      });
    })
    .on("error", (e) => {
      console.error("❌ So'rov xatolik:", e.message);
    });
}

function checkBotAdmin(token, chatId, chatTitle) {
  const url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${chatId}&user_id=${getBotId(
    token
  )}`;

  https
    .get(url, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const result = JSON.parse(data);

          if (result.ok && result.result) {
            const member = result.result;
            const status = member.status;

            if (status === "administrator" || status === "creator") {
              console.log(`   Status: ✅ Admin (${status})`);

              // Admin huquqlarini ko'rsatish
              if (member.can_manage_chat)
                console.log(`   - Chat boshqarish: ✅`);
              if (member.can_delete_messages)
                console.log(`   - Xabar o'chirish: ✅`);
              if (member.can_manage_video_chats)
                console.log(`   - Video chat boshqarish: ✅`);
              if (member.can_restrict_members)
                console.log(`   - A'zolarni cheklash: ✅`);
              if (member.can_promote_members)
                console.log(`   - Admin tayinlash: ✅`);
              if (member.can_change_info)
                console.log(`   - Ma'lumot o'zgartirish: ✅`);
              if (member.can_invite_users)
                console.log(`   - Foydalanuvchi taklif qilish: ✅`);
              if (member.can_post_messages)
                console.log(`   - Xabar yuborish: ✅`);
              if (member.can_edit_messages)
                console.log(`   - Xabar tahrirlash: ✅`);
              if (member.can_pin_messages)
                console.log(`   - Xabar pin qilish: ✅`);
            } else {
              console.log(`   Status: ❌ Admin emas (${status})`);
            }
          } else {
            console.log(
              `   Status: ❓ Tekshirib bo'lmadi (${
                result.description || "Noma'lum xatolik"
              })`
            );
          }
        } catch (e) {
          console.log(`   Status: ❌ Xatolik: ${e.message}`);
        }
      });
    })
    .on("error", (e) => {
      console.log(`   Status: ❌ So'rov xatolik: ${e.message}`);
    });
}

function getBotId(token) {
  // Token formatidan bot ID ni ajratib olish: BOT_ID:TOKEN
  return token.split(":")[0];
}

function getChatTypeEmoji(type) {
  switch (type) {
    case "group":
      return "👥";
    case "supergroup":
      return "👥";
    case "channel":
      return "📢";
    default:
      return "💬";
  }
}

function getChatTypeName(type) {
  switch (type) {
    case "group":
      return "Guruh";
    case "supergroup":
      return "Superguruh";
    case "channel":
      return "Kanal";
    case "private":
      return "Shaxsiy chat";
    default:
      return type;
  }
}
