// Bot admin huquqlarini tekshirish (ma'lum chat ID lar bilan)
// Ishlatish: node check-bot-admin.cjs YOUR_BOT_TOKEN CHAT_ID1 CHAT_ID2 ...

const https = require("https");

const botToken = process.argv[2];
const chatIds = process.argv.slice(3);

if (!botToken) {
  console.error("❌ Bot token kiritilmagan!");
  console.log(
    "Ishlatish: node check-bot-admin.cjs YOUR_BOT_TOKEN CHAT_ID1 CHAT_ID2 ..."
  );
  console.log("\nMisol:");
  console.log(
    "node check-bot-admin.cjs YOUR_TOKEN -1001234567890 -1009876543210"
  );
  process.exit(1);
}

if (chatIds.length === 0) {
  console.error("❌ Hech qanday chat ID kiritilmagan!");
  console.log(
    "\nIshlatish: node check-bot-admin.cjs YOUR_BOT_TOKEN CHAT_ID1 CHAT_ID2 ..."
  );
  console.log("\n💡 Chat ID ni qanday topish:");
  console.log("   1. Botni guruhga qo'shing");
  console.log("   2. @userinfobot ni guruhga qo'shing");
  console.log("   3. @userinfobot chat ID ni ko'rsatadi");
  console.log('\nYoki Firestore da "meta" collection dan chat_id larni oling');
  process.exit(1);
}

const botId = botToken.split(":")[0];

console.log("🤖 Bot ID:", botId);
console.log("📊 Tekshiriladigan chatlar:", chatIds.length, "ta\n");
console.log("=".repeat(70) + "\n");

let completed = 0;
const total = chatIds.length;

chatIds.forEach((chatId, index) => {
  checkBotInChat(botToken, botId, chatId.trim(), index + 1, () => {
    completed++;
    if (completed === total) {
      console.log("\n" + "=".repeat(70));
      console.log(`\n✅ Barcha ${total} ta chat tekshirildi\n`);
    }
  });
});

function checkBotInChat(token, botId, chatId, index, callback) {
  // Avval chat haqida ma'lumot olish
  const chatInfoUrl = `https://api.telegram.org/bot${token}/getChat?chat_id=${chatId}`;

  https
    .get(chatInfoUrl, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const result = JSON.parse(data);

          if (result.ok && result.result) {
            const chat = result.result;

            console.log(
              `${index}. ${getChatTypeEmoji(chat.type)} ${
                chat.title || "Nomsiz"
              }`
            );
            console.log(`   Chat ID: ${chatId}`);
            console.log(`   Turi: ${getChatTypeName(chat.type)}`);

            if (chat.username) {
              console.log(`   Username: @${chat.username}`);
              console.log(`   Link: https://t.me/${chat.username}`);
            }

            if (chat.description) {
              console.log(
                `   Tavsif: ${chat.description.substring(0, 100)}${
                  chat.description.length > 100 ? "..." : ""
                }`
              );
            }

            // Bot statusini tekshirish
            checkBotStatus(token, botId, chatId, callback);
          } else {
            console.log(`${index}. ❌ Chat topilmadi: ${chatId}`);
            console.log(`   Xatolik: ${result.description || "Noma'lum"}`);
            console.log(
              `   Sabab: Bot bu chatda emas yoki chat ID noto'g'ri\n`
            );
            callback();
          }
        } catch (e) {
          console.log(
            `${index}. ❌ Chat ma'lumotlarini olishda xatolik: ${chatId}`
          );
          console.log(`   ${e.message}\n`);
          callback();
        }
      });
    })
    .on("error", (e) => {
      console.log(`${index}. ❌ So'rov xatolik: ${chatId}`);
      console.log(`   ${e.message}\n`);
      callback();
    });
}

function checkBotStatus(token, botId, chatId, callback) {
  const url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${chatId}&user_id=${botId}`;

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

            console.log(
              `   Status: ${getStatusEmoji(status)} ${getStatusName(status)}`
            );

            if (status === "administrator" || status === "creator") {
              console.log(`   Huquqlar:`);

              const permissions = [
                { key: "can_manage_chat", name: "Chat boshqarish" },
                { key: "can_delete_messages", name: "Xabar o'chirish" },
                {
                  key: "can_manage_video_chats",
                  name: "Video chat boshqarish",
                },
                { key: "can_restrict_members", name: "A'zolarni cheklash" },
                { key: "can_promote_members", name: "Admin tayinlash" },
                { key: "can_change_info", name: "Ma'lumot o'zgartirish" },
                {
                  key: "can_invite_users",
                  name: "Foydalanuvchi taklif qilish",
                },
                { key: "can_post_messages", name: "Xabar yuborish (kanal)" },
                { key: "can_edit_messages", name: "Xabar tahrirlash (kanal)" },
                { key: "can_pin_messages", name: "Xabar pin qilish" },
                { key: "can_manage_topics", name: "Mavzularni boshqarish" },
              ];

              let hasAnyPermission = false;
              permissions.forEach((perm) => {
                if (member[perm.key] === true) {
                  console.log(`     ✅ ${perm.name}`);
                  hasAnyPermission = true;
                }
              });

              if (!hasAnyPermission) {
                console.log(`     ⚠️  Hech qanday maxsus huquq yo'q`);
              }
            } else if (status === "member") {
              console.log(`   ⚠️  Bot oddiy a'zo, admin emas`);
            } else if (status === "left") {
              console.log(`   ⚠️  Bot guruhni tark etgan`);
            } else if (status === "kicked") {
              console.log(`   ⚠️  Bot guruhdan chiqarib yuborilgan`);
            }
          } else {
            console.log(`   Status: ❓ Tekshirib bo'lmadi`);
            console.log(`   Xatolik: ${result.description || "Noma'lum"}`);
          }

          console.log("");
          callback();
        } catch (e) {
          console.log(`   Status: ❌ Xatolik: ${e.message}\n`);
          callback();
        }
      });
    })
    .on("error", (e) => {
      console.log(`   Status: ❌ So'rov xatolik: ${e.message}\n`);
      callback();
    });
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

function getStatusEmoji(status) {
  switch (status) {
    case "creator":
      return "👑";
    case "administrator":
      return "⭐";
    case "member":
      return "👤";
    case "restricted":
      return "🚫";
    case "left":
      return "🚪";
    case "kicked":
      return "❌";
    default:
      return "❓";
  }
}

function getStatusName(status) {
  switch (status) {
    case "creator":
      return "Yaratuvchi";
    case "administrator":
      return "Administrator";
    case "member":
      return "A'zo";
    case "restricted":
      return "Cheklangan";
    case "left":
      return "Tark etgan";
    case "kicked":
      return "Chiqarilgan";
    default:
      return status;
  }
}
