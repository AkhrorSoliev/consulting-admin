import { todayDdMmYyyy } from "./dateUtils";

export const TEMPLATE_COLLECTION = "template_documents";
export const TEMPLATE_ID = "vermittlungsvertrag";

export function getInitialFormState() {
  return {
    candidateFirstName: "",
    candidateLastName: "",
    candidateBirthDate: "",
    candidateNationality: "",
    candidatePassportNr: "",
    candidateStreet: "",
    candidateHouseNumber: "",
    candidatePLZ: "",
    candidateBirthPlace: "",
    candidateLand: "",
    contractDurationYears: 2,
    contractProtectionMonths: "6",
    contractPenaltyPercent: "50",
    contractPenaltyMaxEur: "2.000",
    signatureDate: todayDdMmYyyy(),
    signatureCity: "Taschkent",
  };
}
