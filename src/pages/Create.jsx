import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import ReCAPTCHA from "react-google-recaptcha";
import { FaPaperPlane, FaTelegramPlane, FaVideo } from "react-icons/fa";
import { addDocument } from "../utils";
import FormInput from "../components/FormInput";
import ExperienceSection from "../components/ExperienceSection";
import EducationSection from "../components/EducationSection";
import SkillsSection from "../components/SkillsSection";
import LanguagesSection from "../components/LanguagesSection";
import RequiredLabel from "../components/RequiredLabel";
import PhoneInputWithCountry from "../components/PhoneInputWithCountry";
import CountryNameCombobox from "../components/CountryNameCombobox";
import {
  imageFileToBase64,
  toInputDate,
  fromInputDate,
  generateSkills,
  uploadFilesToConsulting,
  checkEmailRemote,
  registerEmailRemote,
} from "../utils";
import {
  CANDIDATE_STATUS_DEFAULT,
  candidateStatusMap,
} from "../constants/candidateStatus";
import PrivacyModal from "./create/components/modals/PrivacyModal";
import GuideModal from "./create/components/modals/GuideModal";
import ExistingEmailModal from "./create/components/modals/ExistingEmailModal";

function Create() {
  const initialCv = useMemo(
    () => ({
      personalInfo: {
        name: "",
        lastName: "",
        gender: "",
        address: "",
        birthDate: "",
        maritalStatus: "",
        childrenCount: "",
        noChildren: false,
        hasDrivingLicense: false,
        drivingLicenseType: "",
        phone: "",
        email: "",
        photo: "",
      },
      experience: [],
      education: [],
      skills: {
        softSkills: [],
        languages: {},
        pcSkills: [],
      },
    }),
    []
  );

  const [cv, setCv] = useState(initialCv);
  const [isGeneratingSoft, setIsGeneratingSoft] = useState(false);
  const [isGeneratingPc, setIsGeneratingPc] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState({ soft: [], pc: [] });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [existingMajor, setExistingMajor] = useState("");
  const [enteredEmail, setEnteredEmail] = useState("");
  const [searchParams] = useSearchParams();
  const [diplomaFiles, setDiplomaFiles] = useState([]);
  const [langCertFiles, setLangCertFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [diplomaError, setDiplomaError] = useState(false);
  const [noLangCert, setNoLangCert] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showEducationWarning, setShowEducationWarning] = useState(false);
  const [showExperienceWarning, setShowExperienceWarning] = useState(false);
  const [educationErrors, setEducationErrors] = useState([]);
  const [experienceErrors, setExperienceErrors] = useState([]);
  const [showLanguageWarning, setShowLanguageWarning] = useState(false);
  const [languageErrors, setLanguageErrors] = useState([]);

  const languageRows = useMemo(
    () =>
      Object.entries(cv.skills.languages).map(([name, level]) => ({
        name,
        level,
      })),
    [cv.skills.languages]
  );

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Consultinguz | Bewerbungsformular";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  function formatGermanAddress(parts) {
    const street = String(parts?.street || "").trim();
    const houseNumber = String(parts?.houseNumber || "").trim();
    const postalCode = String(parts?.postalCode || "").trim();
    const city = String(parts?.city || "").trim();
    const country = String(parts?.country || "").trim();

    const streetLine = [street, houseNumber].filter(Boolean).join(" ").trim();
    const cityLine = [postalCode, city].filter(Boolean).join(" ").trim();

    return [streetLine, cityLine, country].filter(Boolean).join(", ").trim();
  }

  function uniqueKey(file) {
    return `${file?.name || ""}__${file?.size || 0}__${
      file?.lastModified || 0
    }`;
  }

  function mergeFiles(existing, incoming) {
    const map = new Map();
    (existing || []).forEach((f) => map.set(uniqueKey(f), f));
    (incoming || []).forEach((f) => {
      if (f instanceof File) map.set(uniqueKey(f), f);
    });
    return Array.from(map.values());
  }

  function removeFileAt(files, idx) {
    return (files || []).filter((_, i) => i !== idx);
  }

  function isEducationEntryFilled(edu) {
    const hasStart = Boolean((edu?.startDate || "").trim());
    const hasEnd =
      edu?.endDate === "bis heute" || Boolean((edu?.endDate || "").trim());
    const hasInstitution = Boolean((edu?.institution || "").trim());
    const hasDegree = Boolean((edu?.degree || "").trim());
    return hasStart && hasEnd && hasInstitution && hasDegree;
  }

  function isExperienceEntryFilled(exp) {
    const hasStart = Boolean((exp?.startDate || "").trim());
    const hasEnd =
      exp?.endDate === "bis heute" || Boolean((exp?.endDate || "").trim());
    const hasPosition = Boolean((exp?.position || "").trim());
    const hasCompany = Boolean((exp?.company || "").trim());
    const hasLocation = Boolean((exp?.location || "").trim());
    return hasStart && hasEnd && hasPosition && hasCompany && hasLocation;
  }

  function getEducationErrors(entries) {
    if (!Array.isArray(entries)) return [];
    return entries.map((edu) => ({
      startDate: !(edu?.startDate || "").trim(),
      endDate: !(edu?.endDate === "bis heute" || (edu?.endDate || "").trim()),
      institution: !(edu?.institution || "").trim(),
      degree: !(edu?.degree || "").trim(),
    }));
  }

  function getExperienceErrors(entries) {
    if (!Array.isArray(entries)) return [];
    return entries.map((exp) => ({
      startDate: !(exp?.startDate || "").trim(),
      endDate: !(exp?.endDate === "bis heute" || (exp?.endDate || "").trim()),
      position: !(exp?.position || "").trim(),
      company: !(exp?.company || "").trim(),
      location: !(exp?.location || "").trim(),
    }));
  }

  function isLanguageEntryFilled(row) {
    const hasName = Boolean((row?.name || "").trim());
    const hasLevel = Boolean((row?.level || "").trim());
    return hasName && hasLevel;
  }

  function getLanguageErrors(entries) {
    if (!Array.isArray(entries)) return [];
    return entries.map((row) => ({
      name: !(row?.name || "").trim(),
      level: !(row?.level || "").trim(),
    }));
  }

  const TELEGRAM_SUPPORT_URL = "https://t.me/consultinguz_kundensupport";
  // Phone/Country dropdown options come from `src/utils/const.js` via components

  useEffect(() => {
    try {
      const v = localStorage.getItem("createCvSubmitted");
      if (v === "true") setIsSubmitted(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setIsPrivacyOpen(false);
        setIsGuideOpen(false);
      }
    }
    if (isPrivacyOpen || isGuideOpen) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPrivacyOpen, isGuideOpen]);

  useEffect(() => {
    const hasCompleteEducation =
      Array.isArray(cv.education) &&
      cv.education.length > 0 &&
      cv.education.every((edu) => isEducationEntryFilled(edu));
    if (hasCompleteEducation) {
      setShowEducationWarning(false);
      setEducationErrors([]);
    }
  }, [cv.education]);

  useEffect(() => {
    const hasIncompleteExperience =
      Array.isArray(cv.experience) &&
      cv.experience.some((exp) => !isExperienceEntryFilled(exp));
    if (!hasIncompleteExperience) {
      setShowExperienceWarning(false);
      setExperienceErrors([]);
    }
  }, [cv.experience]);

  useEffect(() => {
    const rows =
      Array.isArray(languageRows) && languageRows.length > 0
        ? languageRows
        : [];
    const hasCompleteLanguages =
      rows.length > 0 && rows.every((row) => isLanguageEntryFilled(row));
    if (hasCompleteLanguages) {
      setShowLanguageWarning(false);
      setLanguageErrors([]);
    }
  }, [languageRows]);

  const {
    register,
    control,
    handleSubmit: rhfHandleSubmit,
    setValue,
    setFocus,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      personalInfo: {
        name: initialCv.personalInfo.name,
        lastName: initialCv.personalInfo.lastName,
        gender: initialCv.personalInfo.gender,
        address: initialCv.personalInfo.address,
        addressStreet: "",
        addressHouseNumber: "",
        addressPostalCode: "",
        addressCity: "",
        addressCountry: "",
        birthDate: toInputDate(initialCv.personalInfo.birthDate),
        maritalStatus: initialCv.personalInfo.maritalStatus,
        childrenCount: initialCv.personalInfo.childrenCount,
        noChildren: initialCv.personalInfo.noChildren,
        hasDrivingLicense: initialCv.personalInfo.hasDrivingLicense,
        drivingLicenseType: initialCv.personalInfo.drivingLicenseType,
        phone: initialCv.personalInfo.phone,
        email: initialCv.personalInfo.email,
        photo: initialCv.personalInfo.photo,
      },
    },
  });

  const addressStreet = watch("personalInfo.addressStreet");
  const addressHouseNumber = watch("personalInfo.addressHouseNumber");
  const addressPostalCode = watch("personalInfo.addressPostalCode");
  const addressCity = watch("personalInfo.addressCity");
  const addressCountry = watch("personalInfo.addressCountry");

  useEffect(() => {
    const formatted = formatGermanAddress({
      street: addressStreet,
      houseNumber: addressHouseNumber,
      postalCode: addressPostalCode,
      city: addressCity,
      country: addressCountry,
    });
    setValue("personalInfo.address", formatted, {
      shouldDirty: true,
      shouldValidate: false,
    });
  }, [
    addressStreet,
    addressHouseNumber,
    addressPostalCode,
    addressCity,
    addressCountry,
    setValue,
  ]);

  async function handlePhotoFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await imageFileToBase64(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.9,
        mimeType: "image/jpeg",
      });
      setValue("personalInfo.photo", base64, { shouldDirty: true });
    } catch (err) {
      console.error("Fehler beim Lesen des Fotos:", err);
    }
  }

  function addExperience() {
    setCv((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          startDate: "",
          endDate: "",
          position: "",
          company: "",
          location: "",
          responsibilities: [],
        },
      ],
    }));
  }

  function updateExperience(idx, field, value) {
    setCv((prev) => {
      const next = [...prev.experience];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, experience: next };
    });
  }

  function onInvalid(formErrors) {
    const requiredOrder = [
      "personalInfo.name",
      "personalInfo.lastName",
      "personalInfo.gender",
      "personalInfo.birthDate",
      "personalInfo.maritalStatus",
      "personalInfo.childrenCount",
      "personalInfo.phone",
      "personalInfo.email",
      "personalInfo.photo",
      "personalInfo.addressStreet",
      "personalInfo.addressHouseNumber",
      "personalInfo.addressPostalCode",
      "personalInfo.addressCity",
      "personalInfo.addressCountry",
    ];
    const labelMap = {
      "personalInfo.name": "Vorname",
      "personalInfo.lastName": "Nachname",
      "personalInfo.gender": "Geschlecht",
      "personalInfo.birthDate": "Geburtsdatum",
      "personalInfo.maritalStatus": "Familienstand",
      "personalInfo.childrenCount": "Kinder",
      "personalInfo.phone": "Telefonnummer",
      "personalInfo.email": "E-Mail",
      "personalInfo.photo": "Foto",
      "personalInfo.addressStreet": "Straße",
      "personalInfo.addressHouseNumber": "Hausnummer",
      "personalInfo.addressPostalCode": "PLZ",
      "personalInfo.addressCity": "Ort",
      "personalInfo.addressCountry": "Land",
    };
    const hasErrAt = (path) => {
      const parts = path.split(".");
      let cur = formErrors;
      for (const p of parts) {
        if (!cur || typeof cur !== "object") return false;
        cur = cur[p];
      }
      return Boolean(cur);
    };
    const firstPath = requiredOrder.find((p) => hasErrAt(p));
    if (firstPath) {
      const label = labelMap[firstPath] || firstPath;
      toast.error(`Bitte füllen Sie „${label}“ aus.`);
      try {
        setFocus(firstPath);
      } catch {
        // ignore focus errors
      }
    } else {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus.");
    }
  }

  function removeExperience(idx) {
    setCv((prev) => {
      const next = prev.experience.filter((_, i) => i !== idx);
      return { ...prev, experience: next };
    });
  }

  function addResponsibility(expIdx, text) {
    if (!text?.trim()) return;
    setCv((prev) => {
      const next = [...prev.experience];
      const resp = [...next[expIdx].responsibilities, text.trim()];
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }

  function removeResponsibility(expIdx, respIdx) {
    setCv((prev) => {
      const next = [...prev.experience];
      const resp = next[expIdx].responsibilities.filter(
        (_, i) => i !== respIdx
      );
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }

  function addEducation() {
    setCv((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { startDate: "", endDate: "", institution: "", degree: "" },
      ],
    }));
  }

  function updateEducation(idx, field, value) {
    setCv((prev) => {
      const next = [...prev.education];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, education: next };
    });
  }

  function removeEducation(idx) {
    setCv((prev) => {
      const next = prev.education.filter((_, i) => i !== idx);
      return { ...prev, education: next };
    });
  }

  function addTag(path, value) {
    if (!value?.trim()) return;
    setCv((prev) => {
      const draft = structuredClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]];
      }
      const key = path[path.length - 1];
      target[key] = [...target[key], value.trim()];
      return draft;
    });
  }

  function addTags(path, values) {
    if (!Array.isArray(values) || !values.length) return;
    setCv((prev) => {
      const draft = structuredClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]];
      }
      const key = path[path.length - 1];
      const existing = Array.isArray(target[key]) ? target[key] : [];
      const nextSet = new Set(existing);
      values.forEach((v) => {
        const trimmed = String(v || "").trim();
        if (trimmed) nextSet.add(trimmed);
      });
      target[key] = Array.from(nextSet);
      return draft;
    });
  }

  function removeTag(path, index) {
    setCv((prev) => {
      const draft = structuredClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]];
      }
      const key = path[path.length - 1];
      target[key] = target[key].filter((_, i) => i !== index);
      return draft;
    });
  }

  async function autoAddSkills(kind) {
    if (kind === "soft") {
      setIsGeneratingSoft(true);
    } else {
      setIsGeneratingPc(true);
    }
    try {
      // Simulate async generation; keep sync but allow future async
      const generated = generateSkills(cv, kind);
      if (generated.length) {
        if (kind === "soft") {
          addTags(["skills", "softSkills"], generated);
          setRecentlyAdded((prev) => ({ ...prev, soft: generated }));
        } else {
          addTags(["skills", "pcSkills"], generated);
          setRecentlyAdded((prev) => ({ ...prev, pc: generated }));
        }
      } else {
        // No new items; show empty feedback
        if (kind === "soft") {
          setRecentlyAdded((prev) => ({ ...prev, soft: [] }));
        } else {
          setRecentlyAdded((prev) => ({ ...prev, pc: [] }));
        }
      }
    } finally {
      if (kind === "soft") {
        setIsGeneratingSoft(false);
      } else {
        setIsGeneratingPc(false);
      }
    }
  }

  function addLanguageRow() {
    setCv((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        languages: { ...prev.skills.languages, "": "A1" },
      },
    }));
  }

  function updateLanguageRow(rowIdx, field, value) {
    setCv((prev) => {
      const entries = Object.entries(prev.skills.languages);
      const [oldName, oldLevel] = entries[rowIdx] || ["", "A1"];
      let nextEntries = [...entries];
      if (field === "name") {
        nextEntries[rowIdx] = [value, oldLevel];
      } else {
        nextEntries[rowIdx] = [oldName, value];
      }
      const nextObj = Object.fromEntries(
        nextEntries.filter(
          ([k]) => k !== "" || (k === "" && field === "name" && value !== "")
        )
      );
      return {
        ...prev,
        skills: { ...prev.skills, languages: nextObj },
      };
    });
  }

  function removeLanguageRow(rowIdx) {
    setCv((prev) => {
      const entries = Object.entries(prev.skills.languages).filter(
        (_, i) => i !== rowIdx
      );
      return {
        ...prev,
        skills: { ...prev.skills, languages: Object.fromEntries(entries) },
      };
    });
  }

  async function onSubmit(formData) {
    // Start loading immediately to reflect click action without delay
    setIsUploading(true);
    try {
      if (!captchaToken) {
        toast.error("Bitte bestätigen Sie, dass Sie kein Roboter sind.");
        return;
      }

      const hasEducation =
        Array.isArray(cv.education) &&
        cv.education.length > 0 &&
        cv.education.every((edu) => isEducationEntryFilled(edu));
      if (!hasEducation) {
        setShowEducationWarning(true);
        setEducationErrors(getEducationErrors(cv.education));
        toast.error(
          "Bitte fügen Sie mindestens eine vollständige Ausbildungsstation hinzu (mindestens Schule) und füllen Sie alle Felder aus."
        );
        return;
      }

      const hasIncompleteExperience =
        Array.isArray(cv.experience) &&
        cv.experience.some((exp) => !isExperienceEntryFilled(exp));
      if (hasIncompleteExperience) {
        setShowExperienceWarning(true);
        setExperienceErrors(getExperienceErrors(cv.experience));
        toast.error(
          "Bitte füllen Sie alle Felder in jeder Berufserfahrung aus oder entfernen Sie unvollständige Einträge."
        );
        return;
      }

      const rows =
        Array.isArray(languageRows) && languageRows.length > 0
          ? languageRows
          : [];
      const hasLanguages =
        rows.length > 0 && rows.every((row) => isLanguageEntryFilled(row));
      if (!hasLanguages) {
        setShowLanguageWarning(true);
        setLanguageErrors(getLanguageErrors(rows));
        toast.error(
          "Bitte fügen Sie mindestens eine Sprache mit Niveau hinzu."
        );
        return;
      }

      if (!Array.isArray(diplomaFiles) || diplomaFiles.length === 0) {
        setDiplomaError(true);
        toast.error(
          "Bitte laden Sie mindestens ein Diplom/Schulzeugnis als PDF hoch."
        );
        return;
      } else {
        setDiplomaError(false);
      }

      const final = {
        ...cv,
        personalInfo: {
          ...formData.personalInfo,
          birthDate: fromInputDate(formData.personalInfo.birthDate),
        },
      };

      const noChildrenSelected = Boolean(final.personalInfo?.noChildren);
      const rawChildrenCount = String(final.personalInfo?.childrenCount || "")
        .trim()
        .replace(/[^\d]/g, "");
      const childrenCount = noChildrenSelected ? "" : rawChildrenCount;

      const lebenslauf = {
        persoenlicheDaten: {
          name: final.personalInfo.name,
          nachname: final.personalInfo.lastName,
          geschlecht: final.personalInfo.gender,
          adresse: final.personalInfo.address,
          geburtsdatum: final.personalInfo.birthDate,
          familienstand: final.personalInfo.maritalStatus,
          kinderAnzahl: childrenCount,
          keinKinder: noChildrenSelected,
          fuehrerschein: Boolean(final.personalInfo?.hasDrivingLicense),
          fuehrerscheinTyp: String(final.personalInfo?.drivingLicenseType || "")
            .trim()
            .toUpperCase(),
          telefon: final.personalInfo.phone,
          email: final.personalInfo.email,
          foto: final.personalInfo.photo,
        },
        berufserfahrung: Array.isArray(final.experience)
          ? final.experience.map((exp) => ({
              beginn: exp.startDate,
              ende: exp.endDate,
              position: exp.position,
              unternehmen: exp.company,
              ort: exp.location,
              aufgaben: Array.isArray(exp.responsibilities)
                ? exp.responsibilities
                : [],
            }))
          : [],
        ausbildung: Array.isArray(final.education)
          ? final.education.map((edu) => ({
              beginn: edu.startDate,
              ende: edu.endDate,
              bildungseinrichtung: edu.institution,
              abschluss: edu.degree || "",
            }))
          : [],
        faehigkeiten: {
          sozialkompetenzen: final.skills?.softSkills || [],
          pcKenntnisse: final.skills?.pcSkills || [],
          sprachen: final.skills?.languages || {},
        },
      };

      const major = (searchParams.get("major") || "").trim();

      if (!major) {
        toast.error("Der URL-Parameter ?major= fehlt oder ist leer.");
        return;
      }

      const email = (formData.personalInfo.email || "").trim();
      try {
        const { exists, data } = await checkEmailRemote(email);
        if (exists) {
          setExistingMajor(data?.major || "Unbekannt");
          setEnteredEmail(email);
          setIsEmailModalOpen(true);
          return;
        }
      } catch (error) {
        console.error(error);
        toast.error(
          "Fehler bei der Überprüfung der E-Mail-Adresse. Bitte versuchen Sie es erneut."
        );
        return;
      }

      try {
        // Upload files first and attach URLs (language certificates optional)
        const [diplomaUrls, langUrls] = await Promise.all([
          uploadFilesToConsulting(diplomaFiles),
          noLangCert
            ? Promise.resolve([])
            : uploadFilesToConsulting(langCertFiles),
        ]);

        const payload = {
          ...lebenslauf,
          attachments: {
            diplomas: diplomaUrls || [],
            languageCertificates: langUrls || [],
            noLanguageCertificate: Boolean(noLangCert),
          },
          status: {
            value: CANDIDATE_STATUS_DEFAULT,
            label: candidateStatusMap[CANDIDATE_STATUS_DEFAULT].label,
            updatedAt: Date.now(),
            updatedBy: "system",
          },
          createdAt: Date.now(),
        };

        await addDocument(major, payload);
        await registerEmailRemote(email, major);
        toast.success("Daten erfolgreich gesendet!");
        try {
          localStorage.setItem("createCvSubmitted", "true");
        } catch {
          // ignore storage errors
        }
        setIsSubmitted(true);
      } catch (error) {
        console.error("Fehler beim Senden an Firestore:", error);
        toast.error(`Fehler beim Senden: ${error.message}`);
      }
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-base-200">
      {isUploading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-content/40 backdrop-blur-sm">
          <div
            className="card bg-base-100 shadow-2xl p-6 flex items-center gap-3"
            role="status"
            aria-live="polite"
          >
            <span className="loading loading-spinner loading-lg text-primary" />
            <div className="text-sm font-medium">Wird hochgeladen...</div>
          </div>
        </div>
      ) : null}
      <div
        className={
          isSubmitted
            ? "max-w-3xl mx-auto min-h-[calc(100vh-3rem)] grid place-items-center"
            : "max-w-3xl mx-auto"
        }
      >
        <section className="card bg-base-100 shadow w-full max-w-lg mx-auto py-10">
          <div
            className={
              isSubmitted
                ? "card-body items-center text-center !p-[0.7rem]"
                : "card-body !p-[0.7rem]"
            }
          >
            {isSubmitted ? (
              <div className="space-y-4 text-center">
                <h2 className="card-title text-3xl font-bold w-full justify-center text-center">
                  Vielen Dank!
                </h2>
                <p>
                  Vielen Dank, dass Sie die Informationen auf Deutsch ausgefüllt
                  haben.
                </p>
              </div>
            ) : (
              <>
                <div className="w-full flex justify-center">
                  <h2 className="card-title text-3xl font-bold text-center">
                    Persönliche Daten
                  </h2>
                </div>

                <form
                  onSubmit={rhfHandleSubmit(onSubmit, onInvalid)}
                  className="space-y-6"
                >
                  <div className="divider mt-0">
                    <span className="mx-auto">Persönliche Daten</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      control={control}
                      name="personalInfo.name"
                      rules={{ required: "Vorname ist erforderlich" }}
                      render={({ field, fieldState }) => (
                        <FormInput
                          label={<RequiredLabel>Vorname</RequiredLabel>}
                          placeholder="Vorname"
                          inputClassName={
                            errors?.personalInfo?.name ? "input-error" : ""
                          }
                          aria-invalid={
                            errors?.personalInfo?.name ? "true" : "false"
                          }
                          {...field}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="personalInfo.lastName"
                      rules={{ required: "Nachname ist erforderlich" }}
                      render={({ field, fieldState }) => (
                        <FormInput
                          label={<RequiredLabel>Nachname</RequiredLabel>}
                          placeholder="Nachname"
                          inputClassName={
                            errors?.personalInfo?.lastName ? "input-error" : ""
                          }
                          aria-invalid={
                            errors?.personalInfo?.lastName ? "true" : "false"
                          }
                          {...field}
                        />
                      )}
                    />
                    <div className="md:col-span-2">
                      <label className="label">
                        <RequiredLabel className="label-text">
                          Geschlecht
                        </RequiredLabel>
                      </label>
                      <div className="flex gap-6">
                        <label className="cursor-pointer flex items-center gap-2">
                          <input
                            type="radio"
                            value="Männlich"
                            className="radio radio-primary"
                            {...register("personalInfo.gender", {
                              required: "Bitte Geschlecht auswählen",
                            })}
                          />
                          <span>Männlich</span>
                        </label>
                        <label className="cursor-pointer flex items-center gap-2">
                          <input
                            type="radio"
                            value="Weiblich"
                            className="radio radio-primary"
                            {...register("personalInfo.gender", {
                              required: "Bitte Geschlecht auswählen",
                            })}
                          />
                          <span>Weiblich</span>
                        </label>
                      </div>
                      {errors?.personalInfo?.gender && (
                        <p className="text-error text-sm mt-1">
                          {errors.personalInfo.gender.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Controller
                        control={control}
                        name="personalInfo.birthDate"
                        rules={{ required: "Geburtsdatum ist erforderlich" }}
                        render={({ field, fieldState }) => (
                          <>
                            <label
                              className="label"
                              htmlFor="personalInfo-birthDate"
                            >
                              <RequiredLabel className="label-text">
                                Geburtsdatum
                              </RequiredLabel>
                            </label>
                            <input
                              id="personalInfo-birthDate"
                              type="date"
                              placeholder="YYYY-MM-DD"
                              className={`input input-bordered w-full ${
                                errors?.personalInfo?.birthDate
                                  ? "input-error"
                                  : ""
                              }`}
                              aria-invalid={
                                errors?.personalInfo?.birthDate
                                  ? "true"
                                  : "false"
                              }
                              {...field}
                            />
                          </>
                        )}
                      />
                    </div>
                    <div>
                      <Controller
                        control={control}
                        name="personalInfo.maritalStatus"
                        rules={{ required: "Bitte Familienstand auswählen" }}
                        render={({ field, fieldState }) => (
                          <>
                            <label
                              className="label"
                              htmlFor="personalInfo-maritalStatus"
                            >
                              <RequiredLabel className="label-text">
                                Familienstand
                              </RequiredLabel>
                            </label>
                            <select
                              id="personalInfo-maritalStatus"
                              className={`select select-bordered w-full ${
                                errors?.personalInfo?.maritalStatus
                                  ? "select-error"
                                  : ""
                              }`}
                              aria-invalid={
                                errors?.personalInfo?.maritalStatus
                                  ? "true"
                                  : "false"
                              }
                              {...field}
                            >
                              <option value="">Bitte auswählen</option>
                              <option value="ledig">ledig</option>
                              <option value="verheiratet">verheiratet</option>
                              <option value="geschieden">geschieden</option>
                              <option value="verwitwet">verwitwet</option>
                            </select>
                          </>
                        )}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label
                        className="label"
                        htmlFor="personalInfo-hasDrivingLicense"
                      >
                        <span className="label-text">Führerschein</span>
                      </label>
                      <label className="cursor-pointer flex items-center gap-2">
                        <input
                          id="personalInfo-hasDrivingLicense"
                          type="checkbox"
                          className="checkbox"
                          {...register("personalInfo.hasDrivingLicense")}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setValue(
                              "personalInfo.hasDrivingLicense",
                              checked,
                              {
                                shouldDirty: true,
                                shouldValidate: true,
                              }
                            );
                            if (!checked) {
                              setValue("personalInfo.drivingLicenseType", "", {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                            }
                          }}
                          checked={Boolean(
                            watch("personalInfo.hasDrivingLicense")
                          )}
                        />
                        <span className="text-sm">Vorhanden</span>
                      </label>
                      {watch("personalInfo.hasDrivingLicense") ? (
                        <div className="mt-3">
                          <FormInput
                            label="Führerschein-Klasse (z.B. B, C, CE)"
                            placeholder="B"
                            inputClassName={
                              errors?.personalInfo?.drivingLicenseType
                                ? "input-error"
                                : ""
                            }
                            aria-invalid={
                              errors?.personalInfo?.drivingLicenseType
                                ? "true"
                                : "false"
                            }
                            {...register("personalInfo.drivingLicenseType", {
                              validate: (v) => {
                                const has = Boolean(
                                  watch("personalInfo.hasDrivingLicense")
                                );
                                if (!has) return true;
                                const s = String(v || "").trim();
                                if (!s)
                                  return "Bitte Führerschein-Klasse eingeben.";
                                return true;
                              },
                              setValueAs: (v) =>
                                String(v ?? "")
                                  .trim()
                                  .toUpperCase(),
                            })}
                          />
                          {errors?.personalInfo?.drivingLicenseType ? (
                            <p className="text-error text-sm mt-1">
                              {errors.personalInfo.drivingLicenseType.message}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="md:col-span-2">
                      <label
                        className="label"
                        htmlFor="personalInfo-childrenCount"
                      >
                        <RequiredLabel className="label-text">
                          Kinder
                        </RequiredLabel>
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="form-control">
                          <input
                            id="personalInfo-childrenCount"
                            type="number"
                            min={0}
                            inputMode="numeric"
                            placeholder="0"
                            className={`input input-bordered w-full ${
                              errors?.personalInfo?.childrenCount
                                ? "input-error"
                                : ""
                            }`}
                            disabled={watch("personalInfo.noChildren")}
                            aria-invalid={
                              errors?.personalInfo?.childrenCount
                                ? "true"
                                : "false"
                            }
                            {...register("personalInfo.childrenCount", {
                              validate: (value) => {
                                const noKids = Boolean(
                                  watch("personalInfo.noChildren")
                                );
                                if (noKids) return true;
                                const v = String(value || "").trim();
                                if (!v)
                                  return "Bitte Kinderanzahl eingeben oder 'Keine Kinder' auswählen.";
                                const n = Number(v);
                                if (Number.isNaN(n) || n < 0)
                                  return "Bitte eine gültige Zahl eingeben.";
                                return true;
                              },
                              setValueAs: (v) => {
                                const s = String(v ?? "").trim();
                                if (!s) return "";
                                const num = Number(s);
                                if (Number.isNaN(num)) return "";
                                return String(Math.max(0, Math.floor(num)));
                              },
                            })}
                          />
                          {errors?.personalInfo?.childrenCount ? (
                            <p className="text-error text-sm mt-1">
                              {errors.personalInfo.childrenCount.message}
                            </p>
                          ) : null}
                        </div>
                        <div className="form-control">
                          <label className="cursor-pointer flex items-center gap-2 mt-2 md:mt-0">
                            <input
                              type="checkbox"
                              className="checkbox"
                              {...register("personalInfo.noChildren")}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setValue("personalInfo.noChildren", checked, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                                if (checked) {
                                  setValue("personalInfo.childrenCount", "", {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                }
                              }}
                              checked={Boolean(
                                watch("personalInfo.noChildren")
                              )}
                            />
                            <span className="text-sm">Keine Kinder</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <Controller
                      control={control}
                      name="personalInfo.phone"
                      rules={{
                        required: "Telefonnummer ist erforderlich",
                        validate: (v) => {
                          const raw = String(v || "").trim();
                          const firstSpace = raw.indexOf(" ");
                          if (firstSpace < 0) {
                            return "Bitte Telefonnummer vollständig eingeben.";
                          }
                          const body = raw.slice(firstSpace + 1);
                          const digits = String(body || "").replace(
                            /[^\d]/g,
                            ""
                          );
                          if (digits.length !== 9) {
                            return "Bitte Telefonnummer vollständig eingeben.";
                          }
                          return true;
                        },
                      }}
                      render={({ field }) => {
                        return (
                          <PhoneInputWithCountry
                            label={
                              <RequiredLabel className="label-text">
                                Telefonnummer
                              </RequiredLabel>
                            }
                            required
                            value={field.value}
                            onChange={field.onChange}
                            error={errors?.personalInfo?.phone?.message}
                          />
                        );
                      }}
                    />
                    <div>
                      <Controller
                        control={control}
                        name="personalInfo.email"
                        rules={{
                          required: "E-Mail ist erforderlich",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Bitte gültige E-Mail eingeben",
                          },
                        }}
                        render={({ field, fieldState }) => (
                          <FormInput
                            label={<RequiredLabel>E-Mail</RequiredLabel>}
                            placeholder="E-Mail"
                            type="email"
                            inputClassName={
                              errors?.personalInfo?.email ? "input-error" : ""
                            }
                            aria-invalid={
                              errors?.personalInfo?.email ? "true" : "false"
                            }
                            {...field}
                          />
                        )}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label
                        className="label flex-col items-start gap-1"
                        htmlFor="personalInfo-photo-file"
                      >
                        <RequiredLabel className="label-text">
                          Foto hochladen (JPEG/PNG)
                        </RequiredLabel>
                        <span className="label-text-alt text-xs text-base-content/70">
                          Bis 250 KB
                        </span>
                      </label>
                      <input
                        type="hidden"
                        {...register("personalInfo.photo", {
                          required: "Foto ist erforderlich",
                        })}
                      />
                      <input
                        id="personalInfo-photo-file"
                        type="file"
                        accept="image/*"
                        className={`file-input file-input-bordered w-full ${
                          errors?.personalInfo?.photo ? "file-input-error" : ""
                        }`}
                        onChange={handlePhotoFileChange}
                      />
                    </div>
                    <div className="md:col-span-2">
                      {/* Keep a single `address` field for storage/PDF, but collect it as Germany address parts */}
                      <input
                        type="hidden"
                        {...register("personalInfo.address")}
                        aria-hidden="true"
                      />

                      <div className="rounded-box border border-base-300 bg-base-200/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">
                              <RequiredLabel>
                                Adresse (Deutschland)
                              </RequiredLabel>
                            </div>
                            <p className="text-xs text-base-content/70 mt-1">
                              Format: Straße + Hausnummer, PLZ Ort (z.B.{" "}
                              <span className="font-mono">
                                Musterstraße 12A, 12345 Berlin
                              </span>
                              )
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                          <div>
                            <label
                              className="label"
                              htmlFor="personalInfo-addressStreet"
                            >
                              <RequiredLabel className="label-text">
                                Straße
                              </RequiredLabel>
                            </label>
                            <input
                              id="personalInfo-addressStreet"
                              type="text"
                              placeholder="Straße"
                              className={`input input-bordered w-full ${
                                errors?.personalInfo?.addressStreet
                                  ? "input-error"
                                  : ""
                              }`}
                              aria-invalid={
                                errors?.personalInfo?.addressStreet
                                  ? "true"
                                  : "false"
                              }
                              {...register("personalInfo.addressStreet", {
                                required: "Straße ist erforderlich",
                                setValueAs: (v) => String(v || "").trim(),
                              })}
                            />
                            {errors?.personalInfo?.addressStreet ? (
                              <p className="text-error text-sm mt-1">
                                {errors.personalInfo.addressStreet.message}
                              </p>
                            ) : null}
                          </div>

                          <div>
                            <label
                              className="label"
                              htmlFor="personalInfo-addressHouseNumber"
                            >
                              <RequiredLabel className="label-text">
                                Hausnummer
                              </RequiredLabel>
                            </label>
                            <input
                              id="personalInfo-addressHouseNumber"
                              type="text"
                              placeholder="z.B. 12A"
                              className={`input input-bordered w-full ${
                                errors?.personalInfo?.addressHouseNumber
                                  ? "input-error"
                                  : ""
                              }`}
                              aria-invalid={
                                errors?.personalInfo?.addressHouseNumber
                                  ? "true"
                                  : "false"
                              }
                              {...register("personalInfo.addressHouseNumber", {
                                required: "Hausnummer ist erforderlich",
                                setValueAs: (v) => String(v || "").trim(),
                              })}
                            />
                            {errors?.personalInfo?.addressHouseNumber ? (
                              <p className="text-error text-sm mt-1">
                                {errors.personalInfo.addressHouseNumber.message}
                              </p>
                            ) : null}
                          </div>

                          <div>
                            <label
                              className="label"
                              htmlFor="personalInfo-addressPostalCode"
                            >
                              <RequiredLabel className="label-text">
                                PLZ
                              </RequiredLabel>
                            </label>
                            <input
                              id="personalInfo-addressPostalCode"
                              type="text"
                              inputMode="numeric"
                              placeholder="12345"
                              maxLength={5}
                              className={`input input-bordered w-full ${
                                errors?.personalInfo?.addressPostalCode
                                  ? "input-error"
                                  : ""
                              }`}
                              aria-invalid={
                                errors?.personalInfo?.addressPostalCode
                                  ? "true"
                                  : "false"
                              }
                              {...register("personalInfo.addressPostalCode", {
                                required: "PLZ ist erforderlich",
                                validate: (v) =>
                                  /^\d{5}$/.test(String(v || "").trim()) ||
                                  "PLZ muss 5 Ziffern haben",
                                setValueAs: (v) =>
                                  String(v || "")
                                    .replace(/[^\d]/g, "")
                                    .slice(0, 5),
                              })}
                            />
                            {errors?.personalInfo?.addressPostalCode ? (
                              <p className="text-error text-sm mt-1">
                                {errors.personalInfo.addressPostalCode.message}
                              </p>
                            ) : null}
                          </div>

                          <div>
                            <label
                              className="label"
                              htmlFor="personalInfo-addressCity"
                            >
                              <RequiredLabel className="label-text">
                                Ort
                              </RequiredLabel>
                            </label>
                            <input
                              id="personalInfo-addressCity"
                              type="text"
                              placeholder="z.B. Berlin"
                              className={`input input-bordered w-full ${
                                errors?.personalInfo?.addressCity
                                  ? "input-error"
                                  : ""
                              }`}
                              aria-invalid={
                                errors?.personalInfo?.addressCity
                                  ? "true"
                                  : "false"
                              }
                              {...register("personalInfo.addressCity", {
                                required: "Ort ist erforderlich",
                                setValueAs: (v) => String(v || "").trim(),
                              })}
                            />
                            {errors?.personalInfo?.addressCity ? (
                              <p className="text-error text-sm mt-1">
                                {errors.personalInfo.addressCity.message}
                              </p>
                            ) : null}
                          </div>

                          <div className="md:col-span-2">
                            <Controller
                              control={control}
                              name="personalInfo.addressCountry"
                              rules={{ required: "Land ist erforderlich" }}
                              render={({ field }) => (
                                <CountryNameCombobox
                                  id="personalInfo-addressCountry"
                                  label={
                                    <RequiredLabel className="label-text">
                                      Land
                                    </RequiredLabel>
                                  }
                                  required
                                  placeholder="Usbekistan"
                                  value={field.value}
                                  onChange={(v) =>
                                    field.onChange(String(v || "").trim())
                                  }
                                  error={
                                    errors?.personalInfo?.addressCountry
                                      ?.message
                                  }
                                />
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="divider">Berufserfahrung</div>
                  <ExperienceSection
                    experience={cv.experience}
                    onAddExperience={addExperience}
                    onUpdateExperience={updateExperience}
                    onRemoveExperience={removeExperience}
                    onAddResponsibility={addResponsibility}
                    onRemoveResponsibility={removeResponsibility}
                    showRequiredWarning={showExperienceWarning}
                    errors={experienceErrors}
                  />

                  <div className="divider">
                    <span className="mx-auto">
                      <RequiredLabel>Ausbildung</RequiredLabel>
                    </span>
                  </div>
                  <EducationSection
                    education={cv.education}
                    onAddEducation={addEducation}
                    onUpdateEducation={updateEducation}
                    onRemoveEducation={removeEducation}
                    showRequiredWarning={showEducationWarning}
                    errors={educationErrors}
                  />

                  <div className="divider">Fähigkeiten</div>
                  <SkillsSection
                    softSkills={cv.skills.softSkills}
                    pcSkills={cv.skills.pcSkills}
                    onAddSoft={(val) => addTag(["skills", "softSkills"], val)}
                    onRemoveSoft={(i) => removeTag(["skills", "softSkills"], i)}
                    onAddPc={(val) => addTag(["skills", "pcSkills"], val)}
                    onRemovePc={(i) => removeTag(["skills", "pcSkills"], i)}
                    onAutoAddSoft={() => autoAddSkills("soft")}
                    onAutoAddPc={() => autoAddSkills("pc")}
                    isGeneratingSoft={isGeneratingSoft}
                    isGeneratingPc={isGeneratingPc}
                    recentlyAddedSoft={recentlyAdded.soft}
                    recentlyAddedPc={recentlyAdded.pc}
                  />

                  <div className="divider">Sprachen</div>
                  <LanguagesSection
                    languageRows={languageRows}
                    onAddRow={addLanguageRow}
                    onUpdateRow={updateLanguageRow}
                    onRemoveRow={removeLanguageRow}
                    showRequiredWarning={showLanguageWarning}
                    errors={languageErrors}
                  />

                  <div className="divider">Dokumente</div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="label" htmlFor="doc-diplomas">
                          <RequiredLabel className="label-text">
                            Diplome (PDF, mindestens Schulzeugnis)
                          </RequiredLabel>
                        </label>
                        {Array.isArray(diplomaFiles) &&
                        diplomaFiles.length > 0 ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => setDiplomaFiles([])}
                          >
                            Alle entfernen
                          </button>
                        ) : null}
                      </div>
                      <p className="text-xs text-base-content/70 mb-2">
                        Pflicht: Laden Sie mindestens Ihr Schulzeugnis als PDF
                        hoch.
                      </p>
                      <input
                        id="doc-diplomas"
                        type="file"
                        multiple
                        accept=".pdf,application/pdf"
                        className={`file-input file-input-bordered w-full ${
                          diplomaError ? "file-input-error" : ""
                        }`}
                        aria-invalid={diplomaError ? "true" : "false"}
                        onChange={(e) => {
                          const raw = Array.from(e.target.files || []);
                          const pdfs = raw.filter(
                            (f) =>
                              String(f.type).toLowerCase() ===
                                "application/pdf" ||
                              /\.pdf$/i.test(String(f.name || ""))
                          );
                          const invalid = raw.length - pdfs.length;
                          if (invalid > 0) {
                            toast.error("Nur PDF-Dateien sind erlaubt.");
                          }
                          if (pdfs.length > 0) {
                            setDiplomaError(false);
                          }
                          setDiplomaFiles((prev) => mergeFiles(prev, pdfs));
                          // reset value to allow picking the same file again if needed
                          e.target.value = "";
                        }}
                      />
                      {diplomaError ? (
                        <p className="text-error text-sm mt-1">
                          Mindestens ein Diplom bzw. Schulzeugnis (PDF)
                          erforderlich.
                        </p>
                      ) : null}
                      {Array.isArray(diplomaFiles) &&
                      diplomaFiles.length > 0 ? (
                        <div className="mt-2">
                          <div className="text-xs opacity-70 mb-1">Nur PDF</div>
                          <ul className="space-y-2">
                            {diplomaFiles.map((f, i) => (
                              <li
                                key={uniqueKey(f)}
                                className="flex items-center justify-between gap-2 rounded-box border border-base-300 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-medium">
                                    {f.name}
                                  </div>
                                  <div className="text-xs opacity-70">
                                    {(f.size / 1024).toFixed(1)} KB
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs"
                                  onClick={() =>
                                    setDiplomaFiles((prev) =>
                                      removeFileAt(prev, i)
                                    )
                                  }
                                  aria-label="Entfernen"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="label" htmlFor="doc-langcerts">
                          <span className="label-text">
                            Sprachzertifikate (mehrere möglich)
                          </span>
                        </label>
                        {Array.isArray(langCertFiles) &&
                        langCertFiles.length > 0 ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => setLangCertFiles([])}
                          >
                            Alle entfernen
                          </button>
                        ) : null}
                      </div>
                      <div className="form-control mb-2">
                        <label className="cursor-pointer flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={noLangCert}
                            onChange={(e) => {
                              const v = e.target.checked;
                              setNoLangCert(v);
                              if (v) setLangCertFiles([]);
                            }}
                          />
                          <span className="text-sm">Kein Sprachzertifikat</span>
                        </label>
                      </div>
                      <input
                        id="doc-langcerts"
                        type="file"
                        multiple
                        accept=".pdf,application/pdf"
                        className="file-input file-input-bordered w-full"
                        disabled={noLangCert}
                        onChange={(e) => {
                          const raw = Array.from(e.target.files || []);
                          const pdfs = raw.filter(
                            (f) =>
                              String(f.type).toLowerCase() ===
                                "application/pdf" ||
                              /\.pdf$/i.test(String(f.name || ""))
                          );
                          const invalid = raw.length - pdfs.length;
                          if (invalid > 0) {
                            toast.error("Nur PDF-Dateien sind erlaubt.");
                          }
                          setLangCertFiles((prev) => mergeFiles(prev, pdfs));
                          e.target.value = "";
                        }}
                      />
                      {Array.isArray(langCertFiles) &&
                      langCertFiles.length > 0 ? (
                        <div className="mt-2">
                          <div className="text-xs opacity-70 mb-1">Nur PDF</div>
                          <ul className="space-y-2">
                            {langCertFiles.map((f, i) => (
                              <li
                                key={uniqueKey(f)}
                                className="flex items-center justify-between gap-2 rounded-box border border-base-300 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-medium">
                                    {f.name}
                                  </div>
                                  <div className="text-xs opacity-70">
                                    {(f.size / 1024).toFixed(1)} KB
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs"
                                  onClick={() =>
                                    setLangCertFiles((prev) =>
                                      removeFileAt(prev, i)
                                    )
                                  }
                                  aria-label="Entfernen"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="divider"></div>
                  <div className="form-control">
                    <div className="rounded-box border border-base-300 bg-base-200/40 p-4 md:p-5">
                      <div className="flex items-start gap-3">
                        <input
                          id="agreePrivacy"
                          type="checkbox"
                          className={`checkbox mt-1 ${
                            errors?.agreePrivacy ? "checkbox-error" : ""
                          }`}
                          aria-invalid={errors?.agreePrivacy ? "true" : "false"}
                          aria-describedby={
                            errors?.agreePrivacy
                              ? "agreePrivacy-error"
                              : undefined
                          }
                          {...register("agreePrivacy", { required: true })}
                        />
                        <div className="min-w-0">
                          <label
                            htmlFor="agreePrivacy"
                            className="font-medium leading-6 cursor-pointer"
                          >
                            Ich habe die Datenschutzerklärung gelesen und stimme
                            zu.
                          </label>
                          <div className="mt-1 text-sm text-base-content/80 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="link link-primary"
                              onClick={() => setIsPrivacyOpen(true)}
                            >
                              Datenschutzrichtlinie
                            </button>
                          </div>
                          {errors?.agreePrivacy ? (
                            <p
                              id="agreePrivacy-error"
                              className="text-error text-sm mt-2"
                            >
                              Bitte stimmen Sie der Datenschutzerklärung zu, um
                              fortzufahren.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="divider"></div>
                  <div className="flex justify-center mb-4">
                    <ReCAPTCHA
                      sitekey={
                        import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
                        "6LdEVycsAAAAAJ11zB8ovl-uNIQPPI06t8Rhwow8"
                      }
                      onChange={setCaptchaToken}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!watch("agreePrivacy") || isUploading}
                    >
                      {isUploading ? (
                        "Hochladen..."
                      ) : (
                        <>
                          <FaPaperPlane className="inline-block mr-2" />
                          Absenden
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
      <PrivacyModal
        open={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-3">
        <button
          type="button"
          className="btn btn-primary btn-circle shadow-lg"
          aria-label="Video-Guide öffnen"
          onClick={() => setIsGuideOpen(true)}
        >
          <FaVideo className="text-xl" />
          <span className="sr-only">Video-Guide</span>
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-circle shadow-lg"
          aria-label="Support via Telegram"
          onClick={() =>
            window.open(TELEGRAM_SUPPORT_URL, "_blank", "noopener,noreferrer")
          }
        >
          <FaTelegramPlane className="text-xl" />
          <span className="sr-only">Support Chat</span>
        </button>
      </div>

      <GuideModal open={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      <ExistingEmailModal
        open={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        enteredEmail={enteredEmail}
        existingMajor={existingMajor}
      />
    </div>
  );
}

export default Create;
