// Test script to check Telegram message format
function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/'/g, "&#39;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;")
    .replace(/"/g, "&quot;");
}

const emailTitle = "Ichki suhbatga taklif";
const fullName = "Test User";
const statusLabelText = "1-bosqich (ichki suhbat) — kutilmoqda";
const mainText =
  "Sizning arizangiz ko'rib chiqildi. 1-bosqich — ichki suhbat uchun navbat belgilandi.";
const nextStepNote =
  "Iltimos, belgilangan vaqt va ko'rsatmalarga amal qiling. Qo'shimcha ma'lumotlar kerak bo'lsa, siz bilan bog'lanamiz.";

const parts = [];

parts.push(`📧 <b>${escapeHtml(emailTitle)}</b>`);
parts.push("");
parts.push(`👤 <b>Hurmatli ${escapeHtml(fullName)},</b>`);
parts.push("");
parts.push(
  `Sizning arizangiz holatini yangiladik. Quyida joriy holat va keyingi qadamlar bilan tanishishingiz mumkin.`
);
parts.push("");
parts.push(`🟢 <b>Holat:</b> <b>${escapeHtml(statusLabelText)}</b>`);
parts.push("");
parts.push(`📋 <b>Ma'lumot:</b>`);
parts.push(`${escapeHtml(mainText)}`);
parts.push("");
parts.push(`${escapeHtml(nextStepNote)}`);
parts.push("");
parts.push(`━━━━━━━━━━━━━━━`);
parts.push(`📢 <b>Foydali havolalar:</b>`);
parts.push("");
parts.push(
  `📌 <b>ConsultingUz rasmiy kanali:</b> <a href="https://t.me/Consulting_UZB">Kanalga o'tish</a>`
);
parts.push(
  `📍 <b>O'zbekiston bo'ylab nemis tili markazlarimiz:</b> <a href="https://t.me/dafsprachzentrum">Markazlar ro'yxati</a>`
);
parts.push("");
parts.push(`━━━━━━━━━━━━━━━`);
parts.push("");
parts.push(`🤝 <b>Hurmat bilan,</b>`);
parts.push(`<b>ConsultingUz jamoasi</b>`);

const message = parts.join("\n");

console.log("Message length:", message.length);
console.log("\n=== MESSAGE ===\n");
console.log(message);
console.log("\n=== END MESSAGE ===\n");

// Check for potential issues
const hasUnescapedChars =
  /<(?!\/?(b|i|a|code|pre|strong|em|u|s|strike|del)[\s>])/i.test(message);
console.log("Has unescaped HTML tags:", hasUnescapedChars);

// Check message length (Telegram limit is 4096 characters)
if (message.length > 4096) {
  console.log("WARNING: Message exceeds Telegram's 4096 character limit!");
}
