import { useCallback } from "react";
import toast from "react-hot-toast";
import {
  isEducationEntryFilled, isExperienceEntryFilled, isExperienceEntryEmpty,
  isLanguageEntryFilled, getEducationErrors, getExperienceErrors, getLanguageErrors,
} from "../validationHelpers";

/** Step validation logic and wizard navigation (goNext / goBack). */
export default function useStepValidation({
  currentStep, setCurrentStep, setMaxUnlockedStep, FINAL_STEP,
  cv, setCv, languageRows, diplomaFiles, langCertFiles, noLanguageCertificates,
  passportFiles, setShowEducationWarning, setEducationErrors,
  setShowExperienceWarning, setExperienceErrors,
  setShowLanguageWarning, setLanguageErrors,
  setDiplomaError, setLangCertTypeError, setPassportError,
  trigger, getFieldState, watch, formScrollRef,
}) {
  const scrollWizardToTop = useCallback(() => {
    try {
      const el = formScrollRef.current;
      if (el && typeof el.scrollTo === "function" && el.scrollHeight > el.clientHeight + 1) {
        el.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { window.scrollTo({ top: 0, behavior: "smooth" }); }
  }, [formScrollRef]);

  const validateCurrentStep = useCallback(async () => {
    const errLabels = {
      education: "Ausbildung", experience: "Berufserfahrung",
      language: "Sprache", diploma: "Diplom/Zeugnis",
      langCertType: "Zertifikat-Typ", passport: "Reisepass/ID",
    };

    if (currentStep === 0) {
      const fields = [
        "personalInfo.name", "personalInfo.lastName", "personalInfo.gender",
        "personalInfo.birthDate", "personalInfo.birthPlace",
        "personalInfo.maritalStatus", "personalInfo.childrenCount",
        "personalInfo.phone", "personalInfo.email", "personalInfo.passportNumber",
        "personalInfo.photo", "personalInfo.addressStreet",
        "personalInfo.addressHouseNumber", "personalInfo.addressPostalCode",
        "personalInfo.addressCity", "personalInfo.addressCountry",
      ];
      const ok = await trigger(fields, { shouldFocus: true });
      if (!ok) {
        const missing = fields.filter((p) => getFieldState(p).invalid);
        if (missing.length) {
          const labelMap = {
            "personalInfo.name": "Vorname", "personalInfo.lastName": "Nachname",
            "personalInfo.gender": "Geschlecht", "personalInfo.birthDate": "Geburtsdatum",
            "personalInfo.birthPlace": "Geburtsort", "personalInfo.maritalStatus": "Familienstand",
            "personalInfo.childrenCount": "Kinder", "personalInfo.phone": "Telefonnummer",
            "personalInfo.email": "E-Mail", "personalInfo.passportNumber": "Passnummer",
            "personalInfo.photo": "Foto", "personalInfo.addressStreet": "Stra\u00DFe",
            "personalInfo.addressHouseNumber": "Hausnummer",
            "personalInfo.addressPostalCode": "PLZ (Postleitzahl)",
            "personalInfo.addressCity": "Ort", "personalInfo.addressCountry": "Land",
          };
          if (missing.length === 1) {
            toast.error(`Fehlend: ${labelMap[missing[0]] || missing[0]}`);
          } else {
            toast.error("Sie haben mehrere Pflichtfelder nicht ausgef\u00FCllt.");
          }
        } else {
          toast.error("Bitte f\u00FCllen Sie alle Pflichtfelder aus.");
        }
        return false;
      }
      return true;
    }

    if (currentStep === 1) {
      const hasPartial = Array.isArray(cv.experience) &&
        cv.experience.some((exp) => !isExperienceEntryFilled(exp) && !isExperienceEntryEmpty(exp));
      if (hasPartial) {
        setShowExperienceWarning(true);
        setExperienceErrors(getExperienceErrors(cv.experience));
        toast.error(`Fehlend: ${errLabels.experience}`);
        return false;
      }
      return true;
    }

    if (currentStep === 2) {
      if (!isEducationEntryFilled(cv.education?.schule)) {
        setShowEducationWarning(true);
        setEducationErrors(getEducationErrors(cv.education));
        toast.error(`Fehlend: ${errLabels.education}`);
        return false;
      }
      return true;
    }

    if (currentStep === 3) {
      const rows = Array.isArray(languageRows) && languageRows.length > 0 ? languageRows : [];
      if (!(rows.length > 0 && rows.every((row) => isLanguageEntryFilled(row)))) {
        setShowLanguageWarning(true);
        setLanguageErrors(getLanguageErrors(rows));
        toast.error(`Fehlend: ${errLabels.language}`);
        return false;
      }
      return true;
    }

    if (currentStep === 4) {
      if (!Boolean(watch("personalInfo.hasDrivingLicense"))) return true;
      return await trigger(["personalInfo.drivingLicenseType"], { shouldFocus: true });
    }

    if (currentStep === 5) {
      const blocking = [];
      if (!Array.isArray(diplomaFiles) || diplomaFiles.length === 0) {
        setDiplomaError(true); blocking.push("diploma");
      } else { setDiplomaError(false); }
      const hasLCF = Array.isArray(langCertFiles) && langCertFiles.length > 0;
      const missingType = !noLanguageCertificates && hasLCF
        ? langCertFiles.some((item) => !String(item?.type || "").trim()) : false;
      if (missingType) { setLangCertTypeError(true); blocking.push("langCertType"); }
      else { setLangCertTypeError(false); }
      if (!Array.isArray(passportFiles) || passportFiles.length === 0) {
        setPassportError(true); blocking.push("passport");
      } else { setPassportError(false); }
      if (blocking.length) {
        toast.error(`Fehlend: ${blocking.map((k) => errLabels[k] || k).join(", ")}`);
        return false;
      }
      return true;
    }
    return true;
  }, [
    currentStep, cv, languageRows, diplomaFiles, langCertFiles,
    noLanguageCertificates, passportFiles, trigger, getFieldState, watch,
    setShowEducationWarning, setEducationErrors,
    setShowExperienceWarning, setExperienceErrors,
    setShowLanguageWarning, setLanguageErrors,
    setDiplomaError, setLangCertTypeError, setPassportError,
  ]);

  const cleanExperience = useCallback(() => {
    if (!Array.isArray(cv.experience) || cv.experience.length === 0) return;
    const hasPartial = cv.experience.some(
      (exp) => !isExperienceEntryFilled(exp) && !isExperienceEntryEmpty(exp));
    if (hasPartial) return;
    const filtered = cv.experience.filter((exp) => !isExperienceEntryEmpty(exp));
    if (filtered.length !== cv.experience.length) {
      setCv((prev) => ({ ...prev, experience: filtered }));
    }
  }, [cv.experience, setCv]);

  const goNext = useCallback(async () => {
    const ok = await validateCurrentStep();
    if (!ok) return;
    cleanExperience();
    setCurrentStep((s) => Math.min(FINAL_STEP, s + 1));
    setMaxUnlockedStep((u) => Math.max(u, currentStep + 1));
    scrollWizardToTop();
  }, [validateCurrentStep, cleanExperience, setCurrentStep, setMaxUnlockedStep, currentStep, FINAL_STEP, scrollWizardToTop]);

  const goBack = useCallback(() => {
    cleanExperience();
    setCurrentStep((s) => Math.max(0, s - 1));
    scrollWizardToTop();
  }, [cleanExperience, setCurrentStep, scrollWizardToTop]);

  return { validateCurrentStep, scrollWizardToTop, goNext, goBack };
}
