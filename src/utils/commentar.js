export const DEFAULT_COMMENT_TEMPLATE_HTML =
  "<p><strong>Eingeschätzte Sprachniveau:</strong>&nbsp;</p>" +
  "<p></p>" +
  "<p><strong>Erfahrung in diesem Bereich:</strong>&nbsp;</p>" +
  "<p></p>" +
  "<p><strong>Langfristige Ziele in Deutschland:</strong>&nbsp;</p>" +
  "<p></p>" +
  "<p><strong>Auslandserfahrungen:</strong>&nbsp;</p>" +
  "<p></p>" +
  "<p><strong>Familie/Kinder:</strong>&nbsp;</p>" +
  "<p></p>" +
  "<p><strong>Weitere Gesprächsnotizen:</strong>&nbsp;</p>" +
  "<p></p>";

export function hasRichTextContent(value) {
  return Boolean(
    String(value || "")
      .replace(/<[^>]*>/g, "")
      .trim()
  );
}

export function getCommentHtmlOrDefault(value) {
  const raw = String(value || "");
  return hasRichTextContent(raw) ? raw : DEFAULT_COMMENT_TEMPLATE_HTML;
}

function decodeHtmlEntities(input) {
  return String(input || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Convert (limited) rich-text HTML from our editor to plain text suitable for PDF.
export function commentHtmlToPlainText(value) {
  const html = getCommentHtmlOrDefault(value);

  let text = String(html || "")
    // line breaks
    .replace(/<br\s*\/?>/gi, "\n")
    // paragraphs
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")
    // lists
    .replace(/<\/li\s*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/?(ul|ol)[^>]*>/gi, "\n")
    // strip remaining tags
    .replace(/<[^>]*>/g, "");

  text = decodeHtmlEntities(text);

  // normalize whitespace/newlines
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  text = text.replace(/[ \t]+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  return text || "—";
}





