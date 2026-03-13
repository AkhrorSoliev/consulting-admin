import { useEffect } from "react";
import {
  isEducationEntryFilled,
  isExperienceEntryFilled,
  isExperienceEntryEmpty,
  isLanguageEntryFilled,
} from "../validationHelpers";

/** General useEffect hooks for the Create form. */
export default function useCreateEffects({
  setCaptchaSize, setIsMobile, setIsRequiredDocsOpen, setIsInputFocused,
  setIsPrivacyOpen, setIsGuideOpen, setIsPdfPreviewOpen,
  isPrivacyOpen, isGuideOpen, isPdfPreviewOpen,
  cv, setShowEducationWarning, setEducationErrors,
  setShowExperienceWarning, setExperienceErrors,
  setShowLanguageWarning, setLanguageErrors, languageRows,
  majorInfo, majorLoading, setIsSubmitted,
  watchBirthPlace, setValue,
  addressStreet, addressHouseNumber, addressPostalCode, addressCity, addressCountry,
  formatGermanAddress, REGION_POSTAL_CODES,
}) {
  // Document title
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Consultinguz | Bewerbungsformular";
    return () => { document.title = previousTitle; };
  }, []);

  // reCAPTCHA responsive sizing
  useEffect(() => {
    if (typeof window === "undefined" || !window?.matchMedia) return;
    const mq = window.matchMedia("(max-width: 360px)");
    const update = () => setCaptchaSize(mq.matches ? "compact" : "normal");
    update();
    try {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    } catch {
      mq.addListener(update);
      return () => mq.removeListener(update);
    }
  }, [setCaptchaSize]);

  // Window resize tracking
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsMobile]);

  // Required docs modal on load
  useEffect(() => { setIsRequiredDocsOpen(true); }, [setIsRequiredDocsOpen]);

  // Mobile keyboard behavior
  useEffect(() => {
    if (typeof window === "undefined") return;
    const textTypes = ["text", "email", "tel", "url", "search", "password"];
    const handleFocus = (e) => {
      const t = e.target;
      if (t instanceof HTMLInputElement && textTypes.includes(t.type.toLowerCase())) {
        if (window.innerWidth < 1024) setIsInputFocused(true);
      }
    };
    const handleBlur = (e) => {
      const t = e.target;
      if (t instanceof HTMLInputElement && textTypes.includes(t.type.toLowerCase())) {
        setIsInputFocused(false);
      }
    };
    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);
    return () => {
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
    };
  }, [setIsInputFocused]);

  // ESC key handling for modals
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setIsPrivacyOpen(false);
        setIsGuideOpen(false);
        setIsPdfPreviewOpen(false);
      }
    }
    if (isPrivacyOpen || isGuideOpen || isPdfPreviewOpen) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPrivacyOpen, isGuideOpen, isPdfPreviewOpen, setIsPrivacyOpen, setIsGuideOpen, setIsPdfPreviewOpen]);

  // Education validation cleanup
  useEffect(() => {
    if (isEducationEntryFilled(cv.education?.schule)) {
      setShowEducationWarning(false);
      setEducationErrors({});
    }
  }, [cv.education, setShowEducationWarning, setEducationErrors]);

  // Experience validation cleanup
  useEffect(() => {
    const hasPartial = Array.isArray(cv.experience) &&
      cv.experience.some((exp) => !isExperienceEntryFilled(exp) && !isExperienceEntryEmpty(exp));
    if (!hasPartial) {
      setShowExperienceWarning(false);
      setExperienceErrors([]);
    }
  }, [cv.experience, setShowExperienceWarning, setExperienceErrors]);

  // Language validation cleanup
  useEffect(() => {
    const rows = Array.isArray(languageRows) && languageRows.length > 0 ? languageRows : [];
    if (rows.length > 0 && rows.every((row) => isLanguageEntryFilled(row))) {
      setShowLanguageWarning(false);
      setLanguageErrors([]);
    }
  }, [languageRows, setShowLanguageWarning, setLanguageErrors]);

  // Submission status tracking per-major
  useEffect(() => {
    const majorCollection = String(majorInfo?.collectionName || "").trim();
    if (!majorCollection || majorLoading) { setIsSubmitted(null); return; }
    setIsSubmitted(null);
    try {
      const v = localStorage.getItem(`createCvSubmitted:${majorCollection}`);
      setIsSubmitted(v === "true");
    } catch (error) {
      setIsSubmitted(false);
    }
  }, [majorInfo?.collectionName, majorLoading, setIsSubmitted]);

  // Birth place -> postal code auto-fill
  useEffect(() => {
    if (watchBirthPlace && REGION_POSTAL_CODES[watchBirthPlace]) {
      setValue("personalInfo.addressPostalCode", REGION_POSTAL_CODES[watchBirthPlace], {
        shouldDirty: true, shouldValidate: true,
      });
    }
  }, [watchBirthPlace, setValue, REGION_POSTAL_CODES]);

  // Format German address from parts
  useEffect(() => {
    const formatted = formatGermanAddress({
      street: addressStreet, houseNumber: addressHouseNumber,
      postalCode: addressPostalCode, city: addressCity, country: addressCountry,
    });
    setValue("personalInfo.address", formatted, { shouldDirty: true, shouldValidate: false });
  }, [addressStreet, addressHouseNumber, addressPostalCode, addressCity, addressCountry, setValue, formatGermanAddress]);
}
