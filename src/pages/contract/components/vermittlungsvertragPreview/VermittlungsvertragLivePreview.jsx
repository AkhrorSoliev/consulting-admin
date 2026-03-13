import { useMemo } from "react";
import {
  A4_WIDTH_PT,
  A4_HEIGHT_PT,
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  PAGE_MARGIN_PT,
} from "./utils";
import { buildVermittlungsvertragBlocks } from "./buildVermittlungsvertragBlocks";
import useA4Pagination from "./useA4Pagination";

function extractBlockParams(form) {
  const firstName = String(form?.candidateFirstName || form?.firstName || "").trim();
  const lastName = String(form?.candidateLastName || form?.lastName || "").trim();
  const candidateBirthDate = String(form?.candidateBirthDate || form?.candidateBirthPlace || "").trim();
  const candidateNationality = String(form?.candidateNationality || form?.candidateLand || "").trim();
  const street = String(form?.candidateStreet || "").trim();
  const houseNumber = String(form?.candidateHouseNumber || "").trim();
  const postalCode = String(form?.candidatePLZ || "").trim();
  const country = String(form?.candidateLand || "").trim();
  const composedAddress = [street, houseNumber].filter(Boolean).join(" ").trim();
  const composedAddressWithPostal = [composedAddress, postalCode].filter(Boolean).join(", ").trim();
  const candidateAddress =
    [composedAddressWithPostal, country].filter(Boolean).join(", ").trim() ||
    String(form?.candidateAddress || "").trim();

  return {
    firstName, lastName, candidateBirthDate, candidateNationality, candidateAddress,
    candidatePassportNr: String(form?.candidatePassportNr || form?.passportNumber || form?.passportId || "").trim(),
    candidateCity: String(form?.signatureCity || form?.candidateCity || "").trim(),
    pdfGeneratedDate: String(form?.signatureDate || form?.pdfGeneratedDate || "").trim(),
    contractDurationYears: form?.contractDurationYears,
    contractProtectionMonths: form?.contractProtectionMonths,
    contractPenaltyPercent: form?.contractPenaltyPercent,
    contractPenaltyMaxEur: form?.contractPenaltyMaxEur,
  };
}

export default function VermittlungsvertragLivePreview({
  form,
  containerClassName,
  showToolbar = true,
}) {
  const blocks = useMemo(
    () => buildVermittlungsvertragBlocks(extractBlockParams(form)),
    [
      form?.candidateFirstName, form?.candidateLastName,
      form?.firstName, form?.lastName,
      form?.candidateBirthDate, form?.candidateBirthPlace,
      form?.candidateNationality, form?.candidateLand,
      form?.candidateAddress, form?.candidateStreet,
      form?.candidateHouseNumber, form?.candidatePLZ,
      form?.candidatePassportNr, form?.passportNumber, form?.passportId,
      form?.signatureCity, form?.signatureDate,
      form?.candidateCity, form?.pdfGeneratedDate,
      form?.contractDurationYears, form?.contractProtectionMonths,
      form?.contractPenaltyPercent, form?.contractPenaltyMaxEur,
    ],
  );

  const { viewportRef, measureRef, safeScale, resolvedGroups, contentBottomPadPt } =
    useA4Pagination(blocks);

  function ScaledA4({ children, pageLabel }) {
    const scaledW = A4_WIDTH_PX * safeScale;
    const scaledH = A4_HEIGHT_PX * safeScale;
    return (
      <div style={{ width: `${scaledW}px`, height: `${scaledH}px` }}>
        <div
          aria-label={pageLabel}
          style={{
            width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px`,
            position: "relative", left: "50%", top: 0,
            transform: `translateX(-50%) scale(${safeScale})`,
            transformOrigin: "top center",
          }}
        >{children}</div>
      </div>
    );
  }

  return (
    <section
      className={
        (containerClassName ||
          "w-full flex-1 min-w-0 h-[calc(100vh-2rem)] lg:sticky lg:top-4") +
        " relative"
      }
    >
      <div className="bg-slate-200/50 rounded-xl border border-slate-300 shadow-inner h-full flex flex-col overflow-hidden">
        {showToolbar ? (
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider z-10">
            <span>Vorschau (A4)</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live-Aktualisierung
            </span>
          </div>
        ) : null}
        <div ref={viewportRef} className="flex-1 overflow-y-auto w-full bg-slate-100 overflow-x-hidden">
          <div className="w-full flex flex-col gap-6 py-6 items-center">
            <div aria-hidden="true" className="absolute -left-[99999px] top-0 h-0 overflow-hidden opacity-0 pointer-events-none">
              <div
                className="bg-white text-[#0f172a] text-[11pt] leading-[1.45] box-border"
                style={{ fontFamily: "Inter, Helvetica, Arial, sans-serif", width: `${A4_WIDTH_PT}pt`, padding: `${PAGE_MARGIN_PT}pt`, paddingBottom: `${contentBottomPadPt}pt` }}
              >
                <div ref={measureRef} style={{ position: "relative", width: "100%" }}>
                  {blocks.map((b) => (<div key={b.id} data-block className="pr-[6pt]">{b.node}</div>))}
                  <div data-sentinel />
                </div>
              </div>
            </div>
            {resolvedGroups.map((group, pageIdx) => {
              const blocksForPage = group.map((i) => blocks[i]).filter(Boolean);
              return (
                <ScaledA4 key={pageIdx} pageLabel={`A4-Seite ${pageIdx + 1}`}>
                  <div
                    className="bg-white shadow-2xl text-[#0f172a] text-[11pt] leading-[1.45] origin-top shrink-0 box-border"
                    style={{ fontFamily: "Inter, Helvetica, Arial, sans-serif", width: `${A4_WIDTH_PT}pt`, height: `${A4_HEIGHT_PT}pt`, padding: `${PAGE_MARGIN_PT}pt`, paddingBottom: `${contentBottomPadPt}pt` }}
                  >
                    {blocksForPage.map((b) => (<div key={b.id} className="pr-[6pt]">{b.node}</div>))}
                  </div>
                </ScaledA4>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
