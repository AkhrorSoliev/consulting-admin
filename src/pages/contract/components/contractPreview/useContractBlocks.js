/**
 * Hook that builds the renderable block list from form data and PDF preview state.
 */

import { useMemo } from "react";
import { parseMoneyEur, formatEur, normalizeMaybeUrl } from "./utils";
import { buildContractBlocks } from "./buildContractBlocks";
import { buildPdfPreviewBlocks } from "./PdfPreviewBlock";

export function useContractBlocks({ form, pdfUrl, pdfPreviewUrl, pdfPreviewError }) {
  return useMemo(() => {
    const total = parseMoneyEur(form?.feeTotalEur);
    const adv = parseMoneyEur(form?.feeAdvanceEur);
    const rest =
      total != null && adv != null && Number.isFinite(total - adv)
        ? Math.max(0, total - adv)
        : null;
    const totalText = total != null ? formatEur(total) : "_____ €";
    const advText = adv != null ? formatEur(adv) : "_____ €";
    const restText = rest != null ? formatEur(rest) : "_____ €";

    const base = buildContractBlocks({
      clientFullName: `${String(form?.firstName || "").trim()} ${String(
        form?.lastName || ""
      ).trim()}`.trim(),
      contractDate: String(form?.contractDate || "").trim(),
      signatureCity: String(form?.signatureCity || "").trim(),
      totalText,
      advText,
      restText,
    });

    const url = normalizeMaybeUrl(pdfUrl);
    if (!url) return base;

    const extra = buildPdfPreviewBlocks({ form, pdfPreviewUrl, pdfPreviewError });
    return [...base, ...extra];
  }, [
    form?.firstName,
    form?.lastName,
    form?.contractDate,
    form?.signatureCity,
    form?.feeTotalEur,
    form?.feeAdvanceEur,
    pdfUrl,
    pdfPreviewUrl,
    pdfPreviewError,
  ]);
}
