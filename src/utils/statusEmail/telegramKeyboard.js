/**
 * Telegram inline keyboard builder for status messages.
 */

function isValidTelegramUrl(url) {
  if (!url) return false;
  const urlStr = String(url).trim().toLowerCase();
  // Reject localhost, 127.0.0.1, and private network URLs
  if (
    urlStr.includes("localhost") ||
    urlStr.includes("127.0.0.1") ||
    urlStr.startsWith("http://192.168.") ||
    urlStr.startsWith("http://10.") ||
    urlStr.startsWith("http://172.")
  ) {
    console.warn("Skipping localhost/private URL for Telegram:", url);
    return false;
  }
  return urlStr.startsWith("http://") || urlStr.startsWith("https://");
}

export function buildTelegramKeyboard({
  link,
  linkType,
  dataExchangeLinkTg,
  channelInviteLinkTg,
}) {
  const keyboard = [];

  // Add interview link button if available and valid
  if (link && isValidTelegramUrl(link)) {
    const buttonText =
      linkType === "telegram"
        ? "🔗 Suhbat guruhiga qo'shilish"
        : "🔗 Suhbatga qo'shilish";
    keyboard.push([{ text: buttonText, url: link }]);
  }

  // Add DataExchange link button for stage_4 accepted (only if valid)
  if (dataExchangeLinkTg && isValidTelegramUrl(dataExchangeLinkTg)) {
    keyboard.push([
      { text: "📄 Hujjatlarni yuklash", url: dataExchangeLinkTg },
    ]);
  }

  // Add channel invite link button if available and valid
  if (channelInviteLinkTg && isValidTelegramUrl(channelInviteLinkTg)) {
    keyboard.push([
      { text: "📢 Yangiliklar kanaliga qo'shilish", url: channelInviteLinkTg },
    ]);
  }

  // Add channel buttons
  keyboard.push([
    { text: "📌 ConsultingUz kanali", url: "https://t.me/Consulting_UZB" },
    { text: "📍 Nemis tili markazlari", url: "https://t.me/dafsprachzentrum" },
  ]);

  return keyboard;
}
