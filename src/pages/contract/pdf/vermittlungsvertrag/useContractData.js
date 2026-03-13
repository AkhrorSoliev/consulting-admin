import { safeDate, safeName } from "./styles";

export default function useContractData(form, templateForm) {
  const candidateSource =
    form?.candidate && typeof form.candidate === "object" ? form.candidate : form;
  const pd = candidateSource?.persoenlicheDaten || {};
  const personalInfo = candidateSource?.personalInfo || {};

  // Dynamic candidate data (primary keys + backward-compatible fallbacks)
  const firstName = String(
    pd?.name ||
      personalInfo?.name ||
      form?.candidateFirstName ||
      form?.firstName ||
      "",
  ).trim();
  const lastName = String(
    pd?.nachname ||
      personalInfo?.lastName ||
      form?.candidateLastName ||
      form?.lastName ||
      "",
  ).trim();
  const candidateName =
    firstName && lastName ? `${firstName} ${lastName}` : safeName("");

  const candidateBirthDate =
    String(
      pd?.geburtsdatum ||
        personalInfo?.birthDate ||
        form?.candidateBirthDate ||
        "",
    ).trim() || "__________";

  const nationalityPrimary = String(
    pd?.staatsangehoerigkeit ||
      pd?.land ||
      personalInfo?.nationality ||
      form?.candidateNationality ||
      "",
  ).trim();
  const nationalityFallback = String(
    form?.candidateLand || templateForm?.candidateLand || "",
  ).trim();
  const candidateNationality =
    nationalityPrimary || nationalityFallback || "__________";

  const street = String(form?.candidateStreet || "").trim();
  const houseNumber = String(form?.candidateHouseNumber || "").trim();
  const postalCode = String(form?.candidatePLZ || "").trim();
  const country = String(form?.candidateLand || "").trim();
  const composedAddress = [street, houseNumber]
    .filter(Boolean)
    .join(" ")
    .trim();
  const composedAddressWithPostal = [composedAddress, postalCode]
    .filter(Boolean)
    .join(", ")
    .trim();
  const composedAddressFull = [composedAddressWithPostal, country]
    .filter(Boolean)
    .join(", ")
    .trim();
  const candidateAddress =
    String(pd?.adresse || personalInfo?.address || "").trim() ||
    composedAddressFull ||
    String(form?.candidateAddress || "").trim() ||
    "__________";
  const candidatePassportNr =
    String(
      pd?.reisepassNummer ||
        personalInfo?.passportNumber ||
        candidateSource?.passportId ||
      form?.candidatePassportNr ||
      form?.passportNumber ||
      form?.passportId ||
      "",
    ).trim() || "__________";
  const signaturePlace =
    String(
      templateForm?.signatureCity ||
        templateForm?.candidateCity ||
        form?.signatureCity ||
        form?.candidateCity ||
        "",
    ).trim() ||
    "__________";
  const signatureDate =
    String(
      templateForm?.signatureDate ||
        templateForm?.pdfGeneratedDate ||
        form?.signatureDate ||
        form?.pdfGeneratedDate ||
        "",
    ).trim() ||
    safeDate("");
  const contractDurationYears = Math.max(
    1,
    Number.parseInt(
      String(
        form?.contractDurationYears ||
          templateForm?.contractDurationYears ||
          "2",
      ).trim(),
      10,
    ) || 2,
  );
  const contractProtectionMonths = Math.max(
    1,
    Number.parseInt(
      String(
        form?.contractProtectionMonths ||
          templateForm?.contractProtectionMonths ||
          "6",
      ).trim(),
      10,
    ) || 6,
  );
  const protectionMonthsLabel =
    contractProtectionMonths === 1 ? "Monat" : "Monate";
  const protectionMonthsDativeLabel =
    contractProtectionMonths === 1 ? "Monat" : "Monaten";
  const penaltyPercent =
    String(
      form?.contractPenaltyPercent ||
        templateForm?.contractPenaltyPercent ||
        "50",
    ).trim() || "50";
  const penaltyMaxEur =
    String(
      form?.contractPenaltyMaxEur ||
        templateForm?.contractPenaltyMaxEur ||
        "2.000",
    ).trim() || "2.000";

  return {
    candidateName,
    candidateBirthDate,
    candidateNationality,
    candidateAddress,
    candidatePassportNr,
    signaturePlace,
    signatureDate,
    contractDurationYears,
    contractProtectionMonths,
    protectionMonthsLabel,
    protectionMonthsDativeLabel,
    penaltyPercent,
    penaltyMaxEur,
  };
}
