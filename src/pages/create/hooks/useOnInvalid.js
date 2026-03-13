import { useCallback } from "react";
import toast from "react-hot-toast";

const FIELDS = [
  "personalInfo.name", "personalInfo.lastName", "personalInfo.gender",
  "personalInfo.birthDate", "personalInfo.birthPlace", "personalInfo.maritalStatus",
  "personalInfo.childrenCount", "personalInfo.phone", "personalInfo.email",
  "personalInfo.passportNumber", "personalInfo.photo", "personalInfo.addressStreet",
  "personalInfo.addressHouseNumber", "personalInfo.addressPostalCode",
  "personalInfo.addressCity", "personalInfo.addressCountry",
];

const LABEL_MAP = {
  "personalInfo.name": "Vorname",
  "personalInfo.lastName": "Nachname",
  "personalInfo.gender": "Geschlecht",
  "personalInfo.birthDate": "Geburtsdatum",
  "personalInfo.birthPlace": "Geburtsort",
  "personalInfo.maritalStatus": "Familienstand",
  "personalInfo.childrenCount": "Kinder",
  "personalInfo.phone": "Telefonnummer",
  "personalInfo.email": "E-Mail",
  "personalInfo.passportNumber": "Passnummer",
  "personalInfo.photo": "Foto",
  "personalInfo.addressStreet": "Stra\u00DFe",
  "personalInfo.addressHouseNumber": "Hausnummer",
  "personalInfo.addressPostalCode": "PLZ (Postleitzahl)",
  "personalInfo.addressCity": "Ort",
  "personalInfo.addressCountry": "Land",
};

/**
 * Hook returning the onInvalid callback for react-hook-form handleSubmit.
 */
export default function useOnInvalid({ setFocus }) {
  return useCallback((formErrors) => {
    const hasErrAt = (path) => {
      const parts = path.split(".");
      let cur = formErrors;
      for (const p of parts) {
        if (!cur || typeof cur !== "object") return false;
        cur = cur[p];
      }
      return Boolean(cur);
    };
    const missing = FIELDS.filter((p) => hasErrAt(p));
    if (missing.length) {
      if (missing.length === 1) {
        toast.error(`Fehlend: ${LABEL_MAP[missing[0]] || missing[0]}`);
      } else {
        toast.error("Sie haben mehrere Pflichtfelder nicht ausgef\u00FCllt.");
      }
      try { setFocus(missing[0]); } catch { /* ignore */ }
      return;
    }
    toast.error("Bitte f\u00FCllen Sie alle Pflichtfelder aus.");
  }, [setFocus]);
}
