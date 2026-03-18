import { useCallback } from "react";
import toast from "react-hot-toast";
import { normalizePassportNumber } from "../../../utils/validation";
import { uploadFilesToFirebase, fromInputDate } from "../../../utils";
import { triggerBigCelebration } from "../../../utils/celebration";
import {
  CANDIDATE_STATUS_DEFAULT, candidateStatusMap,
} from "../../../constants/candidateStatus";
import { buildLebenslauf, validateForSubmit } from "./useSubmitHelpers";

/** The main onSubmit handler for the Create form. */
export default function useFormSubmission({
  cv, languageRows, diplomaFiles, langCertFiles, noLanguageCertificates,
  passportFiles, captchaToken, captchaRef, setCaptchaToken,
  majorInfo, majorLoading, leadValue, searchParams,
  setIsUploading, setIsSubmitting, setIsSubmitted,
  setShowEducationWarning, setEducationErrors,
  setShowExperienceWarning, setExperienceErrors,
  setShowLanguageWarning, setLanguageErrors,
  setDiplomaError, setLangCertTypeError, setPassportError,
  setExistingMajor, setEnteredEmail, setIsEmailModalOpen,
  setExistingPassportMajor, setEnteredPassport, setIsPassportModalOpen, setError,
}) {
  const SUBMIT_ENDPOINT =
    import.meta.env.VITE_SUBMIT_CANDIDATE_URL ||
    (import.meta.env.VITE_FUNCTIONS_BASE &&
      `${import.meta.env.VITE_FUNCTIONS_BASE}/submitCandidate`);

  const onSubmit = useCallback(async (formData) => {
    setIsUploading(true);
    setIsSubmitting(true);
    try {
      const majorCollection = String(majorInfo?.collectionName || "").trim();
      const blockingErrors = validateForSubmit({
        captchaToken, majorLoading, cv, languageRows,
        diplomaFiles, langCertFiles, noLanguageCertificates, passportFiles,
        majorCollection, setShowEducationWarning, setEducationErrors,
        setShowExperienceWarning, setExperienceErrors,
        setShowLanguageWarning, setLanguageErrors,
        setDiplomaError, setLangCertTypeError, setPassportError,
      });
      const errLabels = {
        captcha: "reCAPTCHA", majorLoading: "Berufsfeld lädt",
        education: "Ausbildung", experience: "Berufserfahrung",
        language: "Sprache", diploma: "Diplom/Zeugnis",
        langCert: "Sprachzertifikat", langCertType: "Zertifikat-Typ",
        passport: "Reisepass/ID", major: "?major=",
      };
      if (blockingErrors.length) {
        const shown = blockingErrors.slice(0, 6);
        const list = shown.map((k) => errLabels[k] || k).join(", ");
        const rest = blockingErrors.length - shown.length;
        toast.error(`Fehlend: ${list}${rest > 0 ? `, +${rest}` : ""}`);
        return;
      }
      const final = {
        ...cv,
        personalInfo: { ...formData.personalInfo, birthDate: fromInputDate(formData.personalInfo.birthDate) },
      };
      const passportNumber = normalizePassportNumber(formData?.personalInfo?.passportNumber || "");
      const lebenslauf = buildLebenslauf(final);
      const email = (formData.personalInfo.email || "").trim();

      try {
        toast.loading("Dokumente werden hochgeladen...", { id: "upload-docs" });
        const ppUpload = Array.isArray(passportFiles) ? passportFiles.filter((f) => f instanceof File) : [];
        if (ppUpload.length === 0) throw new Error("Reisepass/ID fehlt. Bitte laden Sie ein PDF hoch.");
        const passportUrls = await uploadFilesToFirebase(ppUpload, "passports");
        const dipUpload = Array.isArray(diplomaFiles) ? diplomaFiles.filter((f) => f instanceof File) : [];
        if (dipUpload.length === 0) throw new Error("Diplome fehlen. Bitte laden Sie mindestens ein PDF hoch.");
        const diplomaUrls = await uploadFilesToFirebase(dipUpload, "diplomas");
        let langCertUrls = [];
        const lcUpload = Array.isArray(langCertFiles)
          ? langCertFiles.filter((item) => (item?.file || item) instanceof File) : [];
        if (lcUpload.length > 0) {
          langCertUrls = await uploadFilesToFirebase(lcUpload.map((item) => item?.file || item), "certificates");
        }
        toast.success("Dokumente erfolgreich hochgeladen!", { id: "upload-docs" });

        const urlFilter = (u) => /^https?:\/\//.test(u);
        const langCertDetailed = lcUpload
          .map((item, idx) => ({ url: langCertUrls[idx] || "", type: String(item?.type || "") }))
          .filter((it) => urlFilter(it.url));
        const teIdParam = String(searchParams.get("teId") || "").trim();
        const payload = {
          ...lebenslauf,
          passportId: passportNumber || null,
          lead: String(leadValue || "").trim(),
          telegramId: teIdParam || null,
          documents: {
            diplomas: diplomaUrls.filter(urlFilter),
            certificates: langCertUrls.filter(urlFilter),
            certificatesDetailed: langCertDetailed,
            passport: passportUrls.filter(urlFilter),
            noLanguageCertificate: Boolean(noLanguageCertificates),
          },
          status: {
            value: CANDIDATE_STATUS_DEFAULT,
            label: candidateStatusMap[CANDIDATE_STATUS_DEFAULT].label,
            updatedAt: Date.now(), updatedBy: "system",
          },
          createdAt: Date.now(),
        };
        if (!SUBMIT_ENDPOINT) throw new Error("SUBMIT_CANDIDATE_URL is not configured (VITE_SUBMIT_CANDIDATE_URL)");
        const res = await fetch(SUBMIT_ENDPOINT, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ major: majorCollection, payload, recaptchaToken: captchaToken }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.status === 409 && String(json?.error || "") === "email-exists") {
          const m = String(json?.existing?.major || "Unbekannt");
          setExistingMajor(m); setEnteredEmail(String(json?.existing?.email || email).trim());
          setError("personalInfo.email", { type: "remoteExists", message: `Diese E-Mail ist bereits für „${m}“ registriert.` });
          setIsEmailModalOpen(true); return;
        }
        if (res.status === 409 && String(json?.error || "") === "passport-exists") {
          const m = String(json?.existing?.major || "Unbekannt");
          setExistingPassportMajor(m); setEnteredPassport(String(json?.existing?.passportId || passportNumber).trim());
          setError("personalInfo.passportNumber", { type: "remoteExists", message: `Diese Passnummer ist bereits für „${m}“ registriert.` });
          setIsPassportModalOpen(true); return;
        }
        if (res.status === 409 && String(json?.error || "") === "telegram-exists") {
          const m = String(json?.existing?.major || "Unbekannt");
          toast.error(`Diese Telegram-ID ist bereits für „${m}“ registriert. Bitte kontaktieren Sie den Support.`, { duration: 8000 });
          return;
        }
        if (!res.ok || !json?.ok) {
          const base = json?.error || json?.details || `Submit failed (${res.status || ""})`;
          const meta = [];
          if (json?.reason) meta.push(`reason: ${json.reason}`);
          if (Array.isArray(json?.codes) && json.codes.length) meta.push(`codes: ${json.codes.join(",")}`);
          if (String(json?.error || "") === "recaptcha-failed") {
            try { captchaRef.current?.reset?.(); } catch { /* ignore */ }
            setCaptchaToken(null);
          }
          throw new Error(meta.length ? `${base} (${meta.join(" | ")})` : base);
        }
        toast.success("Daten erfolgreich gesendet!");
        triggerBigCelebration();
        try { localStorage.setItem(`createCvSubmitted:${majorCollection}`, "true"); localStorage.removeItem("createCvSubmitted"); } catch { /* ignore */ }
        setIsSubmitted(true);
      } catch (error) { toast.error(`Fehler: ${error.message}`); }
    } finally { setIsSubmitting(false); setIsUploading(false); }
  }, [
    cv, languageRows, diplomaFiles, langCertFiles, noLanguageCertificates,
    passportFiles, captchaToken, captchaRef, setCaptchaToken,
    majorInfo, majorLoading, leadValue, searchParams,
    setIsUploading, setIsSubmitting, setIsSubmitted,
    setShowEducationWarning, setEducationErrors,
    setShowExperienceWarning, setExperienceErrors,
    setShowLanguageWarning, setLanguageErrors,
    setDiplomaError, setLangCertTypeError, setPassportError,
    setExistingMajor, setEnteredEmail, setIsEmailModalOpen,
    setExistingPassportMajor, setEnteredPassport, setIsPassportModalOpen,
    setError, SUBMIT_ENDPOINT,
  ]);

  return { onSubmit, SUBMIT_ENDPOINT };
}
