// Webhook o'chirish scripti
// Ishlatish: node delete-webhook.cjs YOUR_BOT_TOKEN

const https = require("https");

const botToken = process.argv[2];

if (!botToken) {
  console.error("❌ Bot token kiritilmagan!");
  console.log("Ishlatish: node delete-webhook.cjs YOUR_BOT_TOKEN");
  process.exit(1);
}

console.log("🔧 Webhook o'chirilmoqda...");

const postData = JSON.stringify({
  drop_pending_updates: true,
});

const options = {
  hostname: "api.telegram.org",
  port: 443,
  path: `/bot${botToken}/deleteWebhook`,
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
        console.log("\n✅ Webhook muvaffaqiyatli o'chirildi!");
        console.log("\n📝 Endi getUpdates ishlatishingiz mumkin!");
      } else {
        console.log("\n❌ Webhook o'chirishda xatolik!");
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
