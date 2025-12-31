// Webhook o'rnatish scripti
// Ishlatish: node set-webhook.cjs YOUR_BOT_TOKEN

const https = require("https");

const botToken = process.argv[2];
const webhookUrl =
  "https://us-central1-consulting-bdb74.cloudfunctions.net/telegramBotWebhook";

if (!botToken) {
  console.error("❌ Bot token kiritilmagan!");
  console.log("Ishlatish: node set-webhook.cjs YOUR_BOT_TOKEN");
  process.exit(1);
}

console.log("🔧 Webhook o'rnatilmoqda...");
console.log("🔗 URL:", webhookUrl);

const postData = JSON.stringify({
  url: webhookUrl,
  max_connections: 40,
  drop_pending_updates: false,
});

const options = {
  hostname: "api.telegram.org",
  port: 443,
  path: `/bot${botToken}/setWebhook`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
  },
};

const req = https.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const result = JSON.parse(data);

      console.log("\n📊 Natija:\n");
      console.log("✅ OK:", result.ok);
      console.log("📝 Description:", result.description);

      if (result.ok) {
        console.log("\n✅ Webhook muvaffaqiyatli o'rnatildi!");
        console.log("\n📝 Tekshirish uchun:");
        console.log("node check-webhook.cjs", botToken);
      } else {
        console.log("\n❌ Webhook o'rnatishda xatolik!");
        console.log("Xatolik:", result.description);
      }

      console.log("\n📄 To'liq javob:");
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error("❌ JSON parse xatolik:", e.message);
      console.log("Response:", data);
    }
  });
});

req.on("error", (e) => {
  console.error("❌ So'rov xatolik:", e.message);
});

req.write(postData);
req.end();
