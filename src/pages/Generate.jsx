import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { doc, increment, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import {
  FaDownload,
  FaArrowLeft,
  FaExternalLinkAlt,
  FaSave,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { pdf } from "@react-pdf/renderer";
import CvPdfDocument from "./generate/pdf/CvPdfDocument";
import FormInput from "../components/FormInput";
import PhoneInputWithCountry from "../components/PhoneInputWithCountry";
import {
  getPhoneBodyDigits,
  isEmailValid,
  isPhoneComplete,
} from "../utils/validation";
import CountryNameCombobox from "../components/CountryNameCombobox";
import ExperienceSection from "../components/ExperienceSection";
import EducationSection from "../components/EducationSection";
import SkillsSection from "../components/SkillsSection";
import LanguagesSection from "../components/LanguagesSection";
import CollapsibleSection from "../components/CollapsibleSection";
import {
  deleteCandidateWithCurrentStats,
  deleteEmailRemote,
  deleteUploadedFilesRemote,
  getDocumentDataById,
  imageFileToBase64,
  toInputDate,
  fromInputDate,
  generateSkills,
  sortTimelineItemsDesc,
  updateDocument,
  updateCandidateWithCurrentStats,
  updateEmailRemote,
  getMetaByName,
  hasRichTextContent,
  commentHtmlToPlainText,
  DEFAULT_COMMENT_TEMPLATE_HTML,
} from "../utils";
import CandidateStatusStepper from "../components/CandidateStatusStepper";
import {
  CANDIDATE_STATUS_DEFAULT,
  CANDIDATE_STATUS_OPTIONS,
  getCandidateStatus,
  normalizeCandidateStatusValue,
} from "../constants/candidateStatus";
import {
  buildStatusEmailTemplate,
  getStatusEmailCopy,
} from "../utils/statusEmail";
import { sendBrevoEmail } from "../utils/brevo";
import RichTextEditor from "../components/RichTextEditor";
import { useUserRole } from "../hooks/useUserRole";
import DeleteCandidateModal from "../components/DeleteCandidateModal";
import PhotoModal from "./generate/components/modals/PhotoModal";
import StageEmailModal from "./generate/components/modals/StageEmailModal";
import CustomEmailModal from "./generate/components/modals/CustomEmailModal";
import LivePreview from "./generate/components/LivePreview";
import { UZBEK_REGIONS } from "../constants/uzbekRegions";
import { LANGUAGE_OPTIONS } from "../constants/languageOptions";
import {
  makeEmailTemplateId,
  subscribeToEmailTemplates,
  toCopyOverridesFromTemplateDoc,
} from "../utils/emailTemplates";

function safeJson(value, space = 2, maxLen = 120_000) {
  try {
    const s = JSON.stringify(value, null, space);
    if (typeof s === "string" && s.length > maxLen) {
      return `${s.slice(0, maxLen)}\n... (truncated ${
        s.length - maxLen
      } chars)`;
    }
    return s;
  } catch (e) {
    return `"(unserializable)" ${e?.message || ""}`.trim();
  }
}

function safeClone(value) {
  // structuredClone is not available in some environments (older browsers / webviews).
  // Our form state is plain JSON, so JSON clone is an acceptable fallback.
  try {
    if (typeof structuredClone === "function") return structuredClone(value);
  } catch {
    // ignore and fallback to JSON clone
  }
  return JSON.parse(JSON.stringify(value ?? null));
}

function toDateTimeLocalString(value) {
  if (!value) return "";
  function formatDateTimeLocalInTimeZone(date, timeZone) {
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(d.getTime())) return "";
      const formatter = new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone,
      });
      const parts = formatter.formatToParts(d).reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {});
      if (!parts.year || !parts.month || !parts.day || !parts.hour || !parts.minute) {
        return "";
      }
      return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
    } catch {
      return "";
    }
  }

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return "";
    // datetime-local: yyyy-mm-ddThh:mm
    // If it's already a plain datetime-local string (NO timezone info), keep as-is.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(s)) return s.slice(0, 16);
    // If it contains timezone (Z or +hh:mm/-hh:mm), normalize to Asia/Tashkent for the input.
    if (/[zZ]$/.test(s) || /[+\-]\d{2}:\d{2}$/.test(s)) {
      const out = formatDateTimeLocalInTimeZone(new Date(s), "Asia/Tashkent");
      if (out) return out;
    }
    // yyyy-mm-dd -> yyyy-mm-ddT00:00
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00`;
    // dd.mm.yyyy -> yyyy-mm-ddT00:00
    const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      return `${yyyy}-${mm}-${dd}T00:00`;
    }
    return "";
  }
  if (typeof value === "number") {
    // IMPORTANT: datetime-local expects *local wall time*; toISOString() is UTC and shifts time.
    // We standardize on Toshkent time for scheduling fields.
    return formatDateTimeLocalInTimeZone(new Date(value), "Asia/Tashkent");
  }
  return "";
}

function inferLinkType(link, fallback = "zoom") {
  const raw = String(link || "").toLowerCase();
  if (raw.includes("t.me/") || raw.includes("telegram")) return "telegram";
  return fallback;
}

function createEmptyStageInfo() {
  return {
    dateTime: "",
    link: "",
    linkType: "zoom",
    locationName: "",
    locationUrl: "",
  };
}

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

function parseGermanAddress(raw) {
  const normalized = String(raw || "")
    .replace(/\s*\n+\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!normalized) {
    return {
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      country: "",
    };
  }

  const parts = normalized
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  let streetLine = normalized;
  let postalCode = "";
  let city = "";
  let country = "";

  // If we have 3 parts like: "Street 1", "12345 Berlin", "Deutschland"
  if (parts.length >= 3) {
    const maybeCountry = parts[parts.length - 1];
    if (maybeCountry && !/\d/.test(maybeCountry)) {
      country = maybeCountry;
      streetLine = parts.slice(0, parts.length - 1).join(", ");
    }
  }

  // Split off postal code + city at the end, if present:
  // "... , 12345 Berlin" (DE) or "... , 150100 Farg‘ona" (UZ)
  // Create.jsx currently collects 6-digit codes, so we support both 5 and 6 digits
  // to avoid corrupt parsing ("1" leaking into house number, etc.).
  const mPlz = streetLine.match(/^(.*?)(?:,\s*)?(\d{5,6})\s+(.+)$/);
  if (mPlz) {
    streetLine = String(mPlz[1] || "")
      .trim()
      .replace(/,+\s*$/, "");
    postalCode = String(mPlz[2] || "").trim();
    city = String(mPlz[3] || "").trim();
  }

  let street = streetLine;
  let houseNumber = "";
  const mHouse = streetLine.match(/^(.*\D)\s+(\d+\w*)$/);
  if (mHouse) {
    street = String(mHouse[1] || "").trim();
    houseNumber = String(mHouse[2] || "").trim();
  }

  return { street, houseNumber, postalCode, city, country };
}

function isGermanAddressComplete(parts) {
  return (
    Boolean(String(parts?.street || "").trim()) &&
    Boolean(String(parts?.houseNumber || "").trim()) &&
    /^\d{5,6}$/.test(String(parts?.postalCode || "").trim()) &&
    Boolean(String(parts?.city || "").trim()) &&
    Boolean(String(parts?.country || "").trim())
  );
}

function Generate() {
  const { major, id } = useParams();
  const navigate = useNavigate();
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
  const [docCv, setDocCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusValue, setStatusValue] = useState(CANDIDATE_STATUS_DEFAULT);
  const [statusUpdatedAt, setStatusUpdatedAt] = useState(null);
  const [statusUpdatedBy, setStatusUpdatedBy] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [sendingStepValue, setSendingStepValue] = useState(null);
  const sendingEmailLockRef = useRef(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);

  const [metaInfo, setMetaInfo] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [resolvedMajor, setResolvedMajor] = useState({
    collectionName: "",
    title: "",
    linkId: "",
  });

  const { user } = useSelector((state) => state.auth);
  const { role: userRole } = useUserRole();

  const [isStageEmailModalOpen, setIsStageEmailModalOpen] = useState(false);
  const [pendingStageStep, setPendingStageStep] = useState(null);
  const [stageDecision, setStageDecision] = useState("accepted");
  const [stageAdditionalInfoForm, setStageAdditionalInfoForm] =
    useState(createEmptyStageInfo);
  const [emailTemplatesMap, setEmailTemplatesMap] = useState({});
  useEffect(() => {
    if (stageDecision === "rejected") {
      // Clear extra info when switching to rejection to avoid leaking previous data
      setStageAdditionalInfoForm(createEmptyStageInfo());
    }
  }, [stageDecision]);

  useEffect(() => {
    const isPrivileged = userRole === "super_admin" || userRole === "admin";
    if (!isPrivileged) {
      setEmailTemplatesMap({});
      return undefined;
    }
    // Live subscribe so newly saved templates in Settings are picked up instantly.
    const unsub = subscribeToEmailTemplates((map) => {
      setEmailTemplatesMap(map || {});
    });
    return () => unsub?.();
  }, [userRole]);

  const [isCustomEmailModalOpen, setIsCustomEmailModalOpen] = useState(false);
  const [customEmailForm, setCustomEmailForm] = useState({
    to: "",
    emailTitle: "Ariza holati yangilandi",
    subject: "",
    bodyText: "",
  });
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoModalSrc, setPhotoModalSrc] = useState("");

  const [isDrivingLicenseDropdownOpen, setIsDrivingLicenseDropdownOpen] =
    useState(false);
  const drivingLicenseDropdownRef = useRef(null);

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

  // Local editable state (Create.jsx like)
  const initialForm = useMemo(
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
        drivingLicenseType: "",
        phone: "",
        email: "",
        photo: "",
      },
      experience: [],
      education: [],
      skills: { softSkills: [], pcSkills: [], languages: {} },
      documents: { diplomas: [], certificates: [], passport: [] },
      commentar: "",
    }),
    []
  );
  const [formCv, setFormCv] = useState(initialForm);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showComment, setShowComment] = useState(true);
  const [showCommentDate, setShowCommentDate] = useState(true);
  const [isGeneratingSoft, setIsGeneratingSoft] = useState(false);
  const [isGeneratingPc, setIsGeneratingPc] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState({ soft: [], pc: [] });
  const [formInitialized, setFormInitialized] = useState(false);
  const [isCommentEditorOpen, setIsCommentEditorOpen] = useState(false);
  const [commentBaseline, setCommentBaseline] = useState("");
  const [commentMeta, setCommentMeta] = useState({
    updatedAt: null,
    updatedByName: "",
    updatedByPhoto: "",
    updatedByUid: "",
  });

  function getCommentHtml(obj) {
    return String(obj?.commentar || "");
  }

  function setCommentHtml(nextHtml) {
    const v = String(nextHtml || "");
    setFormCv((prev) => ({ ...prev, commentar: v }));
  }

  const [addressFields, setAddressFields] = useState(() =>
    parseGermanAddress(initialForm.personalInfo.address)
  );
  const lastSyncedAddressRef = useRef("");
  const internalAddressUpdateRef = useRef(false);

  function normalizeForm(form) {
    const safe = form || initialForm;
    const commentHtml = getCommentHtml(safe);
    const langEntries = Object.entries(safe?.skills?.languages || {}).filter(
      ([key]) => key !== undefined && key !== null
    );
    langEntries.sort(([a], [b]) =>
      String(a || "").localeCompare(String(b || ""), undefined, {
        sensitivity: "base",
      })
    );

    return {
      personalInfo: {
        name: String(safe?.personalInfo?.name || ""),
        lastName: String(safe?.personalInfo?.lastName || ""),
        gender: String(safe?.personalInfo?.gender || ""),
        address: String(safe?.personalInfo?.address || ""),
        birthDate: String(safe?.personalInfo?.birthDate || ""),
        birthPlace: String(safe?.personalInfo?.birthPlace || ""),
        maritalStatus: String(safe?.personalInfo?.maritalStatus || ""),
        childrenCount: String(safe?.personalInfo?.childrenCount || ""),
        noChildren: Boolean(safe?.personalInfo?.noChildren),
        hasDrivingLicense: Boolean(safe?.personalInfo?.hasDrivingLicense),
        drivingLicenseType: String(
          safe?.personalInfo?.drivingLicenseType || ""
        ).trim(),
        phone: String(safe?.personalInfo?.phone || ""),
        email: String(safe?.personalInfo?.email || ""),
        photo: String(safe?.personalInfo?.photo || ""),
      },
      experience: sortTimelineItemsDesc(
        Array.isArray(safe?.experience)
          ? safe.experience.map((exp) => ({
              startDate: String(exp?.startDate || ""),
              endDate: String(exp?.endDate || ""),
              position: String(exp?.position || ""),
              company: String(exp?.company || ""),
              location: String(exp?.location || ""),
              responsibilities: Array.isArray(exp?.responsibilities)
                ? exp.responsibilities.map((r) => String(r || ""))
                : [],
            }))
          : []
      ),
      education: sortTimelineItemsDesc(
        Array.isArray(safe?.education)
          ? safe.education.map((edu) => ({
              startDate: String(edu?.startDate || ""),
              endDate: String(edu?.endDate || ""),
              institution: String(edu?.institution || ""),
              degree: String(edu?.degree || ""),
            }))
          : []
      ),
      skills: {
        softSkills: Array.isArray(safe?.skills?.softSkills)
          ? safe.skills.softSkills.map((s) => String(s || ""))
          : [],
        pcSkills: Array.isArray(safe?.skills?.pcSkills)
          ? safe.skills.pcSkills.map((s) => String(s || ""))
          : [],
        languages: Object.fromEntries(
          langEntries.map(([k, v]) => [String(k), v])
        ),
      },
      documents: {
        diplomas: Array.isArray(safe?.documents?.diplomas)
          ? safe.documents.diplomas.map((d) => String(d || ""))
          : [],
        certificates: Array.isArray(safe?.documents?.certificates)
          ? safe.documents.certificates.map((c) => String(c || ""))
          : [],
        passport: Array.isArray(safe?.documents?.passport)
          ? safe.documents.passport.map((p) => String(p || ""))
          : [],
      },
      commentar: commentHtml,
    };
  }

  const isLimitedAdmin = userRole === "limited_admin";
  const commentHtml = useMemo(() => getCommentHtml(formCv), [formCv]);
  const hasComment = useMemo(
    () => hasRichTextContent(commentHtml),
    [commentHtml]
  );
  const commentChanged = useMemo(
    () => String(commentHtml || "") !== String(commentBaseline || ""),
    [commentHtml, commentBaseline]
  );

  const normalizedDocForm = useMemo(() => {
    if (!docCv) return null;
    return normalizeForm(mapDocToForm(docCv));
  }, [docCv]);

  const normalizedCurrentForm = useMemo(() => normalizeForm(formCv), [formCv]);

  const hasUnsavedChanges = useMemo(() => {
    if (!normalizedDocForm) return false;
    return (
      JSON.stringify(normalizedDocForm) !==
      JSON.stringify(normalizedCurrentForm)
    );
  }, [normalizedDocForm, normalizedCurrentForm]);

  function handleCancel() {
    if (!docCv) return;
    const mapped = mapDocToForm(docCv);
    setFormCv(normalizeForm(mapped));
    setCommentBaseline(getCommentHtml(mapped));
    setIsCommentEditorOpen(false);
    setRecentlyAdded({ soft: [], pc: [] });
  }

  useEffect(() => {
    const raw = String(formCv?.personalInfo?.address || "").trim();
    if (internalAddressUpdateRef.current) {
      internalAddressUpdateRef.current = false;
      lastSyncedAddressRef.current = raw;
      return;
    }
    if (raw === lastSyncedAddressRef.current) return;
    lastSyncedAddressRef.current = raw;
    setAddressFields(parseGermanAddress(raw));
  }, [formCv?.personalInfo?.address]);

  function applyAddressFields(nextFields) {
    setAddressFields(nextFields);
    const formatted = formatGermanAddress(nextFields);
    internalAddressUpdateRef.current = true;
    setFormCv((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, address: formatted },
    }));
  }

  useEffect(() => {
    const key = String(major || "").trim();
    let cancelled = false;
    setMetaLoading(true);
    (async () => {
      try {
        if (!key) {
          setResolvedMajor({ collectionName: "", title: "", linkId: "" });
          setMetaInfo(null);
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await getMetaByName(key);
        if (cancelled) return;
        if (data) {
          setResolvedMajor({
            collectionName:
              data.collectionName || data.slug || data.name || key,
            title: data.title || data.collectionName || key,
            linkId: data.linkId || data.uuid || data.id || key,
          });
          setMetaInfo(data || null);
        } else {
          setResolvedMajor({
            collectionName: key,
            title: key,
            linkId: key,
          });
          setMetaInfo(null);
        }
      } catch (e) {
        if (!cancelled) {
          setResolvedMajor({
            collectionName: key,
            title: key,
            linkId: key,
          });
          setMetaInfo(null);
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [major]);

  useEffect(() => {
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) {
      setNotFound(true);
      setLoading(false);
      return undefined;
    }
    const ref = doc(db, col, docId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          setDocCv(null);
        } else {
          const data = snap.data() || null;
          const status = data?.status || {};
          setStatusValue(
            normalizeCandidateStatusValue(
              status?.value || CANDIDATE_STATUS_DEFAULT
            ) || CANDIDATE_STATUS_DEFAULT
          );
          setStatusUpdatedAt(status?.updatedAt || null);
          setStatusUpdatedBy(status?.updatedBy || "");
          setDocCv(data);
          const cMeta = data?.commentarMeta || {};
          setCommentMeta({
            updatedAt: cMeta?.updatedAt || null,
            updatedByName: cMeta?.updatedByName || "",
            updatedByPhoto: cMeta?.updatedByPhoto || "",
            updatedByUid: cMeta?.updatedByUid || "",
          });
          setNotFound(false);
          if (!formInitialized) {
            const mapped = mapDocToForm(data);
            setFormCv(normalizeForm(mapped));
            setFormInitialized(true);
          }
        }
        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [resolvedMajor.collectionName, id, formInitialized]);

  function mapDocToForm(data) {
    const p = data?.persoenlicheDaten || {};
    const rawLicense = p?.fuehrerschein;
    const rawLicenseType = p?.fuehrerscheinTyp;
    const licenseTypeFromLegacy =
      typeof rawLicense === "string" &&
      rawLicense &&
      !["ja", "true", "nein", "false"].includes(
        String(rawLicense).trim().toLowerCase()
      )
        ? String(rawLicense).trim()
        : "";
    const hasDrivingLicense =
      rawLicense === true ||
      rawLicense === 1 ||
      String(rawLicense || "")
        .trim()
        .toLowerCase() === "ja" ||
      String(rawLicense || "")
        .trim()
        .toLowerCase() === "true" ||
      Boolean(String(rawLicenseType || "").trim()) ||
      Boolean(licenseTypeFromLegacy);
    const drivingLicenseType = String(
      rawLicenseType || licenseTypeFromLegacy || ""
    )
      .trim()
      .toUpperCase();
    const berufe = Array.isArray(data?.berufserfahrung)
      ? data.berufserfahrung
      : [];
    const ausb = Array.isArray(data?.ausbildung) ? data.ausbildung : [];
    const f = data?.faehigkeiten || {};
    const d = data?.dokumente || {};
    const att = data?.attachments || {};

    let diplomas = [];
    if (Array.isArray(d?.diplome)) {
      diplomas = d.diplome;
    } else if (Array.isArray(att?.diplomas)) {
      diplomas = att.diplomas;
    }

    let certificates = [];
    if (Array.isArray(d?.zertifikate)) {
      certificates = d.zertifikate;
    } else if (Array.isArray(att?.languageCertificates)) {
      certificates = att.languageCertificates;
    }

    const passportCandidates = [
      att?.passport,
      ...(Array.isArray(att?.passports) ? att.passports : []),
      d?.reisepass,
      d?.passport,
      ...(Array.isArray(d?.reisepaesse) ? d.reisepaesse : []),
      ...(Array.isArray(d?.passports) ? d.passports : []),
      (data?.documents || {})?.passport,
      ...(Array.isArray((data?.documents || {})?.passports)
        ? (data?.documents || {})?.passports
        : []),
    ];
    const passport = passportCandidates
      .flatMap((p) => (Array.isArray(p) ? p : [p]))
      .map((p) => String(p || "").trim())
      .filter(Boolean);
    // Dedupe (some docs store the same URL in multiple legacy fields)
    const seenPassport = new Set();
    const passportUnique = passport.filter((u) => {
      if (seenPassport.has(u)) return false;
      seenPassport.add(u);
      return true;
    });

    const rawChildrenCount = String(p.kinderAnzahl ?? "").trim();
    const noChildrenFromDoc = Boolean(p.keinKinder);
    const inferredNoChildren =
      noChildrenFromDoc || rawChildrenCount === "" || rawChildrenCount === "0";
    const childrenCount = inferredNoChildren ? "" : rawChildrenCount;

    return {
      personalInfo: {
        name: String(p.name || ""),
        lastName: String(p.nachname || ""),
        gender: String(p.geschlecht || ""),
        address: String(p.adresse || ""),
        birthDate: String(p.geburtsdatum || ""),
        birthPlace: String(p.geburtsort || ""),
        maritalStatus: String(p.familienstand || ""),
        childrenCount,
        noChildren: inferredNoChildren,
        hasDrivingLicense,
        drivingLicenseType,
        phone: String(p.telefon || ""),
        email: String(p.email || ""),
        photo: String(p.foto || ""),
      },
      experience: berufe.map((b) => ({
        startDate: String(b?.beginn || ""),
        endDate: String(b?.ende || ""),
        position: String(b?.position || ""),
        company: String(b?.unternehmen || ""),
        location: String(b?.ort || ""),
        responsibilities: Array.isArray(b?.aufgaben) ? b.aufgaben : [],
      })),
      education: ausb.map((a) => ({
        startDate: String(a?.beginn || ""),
        endDate: String(a?.ende || ""),
        institution: String(a?.bildungseinrichtung || ""),
        degree: String(a?.abschluss || ""),
      })),
      skills: {
        softSkills: Array.isArray(f?.sozialkompetenzen)
          ? f.sozialkompetenzen
          : [],
        pcSkills: Array.isArray(f?.pcKenntnisse) ? f.pcKenntnisse : [],
        languages:
          typeof f?.sprachen === "object" && f?.sprachen !== null
            ? f.sprachen
            : {},
      },
      documents: {
        diplomas,
        certificates,
        passport: passportUnique,
      },
      commentar: String(data?.commentar || ""),
    };
  }

  function mapFormToDoc(f) {
    const noChildren = Boolean(f?.personalInfo?.noChildren);
    return {
      persoenlicheDaten: {
        name: f.personalInfo.name,
        nachname: f.personalInfo.lastName,
        geschlecht: f.personalInfo.gender,
        adresse: f.personalInfo.address,
        geburtsdatum: f.personalInfo.birthDate,
        geburtsort: String(f?.personalInfo?.birthPlace || "").trim(),
        familienstand: f.personalInfo.maritalStatus,
        kinderAnzahl: noChildren
          ? ""
          : String(f.personalInfo.childrenCount || ""),
        keinKinder: noChildren,
        fuehrerschein: Boolean(f?.personalInfo?.hasDrivingLicense),
        fuehrerscheinTyp: String(f?.personalInfo?.drivingLicenseType || "")
          .trim()
          .toUpperCase(),
        telefon: f.personalInfo.phone,
        email: f.personalInfo.email,
        foto: f.personalInfo.photo,
      },
      berufserfahrung: Array.isArray(f.experience)
        ? f.experience.map((exp) => ({
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
      ausbildung: Array.isArray(f.education)
        ? f.education.map((edu) => ({
            beginn: edu.startDate,
            ende: edu.endDate,
            bildungseinrichtung: edu.institution,
            abschluss: edu.degree || "",
          }))
        : [],
      faehigkeiten: {
        sozialkompetenzen: f.skills?.softSkills || [],
        pcKenntnisse: f.skills?.pcSkills || [],
        sprachen: f.skills?.languages || {},
      },
      dokumente: {
        diplome: f.documents?.diplomas || [],
        zertifikate: f.documents?.certificates || [],
        reisepass: f.documents?.passport || [],
        reisepaesse: Array.isArray(f.documents?.passport)
          ? f.documents.passport
          : [],
      },
      documents: {
        diplomas: f.documents?.diplomas || [],
        certificates: f.documents?.certificates || [],
        passport: Array.isArray(f.documents?.passport)
          ? f.documents.passport
          : f.documents?.passport
          ? [f.documents.passport]
          : [],
      },
      commentar: String(getCommentHtml(f) || ""),
    };
  }

  // PDF export UI/logic extracted to `src/pages/generate/pdf/CvPdfDocument.jsx`

  async function handlePhotoFileChange(e) {
    if (isLimitedAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await imageFileToBase64(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.9,
        mimeType: "image/jpeg",
      });
      setFormCv((prev) => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, photo: base64 },
      }));
    } catch (err) {
      console.error(err);
    }
  }

  // Experience handlers
  function addExperience() {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const next = [
        ...(Array.isArray(prev.experience) ? prev.experience : []),
        {
          startDate: "",
          endDate: "",
          position: "",
          company: "",
          location: "",
          responsibilities: [],
        },
      ];
      return { ...prev, experience: sortTimelineItemsDesc(next) };
    });
  }
  function updateExperience(idx, field, value) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const next = [...prev.experience];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, experience: sortTimelineItemsDesc(next) };
    });
  }
  function removeExperience(idx) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const next = prev.experience.filter((_, i) => i !== idx);
      return { ...prev, experience: sortTimelineItemsDesc(next) };
    });
  }
  function addResponsibility(expIdx, text) {
    if (isLimitedAdmin) return;
    if (!text?.trim()) return;
    setFormCv((prev) => {
      const next = [...prev.experience];
      const resp = [...next[expIdx].responsibilities, text.trim()];
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }
  function removeResponsibility(expIdx, respIdx) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const next = [...prev.experience];
      const resp = next[expIdx].responsibilities.filter(
        (_, i) => i !== respIdx
      );
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }

  // Education handlers
  function addEducation() {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const next = [
        ...(Array.isArray(prev.education) ? prev.education : []),
        { startDate: "", endDate: "", institution: "", degree: "" },
      ];
      return { ...prev, education: sortTimelineItemsDesc(next) };
    });
  }
  function updateEducation(idx, field, value) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const next = [...prev.education];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, education: sortTimelineItemsDesc(next) };
    });
  }
  function removeEducation(idx) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const next = prev.education.filter((_, i) => i !== idx);
      return { ...prev, education: sortTimelineItemsDesc(next) };
    });
  }

  // Skills handlers
  function addTag(path, value) {
    if (isLimitedAdmin) return;
    if (!value?.trim()) return;
    setFormCv((prev) => {
      const draft = safeClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
      const key = path[path.length - 1];
      target[key] = [...target[key], value.trim()];
      return draft;
    });
  }
  function removeTag(path, index) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const draft = safeClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
      const key = path[path.length - 1];
      target[key] = target[key].filter((_, i) => i !== index);
      return draft;
    });
  }
  async function autoAddSkills(kind) {
    if (isLimitedAdmin) return;
    if (kind === "soft") setIsGeneratingSoft(true);
    else setIsGeneratingPc(true);
    try {
      const generated = generateSkills(formCv, kind);
      if (generated.length) {
        if (kind === "soft") {
          setFormCv((prev) => ({
            ...prev,
            skills: {
              ...prev.skills,
              softSkills: [...prev.skills.softSkills, ...generated],
            },
          }));
          setRecentlyAdded((p) => ({ ...p, soft: generated }));
        } else {
          setFormCv((prev) => ({
            ...prev,
            skills: {
              ...prev.skills,
              pcSkills: [...prev.skills.pcSkills, ...generated],
            },
          }));
          setRecentlyAdded((p) => ({ ...p, pc: generated }));
        }
      } else {
        setRecentlyAdded((p) =>
          kind === "soft" ? { ...p, soft: [] } : { ...p, pc: [] }
        );
      }
    } finally {
      if (kind === "soft") setIsGeneratingSoft(false);
      else setIsGeneratingPc(false);
    }
  }

  // Languages handlers
  const languageRows = useMemo(
    () =>
      Object.entries(formCv.skills.languages).map(([name, level]) => ({
        name,
        level,
      })),
    [formCv.skills.languages]
  );
  const experienceCount = Array.isArray(formCv.experience)
    ? formCv.experience.length
    : 0;
  const educationCount = Array.isArray(formCv.education)
    ? formCv.education.length
    : 0;
  const languagesCount = Array.isArray(languageRows) ? languageRows.length : 0;
  const documentsCount =
    (Array.isArray(formCv.documents?.diplomas)
      ? formCv.documents.diplomas.length
      : 0) +
    (Array.isArray(formCv.documents?.certificates)
      ? formCv.documents.certificates.length
      : 0) +
    (Array.isArray(formCv.documents?.passport)
      ? formCv.documents.passport.length
      : 0);
  function addLanguageRow() {
    if (isLimitedAdmin) return;
    setFormCv((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        languages: { ...prev.skills.languages, "": "A1" },
      },
    }));
  }
  function updateLanguageRow(rowIdx, field, value) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const entries = Object.entries(prev.skills.languages);
      const [oldName, oldLevel] = entries[rowIdx] || ["", "A1"];
      let next = [...entries];
      if (field === "name") next[rowIdx] = [value, oldLevel];
      else next[rowIdx] = [oldName, value];
      const nextObj = Object.fromEntries(
        next.filter(
          ([k]) => k !== "" || (k === "" && field === "name" && value !== "")
        )
      );
      return { ...prev, skills: { ...prev.skills, languages: nextObj } };
    });
  }
  function removeLanguageRow(rowIdx) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const entries = Object.entries(prev.skills.languages).filter(
        (_, i) => i !== rowIdx
      );
      return {
        ...prev,
        skills: { ...prev.skills, languages: Object.fromEntries(entries) },
      };
    });
  }

  async function persistStatus(targetValue, { silent = false } = {}) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, den Status zu ändern.");
      return false;
    }
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return false;

    try {
      setIsSavingStatus(true);
      const now = Date.now();
      const statusMeta = getCandidateStatus(targetValue);
      await updateDocument(col, docId, {
        status: {
          value: targetValue,
          label: statusMeta.label,
          updatedAt: now,
          updatedBy: user?.email || user?.uid || "admin",
        },
      });
      setStatusValue(targetValue);
      setStatusUpdatedAt(now);
      setStatusUpdatedBy(user?.email || user?.uid || "admin");
      if (!silent) {
        toast.success("Status gespeichert.");
      }
      return true;
    } catch (err) {
      console.error(err);
      if (!silent) {
        toast.error("Fehler beim Speichern des Status.");
      }
      return false;
    } finally {
      setIsSavingStatus(false);
    }
  }

  async function handleStatusSave() {
    await persistStatus(statusValue, { silent: false });
  }

  function getNextStepValue(value) {
    const steps = CANDIDATE_STATUS_OPTIONS;
    const idx = steps.findIndex((s) => s.value === value);
    if (idx === -1) return null;
    return steps[idx + 1]?.value || null;
  }

  async function sendStatusEmail(
    stepValue,
    { stageDecision: decisionRaw, decisionNote, additionalInfo } = {}
  ) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, E-Mails zu senden.");
      return;
    }
    if (stepValue !== statusValue) {
      toast.error("E-Mails können nur für die aktuelle Stufe gesendet werden.");
      return;
    }
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;

    const recipientEmail = String(formCv.personalInfo.email || "").trim();
    if (!recipientEmail) {
      toast.error("E-Mail-Adresse des Kandidaten wurde nicht gefunden.");
      return;
    }

    if (sendingEmailLockRef.current) {
      toast("E-Mail wird gesendet, bitte warten...");
      return;
    }

    sendingEmailLockRef.current = true;
    setSendingStepValue(stepValue);

    try {
      const normalizedDecision =
        decisionRaw === "rejected" ? "rejected" : "accepted";

      const emailSentAt = Date.now();
      const info =
        normalizedDecision === "accepted"
          ? stepValue === "stage_2"
            ? createEmptyStageInfo()
            : normalizeStageFormInfo(additionalInfo)
          : createEmptyStageInfo();

      if (normalizedDecision === "accepted" && stepValue !== "stage_2") {
        const hasLink = Boolean(info.link);
        const hasLocation = Boolean(info.locationName || info.locationUrl);
        if (!info.dateTime) {
          toast.error("Datum/Uhrzeit fehlt.");
          return;
        }
        if (!hasLink && !hasLocation) {
          toast.error("Bitte Link oder Standort angeben.");
          return;
        }
      }

      const templateId = makeEmailTemplateId(stepValue, normalizedDecision);
      const templateDoc = emailTemplatesMap?.[templateId] || null;
      const copyOverrides =
        toCopyOverridesFromTemplateDoc(templateDoc) || undefined;

      const { subject, message, htmlContent } = buildStatusEmailTemplate({
        statusValue: stepValue,
        firstName: formCv.personalInfo.name,
        lastName: formCv.personalInfo.lastName,
        stageDecision: normalizedDecision,
        decisionNote,
        additionalInfo: info,
        copyOverrides,
      });
      const res = await sendBrevoEmail({
        to: recipientEmail,
        subject,
        message,
        htmlContent,
      });
      if (res?.success === false) {
        throw new Error("Email yuborilmadi (success=false).");
      }

      toast.success("Status-E-Mail wurde gesendet.");

      // Best-effort: store email send counters for list view (CollectionCv)
      try {
        const stageBase = `stageMeta.${stepValue}`;
        await updateDocument(col, docId, {
          "emailMeta.count": increment(1),
          "emailMeta.lastSentAt": emailSentAt,
          "emailMeta.lastSentBy": user?.email || user?.uid || "admin",
          "emailMeta.lastSentType": "status",
          "emailMeta.lastSentStage": stepValue,
          "emailMeta.lastSentDecision": normalizedDecision,
          [`${stageBase}.decision`]: normalizedDecision,
          [`${stageBase}.decidedAt`]: emailSentAt,
          [`${stageBase}.decidedBy`]: user?.email || user?.uid || "admin",
          [`${stageBase}.decisionNote`]: String(decisionNote || "").trim(),
        });
      } catch (e) {
        console.error("emailMeta update failed:", e);
      }

      if (normalizedDecision === "accepted") {
        const nextValue = getNextStepValue(stepValue) || stepValue;
        await persistStatus(nextValue, { silent: true });
        setStatusValue(nextValue);
      }

      setPendingStageStep(null);
      setIsStageEmailModalOpen(false);

      if (normalizedDecision === "rejected") {
        const itemId = String(id || "").trim();
        const targetEmail = String(formCv?.personalInfo?.email || "").trim();
        const firstName = String(formCv?.personalInfo?.name || "").trim();
        const lastName = String(formCv?.personalInfo?.lastName || "").trim();
        const targetName = [firstName, lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (itemId) {
          setDeleteTarget({
            id: itemId,
            email: targetEmail,
            name: targetName,
          });
          setDeleteModalOpen(true);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Senden der E-Mail. Bitte später erneut versuchen.");
    } finally {
      setSendingStepValue(null);
      sendingEmailLockRef.current = false;
    }
  }

  function closeDeleteModal() {
    if (isDeletingCandidate) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  }

  async function confirmDeleteCandidate() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Kandidaten zu löschen.");
      return;
    }
    const colName = String(resolvedMajor?.collectionName || "").trim();
    const itemId = String(deleteTarget?.id || "").trim();
    if (!colName || !itemId) return;
    try {
      setIsDeletingCandidate(true);

      // 0) Load full candidate doc so we can delete uploaded documents as well
      const full = await getDocumentDataById(colName, itemId);
      const att = full?.attachments || {};
      const docs = full?.documents || {};
      const urls = [
        ...(Array.isArray(att?.diplomas) ? att.diplomas : []),
        ...(Array.isArray(att?.languageCertificates)
          ? att.languageCertificates
          : []),
        ...(Array.isArray(att?.certificates) ? att.certificates : []),
        ...(Array.isArray(docs?.diplomas) ? docs.diplomas : []),
        ...(Array.isArray(docs?.certificates) ? docs.certificates : []),
        ...(Array.isArray(att?.passports) ? att.passports : []),
        ...(Array.isArray(att?.passport)
          ? att.passport
          : [att?.passport]
        ).filter(Boolean),
        ...(Array.isArray(docs?.passport)
          ? docs.passport
          : [docs?.passport]
        ).filter(Boolean),
        ...(Array.isArray(docs?.passports) ? docs.passports : []),
        ...(Array.isArray(full?.dokumente?.reisepaesse)
          ? full.dokumente.reisepaesse
          : []),
        ...(Array.isArray(full?.dokumente?.reisepass)
          ? full.dokumente.reisepass
          : [full?.dokumente?.reisepass]
        ).filter(Boolean),
      ];
      if (urls.length > 0) {
        await deleteUploadedFilesRemote(urls);
      }

      // 1) Delete candidate email from external API
      const emailFromDoc = String(full?.persoenlicheDaten?.email || "").trim();
      const targetEmail = String(deleteTarget?.email || emailFromDoc || "")
        .trim()
        .toLowerCase();
      if (targetEmail) {
        await deleteEmailRemote(targetEmail);
      }

      // 2) Delete from Firestore + update LIVE stats (current only)
      await deleteCandidateWithCurrentStats(colName, itemId, {
        majorLabel: resolvedMajor?.title || colName,
      });

      toast.success("Kandidat wurde gelöscht.");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      navigate(`/collectionCv/${resolvedMajor?.linkId || major}`);
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Löschen.");
    } finally {
      setIsDeletingCandidate(false);
    }
  }

  function splitCustomEmailBody(raw) {
    const normalized = String(raw || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
    // first blank line separates main vs note
    const parts = normalized.split(/\n\s*\n/);
    const main = String(parts[0] || "").trim();
    const note = parts.slice(1).join("\n\n").trim();
    return {
      mainText: main,
      nextStepNote: note,
      hasMain: Boolean(main),
      hasNote: Boolean(note),
    };
  }

  async function sendCustomEmail({ to, emailTitle, subject, bodyText }) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, E-Mails zu senden.");
      return;
    }
    const recipientEmail = String(to || "").trim();
    if (!recipientEmail) {
      toast.error("Empfänger-E-Mail (To) ist nicht ausgefüllt.");
      return;
    }
    const safeStatusValue =
      String(statusValue || "").trim() || CANDIDATE_STATUS_DEFAULT;
    const safeDecision = "accepted";

    const firstName = String(formCv.personalInfo.name || "");
    const lastName = String(formCv.personalInfo.lastName || "");

    const additionalInfo = getStageAdditionalInfo(safeStatusValue);

    const { mainText, nextStepNote, hasMain, hasNote } =
      splitCustomEmailBody(bodyText);

    if (!hasMain) {
      toast.error(
        "Im Textbereich muss mindestens 1 Absatz (Haupttext) enthalten sein."
      );
      return;
    }
    const subjectRaw = String(subject || "").trim();
    if (!subjectRaw) {
      toast.error("Betreff ist nicht ausgefüllt.");
      return;
    }

    const copyOverrides = {
      emailTitle: String(emailTitle || "").trim()
        ? String(emailTitle)
        : undefined,
      subject: subjectRaw,
      // Custom email: DO NOT fallback to stage defaults
      mainText,
      nextStepNote: hasNote ? nextStepNote : "",
      emphasizeMainText: false,
    };

    const {
      subject: builtSubject,
      message,
      htmlContent,
    } = buildStatusEmailTemplate({
      statusValue: safeStatusValue,
      firstName,
      lastName,
      stageDecision: safeDecision,
      decisionNote: "",
      additionalInfo,
      copyOverrides,
    });

    const safeSubject = String(builtSubject || "").trim();
    if (!safeSubject) {
      toast.error("Betreff ist nicht ausgefüllt.");
      return;
    }

    if (sendingEmailLockRef.current) {
      toast("E-Mail wird gesendet, bitte warten...");
      return;
    }

    sendingEmailLockRef.current = true;
    setSendingStepValue("custom");
    try {
      const emailSentAt = Date.now();
      const finalMessage = stripStatusLineFromCustomEmail(message);
      const finalHtml = stripStatusLineFromCustomEmail(htmlContent);
      const res = await sendBrevoEmail({
        to: recipientEmail,
        subject: safeSubject,
        message: finalMessage,
        htmlContent: finalHtml || undefined,
      });
      if (res?.success === false) {
        throw new Error("Email yuborilmadi (success=false).");
      }
      toast.success("Benutzerdefinierte E-Mail wurde gesendet.");

      // Best-effort: store email send counters for list view (CollectionCv)
      try {
        const col = String(resolvedMajor?.collectionName || "").trim();
        const docId = String(id || "").trim();
        if (col && docId) {
          await updateDocument(col, docId, {
            "emailMeta.count": increment(1),
            "emailMeta.lastSentAt": emailSentAt,
            "emailMeta.lastSentBy": user?.email || user?.uid || "admin",
            "emailMeta.lastSentType": "custom",
          });
        }
      } catch (e) {
        console.error("emailMeta update failed:", e);
      }

      setIsCustomEmailModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(
        "Fehler beim Senden der benutzerdefinierten E-Mail. Bitte später erneut versuchen."
      );
    } finally {
      setSendingStepValue(null);
      sendingEmailLockRef.current = false;
    }
  }

  async function resetCandidateStages() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, die Stufen zurückzusetzen.");
      return;
    }
    if (sendingEmailLockRef.current || sendingStepValue) {
      toast("E-Mail-Vorgang läuft, bitte warten...");
      return;
    }
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;

    const ok = window.confirm(
      "Kandidat bosqichi boshidan (1-bosqich) boshlansinmi?\n\nEslatma: email hisoblagichi ham 0 ga tushiriladi."
    );
    if (!ok) return;

    try {
      const now = Date.now();
      const statusMeta = getCandidateStatus(CANDIDATE_STATUS_DEFAULT);
      await updateDocument(col, docId, {
        status: {
          value: CANDIDATE_STATUS_DEFAULT,
          label: statusMeta.label,
          updatedAt: now,
          updatedBy: user?.email || user?.uid || "admin",
        },
        emailMeta: {
          count: 0,
          lastSentAt: null,
          lastSentBy: null,
          lastSentType: null,
          lastSentStage: null,
          resetAt: now,
          resetBy: user?.email || user?.uid || "admin",
        },
      });
      setStatusValue(CANDIDATE_STATUS_DEFAULT);
      setStatusUpdatedAt(now);
      setStatusUpdatedBy(user?.email || user?.uid || "admin");
      toast.success("Stufen wurden zurückgesetzt.");
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Zurücksetzen der Stufen.");
    }
  }

  function getStageAdditionalInfo(stepValue) {
    const v = String(stepValue || "").trim();
    const normalizeInterview = (obj) => {
      const rawType = String(obj?.linkType || "").toLowerCase();
      const resolvedType =
        rawType === "telegram" ? "telegram" : inferLinkType(obj?.link, "zoom");
      return {
        dateTime: String(obj?.date || ""),
        link: String(obj?.link || ""),
        linkType: resolvedType,
        locationName: String(obj?.locationName || ""),
        locationUrl: String(obj?.locationUrl || ""),
      };
    };
    if (v === "stage_1") {
      return normalizeInterview(metaInfo?.interviewInternal);
    }
    if (v === "stage_3") {
      return normalizeInterview(metaInfo?.interviewEmployer);
    }
    return createEmptyStageInfo();
  }

  function normalizeStageFormInfo(raw) {
    const link = String(raw?.link || "").trim();
    const linkType =
      raw?.linkType === "telegram" ? "telegram" : inferLinkType(link, "zoom");
    const locationUrl = String(raw?.locationUrl || "").trim();
    const locationNameRaw = String(raw?.locationName || "").trim();
    const locationName = locationNameRaw || locationUrl;
    return {
      dateTime: String(raw?.dateTime || "").trim(),
      link,
      linkType,
      locationName,
      locationUrl,
    };
  }

  function handleSendStatusEmail(stepValue) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, E-Mails zu senden.");
      return;
    }
    if (stepValue !== statusValue) {
      toast.error("E-Mails können nur für die aktuelle Stufe gesendet werden.");
      return;
    }
    const initialInfo = getStageAdditionalInfo(stepValue);
    setPendingStageStep(stepValue);
    setStageDecision("accepted");
    setStageAdditionalInfoForm({
      dateTime: toDateTimeLocalString(initialInfo?.dateTime),
      link: String(initialInfo?.link || ""),
      linkType:
        initialInfo?.linkType === "telegram"
          ? "telegram"
          : inferLinkType(initialInfo?.link, "zoom"),
      locationName: String(initialInfo?.locationName || ""),
      locationUrl: String(initialInfo?.locationUrl || ""),
    });
    setIsStageEmailModalOpen(true);
  }

  function closeStageEmailModal() {
    setIsStageEmailModalOpen(false);
    setPendingStageStep(null);
  }

  function openCustomEmailModal() {
    const recipientEmail = String(formCv.personalInfo.email || "").trim();
    // Start clean (inputs empty), placeholders + preview show defaults.
    setCustomEmailForm({
      to: recipientEmail,
      emailTitle: "",
      subject: "",
      bodyText: "",
    });
    setIsCustomEmailModalOpen(true);
  }

  function closeCustomEmailModal() {
    setIsCustomEmailModalOpen(false);
  }

  async function handleCustomEmailSubmit(e) {
    e?.preventDefault();
    await sendCustomEmail(customEmailForm);
  }

  async function handleStageEmailSubmit(e) {
    e?.preventDefault();
    if (!pendingStageStep) {
      setIsStageEmailModalOpen(false);
      return;
    }
    const info =
      pendingStageStep === "stage_2"
        ? createEmptyStageInfo()
        : normalizeStageFormInfo(stageAdditionalInfoForm);
    await sendStatusEmail(pendingStageStep, {
      stageDecision,
      additionalInfo: info,
    });
  }

  const stageEmailPreview = useMemo(() => {
    if (!pendingStageStep) return null;
    const recipientEmail = String(formCv.personalInfo.email || "").trim();
    const normalizedDecision =
      stageDecision === "rejected" ? "rejected" : "accepted";
    const info =
      normalizedDecision === "accepted"
        ? pendingStageStep === "stage_2"
          ? createEmptyStageInfo()
          : normalizeStageFormInfo(stageAdditionalInfoForm)
        : createEmptyStageInfo();
    try {
      const templateId = makeEmailTemplateId(pendingStageStep, normalizedDecision);
      const templateDoc = emailTemplatesMap?.[templateId] || null;
      const copyOverrides =
        toCopyOverridesFromTemplateDoc(templateDoc) || undefined;

      const { subject, message, htmlContent } = buildStatusEmailTemplate({
        statusValue: pendingStageStep,
        firstName: formCv.personalInfo.name,
        lastName: formCv.personalInfo.lastName,
        stageDecision: normalizedDecision,
        decisionNote: "",
        additionalInfo: info,
        copyOverrides,
      });
      return {
        to: recipientEmail,
        subject,
        message,
        htmlContent,
      };
    } catch (err) {
      console.error("stageEmailPreview error:", err);
      return {
        to: recipientEmail,
        subject: "",
        message: "",
        htmlContent: "",
      };
    }
  }, [
    pendingStageStep,
    stageDecision,
    stageAdditionalInfoForm,
    formCv.personalInfo.email,
    formCv.personalInfo.name,
    formCv.personalInfo.lastName,
    emailTemplatesMap,
  ]);

  const customEmailDefaults = useMemo(() => {
    const stage = String(statusValue || "").trim() || CANDIDATE_STATUS_DEFAULT;
    const templateId = makeEmailTemplateId(stage, "accepted");
    const templateDoc = emailTemplatesMap?.[templateId] || null;
    const override = toCopyOverridesFromTemplateDoc(templateDoc) || {};
    const baseCopy = getStatusEmailCopy(stage, "accepted");
    const subjectFromTemplate =
      override?.subject !== undefined
        ? String(override.subject || "")
        : String(baseCopy?.subject || "");
    return {
      emailTitle: "Ariza holati yangilandi",
      subject: subjectFromTemplate,
      bodyText: "Asosiy matn (main)...\n\nKeyingi qadam (note)...",
    };
  }, [statusValue, emailTemplatesMap]);

  function stripDefaultIntroFromCustomPreview(value) {
    const raw = String(value || "");
    if (!raw) return raw;
    const intro =
      "Arizangiz holatini yangiladik. Quyidagi sharh va keyingi qadamlarni diqqat bilan ko'rib chiqing:";
    // Remove the exact intro line from both HTML and plain text previews (best-effort).
    return raw
      .replace(
        new RegExp(
          `<p[^>]*>\\s*${intro.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}\\s*<\\/p>\\s*`,
          "g"
        ),
        ""
      )
      .replace(
        new RegExp(
          `\\s*${intro.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n?`,
          "g"
        ),
        ""
      )
      .trim();
  }

  function stripStatusLineFromCustomEmail(value) {
    const raw = String(value || "");
    if (!raw) return raw;
    // HTML header "Holat: <strong>...": remove the entire div line.
    const htmlOut = raw.replace(
      /<div[^>]*>\s*Holat:\s*<strong>[\s\S]*?<\/strong>\s*<\/div>\s*/gi,
      ""
    );
    // Plain text "Holat: ..." line
    return htmlOut
      .replace(/\n?Holat:\s*.*(\n|$)/gi, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const customEmailPreview = useMemo(() => {
    const recipientEmail = String(customEmailForm?.to || "").trim();
    const stage = String(statusValue || "").trim() || CANDIDATE_STATUS_DEFAULT;
    const decision = "accepted";
    const info = getStageAdditionalInfo(stage);
    const { mainText, nextStepNote, hasMain, hasNote } = splitCustomEmailBody(
      customEmailForm?.bodyText
    );
    try {
      const { subject, message, htmlContent } = buildStatusEmailTemplate({
        statusValue: stage,
        firstName: formCv.personalInfo.name,
        lastName: formCv.personalInfo.lastName,
        stageDecision: decision,
        decisionNote: "",
        additionalInfo: info,
        copyOverrides: {
          emailTitle: String(customEmailForm?.emailTitle || "").trim()
            ? String(customEmailForm?.emailTitle || "")
            : undefined,
          subject: String(customEmailForm?.subject || "").trim()
            ? String(customEmailForm?.subject || "")
            : undefined,
          // Preview: don't show stage default texts if user didn't type anything
          mainText: hasMain ? mainText : "",
          nextStepNote: hasNote ? nextStepNote : "",
          emphasizeMainText: false,
        },
      });
      return {
        to: recipientEmail,
        subject,
        message: stripStatusLineFromCustomEmail(
          stripDefaultIntroFromCustomPreview(message)
        ),
        htmlContent: stripStatusLineFromCustomEmail(
          stripDefaultIntroFromCustomPreview(htmlContent)
        ),
      };
    } catch (err) {
      console.error("customEmailPreview error:", err);
      return { to: recipientEmail, subject: "", message: "", htmlContent: "" };
    }
  }, [
    customEmailForm,
    formCv.personalInfo.name,
    formCv.personalInfo.lastName,
    statusValue,
    metaInfo,
  ]);

  async function handleSave() {
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;
    const commentHasContent = hasRichTextContent(commentHtml);
    const originalComment = String(docCv?.commentar || "");
    const isCommentUpdated =
      String(commentHtml || "") !== String(originalComment || "");

    const nextCommentMeta = isCommentUpdated
      ? {
          updatedAt: Date.now(),
          updatedByUid: user?.uid || "",
          updatedByName:
            user?.displayName || user?.email || user?.phoneNumber || "Nomaʼlum",
          updatedByPhoto: user?.photoURL || "",
        }
      : null;

    if (!isLimitedAdmin) {
      if (!formCv.personalInfo.name?.trim()) {
        toast.error("Vorname ist erforderlich.");
        return;
      }
      if (!formCv.personalInfo.lastName?.trim()) {
        toast.error("Nachname ist erforderlich.");
        return;
      }
      if (!formCv.personalInfo.gender) {
        toast.error("Bitte Geschlecht auswählen.");
        return;
      }
      if (!String(formCv.personalInfo.birthPlace || "").trim()) {
        toast.error("Geburtsort ist erforderlich.");
        return;
      }
      if (!isGermanAddressComplete(addressFields)) {
        toast.error(
          "Bitte vollständige Adresse eingeben (Straße, Hausnummer, PLZ, Ort, Land)."
        );
        return;
      }
      const noKids = Boolean(formCv.personalInfo.noChildren);
      const kidsCount = String(formCv.personalInfo.childrenCount || "").trim();
      if (!noKids && !kidsCount) {
        toast.error(
          "Bitte Kinderanzahl eingeben oder 'Keine Kinder' auswählen."
        );
        return;
      }
    }

    try {
      setIsSaving(true);
      const payload = isLimitedAdmin
        ? { commentar: String(commentHtml || "") }
        : mapFormToDoc(formCv);
      if (nextCommentMeta) {
        payload.commentarMeta = nextCommentMeta;
      }

      // Email sync (Firestore + external API)
      const oldEmail = String(docCv?.persoenlicheDaten?.email || "").trim();
      const newEmail = String(formCv?.personalInfo?.email || "").trim();
      const shouldSyncEmail =
        !isLimitedAdmin &&
        Boolean(oldEmail) &&
        Boolean(newEmail) &&
        oldEmail.toLowerCase() !== newEmail.toLowerCase();

      // If email changed, reset candidate stages so emails can be re-sent from the beginning.
      if (shouldSyncEmail) {
        const now = Date.now();
        const resetMeta = getCandidateStatus(CANDIDATE_STATUS_DEFAULT);
        payload.status = {
          value: CANDIDATE_STATUS_DEFAULT,
          label: resetMeta.label,
          updatedAt: now,
          updatedBy: user?.email || user?.uid || "admin",
        };
        // Update local UI immediately; snapshot will also refresh.
        setStatusValue(CANDIDATE_STATUS_DEFAULT);
        setStatusUpdatedAt(now);
        setStatusUpdatedBy(user?.email || user?.uid || "admin");
      }

      if (isLimitedAdmin) {
        await updateDocument(col, docId, payload);
      } else {
        // Update Firestore and adjust LIVE stats (current only) based on delta(old,new)
        await updateCandidateWithCurrentStats(col, docId, payload, {
          majorLabel: resolvedMajor?.title || col,
        });
      }

      if (shouldSyncEmail) {
        try {
          await updateEmailRemote(oldEmail, newEmail, col);
        } catch (err) {
          console.error("updateEmailRemote failed:", err);
          toast.error(
            "Firebase saqlandi, lekin tashqi email bazasini yangilashda xato bo'ldi."
          );
        }
      }
      toast.success(
        isLimitedAdmin
          ? "Kommentar wurde gespeichert."
          : "Änderungen wurden gespeichert."
      );
      if (shouldSyncEmail) {
        toast("E-Mail wurde geändert: Kandidatenstufen wurden auf stage_1 zurückgesetzt.");
      }
      if (isLimitedAdmin) {
        setCommentBaseline(String(commentHtml || ""));
      }
      if (nextCommentMeta) {
        setCommentMeta(nextCommentMeta);
      }
      if (commentHasContent) {
        setIsCommentEditorOpen(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Speichern.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDownloadPdf() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung zum Herunterladen.");
      return;
    }
    try {
      setIsDownloading(true);
      const firstName = String(formCv.personalInfo.name || "").trim();
      const lastName = String(formCv.personalInfo.lastName || "").trim();
      const candidateName = [firstName, lastName].filter(Boolean).join(" ");
      const fileBase = candidateName
        ? `Lebenslauf ${candidateName}`
        : "Lebenslauf";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Lebenslauf";
      const blob = await pdf(
        <CvPdfDocument
          form={{ ...formCv, commentarMeta: commentMeta }}
          showDocuments={showDocuments}
          showComment={showComment}
          showCommentDate={showCommentDate}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ConsultingUz ${safeFileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  const SectionTitle = ({ children }) => (
    <div className="mt-8 mb-3">
      <h3 className="text-xl font-semibold">{children}</h3>
      <div className="h-[2px] bg-base-300 mt-1" />
    </div>
  );

  // Preview data from form state
  const firstName = String(formCv.personalInfo.name || "").trim();
  const lastName = String(formCv.personalInfo.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—";
  const address = String(formCv.personalInfo.address || "").trim();
  const birthDate = String(formCv.personalInfo.birthDate || "").trim();
  const phone = String(formCv.personalInfo.phone || "").trim();
  const email = String(formCv.personalInfo.email || "").trim();
  const maritalStatus = String(formCv.personalInfo.maritalStatus || "").trim();
  const noChildren = Boolean(formCv.personalInfo.noChildren);
  const childrenCount = String(formCv.personalInfo.childrenCount || "").trim();
  const photo = String(formCv.personalInfo.photo || "").trim();

  function openPhotoModal() {
    if (!photo) return;
    setPhotoModalSrc(photo);
    setIsPhotoModalOpen(true);
  }

  function closePhotoModal() {
    setIsPhotoModalOpen(false);
    setPhotoModalSrc("");
  }

  // Shared DaisyUI input styles for the edit form
  const inputBase = "input input-bordered w-full";
  const selectBase = "select select-bordered w-full";
  const textareaBase = "textarea textarea-bordered w-full";
  const fileInputBase =
    "file-input file-input-bordered file-input-primary w-full";

  const phoneOk = isPhoneComplete(phone);
  const phoneWarn = phone.length > 0 && !phoneOk;
  const phoneDigits = getPhoneBodyDigits(phone);
  const emailOk = isEmailValid(email);
  const emailWarn = email.length > 0 && !emailOk;

  // Style overrides for FormInput component

  const layoutClass =
    "flex flex-col lg:flex-row gap-6 items-start lg:items-stretch";

  const formCardLimited =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto";
  const formCardAdmin =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[640px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto";

  const formSectionClass = isLimitedAdmin
    ? `${formCardLimited} flex-1 min-w-0 lg:self-stretch lg:basis-[60%] lg:max-w-[60%] lg:flex-none`
    : `${formCardAdmin} flex-1 min-w-0 lg:self-stretch lg:basis-[60%] lg:max-w-[60%] lg:flex-none`;

  const canSaveComment = commentChanged && !isSaving && !loading && !notFound;
  const showCommentPreview = !isCommentEditorOpen;
  const commentActionLabel = !isCommentEditorOpen ? "Qo'shish" : "Bekor qilish";
  const showLimitedCommentSaveButton =
    isLimitedAdmin &&
    isCommentEditorOpen &&
    commentChanged &&
    !loading &&
    !notFound;

  function formatCommentDate(val) {
    if (!val) return "";
    try {
      if (val?.seconds)
        return new Date(val.seconds * 1000).toLocaleString("de-DE");
      if (typeof val === "number") return new Date(val).toLocaleString("de-DE");
      const parsed = new Date(val);
      if (!Number.isNaN(parsed.getTime()))
        return parsed.toLocaleString("de-DE");
    } catch (err) {
      console.error("formatCommentDate error:", err);
    }
    return "";
  }

  const renderCommentPreview = (extraClassName = "") => (
    <div
      className={`rounded-lg border border-base-300 bg-base-100 p-3 max-h-60 overflow-auto ${extraClassName}`}
    >
      {hasComment ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {commentMeta?.updatedByPhoto ? (
                <img
                  src={commentMeta.updatedByPhoto}
                  alt={commentMeta?.updatedByName || "Kommentator"}
                  className="w-8 h-8 rounded-full object-cover border border-base-300"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-base-300 text-base-content/70 flex items-center justify-center text-xs font-semibold">
                  {(commentMeta?.updatedByName || "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
              )}
              <div className="leading-tight">
                <div className="text-sm font-semibold text-base-content">
                  {commentMeta?.updatedByName || "Nomaʼlum foydalanuvchi"}
                </div>
                {commentMeta?.updatedAt && (
                  <div className="text-[11px] text-base-content/60">
                    Yangilandi: {formatCommentDate(commentMeta.updatedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div
            className="prose prose-sm max-w-none text-base-content"
            dangerouslySetInnerHTML={{ __html: commentHtml }}
          />
        </div>
      ) : (
        <p className="text-sm text-base-content/60 italic">
          Kommentariya yo&apos;q.
        </p>
      )}
    </div>
  );

  function openCommentEditor() {
    setCommentBaseline(String(commentHtml || ""));
    setIsCommentEditorOpen(true);
  }

  function handleCommentPrimaryAction() {
    if (!isCommentEditorOpen) {
      const current = String(commentHtml || "");
      setCommentBaseline(current);
      if (!hasRichTextContent(current)) {
        setCommentHtml(DEFAULT_COMMENT_TEMPLATE_HTML);
      }
      setIsCommentEditorOpen(true);
      return;
    }
    // Cancel comment edits
    setCommentHtml(String(commentBaseline || ""));
    setIsCommentEditorOpen(false);
  }

  function appendToComment(nextHtmlBlock) {
    const block = String(nextHtmlBlock || "").trim();
    if (!block) return;
    setCommentHtml(`${String(commentHtml || "")}${block}`);
    setShowComment(true);
    setIsCommentEditorOpen(true);
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function plainTextToSimpleHtml(text) {
    const raw = String(text || "").trim();
    if (!raw) return "";
    const paras = raw.split(/\n{2,}/g);
    return paras
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
      .join("");
  }

  const isPageBusy =
    loading ||
    isSaving ||
    isDownloading ||
    isSavingStatus ||
    Boolean(sendingStepValue) ||
    metaLoading;

  const busyLabel = loading
    ? "Yuklanmoqda..."
    : isSaving
    ? "Saqlanmoqda..."
    : isDownloading
    ? "PDF tayyorlanmoqda..."
    : isSavingStatus
    ? "Status saqlanmoqda..."
    : sendingStepValue
    ? "Email yuborilmoqda..."
    : metaLoading
    ? "Maʼlumotlar yuklanmoqda..."
    : "Iltimos kuting...";

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-base-200 min-h-screen">
      {isPageBusy && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px] flex items-center justify-center"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl px-6 py-5 flex items-center gap-3">
            <span className="loading loading-spinner loading-md text-primary" />
            <div className="text-sm font-medium">{busyLabel}</div>
          </div>
        </div>
      )}
      <DeleteCandidateModal
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteCandidate}
        candidateName={deleteTarget?.name}
        isDeleting={isDeletingCandidate}
        seconds={5}
      />
      <div className="w-full">
        {/* Controls (hidden on print) */}
        <div className="flex items-center justify-between mb-6 pb-2 md:pb-3 print:hidden">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Link
                  to={`/collectionCv/${resolvedMajor.linkId || major}`}
                  className="link flex items-center gap-2"
                >
                  <FaArrowLeft /> Zurück
                </Link>
              </li>
              <li className="opacity-70">CV</li>
            </ul>
          </div>
          <div className="flex items-center gap-2">
            {!isLimitedAdmin && (
              <>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSave}
                  disabled={
                    isSaving || loading || notFound || !hasUnsavedChanges
                  }
                >
                  <FaSave />
                  <span>Saqlash</span>
                </button>
                <button
                  className="btn btn-sm"
                  onClick={handleCancel}
                  disabled={
                    isSaving || loading || notFound || !hasUnsavedChanges
                  }
                >
                  Bekor qilish
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={handleDownloadPdf}
                  disabled={loading || notFound || isDownloading}
                >
                  <FaDownload />{" "}
                  {isDownloading ? "Wird geladen..." : "Herunterladen"}
                </button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : notFound ? (
          <div className="py-16 text-center bg-base-100 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Nicht gefunden</h2>
            <p className="opacity-70">
              Das Dokument existiert nicht oder wurde gelöscht.
            </p>
          </div>
        ) : (
          <>
            <div className={layoutClass}>
              <section className={formSectionClass}>
                <div className="card-body space-y-4 min-h-[calc(100vh-2rem)]">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="card-title text-2xl font-bold">
                      Daten bearbeiten
                    </h2>
                  </div>

                  {isLimitedAdmin && (
                    <div className="flex justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                          Profil rasmi
                        </p>
                        {photo ? (
                          <button
                            type="button"
                            className="rounded-md border border-base-300 overflow-hidden shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            onClick={openPhotoModal}
                          >
                            <img
                              src={photo}
                              alt="Kandidat foto"
                              className="w-[128pt] h-[160pt] object-cover"
                            />
                          </button>
                        ) : (
                          <div className="w-[128pt] h-[160pt] border border-dashed border-base-300 rounded-md bg-base-200 flex items-center justify-center text-xs uppercase tracking-wide text-base-content/60">
                            Foto mavjud emas
                          </div>
                        )}
                        {photo && (
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            onClick={openPhotoModal}
                          >
                            Katta ko‘rish
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <fieldset
                    disabled={isLimitedAdmin}
                    className="space-y-4 disabled:opacity-70"
                  >
                    <div className="divider mt-2">Persönliche Daten</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Vorname"
                        placeholder="Vorname"
                        value={formCv.personalInfo.name}
                        onChange={(e) =>
                          setFormCv((prev) => ({
                            ...prev,
                            personalInfo: {
                              ...prev.personalInfo,
                              name: e.target.value,
                            },
                          }))
                        }
                      />
                      <FormInput
                        label="Nachname"
                        placeholder="Nachname"
                        value={formCv.personalInfo.lastName}
                        onChange={(e) =>
                          setFormCv((prev) => ({
                            ...prev,
                            personalInfo: {
                              ...prev.personalInfo,
                              lastName: e.target.value,
                            },
                          }))
                        }
                      />
                      <div className="md:col-span-2">
                        <label className="label">
                          <span className="label-text">Geschlecht</span>
                        </label>
                        <div className="flex gap-6">
                          <label className="cursor-pointer flex items-center gap-2">
                            <input
                              type="radio"
                              value="Männlich"
                              className="radio radio-primary"
                              checked={
                                formCv.personalInfo.gender === "Männlich"
                              }
                              onChange={(e) =>
                                setFormCv((prev) => ({
                                  ...prev,
                                  personalInfo: {
                                    ...prev.personalInfo,
                                    gender: e.target.value,
                                  },
                                }))
                              }
                            />
                            <span>Männlich</span>
                          </label>
                          <label className="cursor-pointer flex items-center gap-2">
                            <input
                              type="radio"
                              value="Weiblich"
                              className="radio radio-primary"
                              checked={
                                formCv.personalInfo.gender === "Weiblich"
                              }
                              onChange={(e) =>
                                setFormCv((prev) => ({
                                  ...prev,
                                  personalInfo: {
                                    ...prev.personalInfo,
                                    gender: e.target.value,
                                  },
                                }))
                              }
                            />
                            <span>Weiblich</span>
                          </label>
                        </div>
                      </div>
                      <FormInput
                        label="Geburtsdatum"
                        type="date"
                        placeholder="YYYY-MM-DD"
                        value={toInputDate(formCv.personalInfo.birthDate)}
                        onChange={(e) =>
                          setFormCv((prev) => ({
                            ...prev,
                            personalInfo: {
                              ...prev.personalInfo,
                              birthDate: fromInputDate(e.target.value),
                            },
                          }))
                        }
                      />
                      <div className="form-control w-full">
                        <label className="label" htmlFor="g-birthPlace">
                          <span className="label-text">Geburtsort</span>
                        </label>
                        <select
                          id="g-birthPlace"
                          className={selectBase}
                          value={String(formCv.personalInfo.birthPlace || "")}
                          onChange={(e) =>
                            setFormCv((prev) => ({
                              ...prev,
                              personalInfo: {
                                ...prev.personalInfo,
                                birthPlace: e.target.value,
                              },
                            }))
                          }
                        >
                          <option value="">Bitte auswählen</option>
                          {UZBEK_REGIONS.map((region) => (
                            <option key={region} value={region}>
                              {region}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-control w-full">
                        <label className="label" htmlFor="g-marital">
                          <span className="label-text">Familienstand</span>
                        </label>
                        <select
                          id="g-marital"
                          className={selectBase}
                          value={formCv.personalInfo.maritalStatus}
                          onChange={(e) =>
                            setFormCv((prev) => ({
                              ...prev,
                              personalInfo: {
                                ...prev.personalInfo,
                                maritalStatus: e.target.value,
                              },
                            }))
                          }
                        >
                          <option value="">Bitte auswählen</option>
                          <option value="ledig">ledig</option>
                          <option value="verheiratet">verheiratet</option>
                          <option value="geschieden">geschieden</option>
                          <option value="verwitwet">verwitwet</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 form-control w-full">
                        <label className="label" htmlFor="g-childrenCount">
                          <span className="label-text">Kinder *</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            id="g-childrenCount"
                            type="number"
                            min={0}
                            inputMode="numeric"
                            className={inputBase}
                            placeholder="0"
                            disabled={noChildren}
                            value={childrenCount}
                            onChange={(e) => {
                              const raw = String(e.target.value || "");
                              const cleaned = raw.replace(/[^\d]/g, "");
                              setFormCv((prev) => ({
                                ...prev,
                                personalInfo: {
                                  ...prev.personalInfo,
                                  childrenCount: cleaned,
                                },
                              }));
                            }}
                          />
                          <label className="cursor-pointer flex items-center gap-2 mt-2 md:mt-0">
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={noChildren}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFormCv((prev) => ({
                                  ...prev,
                                  personalInfo: {
                                    ...prev.personalInfo,
                                    noChildren: checked,
                                    childrenCount: checked
                                      ? ""
                                      : String(
                                          prev.personalInfo.childrenCount || ""
                                        ),
                                  },
                                }));
                              }}
                            />
                            <span className="text-sm">Keine Kinder</span>
                          </label>
                        </div>
                      </div>
                      <div className="md:col-span-2 form-control w-full">
                        <label className="label" htmlFor="g-driving">
                          <span className="label-text">Führerschein</span>
                        </label>
                        <label className="cursor-pointer flex items-center gap-2">
                          <input
                            id="g-driving"
                            type="checkbox"
                            className="checkbox"
                            checked={Boolean(
                              formCv.personalInfo.hasDrivingLicense
                            )}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormCv((prev) => ({
                                ...prev,
                                personalInfo: {
                                  ...prev.personalInfo,
                                  hasDrivingLicense: checked,
                                  drivingLicenseType: checked
                                    ? String(
                                        prev.personalInfo.drivingLicenseType ||
                                          ""
                                      )
                                    : "",
                                },
                              }));
                              if (!checked)
                                setIsDrivingLicenseDropdownOpen(false);
                            }}
                          />
                          <span className="text-sm">Vorhanden</span>
                        </label>
                        {formCv.personalInfo.hasDrivingLicense ? (
                          <div className="mt-3">
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
                                className={`${selectBase} flex items-center justify-between gap-3`}
                                aria-haspopup="listbox"
                                aria-expanded={isDrivingLicenseDropdownOpen}
                                onClick={() =>
                                  setIsDrivingLicenseDropdownOpen((p) => !p)
                                }
                              >
                                {(() => {
                                  const raw = String(
                                    formCv.personalInfo.drivingLicenseType || ""
                                  )
                                    .trim()
                                    .toUpperCase();
                                  const selected = raw
                                    ? raw
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean)
                                    : [];
                                  const displayValue = selected.length
                                    ? selected.join(", ")
                                    : "Bitte auswählen";
                                  return (
                                    <>
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
                                    </>
                                  );
                                })()}
                              </button>

                              <div className="dropdown-content w-full mt-1 max-h-72 rounded-box border border-base-300 bg-base-100 shadow z-[60] overflow-hidden flex flex-col">
                                <div className="flex justify-end p-2 border-b border-base-200">
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-xs"
                                    aria-label="Schließen"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setIsDrivingLicenseDropdownOpen(false);
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                                <ul
                                  className="menu p-2 overflow-auto w-full"
                                  role="listbox"
                                  aria-multiselectable="true"
                                >
                                  {DRIVING_LICENSE_OPTIONS.map((opt) => {
                                    const upper = String(opt || "")
                                      .trim()
                                      .toUpperCase();
                                    const selected = String(
                                      formCv.personalInfo.drivingLicenseType ||
                                        ""
                                    )
                                      .trim()
                                      .toUpperCase()
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean);
                                    const isSelected = selected.includes(upper);

                                    return (
                                      <li key={opt}>
                                        <button
                                          type="button"
                                          className="flex items-center gap-2"
                                          onClick={() => {
                                            const set = new Set(selected);
                                            if (set.has(upper))
                                              set.delete(upper);
                                            else set.add(upper);
                                            const next =
                                              Array.from(set).join(", ");
                                            setFormCv((prev) => ({
                                              ...prev,
                                              personalInfo: {
                                                ...prev.personalInfo,
                                                drivingLicenseType: next,
                                              },
                                            }));
                                            // Close dropdown after selecting a value (user can reopen to add more)
                                            setIsDrivingLicenseDropdownOpen(
                                              false
                                            );
                                          }}
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
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="md:col-span-2">
                        <PhoneInputWithCountry
                          label="Telefonnummer"
                          required
                          value={formCv.personalInfo.phone}
                          onChange={(next) =>
                            setFormCv((prev) => ({
                              ...prev,
                              personalInfo: {
                                ...prev.personalInfo,
                                phone: next,
                              },
                            }))
                          }
                          inputClassName={
                            phoneOk
                              ? "input-success"
                              : phoneWarn
                              ? "input-warning"
                              : ""
                          }
                          helperText={
                            phoneWarn ? (
                              <span className="text-warning">
                                Telefonnummer unvollständig (
                                {phoneDigits.length}/9 Ziffern)
                              </span>
                            ) : null
                          }
                        />
                      </div>
                      <FormInput
                        label="E-Mail"
                        placeholder="E-Mail"
                        type="email"
                        value={formCv.personalInfo.email}
                        onChange={(e) =>
                          setFormCv((prev) => ({
                            ...prev,
                            personalInfo: {
                              ...prev.personalInfo,
                              email: e.target.value,
                            },
                          }))
                        }
                        inputClassName={
                          emailOk
                            ? "input-success"
                            : emailWarn
                            ? "input-warning"
                            : ""
                        }
                        helperText={
                          emailWarn ? (
                            <span className="text-warning">
                              Bitte gültige E-Mail eingeben.
                            </span>
                          ) : (
                            ""
                          )
                        }
                      />

                      <div className="md:col-span-2 form-control w-full">
                        <label
                          className="label pb-1 flex-col items-start gap-1"
                          htmlFor="g-photo-file"
                        >
                          <span className="label-text font-medium">
                            Foto hochladen (JPEG/PNG) (Ihr eigenes Foto)
                          </span>
                          <span className="label-text-alt text-xs text-base-content/70">
                            Eigenes 3×4‑Passfoto. Bis 250 KB
                          </span>
                        </label>
                        <input
                          id="g-photo-file"
                          type="file"
                          accept="image/*"
                          className={fileInputBase}
                          onChange={handlePhotoFileChange}
                        />
                      </div>

                      <div className="md:col-span-2 form-control w-full">
                        <label className="label pb-1" htmlFor="g-addressStreet">
                          <span className="label-text font-medium">
                            Adresse
                          </span>
                        </label>
                        <div className="rounded-box border border-base-300 bg-base-200/40 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label
                                className="label"
                                htmlFor="g-addressStreet"
                              >
                                <span className="label-text">Straße *</span>
                              </label>
                              <input
                                id="g-addressStreet"
                                type="text"
                                className={inputBase}
                                placeholder="Straße"
                                value={addressFields.street}
                                onChange={(e) =>
                                  applyAddressFields({
                                    ...addressFields,
                                    street: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <div>
                              <label
                                className="label"
                                htmlFor="g-addressHouseNumber"
                              >
                                <span className="label-text">Hausnummer *</span>
                              </label>
                              <input
                                id="g-addressHouseNumber"
                                type="text"
                                className={inputBase}
                                placeholder="z.B. 12A"
                                value={addressFields.houseNumber}
                                onChange={(e) =>
                                  applyAddressFields({
                                    ...addressFields,
                                    houseNumber: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <div>
                              <label
                                className="label"
                                htmlFor="g-addressPostalCode"
                              >
                                <span className="label-text">PLZ *</span>
                              </label>
                              <input
                                id="g-addressPostalCode"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                className={inputBase}
                                placeholder="123456"
                                value={String(addressFields.postalCode || "")}
                                onChange={(e) =>
                                  applyAddressFields({
                                    ...addressFields,
                                    postalCode: String(e.target.value || "")
                                      .replace(/[^\d]/g, "")
                                      .slice(0, 6),
                                  })
                                }
                              />
                            </div>

                            <div>
                              <label className="label" htmlFor="g-addressCity">
                                <span className="label-text">Ort *</span>
                              </label>
                              <select
                                id="g-addressCity"
                                className={selectBase}
                                value={addressFields.city}
                                onChange={(e) =>
                                  applyAddressFields({
                                    ...addressFields,
                                    city: e.target.value,
                                  })
                                }
                              >
                                <option value="">Bitte auswählen</option>
                                {UZBEK_REGIONS.map((region) => (
                                  <option key={region} value={region}>
                                    {region}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <CountryNameCombobox
                                id="g-addressCountry"
                                label="Land"
                                required
                                placeholder="Usbekistan"
                                value={addressFields.country}
                                onChange={(v) =>
                                  applyAddressFields({
                                    ...addressFields,
                                    country: String(v || ""),
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <CollapsibleSection
                      title="Berufserfahrung"
                      count={experienceCount}
                    >
                      <ExperienceSection
                        experience={formCv.experience}
                        onAddExperience={addExperience}
                        onUpdateExperience={updateExperience}
                        onRemoveExperience={removeExperience}
                        onAddResponsibility={addResponsibility}
                        onRemoveResponsibility={removeResponsibility}
                      />
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Ausbildung"
                      count={educationCount}
                    >
                      <EducationSection
                        education={formCv.education}
                        onAddEducation={addEducation}
                        onUpdateEducation={updateEducation}
                        onRemoveEducation={removeEducation}
                      />
                    </CollapsibleSection>

                    <CollapsibleSection title="Fähigkeiten">
                      <SkillsSection
                        softSkills={formCv.skills.softSkills}
                        pcSkills={formCv.skills.pcSkills}
                        onAddSoft={(val) =>
                          addTag(["skills", "softSkills"], val)
                        }
                        onRemoveSoft={(i) =>
                          removeTag(["skills", "softSkills"], i)
                        }
                        onAddPc={(val) => addTag(["skills", "pcSkills"], val)}
                        onRemovePc={(i) => removeTag(["skills", "pcSkills"], i)}
                        onAutoAddSoft={() => autoAddSkills("soft")}
                        onAutoAddPc={() => autoAddSkills("pc")}
                        isGeneratingSoft={isGeneratingSoft}
                        isGeneratingPc={isGeneratingPc}
                        recentlyAddedSoft={recentlyAdded.soft}
                        recentlyAddedPc={recentlyAdded.pc}
                      />
                    </CollapsibleSection>

                    <CollapsibleSection title="Sprachen" count={languagesCount}>
                      <LanguagesSection
                        languageRows={languageRows}
                        onAddRow={addLanguageRow}
                        onUpdateRow={updateLanguageRow}
                        onRemoveRow={removeLanguageRow}
                        languageOptions={LANGUAGE_OPTIONS}
                      />
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Dokumente"
                      count={documentsCount}
                    >
                      <div className="form-control mb-4">
                        <label className="label cursor-pointer justify-start gap-3">
                          <span className="label-text font-semibold">
                            Dokumente im PDF anzeigen
                          </span>
                          <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={showDocuments}
                            onChange={(e) => setShowDocuments(e.target.checked)}
                          />
                        </label>
                      </div>

                      {/* Passport */}
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">
                          Reisepass
                        </h4>
                        <div className="flex flex-col gap-2">
                          {!formCv.documents?.passport ||
                          formCv.documents.passport.length === 0 ? (
                            <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
                              Kein Reisepass vorhanden.
                            </div>
                          ) : (
                            formCv.documents.passport.map((url, i) => (
                              <div
                                key={i}
                                className="flex gap-2 items-center p-2 bg-base-100 border rounded"
                              >
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="link link-primary text-sm truncate flex-1"
                                >
                                  {url}
                                </a>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-square btn-sm btn-ghost text-primary"
                                  title="Link öffnen"
                                >
                                  <FaExternalLinkAlt />
                                </a>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Diplomas */}
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">
                          Diplome
                        </h4>
                        <div className="flex flex-col gap-2">
                          {!formCv.documents?.diplomas ||
                          formCv.documents.diplomas.length === 0 ? (
                            <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
                              Keine Diplome vorhanden.
                            </div>
                          ) : (
                            formCv.documents.diplomas.map((url, i) => (
                              <div
                                key={i}
                                className="flex gap-2 items-center p-2 bg-base-100 border rounded"
                              >
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="link link-primary text-sm truncate flex-1"
                                >
                                  {url}
                                </a>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-square btn-sm btn-ghost text-primary"
                                  title="Link öffnen"
                                >
                                  <FaExternalLinkAlt />
                                </a>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Certificates */}
                      <div className="mb-2">
                        <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">
                          Zertifikate
                        </h4>
                        <div className="flex flex-col gap-2">
                          {!formCv.documents?.certificates ||
                          formCv.documents.certificates.length === 0 ? (
                            <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
                              Keine Zertifikate vorhanden.
                            </div>
                          ) : (
                            formCv.documents.certificates.map((url, i) => (
                              <div
                                key={i}
                                className="flex gap-2 items-center p-2 bg-base-100 border rounded"
                              >
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="link link-primary text-sm truncate flex-1"
                                >
                                  {url}
                                </a>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-square btn-sm btn-ghost text-primary"
                                  title="Link öffnen"
                                >
                                  <FaExternalLinkAlt />
                                </a>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </CollapsibleSection>
                  </fieldset>

                  {!isLimitedAdmin && (
                    <>
                      <div className="divider mt-1">Kommentar</div>
                      <div className="form-control mb-2">
                        <label className="label cursor-pointer justify-start gap-3">
                          <span className="label-text font-semibold">
                            Kommentar in Vorschau & PDF anzeigen
                          </span>
                          <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={showComment}
                            onChange={(e) => setShowComment(e.target.checked)}
                          />
                        </label>
                      </div>
                      <div className="form-control mb-3">
                        <label className="label cursor-pointer justify-start gap-3">
                          <span className="label-text font-semibold">
                            Datum im Footer anzeigen
                          </span>
                          <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={showCommentDate}
                            onChange={(e) =>
                              setShowCommentDate(e.target.checked)
                            }
                          />
                        </label>
                      </div>
                      <div className="form-control gap-3">
                        <label className="label" htmlFor="comment-admin">
                          <span className="label-text font-medium">
                            Allgemeiner Kommentar (Kandidat haqida)
                          </span>
                        </label>
                        {showCommentPreview && renderCommentPreview()}
                        {isCommentEditorOpen && (
                          <RichTextEditor
                            value={commentHtml}
                            onChange={setCommentHtml}
                            placeholder='Umumiy fikr: "Kandidat juda mos, faqat foto yangilansin"'
                          />
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={handleCommentPrimaryAction}
                            disabled={isSaving || loading || notFound}
                          >
                            {commentActionLabel}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {!isLimitedAdmin && (
                    <>
                      <div className="divider"></div>
                      <div className="flex justify-end gap-2"></div>
                    </>
                  )}
                </div>
              </section>

              {isLimitedAdmin && (
                <>
                  {/* Right: Kommentar (sticky) */}
                  <aside className="w-full lg:basis-[40%] lg:max-w-[40%] shrink-0 lg:sticky lg:top-4 lg:self-start lg:h-[90vh] flex">
                    <div className="card bg-base-100 border border-base-300 shadow-2xl w-full h-full flex flex-col">
                      <div className="card-body space-y-3 flex-1 flex flex-col">
                        <div>
                          <h3 className="card-title text-lg mb-1">Kommentar</h3>
                          <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                            Kandidat haqida eslatma
                          </p>
                        </div>
                        {showCommentPreview && renderCommentPreview("flex-1")}
                        {isCommentEditorOpen && (
                          <RichTextEditor
                            value={commentHtml}
                            onChange={setCommentHtml}
                            placeholder='Umumiy fikr: "Kandidat juda mos, faqat foto yangilansin"'
                            className="flex-1"
                            editorClassName="min-h-[220px]"
                          />
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline w-full"
                            onClick={handleCommentPrimaryAction}
                            disabled={isSaving || loading || notFound}
                          >
                            {commentActionLabel}
                          </button>
                        </div>
                        <div className="pt-2">
                          {showLimitedCommentSaveButton && (
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                className={`btn btn-primary w-full ${
                                  !canSaveComment ? "btn-disabled" : ""
                                }`}
                                onClick={handleSave}
                                disabled={!canSaveComment}
                              >
                                {isSaving ? (
                                  <>
                                    <span className="loading loading-spinner loading-sm" />
                                    Saqlanmoqda...
                                  </>
                                ) : (
                                  <>
                                    <FaSave />
                                    <span>Saqlash</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </aside>
                </>
              )}

              {/* Right: Live Preview (WYSIWYG) */}
              {!isLimitedAdmin && (
                <LivePreview
                  formCv={formCv}
                  commentMeta={commentMeta}
                  showDocuments={showDocuments}
                  showComment={showComment}
                  showCommentDate={showCommentDate}
                  onPhotoClick={openPhotoModal}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Stepper should be below the form & preview */}
      {!isLimitedAdmin && !loading && !notFound && (
        <div className="mt-6">
          <CandidateStatusStepper
            currentValue={statusValue}
            onSendEmail={handleSendStatusEmail}
            sendingValue={sendingStepValue}
            disabled={isLimitedAdmin}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="btn btn-sm btn-outline mr-2"
              onClick={resetCandidateStages}
              disabled={Boolean(sendingStepValue)}
              title="Kandidat bosqichini boshidan (1-bosqich) boshlash va email count'ni 0 qilish"
            >
              Bosqich reset
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={openCustomEmailModal}
              disabled={Boolean(sendingStepValue)}
            >
              Custom email
            </button>
          </div>
          <div className="text-xs opacity-60 mt-2">
            Oxirgi yangilanish:{" "}
            {statusUpdatedAt ? (() => {
              try {
                const d = new Date(statusUpdatedAt);
                if (Number.isNaN(d.getTime())) return "—";
                return new Intl.DateTimeFormat("uz-UZ", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                  timeZone: "Asia/Tashkent",
                }).format(d);
              } catch {
                return "—";
              }
            })() : "—"}
            {statusUpdatedBy ? ` • Kim: ${statusUpdatedBy}` : ""}
          </div>
        </div>
      )}

      <PhotoModal
        open={isPhotoModalOpen}
        src={photoModalSrc}
        onClose={closePhotoModal}
      />

      <StageEmailModal
        open={isStageEmailModalOpen}
        onClose={closeStageEmailModal}
        title="Status email yuborish"
        subtitle={
          pendingStageStep === "stage_2"
            ? "2-bosqich emailida link/vaqt yuborilmaydi."
            : isLimitedAdmin
            ? "Email yuborish uchun ruxsat yo'q."
            : metaLoading
            ? "Zusätzliche Infos yuklanmoqda..."
            : "Qabul qilinsa, vaqt, link yoki lokatsiya Zusätzliche Infos'dan olinadi va emailga qo'shiladi."
        }
        decision={stageDecision}
        setDecision={setStageDecision}
        onSubmit={handleStageEmailSubmit}
        isSending={Boolean(sendingStepValue)}
        previewRows={[]}
        showPreviewWhenAccepted
        showAdditionalInfoEditor={
          !isLimitedAdmin &&
          pendingStageStep !== "stage_2" &&
          stageDecision === "accepted"
        }
        additionalInfoForm={stageAdditionalInfoForm}
        setAdditionalInfoForm={setStageAdditionalInfoForm}
        emailPreview={stageEmailPreview}
      />

      <CustomEmailModal
        open={isCustomEmailModalOpen}
        onClose={closeCustomEmailModal}
        onSubmit={handleCustomEmailSubmit}
        isSending={Boolean(sendingStepValue)}
        form={customEmailForm}
        setForm={setCustomEmailForm}
        emailPreview={customEmailPreview}
        placeholders={customEmailDefaults}
      />
    </div>
  );
}

export default Generate;
