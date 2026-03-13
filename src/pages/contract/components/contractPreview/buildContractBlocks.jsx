/**
 * Assembles all contract sections into a flat array of renderable blocks.
 */

import { buildIntroBlocks } from "./contractBlocksIntro";
import { buildPaymentBlocks } from "./contractBlocksPayment";
import { buildLegalBlocks } from "./contractBlocksLegal";
import { buildFinalBlocks } from "./contractBlocksFinal";

export function buildContractBlocks({
  clientFullName,
  contractDate,
  signatureCity,
  totalText = "_____ €",
  advText = "_____ €",
  restText = "_____ €",
}) {
  const nameLine =
    String(clientFullName || "").trim() || "_____________________";
  const dateLine = String(contractDate || "").trim() || "____.__.____";
  const signatureCityLine =
    String(signatureCity || "").trim() || "_____________________";

  const SectionTitle = ({ n, title }) => (
    <div className="mt-[10pt] font-semibold">
      {n}. {title}
    </div>
  );

  const P = ({ children, className = "" }) => (
    <div className={`mt-[6pt] ${className}`}>{children}</div>
  );

  const Bullet = ({ children }) => (
    <div className="flex gap-[6pt] mt-[3pt]">
      <span className="shrink-0">-</span>
      <span className="min-w-0 wrap-break-word">{children}</span>
    </div>
  );

  const shared = { nameLine, dateLine, signatureCityLine, SectionTitle, P, Bullet };

  return [
    ...buildIntroBlocks(shared),
    ...buildPaymentBlocks({ ...shared, totalText, advText, restText }),
    ...buildLegalBlocks(shared),
    ...buildFinalBlocks(shared),
  ];
}
