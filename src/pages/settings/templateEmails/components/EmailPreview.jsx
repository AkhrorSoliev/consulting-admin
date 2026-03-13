import { useMemo } from "react";

export default function EmailPreview({ subject, to, htmlContent, message }) {
  const safeSubject = String(subject || "").trim();
  const safeTo = String(to || "").trim();
  const safeHtml = String(htmlContent || "").trim();
  const safeMsg = String(message || "").trim();

  const inlineBodyHtml = useMemo(() => {
    if (!safeHtml) return "";
    // Prefer DOMParser (browser) to extract <body> content for smooth preview updates.
    try {
      if (typeof DOMParser !== "undefined") {
        const parser = new DOMParser();
        const doc = parser.parseFromString(safeHtml, "text/html");
        const body = doc?.body;
        const inner = body?.innerHTML;
        if (typeof inner === "string") return inner;
      }
    } catch {
      // ignore and fallback below
    }
    // Fallback: best-effort regex extract body.
    const m = safeHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (m && typeof m[1] === "string") return m[1];
    return safeHtml;
  }, [safeHtml]);

  const previewHtml = useMemo(() => {
    if (!inlineBodyHtml) return "";
    // Make email preview responsive on tablet/mobile.
    // Note: this does NOT change the actual sent email HTML, only the settings preview.
    const style = `
      <style>
        html, body { max-width: 100%; overflow-x: hidden; }
        table { max-width: 100% !important; width: 100% !important; }
        img { max-width: 100% !important; height: auto !important; }
        td, div, p, span { word-break: break-word; }
        a { word-break: break-all; }
      </style>
    `;
    return `${style}${inlineBodyHtml}`;
  }, [inlineBodyHtml]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="text-xs opacity-60">An</div>
          <div className="font-medium wrap-break-word">{safeTo || "—"}</div>
        </div>
        <div>
          <div className="text-xs opacity-60">Betreff</div>
          <div className="font-medium wrap-break-word">
            {safeSubject || "—"}
          </div>
        </div>
      </div>

      {safeHtml ? (
        <div className="rounded-lg border border-base-300 bg-white overflow-hidden">
          <div className="w-full p-4 overflow-x-auto">
            <div
              className="min-h-full"
              // Smooth preview (no iframe reload): render email body HTML inline.
              // This is used only in Settings -> Template Emaillar page.
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-base-300 bg-base-100 p-3">
          <div className="text-xs opacity-60 mb-2">
            Kein HTML (Textvorschau)
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">
            {safeMsg || "—"}
          </pre>
        </div>
      )}
    </div>
  );
}
