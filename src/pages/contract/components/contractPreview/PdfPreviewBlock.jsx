/**
 * Renders the passport PDF preview block (or loading/error states)
 * that appears on the final page of the contract.
 */

import { SafeInline, formatDdMmYyyy } from "./utils";

export function buildPdfPreviewBlocks({
  form,
  pdfPreviewUrl,
  pdfPreviewError,
}) {
  const extra = [];

  if (pdfPreviewUrl) {
    const candidateCity = String(form?.candidateCity || "").trim();
    const pdfGeneratedDateRaw =
      String(form?.pdfGeneratedDate || "").trim() ||
      formatDdMmYyyy(new Date());
    const candidateFullName = `${String(
      form?.firstName || ""
    ).trim()} ${String(form?.lastName || "").trim()}`.trim();

    extra.push({
      id: "pdf-preview",
      forceNewPage: true,
      node: (
        <div
          className="flex flex-col justify-end items-center"
          style={{ height: "100%" }}
        >
          <div style={{ width: "78.4%" }}>
            <img
              src={pdfPreviewUrl}
              alt="Passport preview"
              className="block"
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                objectFit: "contain",
                backgroundColor: "#ffffff",
              }}
            />

            <div className="mt-[14pt] text-[11pt] leading-[1.4]">
              <div className="font-medium">
                Datum:{" "}
                <SafeInline>
                  {candidateCity ? `${candidateCity}, ` : ""}
                </SafeInline>
                <SafeInline>{pdfGeneratedDateRaw}</SafeInline>
              </div>

              <div className="mt-[8pt] font-medium">
                Name: <SafeInline>{candidateFullName}</SafeInline>
              </div>

              <div className="mt-[18pt] font-medium">Unterschrift:</div>
              <div className="mt-[10pt] border-b border-slate-700 h-[22pt]" />
            </div>
          </div>
        </div>
      ),
    });
  } else if (pdfPreviewError) {
    extra.push({
      id: "pdf-preview-error",
      forceNewPage: true,
      node: (
        <div className="mt-[10pt]">
          <div className="mt-[6pt] text-[10pt] text-red-700 bg-red-50 border border-red-200 rounded-md p-2 whitespace-pre-wrap">
            {pdfPreviewError}
          </div>
        </div>
      ),
    });
  } else {
    extra.push({
      id: "pdf-preview-loading",
      forceNewPage: true,
      node: (
        <div className="mt-[10pt]">
          <div className="mt-[6pt] text-[10pt] text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-2">
            Loading…
          </div>
        </div>
      ),
    });
  }

  return extra;
}
