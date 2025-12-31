// Firestore dan telegram_groups collection ni o'qish va bot admin huquqlarini tekshirish
// Ishlatish: node get-firestore-chats.cjs

const admin = require("firebase-admin");
const https = require("https");

// Firebase Admin SDK ni initialize qilish
const serviceAccount = require("./functions/service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const botToken = "8413149480:AAHH98Sh7El9n51e3JNLZ0W4FjL7DYxxam0";
const botId = botToken.split(":")[0];

console.log("🔍 Firestore dan telegram_groups ni o'qish...\n");

async function main() {
  try {
    const snapshot = await db.collection("telegram_groups").get();

    if (snapshot.empty) {
      console.log("⚠️  telegram_groups collection bo'sh yoki mavjud emas\n");
      return;
    }

    console.log(`📊 Jami ${snapshot.size} ta guruh/kanal topildi\n`);
    console.log("=".repeat(70) + "\n");

    const groups = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      groups.push({
        id: doc.id,
        ...data,
      });
    });

    // Chat ID bo'yicha saralash
    groups.sort((a, b) => {
      const aId = String(a.chat_id || "");
      const bId = String(b.chat_id || "");
      return aId.localeCompare(bId);
    });

    let index = 1;
    for (const group of groups) {
      const chatId = String(group.chat_id || "").trim();
      const name = String(group.name || "Nomsiz").trim();
      const active = group.active !== false;
      const linksSent = Number(group.linksSentCount) || 0;

      console.log(`${index}. ${name}`);
      console.log(`   Document ID: ${group.id}`);
      console.log(`   Chat ID: ${chatId || "❌ Yo'q"}`);
      console.log(`   Holat: ${active ? "✅ Aktiv" : "❌ O'chirilgan"}`);
      console.log(`   Yuborilgan linklar: ${linksSent}`);

      if (chatId) {
        await checkBotInChat(botToken, botId, chatId);
      } else {
        console.log(`   ⚠️  Chat ID mavjud emas\n`);
      }

      index++;
    }

    console.log("=".repeat(70));
    console.log(`\n✅ Barcha ${groups.length} ta guruh tekshirildi\n`);
  } catch (error) {
    console.error("❌ Xatolik:", error.message);
  } finally {
    process.exit(0);
  }
}

function checkBotInChat(token, botId, chatId) {
  return new Promise((resolve) => {
    // Avval chat haqida ma'lumot
    const chatUrl = `https://api.telegram.org/bot${token}/getChat?chat_id=${chatId}`;

    https
      .get(chatUrl, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const result = JSON.parse(data);
            if (result.ok && result.result) {
              const chat = result.result;
              console.log(`   Turi: ${getChatTypeName(chat.type)}`);
              if (chat.username) {
                console.log(`   Link: https://t.me/${chat.username}`);
              }
            }
          } catch (e) {}

          // Bot statusini tekshirish
          checkBotStatus(token, botId, chatId, resolve);
        });
      })
      .on("error", () => {
        console.log(`   ❌ Chat ma'lumotlarini olishda xatolik\n`);
        resolve();
      });
  });
}

function checkBotStatus(token, botId, chatId, callback) {
  const url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${chatId}&user_id=${botId}`;

  https
    .get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const result = JSON.parse(data);

          if (result.ok && result.result) {
            const member = result.result;
            const status = member.status;

            console.log(
              `   Bot status: ${getStatusEmoji(status)} ${getStatusName(
                status
              )}`
            );

            if (status === "administrator" || status === "creator") {
              const perms = [];
              if (member.can_manage_chat) perms.push("Chat boshqarish");
              if (member.can_delete_messages) perms.push("Xabar o'chirish");
              if (member.can_restrict_members) perms.push("A'zolarni cheklash");
              if (member.can_invite_users) perms.push("Taklif qilish");
              if (member.can_post_messages) perms.push("Xabar yuborish");

              if (perms.length > 0) {
                console.log(`   Huquqlar: ${perms.join(", ")}`);
              }
            }
          } else {
            console.log(
              `   Bot status: ❓ Tekshirib bo'lmadi (${
                result.description || "Xatolik"
              })`
            );
          }
        } catch (e) {
          console.log(`   Bot status: ❌ ${e.message}`);
        }

        console.log("");
        callback();
      });
    })
    .on("error", () => {
      console.log(`   Bot status: ❌ So'rov xatolik\n`);
      callback();
    });
}

function getChatTypeName(type) {
  switch (type) {
    case "group":
      return "Guruh";
    case "supergroup":
      return "Superguruh";
    case "channel":
      return "Kanal";
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
    case "left":
      return "Tark etgan";
    case "kicked":
      return "Chiqarilgan";
    default:
      return status;
  }
}

main();
