// Script to help users reset their bot session by blocking and unblocking them
// This forces Telegram to treat the next /start as a fresh session

const https = require("https");

const botToken = process.argv[2];
const userId = process.argv[3];

if (!botToken || !userId) {
  console.error("❌ Bot token va user ID kiritilmagan!");
  console.log("Ishlatish: node reset-bot-session.cjs BOT_TOKEN USER_ID");
  process.exit(1);
}

async function makeRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `https://api.telegram.org/bot${botToken}/${method}?${queryString}`;

    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function resetSession() {
  try {
    console.log(`\n🔄 Resetting session for user ${userId}...\n`);

    // Step 1: Block user (this clears the session)
    console.log("1️⃣ Blocking user...");
    const blockResult = await makeRequest("blockUser", { user_id: userId });

    if (blockResult.ok) {
      console.log("✅ User blocked successfully");
    } else {
      console.log("⚠️  Block failed:", blockResult.description);
    }

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 2: Unblock user
    console.log("\n2️⃣ Unblocking user...");
    const unblockResult = await makeRequest("unblockUser", { user_id: userId });

    if (unblockResult.ok) {
      console.log("✅ User unblocked successfully");
    } else {
      console.log("⚠️  Unblock failed:", unblockResult.description);
    }

    console.log("\n✅ Session reset complete!");
    console.log("\n📝 Next steps:");
    console.log("1. User should open this link:");
    console.log(
      "   https://t.me/consultinguz_admin_bot?start=straßenbau-ausbildung-2026__lead__2020"
    );
    console.log("2. Bot should now receive the payload correctly");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

resetSession();
