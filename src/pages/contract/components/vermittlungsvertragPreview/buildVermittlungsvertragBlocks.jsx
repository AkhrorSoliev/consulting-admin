import { buildHeaderBlocks } from "./buildBlocksHeader";
import { buildBodyBlocks } from "./buildBlocksBody";
import { buildTailBlocks } from "./buildBlocksTail";

export function buildVermittlungsvertragBlocks({
  firstName,
  lastName,
  candidateBirthDate,
  candidateNationality,
  candidateAddress,
  candidatePassportNr,
  candidateCity,
  pdfGeneratedDate,
  contractDurationYears,
  contractProtectionMonths,
  contractPenaltyPercent,
  contractPenaltyMaxEur,
}) {
  const candidateNameLine =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : "_____________________";
  const birthDateLine = String(candidateBirthDate || "").trim() || "__________";
  const nationalityLine =
    String(candidateNationality || "").trim() || "__________";
  const addressLine = String(candidateAddress || "").trim() || "__________";
  const passportLine = String(candidatePassportNr || "").trim() || "__________";
  const signaturePlaceLine = String(candidateCity || "").trim() || "__________";
  const signatureDateLine =
    String(pdfGeneratedDate || "").trim() || "____.__.____";
  const durationYears = Math.max(
    1,
    Number.parseInt(String(contractDurationYears || "").trim(), 10) || 2,
  );
  const protectionMonths = Math.max(
    1,
    Number.parseInt(String(contractProtectionMonths || "").trim(), 10) || 6,
  );
  const protectionMonthsLabel =
    protectionMonths === 1 ? "Monat" : "Monate";
  const protectionMonthsDativeLabel =
    protectionMonths === 1 ? "Monat" : "Monaten";
  const penaltyPercent =
    String(contractPenaltyPercent || "").trim() || "50";
  const penaltyMaxEur = String(contractPenaltyMaxEur || "").trim() || "2.000";

  const headerBlocks = buildHeaderBlocks({
    candidateNameLine,
    birthDateLine,
    nationalityLine,
    addressLine,
    passportLine,
  });

  const bodyBlocks = buildBodyBlocks({
    penaltyPercent,
    penaltyMaxEur,
    protectionMonths,
    protectionMonthsLabel,
    protectionMonthsDativeLabel,
  });

  const tailBlocks = buildTailBlocks({
    durationYears,
    signaturePlaceLine,
    signatureDateLine,
  });

  return [...headerBlocks, ...bodyBlocks, ...tailBlocks];
}
