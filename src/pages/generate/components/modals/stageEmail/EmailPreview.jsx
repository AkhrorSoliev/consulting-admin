import InfoRow from "./InfoRow";

export default function EmailPreview({ subject, to, htmlContent, message }) {
  const safeSubject = String(subject || "").trim();
  const safeTo = String(to || "").trim();
  const safeHtml = String(htmlContent || "").trim();
  const safeMsg = String(message || "").trim();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow label="An" value={safeTo || "\u2014"} />
        <InfoRow label="Betreff" value={safeSubject || "\u2014"} />
      </div>

      {safeHtml ? (
        <div className="rounded-lg border border-base-300 bg-base-100 overflow-hidden">
          <iframe
            title="E-Mail-Vorschau"
            className="w-full h-64 sm:h-80 md:h-96 bg-white"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            srcDoc={safeHtml}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-base-300 bg-base-100 p-3">
          <div className="text-xs opacity-60 mb-2">Kein HTML (Textansicht)</div>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">
            {safeMsg || "\u2014"}
          </pre>
        </div>
      )}
    </div>
  );
}
