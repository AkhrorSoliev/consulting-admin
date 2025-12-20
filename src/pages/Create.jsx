import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import ReCAPTCHA from "react-google-recaptcha";
import {
  FaGlobe,
  FaPaperPlane,
  FaTelegramPlane,
  FaVideo,
  FaChevronRight,
} from "react-icons/fa";
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
  sortTimelineItemsDesc,
  uploadFilesToConsulting,
  checkEmailRemote,
  registerEmailRemote,
  getMetaByName,
} from "../utils";
import {
  CANDIDATE_STATUS_DEFAULT,
  candidateStatusMap,
} from "../constants/candidateStatus";
import { UZBEK_REGIONS } from "../constants/uzbekRegions";
import { LANGUAGE_OPTIONS } from "../constants/languageOptions";
import PrivacyModal from "./create/components/modals/PrivacyModal";
import GuideModal from "./create/components/modals/GuideModal";
import ExistingEmailModal from "./create/components/modals/ExistingEmailModal";

function Create() {
  const MAX_PDF_BYTES = 2 * 1024 * 1024; // 2MB per file
  const MAX_PHOTO_BYTES = 250 * 1024; // 250KB per file
  const LANG_CERT_TYPES = useMemo(
    () => [
      "DAF Sprachzentrum Zertifikat",
      "Goethe-Zertifikat",
      "TestDaF",
      "telc Deutsch",
      "ÖSD",
    ],
    []
  );
  const DRIVING_LICENSE_OPTIONS = useMemo(
    () => [
      "AM",
      "A1",
      "A2",
      "A",
      "B",
      "BE",
      "C1",
      "C1E",
      "C",
      "CE",
      "D1",
      "D1E",
      "D",
      "DE",
      "T",
    ],
    []
  );

  const initialCv = useMemo(
    () => ({
      personalInfo: {
        name: "",
        lastName: "",
        gender: "",
        address: "",
        birthDate: "",
        birthPlace: "",
        maritalStatus: "",
        childrenCount: "",
        noChildren: false,
        hasDrivingLicense: false,
        // In the form UI we allow selecting multiple license classes.
        // We still serialize it as a comma-separated string on submit for backward compatibility.
        drivingLicenseType: [],
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
  const [passportFiles, setPassportFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [diplomaError, setDiplomaError] = useState(false);
  const [diplomaSizeError, setDiplomaSizeError] = useState(false);
  const [langCertSizeError, setLangCertSizeError] = useState(false);
  const [langCertTypeError, setLangCertTypeError] = useState(false);
  const [passportError, setPassportError] = useState(false);
  const [passportSizeError, setPassportSizeError] = useState(false);
  const [photoSizeError, setPhotoSizeError] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showEducationWarning, setShowEducationWarning] = useState(false);
  const [showExperienceWarning, setShowExperienceWarning] = useState(false);
  const [educationErrors, setEducationErrors] = useState([]);
  const [experienceErrors, setExperienceErrors] = useState([]);
  const [showLanguageWarning, setShowLanguageWarning] = useState(false);
  const [languageErrors, setLanguageErrors] = useState([]);
  const [isDrivingLicenseDropdownOpen, setIsDrivingLicenseDropdownOpen] =
    useState(false);
  const drivingLicenseDropdownRef = useRef(null);
  const [isLinkBlocked, setIsLinkBlocked] = useState(false);
  const [blockedLinkTitle, setBlockedLinkTitle] = useState("");
  const [leadValue, setLeadValue] = useState("");
  const [majorInfo, setMajorInfo] = useState({
    collectionName: "",
    title: "",
    linkId: "",
    showTitle: false,
  });
  const [majorLoading, setMajorLoading] = useState(false);

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

  useEffect(() => {
    const key = String(searchParams.get("major") || "").trim();
    const leadParam = String(searchParams.get("lead") || "").trim();
    let cancelled = false;
    setMajorLoading(true);
    (async () => {
      try {
        // Reset link access state when major changes
        setIsLinkBlocked(false);
        setBlockedLinkTitle("");
        setLeadValue(leadParam);
        if (!key) {
          setMajorInfo({
            collectionName: "",
            title: "",
            linkId: "",
            showTitle: false,
          });
          return;
        }
        const meta = await getMetaByName(key);
        if (cancelled) return;
        if (meta) {
          const isActive = meta?.linkActive !== false; // default active
          if (!isActive) {
            setIsLinkBlocked(true);
            setBlockedLinkTitle(String(meta?.title || meta?.collectionName || key));
          }

          // Lead validation (optional)
          if (leadParam) {
            const leadsGloballyActive = meta?.leadLinksActive !== false;
            const list = Array.isArray(meta?.leadLinks) ? meta.leadLinks : [];
            const match = list.find((l) => {
              const n = String(l?.name || "").trim();
              const id = String(l?.id || l?.key || "").trim();
              return n === leadParam || id === leadParam;
            });
            const leadActive = match ? match?.active !== false : false;
            if (!leadsGloballyActive) {
              setIsLinkBlocked(true);
              setBlockedLinkTitle(
                `Lead linklar vaqtincha o‘chirilgan (${meta?.title || meta?.collectionName || key})`
              );
            } else if (!match) {
              setIsLinkBlocked(true);
              setBlockedLinkTitle(`Lead topilmadi: ${leadParam}`);
            } else if (!leadActive) {
              setIsLinkBlocked(true);
              setBlockedLinkTitle(`Lead link aktiv emas: ${leadParam}`);
            }
          }

          const isUuidMatch = key === (meta.linkId || meta.uuid || meta.id);
          const shouldShowTitle =
            isUuidMatch &&
            Boolean(meta.title) &&
            (meta.linkId || meta.uuid || meta.id) !== meta.collectionName;
          setMajorInfo({
            collectionName:
              meta.collectionName || meta.slug || meta.name || key,
            title: meta.title || meta.collectionName || key,
            linkId: meta.linkId || meta.uuid || meta.id || key,
            showTitle: shouldShowTitle,
          });
        } else {
          setMajorInfo({
            collectionName: key,
            title: key,
            linkId: key,
            showTitle: false,
          });
        }
      } catch {
        if (!cancelled) {
          setMajorInfo({
            collectionName: key,
            title: key,
            linkId: key,
            showTitle: false,
          });
        }
      } finally {
        if (!cancelled) setMajorLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

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

  function mergeLangCertItems(existing, incomingFiles) {
    const map = new Map();
    (existing || []).forEach((item) => {
      const file = item?.file || item;
      const key = uniqueKey(file);
      map.set(key, { file, type: item?.type || "" });
    });
    (incomingFiles || []).forEach((f) => {
      if (!(f instanceof File)) return;
      const key = uniqueKey(f);
      if (!map.has(key)) {
        map.set(key, { file: f, type: "" });
      }
    });
    return Array.from(map.values());
  }

  function removeLangCertAt(items, idx) {
    return (items || []).filter((_, i) => i !== idx);
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
  const SUBMIT_ENDPOINT =
    import.meta.env.VITE_SUBMIT_CANDIDATE_URL ||
    import.meta.env.VITE_FUNCTIONS_BASE &&
      `${import.meta.env.VITE_FUNCTIONS_BASE}/submitCandidate`;
  // Phone/Country dropdown options come from `src/utils/const.js` via components

  useEffect(() => {
    // Submission state should be tracked per-major, otherwise a candidate
    // can't submit again for a different major.
    const majorCollection = String(majorInfo?.collectionName || "").trim();
    if (!majorCollection) {
      setIsSubmitted(false);
      return;
    }
    try {
      const v = localStorage.getItem(`createCvSubmitted:${majorCollection}`);
      setIsSubmitted(v === "true");
    } catch {
      // ignore storage errors
    }
  }, [majorInfo?.collectionName]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setIsPrivacyOpen(false);
        setIsGuideOpen(false);
        setIsDrivingLicenseDropdownOpen(false);
      }
    }
    if (isPrivacyOpen || isGuideOpen) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPrivacyOpen, isGuideOpen]);

  useEffect(() => {
    if (!isDrivingLicenseDropdownOpen) return;
    function onPointerDown(e) {
      const el = drivingLicenseDropdownRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setIsDrivingLicenseDropdownOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
    };
  }, [isDrivingLicenseDropdownOpen]);

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
        birthPlace: initialCv.personalInfo.birthPlace,
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
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("Foto darf maximal 250 KB groß sein.");
      setPhotoSizeError(true);
      try {
        e.target.value = "";
      } catch {
        // ignore reset errors
      }
      setValue("personalInfo.photo", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }
    setPhotoSizeError(false);
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
      experience: sortTimelineItemsDesc([
        ...prev.experience,
        {
          startDate: "",
          endDate: "",
          position: "",
          company: "",
          location: "",
          responsibilities: [],
        },
      ]),
    }));
  }

  function updateExperience(idx, field, value) {
    setCv((prev) => {
      const next = [...prev.experience];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, experience: sortTimelineItemsDesc(next) };
    });
  }

  function onInvalid(formErrors) {
    const requiredOrder = [
      "personalInfo.name",
      "personalInfo.lastName",
      "personalInfo.gender",
      "personalInfo.birthDate",
      "personalInfo.birthPlace",
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
      "personalInfo.birthPlace": "Geburtsort",
      "personalInfo.maritalStatus": "Familienstand",
      "personalInfo.childrenCount": "Kinder",
      "personalInfo.phone": "Telefonnummer",
      "personalInfo.email": "E-Mail",
      "personalInfo.photo": "Foto",
      "personalInfo.addressStreet": "Straße",
      "personalInfo.addressHouseNumber": "Hausnummer",
      "personalInfo.addressPostalCode": "PLZ (Postleitzahl)",
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
    const missing = requiredOrder.filter((p) => hasErrAt(p));
    if (missing.length) {
      const labels = missing.map((p) => labelMap[p] || p).join(", ");
      toast.error(`Bitte füllen Sie folgende Pflichtfelder aus: ${labels}.`);
      // Fokus weiterhin auf das erste fehlende Feld setzen, damit der Nutzer direkt starten kann.
      const firstPath = missing[0];
      try {
        setFocus(firstPath);
      } catch {
        // ignore focus errors
      }
      return;
    }
    toast.error("Bitte füllen Sie alle Pflichtfelder aus.");
  }

  function removeExperience(idx) {
    setCv((prev) => {
      const next = prev.experience.filter((_, i) => i !== idx);
      return { ...prev, experience: sortTimelineItemsDesc(next) };
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
      education: sortTimelineItemsDesc([
        ...prev.education,
        { startDate: "", endDate: "", institution: "", degree: "" },
      ]),
    }));
  }

  function updateEducation(idx, field, value) {
    setCv((prev) => {
      const next = [...prev.education];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, education: sortTimelineItemsDesc(next) };
    });
  }

  function removeEducation(idx) {
    setCv((prev) => {
      const next = prev.education.filter((_, i) => i !== idx);
      return { ...prev, education: sortTimelineItemsDesc(next) };
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
      const blockingErrors = [];
      const errorLabels = {
        captcha: "reCAPTCHA",
        majorLoading: "Berufsfeld lädt",
        education: "Ausbildung",
        experience: "Berufserfahrung",
        language: "Sprache",
        diploma: "Diplom/Zeugnis",
        langCert: "Sprachzertifikat",
        langCertType: "Zertifikat-Typ",
        passport: "Reisepass/ID",
        major: "?major=",
      };

      if (!captchaToken) {
        blockingErrors.push("captcha");
      }

      if (majorLoading) {
        blockingErrors.push("majorLoading");
      }

      const hasEducation =
        Array.isArray(cv.education) &&
        cv.education.length > 0 &&
        cv.education.every((edu) => isEducationEntryFilled(edu));
      if (!hasEducation) {
        setShowEducationWarning(true);
        setEducationErrors(getEducationErrors(cv.education));
        blockingErrors.push("education");
      }

      const hasIncompleteExperience =
        Array.isArray(cv.experience) &&
        cv.experience.some((exp) => !isExperienceEntryFilled(exp));
      if (hasIncompleteExperience) {
        setShowExperienceWarning(true);
        setExperienceErrors(getExperienceErrors(cv.experience));
        blockingErrors.push("experience");
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
        blockingErrors.push("language");
      }

      if (!Array.isArray(diplomaFiles) || diplomaFiles.length === 0) {
        setDiplomaError(true);
        blockingErrors.push("diploma");
      } else {
        setDiplomaError(false);
      }

      // Language certificates are optional, but if provided, a type is required.
      const hasLangCertFiles = Array.isArray(langCertFiles) && langCertFiles.length > 0;
      const hasMissingLangType = hasLangCertFiles
        ? langCertFiles.some((item) => !String(item?.type || "").trim())
        : false;
      if (hasMissingLangType) {
        setLangCertTypeError(true);
        blockingErrors.push("langCertType");
      } else {
        setLangCertTypeError(false);
      }

      if (!Array.isArray(passportFiles) || passportFiles.length === 0) {
        setPassportError(true);
        blockingErrors.push("passport");
      } else {
        setPassportError(false);
      }

      const majorCollection = String(majorInfo?.collectionName || "").trim();
      if (!majorCollection) {
        blockingErrors.push("major");
      }

      if (blockingErrors.length) {
        const maxItems = 6;
        const shown = blockingErrors.slice(0, maxItems);
        const list = shown.map((key) => errorLabels[key] || key).join(", ");
        const remaining = blockingErrors.length - shown.length;
        const suffix = remaining > 0 ? `, +${remaining}` : "";
        toast.error(`Fehlend: ${list}${suffix}`);
        return;
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
          geburtsort: String(final.personalInfo.birthPlace || "").trim(),
          familienstand: final.personalInfo.maritalStatus,
          kinderAnzahl: childrenCount,
          keinKinder: noChildrenSelected,
          fuehrerschein: Boolean(final.personalInfo?.hasDrivingLicense),
          fuehrerscheinTyp: (() => {
            const raw = final.personalInfo?.drivingLicenseType;
            const types = Array.isArray(raw)
              ? raw
              : String(raw || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
            return types
              .map((t) =>
                String(t || "")
                  .trim()
                  .toUpperCase()
              )
              .filter(Boolean)
              .join(", ");
          })(),
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
        const [diplomaUrls, langUrls, passportUrls] = await Promise.all([
          uploadFilesToConsulting(diplomaFiles),
          uploadFilesToConsulting(langCertFiles.map((item) => item?.file)),
          uploadFilesToConsulting(passportFiles),
        ]);

        const langCertTypes = langCertFiles.map((item) => item?.type || "");
        const langCertDetailed = (langUrls || []).map((url, idx) => ({
          url,
          type: langCertTypes[idx] || "",
        }));

        const payload = {
          ...lebenslauf,
          // Tracking: optional lead param from URL (/create?major=...&lead=...)
          lead: String(leadValue || "").trim(),
          attachments: {
            diplomas: diplomaUrls || [],
            languageCertificates: langUrls || [],
            languageCertificatesDetailed: langCertDetailed,
            passport: passportUrls?.[0] || null,
            passports: passportUrls || [],
          },
          documents: {
            diplomas: diplomaUrls || [],
            certificates: langUrls || [],
            certificatesDetailed: langCertDetailed,
            passport: passportUrls || [],
          },
          languageCertificatesDetailed: langCertDetailed,
          status: {
            value: CANDIDATE_STATUS_DEFAULT,
            label: candidateStatusMap[CANDIDATE_STATUS_DEFAULT].label,
            updatedAt: Date.now(),
            updatedBy: "system",
          },
          createdAt: Date.now(),
        };

        // Submit via Cloud Function to enforce link/lead checks server-side
        if (!SUBMIT_ENDPOINT) {
          throw new Error(
            "SUBMIT_CANDIDATE_URL is not configured (VITE_SUBMIT_CANDIDATE_URL)"
          );
        }
        const res = await fetch(SUBMIT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            major: majorCollection,
            payload,
            recaptchaToken: captchaToken,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) {
          const errMsg =
            json?.error ||
            json?.details ||
            `Submit failed (${res.status || ""})`;
          throw new Error(errMsg);
        }

        await registerEmailRemote(email, majorCollection);
        toast.success("Daten erfolgreich gesendet!");
        try {
          localStorage.setItem(`createCvSubmitted:${majorCollection}`, "true");
          // legacy key cleanup (avoid cross-major false positives)
          localStorage.removeItem("createCvSubmitted");
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

  if (isLinkBlocked) {
    return (
      <div className="min-h-screen bg-base-200">
        <div className="max-w-3xl mx-auto min-h-screen grid place-items-center p-4">
          <div className="card bg-base-100 shadow w-full max-w-lg">
            <div className="card-body items-center text-center">
              <h2 className="text-2xl font-bold">Link aktiv emas</h2>
              <p className="opacity-80">
                {blockedLinkTitle
                  ? `“${blockedLinkTitle}” uchun forma vaqtincha o‘chirilgan.`
                  : "Bu forma vaqtincha o‘chirilgan."}
              </p>
              <p className="text-sm opacity-70">
                Iltimos, sizga link bergan admin bilan bog‘laning.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
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
                ? "card-body items-center text-center p-[0.7rem]!"
                : "card-body p-[0.7rem]!"
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
                <div className="w-full max-w-md pt-4">
                  <div className="rounded-2xl border border-base-300 bg-base-100 p-4 text-left shadow-sm">
                    <div className="text-center">
                      <div className="text-sm font-semibold leading-tight">
                        Empfehlung:{" "}
                        <span className="text-base-content">
                          DaF Sprachzentrum
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-base-content/70">
                        Unsere Deutschkurse in ganz Usbekistan.
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <a
                        href="https://www.dafzentrum.uz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3 hover:bg-base-200/60"
                        aria-label="DaF Sprachzentrum Website öffnen"
                      >
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FaGlobe className="text-base" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold">Website</div>
                          <div className="text-xs text-base-content/60 truncate">
                            dafzentrum.uz
                          </div>
                        </div>
                        <FaChevronRight className="text-sm opacity-50 group-hover:opacity-80" />
                      </a>

                      <a
                        href="https://t.me/dafsprachzentrum"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3 hover:bg-base-200/60"
                        aria-label="DaF Sprachzentrum Telegram-Kanal öffnen"
                      >
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#229ED9]/10 text-[#229ED9]">
                          <FaTelegramPlane className="text-base" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold">Telegram</div>
                          <div className="text-xs text-base-content/60 truncate">
                            @dafsprachzentrum
                          </div>
                        </div>
                        <FaChevronRight className="text-sm opacity-50 group-hover:opacity-80" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-full flex justify-center">
                  <h2 className="card-title text-3xl font-bold text-center">
                    {majorInfo.showTitle
                      ? majorInfo.title
                      : "Persönliche Daten"}
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
                      render={({ field }) => (
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
                      render={({ field }) => (
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
                        render={({ field }) => (
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
                        name="personalInfo.birthPlace"
                        rules={{
                          required: "Geburtsort ist erforderlich",
                        }}
                        render={({ field }) => (
                          <>
                            <label
                              className="label"
                              htmlFor="personalInfo-birthPlace"
                            >
                              <RequiredLabel className="label-text">
                                Geburtsort
                              </RequiredLabel>
                            </label>
                            <select
                              id="personalInfo-birthPlace"
                              className={`select select-bordered w-full ${
                                errors?.personalInfo?.birthPlace
                                  ? "select-error"
                                  : ""
                              }`}
                              aria-invalid={
                                errors?.personalInfo?.birthPlace
                                  ? "true"
                                  : "false"
                              }
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(String(e.target.value || ""))
                              }
                            >
                              <option value="">Bitte auswählen</option>
                              {UZBEK_REGIONS.map((region) => (
                                <option key={region} value={region}>
                                  {region}
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                      />
                      {errors?.personalInfo?.birthPlace ? (
                        <p className="text-error text-sm mt-1">
                          {errors.personalInfo.birthPlace.message}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <Controller
                        control={control}
                        name="personalInfo.maritalStatus"
                        rules={{ required: "Bitte Familienstand auswählen" }}
                        render={({ field }) => (
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
                        render={({ field }) => (
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
                      {photoSizeError ? (
                        <p className="text-error text-sm mt-1">
                          Foto ist zu groß. Komprimieren:{" "}
                          <a
                            className="link link-primary"
                            href="https://imagecompressor.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            imagecompressor.com
                          </a>
                        </p>
                      ) : null}
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
                                PLZ (Postleitzahl)
                              </RequiredLabel>
                            </label>
                            <input
                              id="personalInfo-addressPostalCode"
                              type="text"
                              inputMode="numeric"
                              placeholder="123456"
                              maxLength={6}
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
                                required: "PLZ (Postleitzahl) ist erforderlich",
                                validate: (v) =>
                                  /^\d{6}$/.test(String(v || "").trim()) ||
                                  "PLZ muss 6 Ziffern haben",
                                setValueAs: (v) =>
                                  String(v || "")
                                    .replace(/[^\d]/g, "")
                                    .slice(0, 6),
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
                            <select
                              id="personalInfo-addressCity"
                              className={`select select-bordered w-full ${
                                errors?.personalInfo?.addressCity
                                  ? "select-error"
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
                            >
                              <option value="">Bitte auswählen</option>
                              {UZBEK_REGIONS.map((region) => (
                                <option key={region} value={region}>
                                  {region}
                                </option>
                              ))}
                            </select>
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
                    languageOptions={LANGUAGE_OPTIONS}
                  />

                  <div className="divider">Führerschein</div>
                  <div className="grid grid-cols-1 gap-4">
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
                              setValue("personalInfo.drivingLicenseType", [], {
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
                          <Controller
                            control={control}
                            name="personalInfo.drivingLicenseType"
                            rules={{
                              validate: (v) => {
                                const has = Boolean(
                                  watch("personalInfo.hasDrivingLicense")
                                );
                                if (!has) return true;
                                const arr = Array.isArray(v)
                                  ? v
                                  : String(v || "")
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean);
                                if (!arr.length)
                                  return "Bitte mindestens eine Führerschein-Klasse auswählen.";
                                return true;
                              },
                            }}
                            render={({ field }) => {
                              const selected = Array.isArray(field.value)
                                ? field.value
                                : String(field.value || "")
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean);

                              const displayValue = selected.length
                                ? selected.join(", ")
                                : "Bitte auswählen";

                              function toggleOption(opt) {
                                const normalized = String(opt || "")
                                  .trim()
                                  .toUpperCase();
                                const set = new Set(
                                  selected.map((s) =>
                                    String(s || "")
                                      .trim()
                                      .toUpperCase()
                                  )
                                );
                                if (set.has(normalized)) {
                                  set.delete(normalized);
                                } else {
                                  set.add(normalized);
                                }
                                field.onChange(Array.from(set));
                              }

                              return (
                                <div
                                  ref={drivingLicenseDropdownRef}
                                  className={`dropdown w-full ${
                                    isDrivingLicenseDropdownOpen
                                      ? "dropdown-open"
                                      : ""
                                  }`}
                                >
                                  <label className="label">
                                    <span className="label-text">
                                      Führerschein-Klassen (mehrere möglich)
                                    </span>
                                  </label>

                                  <button
                                    type="button"
                                    className={`select select-bordered w-full flex items-center justify-between gap-3 ${
                                      errors?.personalInfo?.drivingLicenseType
                                        ? "select-error"
                                        : ""
                                    }`}
                                    aria-invalid={
                                      errors?.personalInfo?.drivingLicenseType
                                        ? "true"
                                        : "false"
                                    }
                                    aria-haspopup="listbox"
                                    aria-expanded={isDrivingLicenseDropdownOpen}
                                    onClick={() =>
                                      setIsDrivingLicenseDropdownOpen((p) => !p)
                                    }
                                  >
                                    <span
                                      className={
                                        selected.length
                                          ? "text-base-content"
                                          : "text-base-content/60"
                                      }
                                    >
                                      {displayValue}
                                    </span>
                                    <span className="text-base-content/60">
                                      ▾
                                    </span>
                                  </button>

                                  <ul
                                    className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full mt-1 max-h-72 overflow-auto z-60"
                                    role="listbox"
                                    aria-multiselectable="true"
                                  >
                                    {DRIVING_LICENSE_OPTIONS.map((opt) => {
                                      const upper = String(opt || "")
                                        .trim()
                                        .toUpperCase();
                                      const isSelected = selected
                                        .map((s) =>
                                          String(s || "")
                                            .trim()
                                            .toUpperCase()
                                        )
                                        .includes(upper);
                                      return (
                                        <li key={opt}>
                                          <button
                                            type="button"
                                            className="flex items-center gap-2"
                                            onClick={() => toggleOption(opt)}
                                          >
                                            <span className="w-5 text-center">
                                              {isSelected ? "✓" : ""}
                                            </span>
                                            <span className="font-medium">
                                              {opt}
                                            </span>
                                          </button>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              );
                            }}
                          />
                          {errors?.personalInfo?.drivingLicenseType ? (
                            <p className="text-error text-sm mt-1">
                              {errors.personalInfo.drivingLicenseType.message}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="divider">Dokumente</div>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Passport first (required) */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="label" htmlFor="doc-passport">
                          <RequiredLabel className="label-text">
                            Reisepass (PDF)
                          </RequiredLabel>
                        </label>
                        {Array.isArray(passportFiles) &&
                        passportFiles.length > 0 ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => setPassportFiles([])}
                          >
                            Alle entfernen
                          </button>
                        ) : null}
                      </div>
                      <p className="text-xs text-base-content/70 mb-2">
                        Falls kein Reisepass vorhanden ist, bitte
                        Personalausweis oder nationalen Pass (ID Card) als PDF
                        hochladen. Maximal 2 MB.
                      </p>
                      <input
                        id="doc-passport"
                        type="file"
                        accept=".pdf,application/pdf"
                        className={`file-input file-input-bordered w-full ${
                          passportError || passportSizeError
                            ? "file-input-error"
                            : ""
                        }`}
                        aria-invalid={
                          passportError || passportSizeError ? "true" : "false"
                        }
                        onChange={(e) => {
                          const raw = Array.from(e.target.files || []);
                          const pdfs = raw.filter(
                            (f) =>
                              String(f.type).toLowerCase() ===
                                "application/pdf" ||
                              /\.pdf$/i.test(String(f.name || ""))
                          );
                          const sized = pdfs.filter(
                            (f) => (f?.size || 0) <= MAX_PDF_BYTES
                          );
                          const tooBig = pdfs.length - sized.length;
                          const invalid = raw.length - pdfs.length;
                          if (invalid > 0) {
                            toast.error("Nur PDF-Dateien sind erlaubt.");
                          }
                          if (tooBig > 0) {
                            toast.error(
                              "PDF-Datei darf maximal 2 MB groß sein."
                            );
                            setPassportSizeError(true);
                          } else {
                            setPassportSizeError(false);
                          }
                          if (pdfs.length > 0) {
                            setPassportError(false);
                          }
                          setPassportFiles(sized.slice(0, 1));
                          e.target.value = "";
                        }}
                      />
                      {passportError ? (
                        <p className="text-error text-sm mt-1">
                          Reisepass oder Ausweis (PDF) erforderlich.
                        </p>
                      ) : null}
                      {passportSizeError ? (
                        <p className="text-error text-sm mt-1">
                          Datei &gt; 2 MB. Komprimieren:{" "}
                          <a
                            className="link link-primary"
                            href="https://www.ilovepdf.com/compress_pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            iLovePDF
                          </a>
                        </p>
                      ) : null}
                      {Array.isArray(passportFiles) &&
                      passportFiles.length > 0 ? (
                        <div className="mt-2">
                          <div className="text-xs opacity-70 mb-1">Nur PDF</div>
                          <ul className="space-y-2">
                            {passportFiles.map((f) => (
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
                                  onClick={() => setPassportFiles([])}
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

                    {/* Language certificates (optional but type required if provided) */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="label" htmlFor="doc-langcerts">
                          <span className="label-text">
                            Sprachzertifikate (optional, mehrere möglich)
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
                      <p className="text-xs text-base-content/70 mb-2">
                        Falls vorhanden: Laden Sie Sprachzertifikate als PDF hoch.
                      </p>
                      <p className="text-xs text-base-content/70 mb-2">
                        Maximal 2 MB pro Datei.
                      </p>
                      <input
                        id="doc-langcerts"
                        type="file"
                        multiple
                        accept=".pdf,application/pdf"
                        className={`file-input file-input-bordered w-full ${
                          langCertSizeError ? "file-input-error" : ""
                        }`}
                        aria-invalid={
                          langCertSizeError ? "true" : "false"
                        }
                        onChange={(e) => {
                          const raw = Array.from(e.target.files || []);
                          const pdfs = raw.filter(
                            (f) =>
                              String(f.type).toLowerCase() ===
                                "application/pdf" ||
                              /\.pdf$/i.test(String(f.name || ""))
                          );
                          const sized = pdfs.filter(
                            (f) => (f?.size || 0) <= MAX_PDF_BYTES
                          );
                          const tooBig = pdfs.length - sized.length;
                          const invalid = raw.length - pdfs.length;
                          if (invalid > 0) {
                            toast.error("Nur PDF-Dateien sind erlaubt.");
                          }
                          if (tooBig > 0) {
                            toast.error(
                              "PDF-Datei darf maximal 2 MB groß sein."
                            );
                            setLangCertSizeError(true);
                          } else {
                            setLangCertSizeError(false);
                          }
                          setLangCertFiles((prev) =>
                            mergeLangCertItems(prev, sized)
                          );
                          e.target.value = "";
                        }}
                      />
                      {langCertSizeError ? (
                        <p className="text-error text-sm mt-1">
                          Datei &gt; 2 MB. Komprimieren:{" "}
                          <a
                            className="link link-primary"
                            href="https://www.ilovepdf.com/compress_pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            iLovePDF
                          </a>
                        </p>
                      ) : null}
                      {Array.isArray(langCertFiles) &&
                      langCertFiles.length > 0 ? (
                        <div className="mt-2">
                          <div className="text-xs opacity-70 mb-1">Nur PDF</div>
                          <ul className="space-y-2">
                            {langCertFiles.map((item, i) => {
                              const file = item?.file || item;
                              return (
                                <li
                                  key={uniqueKey(file)}
                                  className="flex flex-col gap-2 rounded-box border border-base-300 px-3 py-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="truncate font-medium">
                                        {file.name}
                                      </div>
                                      <div className="text-xs opacity-70">
                                        {(file.size / 1024).toFixed(1)} KB
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-xs"
                                      onClick={() =>
                                        setLangCertFiles((prev) =>
                                          removeLangCertAt(prev, i)
                                        )
                                      }
                                      aria-label="Entfernen"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <div className="grid sm:grid-cols-2 gap-2 items-center">
                                    <label
                                      className="label py-0 sm:py-1"
                                      htmlFor={`langcert-type-${i}`}
                                    >
                                      <span className="label-text text-xs sm:text-sm">
                                        Zertifikat auswählen
                                      </span>
                                    </label>
                                    <select
                                      id={`langcert-type-${i}`}
                                      className={`select select-bordered w-full ${
                                        langCertTypeError &&
                                        !String(item?.type || "").trim()
                                          ? "select-error"
                                          : ""
                                      }`}
                                      aria-label="Typ des Sprachzertifikats"
                                      aria-invalid={
                                        langCertTypeError &&
                                        !String(item?.type || "").trim()
                                          ? "true"
                                          : "false"
                                      }
                                      value={item?.type || ""}
                                      onChange={(e) =>
                                        setLangCertFiles((prev) =>
                                          prev.map((entry, idx) =>
                                            idx === i
                                              ? {
                                                  ...entry,
                                                  type: e.target.value,
                                                }
                                              : entry
                                          )
                                        )
                                      }
                                    >
                                      <option value="">
                                        Zertifikat auswählen
                                      </option>
                                      {LANG_CERT_TYPES.map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  {langCertTypeError &&
                                  !String(item?.type || "").trim() ? (
                                    <p className="text-error text-sm">
                                      Bitte wählen Sie, zu welchem Zertifikat
                                      die Datei gehört.
                                    </p>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : null}
                    </div>

                    {/* Diplomas */}
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
                      <p className="text-xs text-base-content/70 mb-2">
                        Maximal 2 MB pro Datei.
                      </p>
                      <input
                        id="doc-diplomas"
                        type="file"
                        multiple
                        accept=".pdf,application/pdf"
                        className={`file-input file-input-bordered w-full ${
                          diplomaError || diplomaSizeError
                            ? "file-input-error"
                            : ""
                        }`}
                        aria-invalid={
                          diplomaError || diplomaSizeError ? "true" : "false"
                        }
                        onChange={(e) => {
                          const raw = Array.from(e.target.files || []);
                          const pdfs = raw.filter(
                            (f) =>
                              String(f.type).toLowerCase() ===
                                "application/pdf" ||
                              /\.pdf$/i.test(String(f.name || ""))
                          );
                          const sized = pdfs.filter(
                            (f) => (f?.size || 0) <= MAX_PDF_BYTES
                          );
                          const tooBig = pdfs.length - sized.length;
                          const invalid = raw.length - pdfs.length;
                          if (invalid > 0) {
                            toast.error("Nur PDF-Dateien sind erlaubt.");
                          }
                          if (tooBig > 0) {
                            toast.error(
                              "PDF-Datei darf maximal 2 MB groß sein."
                            );
                            setDiplomaSizeError(true);
                          } else {
                            setDiplomaSizeError(false);
                          }
                          if (pdfs.length > 0) {
                            setDiplomaError(false);
                          }
                          setDiplomaFiles((prev) => mergeFiles(prev, sized));
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
                      {diplomaSizeError ? (
                        <p className="text-error text-sm mt-1">
                          Datei &gt; 2 MB. Komprimieren:{" "}
                          <a
                            className="link link-primary"
                            href="https://www.ilovepdf.com/compress_pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            iLovePDF
                          </a>
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
                      disabled={
                        !watch("agreePrivacy") ||
                        isUploading ||
                        majorLoading ||
                        !majorInfo.collectionName
                      }
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
        onAcknowledge={() => {
          // After telling the user that this email was already used for a different area,
          // we mark the current major as "submitted" locally so they see the Thank You screen.
          const majorCollection = String(majorInfo?.collectionName || "").trim();
          if (majorCollection) {
            try {
              localStorage.setItem(
                `createCvSubmitted:${majorCollection}`,
                "true"
              );
              // legacy key cleanup (avoid cross-major false positives)
              localStorage.removeItem("createCvSubmitted");
            } catch {
              // ignore storage errors
            }
          }
          setIsEmailModalOpen(false);
          setIsSubmitted(true);
        }}
        enteredEmail={enteredEmail}
        existingMajor={existingMajor}
      />
    </div>
  );
}

export default Create;
