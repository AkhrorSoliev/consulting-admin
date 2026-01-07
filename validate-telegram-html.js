// Validate Telegram HTML message structure
function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Test stage_1 accepted message
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
parts.push(`🟢 <b>Holat: ${escapeHtml(statusLabelText)}</b>`);
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

console.log("=== TELEGRAM MESSAGE ===");
console.log(message);
console.log("\n=== VALIDATION ===");
console.log("Message length:", message.length);
console.log(
  "Max length (4096):",
  message.length <= 4096 ? "✓ OK" : "✗ TOO LONG"
);

// Check for unclosed tags
const openTags = (message.match(/<b>/g) || []).length;
const closeTags = (message.match(/<\/b>/g) || []).length;
console.log("Open <b> tags:", openTags);
console.log("Close </b> tags:", closeTags);
console.log("Tags balanced:", openTags === closeTags ? "✓ OK" : "✗ UNBALANCED");

const openITags = (message.match(/<i>/g) || []).length;
const closeITags = (message.match(/<\/i>/g) || []).length;
console.log("Open <i> tags:", openITags);
console.log("Close </i> tags:", closeITags);
console.log(
  "Italic tags balanced:",
  openITags === closeITags ? "✓ OK" : "✗ UNBALANCED"
);

const openATags = (message.match(/<a /g) || []).length;
const closeATags = (message.match(/<\/a>/g) || []).length;
console.log("Open <a> tags:", openATags);
console.log("Close </a> tags:", closeATags);
console.log(
  "Link tags balanced:",
  openATags === closeATags ? "✓ OK" : "✗ UNBALANCED"
);

// Check for invalid HTML entities
const invalidEntities = message.match(/&#?\w+;/g);
if (invalidEntities && invalidEntities.length > 0) {
  console.log("HTML entities found:", invalidEntities);
  console.log("⚠ Telegram may not support HTML entities");
} else {
  console.log("No HTML entities: ✓ OK");
}

// Check for nested bold tags
if (message.includes("<b><b>") || message.includes("</b></b>")) {
  console.log("✗ NESTED BOLD TAGS FOUND");
} else {
  console.log("No nested bold tags: ✓ OK");
}

console.log("\n=== TELEGRAM-COMPATIBLE HTML TAGS ===");
console.log("Allowed: <b>, <i>, <a>, <code>, <pre>, <u>, <s>, <strike>");
console.log("NOT allowed: <strong>, <em>, <del>, and most HTML entities");
