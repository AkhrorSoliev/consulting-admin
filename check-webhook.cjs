// Webhook holatini tekshirish scripti
// Ishlatish: node check-webhook.cjs YOUR_BOT_TOKEN

const https = require("https");

const botToken = process.argv[2];

if (!botToken) {
  console.error("❌ Bot token kiritilmagan!");
  console.log("Ishlatish: node check-webhook.cjs YOUR_BOT_TOKEN");
  process.exit(1);
}

const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;

https
  .get(url, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const result = JSON.parse(data);

        console.log("\n📊 Webhook holati:\n");
        console.log("✅ OK:", result.ok);

        if (result.result) {
          const info = result.result;
          console.log("🔗 URL:", info.url || "❌ O'rnatilmagan");
          console.log("📝 Pending updates:", info.pending_update_count || 0);
          console.log(
            "📅 Last error date:",
            info.last_error_date
              ? new Date(info.last_error_date * 1000).toLocaleString()
              : "Yo'q"
          );
          console.log("❌ Last error:", info.last_error_message || "Yo'q");
          console.log("🔢 Max connections:", info.max_connections || "Default");

          if (!info.url) {
            console.log("\n⚠️  MUAMMO: Webhook URL o'rnatilmagan!");
            console.log("\n📝 Webhook o'rnatish uchun:");
            console.log("node set-webhook.cjs YOUR_BOT_TOKEN");
          } else if (info.last_error_message) {
            console.log("\n⚠️  MUAMMO: Webhook xatolik bermoqda!");
            console.log("Xatolik:", info.last_error_message);
          } else {
            console.log("\n✅ Webhook to'g'ri sozlangan!");
          }
        }

        console.log("\n📄 To'liq ma'lumot:");
        console.log(JSON.stringify(result, null, 2));
      } catch (e) {
        console.error("❌ JSON parse xatolik:", e.message);
        console.log("Response:", data);
      }
    });
  })
  .on("error", (e) => {
    console.error("❌ So'rov xatolik:", e.message);
  });
