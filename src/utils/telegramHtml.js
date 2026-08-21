/**
 * Convert arbitrary HTML (e.g. a full email template) into the small HTML
 * subset that Telegram's `parse_mode: "HTML"` understands.
 *
 * Telegram only accepts <b> <i> <u> <s> <code> <pre> <a>. Everything else has
 * to be turned into plain text/newlines, and every character that is not part
 * of a tag we emit must be escaped — otherwise the raw markup shows up in the
 * chat or the API rejects the message with "can't parse entities".
 */

const INLINE_TAGS = {
  b: "b",
  strong: "b",
  i: "i",
  em: "i",
  u: "u",
  ins: "u",
  s: "s",
  strike: "s",
  del: "s",
  code: "code",
  pre: "pre",
};

// Blocks whose *content* must never reach the message (CSS, scripts, <head>).
const DROPPED_BLOCKS =
  /<(head|style|script|title|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

const BLOCK_TAGS = new Set([
  "p", "div", "table", "tbody", "thead", "tr", "ul", "ol", "hr",
  "blockquote", "section", "article", "header", "footer", "main",
  "body", "html", "center", "figure",
]);

// Only real markup switches on the HTML parser; plain text that happens to
// contain <angle brackets> must stay plain text.
const HTML_MARKUP =
  /<\/?(?:html|head|body|title|style|script|div|p|br|span|font|center|table|tbody|thead|tr|td|th|a|b|strong|i|em|u|ins|s|strike|del|code|pre|ul|ol|li|h[1-6]|img|hr|blockquote|section|article|header|footer|main|figure)\b[^>]*>/i;

const NAMED_ENTITIES = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  laquo: "«", raquo: "»", ndash: "–", mdash: "—", hellip: "…",
  copy: "©", reg: "®", trade: "™", euro: "€", middot: "·", bull: "•",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”",
};

export function escapeTelegramHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function decodeEntities(value) {
  return String(value).replace(
    /&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);/gi,
    (match, ref) => {
      if (ref[0] === "#") {
        const code =
          ref[1] === "x" || ref[1] === "X"
            ? parseInt(ref.slice(2), 16)
            : parseInt(ref.slice(1), 10);
        try {
          return Number.isFinite(code) && code > 0
            ? String.fromCodePoint(code)
            : match;
        } catch {
          return match;
        }
      }
      const named = NAMED_ENTITIES[ref.toLowerCase()];
      return named === undefined ? match : named;
    }
  );
}

function mapInlineTag(name) {
  if (INLINE_TAGS[name]) return INLINE_TAGS[name];
  if (name === "a") return "a";
  if (/^h[1-6]$/.test(name)) return "b";
  return "";
}

function readHref(attrs) {
  const match = /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs || "");
  const raw = decodeEntities(match?.[2] ?? match?.[3] ?? match?.[4] ?? "").trim();
  return /^(https?:|tg:|mailto:)/i.test(raw) ? escapeTelegramHtml(raw) : "";
}

function tidy(value) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\u00a0]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * @param {string} input HTML (or plain text) to convert.
 * @returns {string} Telegram-safe HTML.
 */
export function htmlToTelegramHtml(input) {
  const raw = String(input || "");
  if (!raw.trim()) return "";
  if (!HTML_MARKUP.test(raw)) {
    return tidy(escapeTelegramHtml(decodeEntities(raw)));
  }

  const cleaned = raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(DROPPED_BLOCKS, "")
    .replace(/<![^>]*>/g, "");

  const out = [];
  const stack = [];
  const tagRe = /<(\/?)([a-z][a-z0-9-]*)\b([^>]*)>/gi;
  let cursor = 0;
  let match;

  const closeDownTo = (tag) => {
    const idx = stack.lastIndexOf(tag);
    if (idx === -1) return;
    while (stack.length > idx) out.push(`</${stack.pop()}>`);
  };

  while ((match = tagRe.exec(cleaned)) !== null) {
    const text = cleaned.slice(cursor, match.index);
    if (text) out.push(escapeTelegramHtml(decodeEntities(text)));
    cursor = tagRe.lastIndex;

    const isClosing = match[1] === "/";
    const name = match[2].toLowerCase();
    const attrs = match[3] || "";
    const heading = /^h[1-6]$/.test(name);
    const inline = mapInlineTag(name);

    if (name === "br") {
      out.push("\n");
      continue;
    }
    if (name === "li") {
      out.push(isClosing ? "\n" : "\n• ");
      continue;
    }
    if (name === "td" || name === "th") {
      if (isClosing) out.push(" ");
      continue;
    }
    if (inline) {
      if (heading && !isClosing) out.push("\n");
      if (isClosing) {
        closeDownTo(inline);
      } else if (inline === "a") {
        const href = readHref(attrs);
        if (href) {
          stack.push("a");
          out.push(`<a href="${href}">`);
        }
      } else {
        stack.push(inline);
        out.push(`<${inline}>`);
      }
      if (heading && isClosing) out.push("\n");
      continue;
    }
    if (BLOCK_TAGS.has(name)) out.push("\n");
  }

  const tail = cleaned.slice(cursor);
  if (tail) out.push(escapeTelegramHtml(decodeEntities(tail)));
  while (stack.length) out.push(`</${stack.pop()}>`);

  return tidy(out.join(""));
}
