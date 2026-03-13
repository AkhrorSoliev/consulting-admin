import toast from "react-hot-toast";
import { isGermanAddressComplete } from "../../utils";

/**
 * Validates the candidate form before saving.
 * Shows toast errors for invalid fields.
 *
 * @param {Object} params
 * @param {Object} params.formCv - The form state
 * @param {boolean} params.isLimitedAdmin - Whether user is a limited admin
 * @param {Object} params.addressFields - Address field values
 * @returns {boolean} true if valid, false otherwise
 */
export function validateForm({ formCv, isLimitedAdmin, addressFields }) {
  if (isLimitedAdmin) {
    return true;
  }

  if (!formCv.personalInfo.name?.trim()) {
    toast.error("Vorname ist erforderlich.");
    return false;
  }
  if (!formCv.personalInfo.lastName?.trim()) {
    toast.error("Nachname ist erforderlich.");
    return false;
  }
  if (!formCv.personalInfo.gender) {
    toast.error("Bitte Geschlecht auswählen.");
    return false;
  }
  if (!String(formCv.personalInfo.birthPlace || "").trim()) {
    toast.error("Geburtsort ist erforderlich.");
    return false;
  }
  if (!isGermanAddressComplete(addressFields)) {
    toast.error(
      "Bitte vollständige Adresse eingeben (Straße, Hausnummer, PLZ, Ort, Land).",
    );
    return false;
  }

  const noKids = Boolean(formCv.personalInfo.noChildren);
  const kidsCount = String(formCv.personalInfo.childrenCount || "").trim();
  if (!noKids && !kidsCount) {
    toast.error(
      "Bitte Kinderanzahl eingeben oder 'Keine Kinder' auswählen.",
    );
    return false;
  }

  return true;
}
