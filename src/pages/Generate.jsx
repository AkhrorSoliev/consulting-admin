import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Link,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  increment,
  onSnapshot,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  FaDownload,
  FaArrowLeft,
  FaExternalLinkAlt,
  FaSave,
  FaTrash,
  FaUndo,
  FaEnvelope,
  FaTelegram,
  FaRobot,
  FaThumbsUp,
  FaThumbsDown,
  FaPaperPlane,
} from "react-icons/fa";
import { HiMiniDocumentCheck } from "react-icons/hi2";
import toast from "react-hot-toast";
import { pdf } from "@react-pdf/renderer";
import CvPdfDocument from "./generate/pdf/CvPdfDocument";
import FormInput from "../components/FormInput";
import PhoneInputWithCountry from "../components/PhoneInputWithCountry";
import {
  getPhoneBodyDigits,
  isEmailValid,
  isPhoneComplete,
  isPassportNumberValid,
  normalizePassportNumber,
} from "../utils/validation";
import CountryNameCombobox from "../components/CountryNameCombobox";
import ExperienceSection from "../components/ExperienceSection";
import SkillsSection from "../components/SkillsSection";
import LanguagesSection from "../components/LanguagesSection";
import CollapsibleSection from "../components/CollapsibleSection";
import {
  addCandidateWithDualStats,
  deleteCandidateWithCurrentStats,
  getDocumentDataById,
  getRemoteUserRecord,
  subscribeToCollections,
  subscribeToMetaByName,
  upsertEmailAndPassIdFirestore,
  deleteEmailAndPassIdByEmail,
  saveArchivedUserSnapshotFirestore,
  saveDeletedUserSnapshotFirestore,
  imageFileToBase64,
  toInputDate,
  fromInputDate,
  generateSkills,
  sortTimelineItemsDesc,
  updateDocument,
  updateCandidateWithDualStats,
  updateEmailRemote,
  getMetaByName,
  hasRichTextContent,
  commentHtmlToPlainText,
  DEFAULT_COMMENT_TEMPLATE_HTML,
  deleteUploadedFile,
  uploadFileToFirebase,
  toInputMonth,
  fromInputMonth,
  getUserFromFirestore,
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
import {
  generateTelegramInviteLink,
  generateTelegramChannelInviteLink,
  trackTelegramInviteSent,
} from "../utils/telegramInvites";
import { sendBrevoEmail } from "../utils/brevo";
import { sendEmailViaTelegram, sendStatusViaTelegram } from "../utils/telegram";
import { removeUserFromTelegramGroups } from "../utils/removeFromTelegramGroups";
import RichTextEditor from "../components/RichTextEditor";
import { useUserRole } from "../hooks/useUserRole";
import DeleteCandidateModal from "../components/DeleteCandidateModal";
import UnsavedChangesModal from "../components/UnsavedChangesModal";
import PhotoModal from "./generate/components/modals/PhotoModal";
import StageEmailModal from "./generate/components/modals/StageEmailModal";
import CustomEmailModal from "./generate/components/modals/CustomEmailModal";
import SendDocumentLinkModal from "./generate/components/modals/SendDocumentLinkModal";
import ErklaerungBeschaeftigungModal from "./generate/components/modals/ErklaerungBeschaeftigungModal";
import ZusatzblattAModal from "./generate/components/modals/ZusatzblattAModal";
import ZusatzblattBModal from "./generate/components/modals/ZusatzblattBModal";
import ZusatzblattCModal from "./generate/components/modals/ZusatzblattCModal";
import ZusatzblattDModal from "./generate/components/modals/ZusatzblattDModal";
import LivePreview from "./generate/components/LivePreview";
import SelectMajorModal from "../components/SelectMajorModal";
import { restoreRemoteRecordToFirebase } from "./candidates/remoteUserUtils";
import { UZBEK_REGIONS } from "../constants/uzbekRegions";
import { REGION_POSTAL_CODES } from "../constants/regionPostalCodes";
import { LANGUAGE_OPTIONS } from "../constants/languageOptions";
import { DOCUMENT_TEMPLATES } from "../constants/documentTemplates";
import BeratungsvertragPdfDocument from "./contract/pdf/BeratungsvertragPdfDocument";
import VermittlungsvertragPdfDocument from "./contract/pdf/VermittlungsvertragPdfDocument";
import VollmachtPdfDocument from "./contract/pdf/VollmachtPdfDocument";
import VollmachtArbeitgeberPdfDocument from "./contract/pdf/VollmachtArbeitgeberPdfDocument";
import RozilikXatiPdfDocument from "./contract/pdf/RozilikXatiPdfDocument";
import NomzodRozilikXatiPdfDocument from "./contract/pdf/NomzodRozilikXatiPdfDocument";
import MitarbeiterwohnungPdfDocument from "./contract/pdf/MitarbeiterwohnungPdfDocument";
import SprachsbestaetigungPdfDocument from "./contract/pdf/SprachsbestaetigungPdfDocument";
import EinwilligungserklaerungPdfDocument from "./contract/pdf/EinwilligungserklaerungPdfDocument";
import FotoVideoRozilikPdfDocument from "./contract/pdf/FotoVideoRozilikPdfDocument";
import PersonalfragebogenPdfDocument from "./contract/pdf/PersonalfragebogenPdfDocument";
import {
  makeEmailTemplateId,
  subscribeToEmailTemplates,
  toCopyOverridesFromTemplateDoc,
} from "../utils/emailTemplates";
import {
  safeJson,
  safeClone,
  todayDdMmYyyy,
  toDateTimeLocalString,
  parseGermanAddress,
  formatGermanAddress,
  isGermanAddressComplete,
  inferLinkType,
  createEmptyStageInfo,
  getTelegramGroupIdForStage,
  ensureTelegramGroupNameFactory,
  buildProxyAssetUrl,
  fetchUrlAsImageDataUrlBestEffort,
} from "./generate/utils";
import { correctCommentWithAI, correctExperienceWithAI } from "../utils/openai";
import { usePdfGeneration } from "./generate/hooks";
import { useDocumentManagement } from "./generate/hooks";
import { useFormNormalization } from "./generate/hooks";
import { useAddressManagement } from "./generate/hooks";
import {
  DRIVING_LICENSE_OPTIONS,
  LANG_CERT_TYPES,
  INITIAL_FORM,
} from "./generate/constants/formDefaults";

function Generate() {
  const { major, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const sp = useMemo(
    () => new URLSearchParams(String(location?.search || "")),
    [location?.search],
  );
  const remoteMode = sp.get("remote") === "1";
  const remoteKind = String(sp.get("kind") || "")
    .trim()
    .toLowerCase();
  const remoteRid = String(sp.get("rid") || "").trim();
  const deletedDocId = String(sp.get("deletedDocId") || "").trim();
  const archivedDocId = String(sp.get("archivedDocId") || "").trim();
  const stateRemoteRecord = useMemo(() => {
    const st = location?.state;
    if (!st || typeof st !== "object") return null;
    const rec = st.remoteRecord;
    return rec && typeof rec === "object" ? rec : null;
  }, [location?.state]);
  const DEBUG_GENERATE = useMemo(() => {
    try {
      if (import.meta.env.DEV) return true;
      // Enable debug logs in production via URL: /generate/...?...&debug=1
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        if (sp.get("debug") === "1") return true;
      }
      // Optional build-time flag
      return String(import.meta.env.VITE_DEBUG_GENERATE || "") === "true";
    } catch {
      return false;
    }
  }, []);
  const [docCv, setDocCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reaction, setReaction] = useState(null);
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
  // Cache telegram group names by Firestore doc id (telegram_groups/{id})
  const telegramGroupNameCacheRef = useRef({});
  const [telegramGroupNameById, setTelegramGroupNameById] = useState({});
  const [resolvedMajor, setResolvedMajor] = useState({
    collectionName: "",
    title: "",
    linkId: "",
  });

  const ensureTelegramGroupName = useMemo(() => {
    // stable function that can update local cache + state
    return ensureTelegramGroupNameFactory({
      getDocFn: getDoc,
      docFn: doc,
      dbRef: db,
      cacheRef: telegramGroupNameCacheRef,
      setMap: setTelegramGroupNameById,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { user } = useSelector((state) => state.auth);
  const { role: userRole } = useUserRole();

  // Remote-mode restore UI (for candidates/* -> Generate)
  const [remoteRecord, setRemoteRecord] = useState(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [majors, setMajors] = useState([]);
  const [majorModalOpen, setMajorModalOpen] = useState(false);
  const [majorModalKey, setMajorModalKey] = useState("");

  const [isStageEmailModalOpen, setIsStageEmailModalOpen] = useState(false);
  const [pendingStageStep, setPendingStageStep] = useState(null);
  const [stageDecision, setStageDecision] = useState("accepted");
  const [stageAdditionalInfoForm, setStageAdditionalInfoForm] =
    useState(createEmptyStageInfo);
  const [selectedExample, setSelectedExample] = useState("example1");
  const [emailTemplatesMap, setEmailTemplatesMap] = useState({});
  useEffect(() => {
    if (stageDecision === "rejected") {
      // Clear extra info when switching to rejection to avoid leaking previous data
      setStageAdditionalInfoForm(createEmptyStageInfo());
    }
  }, [stageDecision]);

  // Reset selected example when stage changes or modal opens
  useEffect(() => {
    if (pendingStageStep === "stage_2") {
      const hasLeadershipMeta = Boolean(
        metaInfo?.interviewLeadership &&
        (metaInfo?.interviewLeadership?.date ||
          metaInfo?.interviewLeadership?.link ||
          metaInfo?.interviewLeadership?.locationName ||
          metaInfo?.interviewLeadership?.locationUrl),
      );
      setSelectedExample(hasLeadershipMeta ? "example2" : "example1");
    }
  }, [pendingStageStep, metaInfo?.interviewLeadership]);

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
  const [missingPassportModalOpen, setMissingPassportModalOpen] =
    useState(false);
  const missingPassportResolverRef = useRef(null);

  const [isSendDocLinkModalOpen, setIsSendDocLinkModalOpen] = useState(false);
  const [isSendingDocLink, setIsSendingDocLink] = useState(false);

  const [isErklaerungModalOpen, setIsErklaerungModalOpen] = useState(false);
  const [isZusatzblattAModalOpen, setIsZusatzblattAModalOpen] = useState(false);
  const [isZusatzblattBModalOpen, setIsZusatzblattBModalOpen] = useState(false);
  const [isZusatzblattCModalOpen, setIsZusatzblattCModalOpen] = useState(false);
  const [isZusatzblattDModalOpen, setIsZusatzblattDModalOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });
  const [showBirthPlacePicker, setShowBirthPlacePicker] = useState(false);
  const [showMaritalStatusPicker, setShowMaritalStatusPicker] = useState(false);

  const [isDrivingLicenseDropdownOpen, setIsDrivingLicenseDropdownOpen] =
    useState(false);
  const drivingLicenseDropdownRef = useRef(null);

  useEffect(() => {
    // Track window size for mobile vs desktop UI
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        passportNumber: "",
        email: "",
        photo: "",
      },
      experience: [],
      education: [],
      skills: { softSkills: [], pcSkills: [], languages: {} },
      documents: {
        diplomas: [],
        certificates: [],
        certificatesDetailed: [],
        passport: [],
        noLanguageCertificate: false,
      },
      commentar: "",
    }),
    [],
  );
  const [formCv, setFormCv] = useState(initialForm);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [passportTouched, setPassportTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showComment, setShowComment] = useState(true);
  const [showCommentDate, setShowCommentDate] = useState(true);
  const [isGeneratingSoft, setIsGeneratingSoft] = useState(false);
  const [isGeneratingPc, setIsGeneratingPc] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState({ soft: [], pc: [] });
  const [formInitialized, setFormInitialized] = useState(false);
  const formInitializedRef = useRef(false);
  const baselineInitializedRef = useRef(false);
  const passportToastShownRef = useRef(false);
  const [isCommentEditorOpen, setIsCommentEditorOpen] = useState(false);
  const [commentBaseline, setCommentBaseline] = useState("");
  const [commentMeta, setCommentMeta] = useState({
    updatedAt: null,
    updatedByName: "",
    updatedByPhoto: "",
    updatedByUid: "",
  });
  const [emailMeta, setEmailMeta] = useState({
    count: 0,
    lastSentAt: null,
    lastSentBy: "",
    lastSentByUid: "",
    lastSentByName: "",
    lastSentByPhoto: "",
    lastSentType: "",
  });
  const [isCorrectingComment, setIsCorrectingComment] = useState(false);
  const [correctingExperienceIndex, setCorrectingExperienceIndex] =
    useState(null);
  const [aufgabenOnlyMode, setAufgabenOnlyMode] = useState({});
  const [experienceHistory, setExperienceHistory] = useState({});
  const [experienceHistoryIndex, setExperienceHistoryIndex] = useState({});
  const [commentHistory, setCommentHistory] = useState([]);
  const [commentHistoryIndex, setCommentHistoryIndex] = useState(-1);
  const [emailMetaAvatarFromUsers, setEmailMetaAvatarFromUsers] = useState("");

  // Allow candidate to delete incoming documents (controlled by admin)
  const [allowIncomingDelete, setAllowIncomingDelete] = useState(true);
  const [savingAllowDelete, setSavingAllowDelete] = useState(false);
  const [deletingIncomingDoc, setDeletingIncomingDoc] = useState({});

  // Document upload state
  const [selectedDocumentType, setSelectedDocumentType] = useState("");

  // Pending files to upload on save (File objects, not yet uploaded to Firebase)
  const [pendingDocumentFiles, setPendingDocumentFiles] = useState({
    passport: [],
    diplomas: [],
    certificates: [],
  });

  // Track documents marked for deletion (soft delete)
  const [documentsMarkedForDeletion, setDocumentsMarkedForDeletion] = useState({
    passport: [],
    diplomas: [],
    certificates: [],
  });

  function getCommentHtml(obj) {
    return String(obj?.commentar || "");
  }

  function setCommentHtml(nextHtml) {
    const v = String(nextHtml || "");
    setFormCv((prev) => ({ ...prev, commentar: v }));
  }

  const [addressFields, setAddressFields] = useState(() =>
    parseGermanAddress(initialForm.personalInfo.address),
  );
  const lastSyncedAddressRef = useRef("");
  const internalAddressUpdateRef = useRef(false);
  const previousCityRef = useRef("");
  const previousBirthPlaceRef = useRef("");

  function normalizeForm(form) {
    const safe = form || initialForm;
    const commentHtml = getCommentHtml(safe);
    const langEntries = Object.entries(safe?.skills?.languages || {})
      .filter(([key]) => key !== undefined && key !== null)
      .sort(([a], [b]) => String(a).localeCompare(String(b)));
    return {
      personalInfo: {
        name: String(safe?.personalInfo?.name || "").trim(),
        lastName: String(safe?.personalInfo?.lastName || "").trim(),
        gender: String(safe?.personalInfo?.gender || "").trim(),
        address: String(safe?.personalInfo?.address || "").trim(),
        birthDate: String(safe?.personalInfo?.birthDate || "").trim(),
        birthPlace: String(safe?.personalInfo?.birthPlace || "").trim(),
        maritalStatus: String(safe?.personalInfo?.maritalStatus || "").trim(),
        childrenCount: String(safe?.personalInfo?.childrenCount || "").trim(),
        noChildren: Boolean(safe?.personalInfo?.noChildren),
        hasDrivingLicense: Boolean(safe?.personalInfo?.hasDrivingLicense),
        drivingLicenseType: String(safe?.personalInfo?.drivingLicenseType || "")
          .trim()
          .toUpperCase(),
        phone: String(safe?.personalInfo?.phone || "").trim(),
        passportNumber: normalizePassportNumber(
          safe?.personalInfo?.passportNumber || "",
        ),
        email: String(safe?.personalInfo?.email || "").trim(),
        photo: String(safe?.personalInfo?.photo || "").trim(),
      },
      experience: Array.isArray(safe?.experience)
        ? safe.experience.map((exp) => ({
            startDate: String(exp?.startDate || "").trim(),
            endDate: String(exp?.endDate || "").trim(),
            position: String(exp?.position || "").trim(),
            company: String(exp?.company || "").trim(),
            location: String(exp?.location || "").trim(),
            responsibilities: Array.isArray(exp?.responsibilities)
              ? exp.responsibilities.map((r) => String(r || "").trim())
              : [],
          }))
        : [],
      education: Array.isArray(safe?.education)
        ? safe.education.map((edu) => ({
            startDate: String(edu?.startDate || "").trim(),
            endDate: String(edu?.endDate || "").trim(),
            institution: String(edu?.institution || "").trim(),
            degree: String(edu?.degree || "").trim(),
          }))
        : [],
      skills: {
        softSkills: Array.isArray(safe?.skills?.softSkills)
          ? safe.skills.softSkills.map((s) => String(s || "").trim())
          : [],
        pcSkills: Array.isArray(safe?.skills?.pcSkills)
          ? safe.skills.pcSkills.map((s) => String(s || "").trim())
          : [],
        languages: Object.fromEntries(
          langEntries.map(([k, v]) => [String(k), v]),
        ),
      },
      documents: {
        diplomas: Array.isArray(safe?.documents?.diplomas)
          ? safe.documents.diplomas.map((d) => String(d || ""))
          : [],
        certificates: Array.isArray(safe?.documents?.certificates)
          ? safe.documents.certificates.map((c) => String(c || ""))
          : [],
        certificatesDetailed: Array.isArray(
          safe?.documents?.certificatesDetailed,
        )
          ? safe.documents.certificatesDetailed.map((cert) => ({
              url: String(cert?.url || "").trim(),
              type: String(cert?.type || "").trim(),
            }))
          : [],
        passport: Array.isArray(safe?.documents?.passport)
          ? safe.documents.passport.map((p) => String(p || ""))
          : [],
        noLanguageCertificate: Boolean(safe?.documents?.noLanguageCertificate),
      },
      commentar: commentHtml,
    };
  }

  const isLimitedAdmin = userRole === "limited_admin";
  const isSuperAdmin = userRole === "super_admin";

  // ---- Outgoing documents (templates sent to the candidate) ----
  const candidateCollection = String(
    resolvedMajor?.collectionName || "",
  ).trim();
  const candidateDocId = String(id || "").trim();
  const [outgoingDocs, setOutgoingDocs] = useState(() => ({}));
  const [outgoingBusyById, setOutgoingBusyById] = useState(() => ({}));
  const [outgoingBulkBusy, setOutgoingBulkBusy] = useState(false);
  const outgoingDocsRef = useRef({});

  useEffect(() => {
    const raw = docCv?.outgoingDocuments;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      setOutgoingDocs(raw);
      outgoingDocsRef.current = raw;
    } else {
      setOutgoingDocs({});
      outgoingDocsRef.current = {};
    }
  }, [docCv]);

  // Fetch allowIncomingDelete from candidate_metadata
  useEffect(() => {
    if (!candidateDocId) return;
    const fetchMetadata = async () => {
      try {
        const metaDoc = await getDocumentDataById(
          "candidate_metadata",
          candidateDocId,
        );
        if (metaDoc && typeof metaDoc.allowIncomingDelete === "boolean") {
          setAllowIncomingDelete(metaDoc.allowIncomingDelete);
        } else {
          setAllowIncomingDelete(true);
        }
      } catch {
        setAllowIncomingDelete(true);
      }
    };
    fetchMetadata();
  }, [candidateDocId]);

  async function handleToggleAllowIncomingDelete(newValue) {
    if (!candidateDocId) return;
    setSavingAllowDelete(true);
    try {
      // Use setDoc with merge to create document if it doesn't exist
      const metadataRef = doc(db, "candidate_metadata", candidateDocId);
      await setDoc(
        metadataRef,
        {
          allowIncomingDelete: newValue,
          collectionName: candidateCollection,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
      setAllowIncomingDelete(newValue);
      toast.success(newValue ? "Löschen erlaubt" : "Löschen gesperrt");
    } catch (err) {
      console.error("Failed to update allowIncomingDelete:", err);
      toast.error("Fehler beim Speichern");
    } finally {
      setSavingAllowDelete(false);
    }
  }

  async function handleDeleteIncomingDoc(docId) {
    if (!candidateDocId || !candidateCollection) return;
    const incomingDocs = docCv?.incomingDocuments || {};
    const docData = incomingDocs[docId];
    if (!docData?.url) return;

    setDeletingIncomingDoc((prev) => ({ ...prev, [docId]: true }));
    try {
      await deleteUploadedFile(docData.url);
      const updatedIncoming = { ...incomingDocs };
      delete updatedIncoming[docId];
      await updateDocument(candidateCollection, candidateDocId, {
        incomingDocuments: updatedIncoming,
      });
      toast.success("Dokument gelöscht");
    } catch (err) {
      console.error("Failed to delete incoming doc:", err);
      toast.error("Fehler beim Löschen");
    } finally {
      setDeletingIncomingDoc((prev) => ({ ...prev, [docId]: false }));
    }
  }

  async function handleDownloadIncomingDoc(url, fileName) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Download fehlgeschlagen");
    }
  }

  const outgoingEntries = useMemo(
    () =>
      Object.entries(outgoingDocs || {}).filter(
        ([, v]) => v && typeof v === "object" && String(v?.url || "").trim(),
      ),
    [outgoingDocs],
  );

  const outgoingAnyBusy = useMemo(
    () => Object.values(outgoingBusyById || {}).some(Boolean),
    [outgoingBusyById],
  );

  function getOutgoingDocState(templateId) {
    const key = String(templateId || "").trim();
    const raw = outgoingDocs?.[key];
    return raw && typeof raw === "object" ? raw : {};
  }

  function cloneOutgoingDocsState(map) {
    if (!map || typeof map !== "object" || Array.isArray(map)) {
      return {};
    }
    const cloned = {};
    for (const key of Object.keys(map)) {
      const value = map[key];
      cloned[key] =
        value && typeof value === "object" && !Array.isArray(value)
          ? { ...value }
          : value;
    }
    return cloned;
  }

  async function persistOutgoingDocs(updater) {
    if (remoteMode) return false;
    if (!candidateCollection || !candidateDocId) return false;

    const prevStateRaw =
      outgoingDocsRef.current &&
      typeof outgoingDocsRef.current === "object" &&
      !Array.isArray(outgoingDocsRef.current)
        ? outgoingDocsRef.current
        : {};
    const prevSnapshot = cloneOutgoingDocsState(prevStateRaw);

    const nextCandidate =
      typeof updater === "function"
        ? updater(cloneOutgoingDocsState(prevSnapshot))
        : updater || {};

    const nextState = cloneOutgoingDocsState(nextCandidate);

    outgoingDocsRef.current = nextState;
    setOutgoingDocs(nextState);

    try {
      await updateDocument(candidateCollection, candidateDocId, {
        outgoingDocuments: nextState,
        outgoingDocumentsUpdatedAt: Date.now(),
      });
      return true;
    } catch (e) {
      toast.error("Hujjatlar bo'limini saqlashda xatolik.");
      outgoingDocsRef.current = prevSnapshot;
      setOutgoingDocs(prevSnapshot);
      return false;
    }
  }

  async function deleteOutgoingDocFromState(tplId) {
    return persistOutgoingDocs((current) => {
      const next = { ...current };
      delete next[tplId];
      return next;
    });
  }

  async function deleteOutgoingDocRemoteFirst(tplId, options = {}) {
    const safeId = String(tplId || "").trim();
    if (!safeId) return { ok: false, remoteMissing: false };

    const currentSnapshot =
      options?.current && typeof options.current === "object"
        ? options.current
        : getOutgoingDocState(safeId);
    const url = String(
      options?.urlOverride ?? currentSnapshot?.url ?? "",
    ).trim();

    let remoteMissing = false;
    if (url) {
      try {
        await deleteUploadedFile(url);
      } catch (err) {
        // Handle both HTTP 404 status and Firebase storage/object-not-found error
        if (
          Number(err?.status) === 404 ||
          err?.code === "storage/object-not-found"
        ) {
          remoteMissing = true;
        } else {
          throw err;
        }
      }
    }

    const persisted = await deleteOutgoingDocFromState(safeId);
    return { ok: Boolean(persisted), remoteMissing };
  }

  async function deleteDocumentRemoteFirst(url, documentType, index) {
    const safeUrl = String(url || "").trim();
    if (!safeUrl) return { ok: false, remoteMissing: false };

    // Soft delete: only mark for deletion in UI, actual deletion happens on save
    setDocumentsMarkedForDeletion((prev) => ({
      ...prev,
      [documentType]: [...(prev[documentType] || []), { url, index }],
    }));

    toast.success(
      "Dokument zum Löschen markiert. Wird beim Speichern endgültig gelöscht.",
    );
    return { ok: true, remoteMissing: false };
  }

  async function generateAndUploadBeratungsvertrag(options = {}) {
    const omitPassportPage = Boolean(options?.omitPassportPage);
    // Load template defaults from Firestore (same source as Contract template page)
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "beratungsvertrag",
    );
    const savedForm =
      templateDoc &&
      typeof templateDoc === "object" &&
      templateDoc.form &&
      typeof templateDoc.form === "object"
        ? templateDoc.form
        : null;

    const firstName = String(formCv?.personalInfo?.name || "").trim();
    const lastName = String(formCv?.personalInfo?.lastName || "").trim();
    const city =
      String(addressFields?.city || "").trim() ||
      String(
        parseGermanAddress(formCv?.personalInfo?.address || "")?.city || "",
      ).trim();

    const baseForm = {
      firstName: "",
      lastName: "",
      contractDate: todayDdMmYyyy(),
      candidateCity: "",
      pdfGeneratedDate: todayDdMmYyyy(),
      feeTotalEur: "1200",
      feeAdvanceEur: "250",
      signatureCity: "",
      pdfUrl: "",
    };

    const merged = {
      ...baseForm,
      ...(savedForm ? savedForm : {}),
      firstName,
      lastName,
      candidateCity: city,
      signatureCity: city,
      pdfGeneratedDate: todayDdMmYyyy(),
    };

    const passportUrls = Array.isArray(formCv?.documents?.passport)
      ? formCv.documents.passport
          .map((u) => String(u || "").trim())
          .filter(Boolean)
      : [];
    const diplomaUrls = Array.isArray(formCv?.documents?.diplomas)
      ? formCv.documents.diplomas
          .map((u) => String(u || "").trim())
          .filter(Boolean)
      : [];
    // Source priority:
    // 1) Reisepass (passport) — desired default for Beratungsvertrag page
    // 2) Fallback: Diplome (if passport is missing)
    const docUrls = omitPassportPage
      ? []
      : Array.from(
          new Set([
            ...(passportUrls.length ? passportUrls : []),
            ...(!passportUrls.length ? diplomaUrls : []),
          ]),
        );
    let passportSrc = "";
    let usedPassportUrl = "";
    // Try all candidate passport URLs until we can successfully embed one.
    for (const u of docUrls) {
      // eslint-disable-next-line no-await-in-loop
      const extracted = await fetchUrlAsImageDataUrlBestEffort(u);
      if (extracted) {
        passportSrc = extracted;
        usedPassportUrl = u;
        break;
      }
      // Fallback: if it's a direct image URL and extraction failed, let react-pdf fetch the image itself.
      const looksImage = /\.(png|jpe?g|webp)$/i.test(u);
      if (looksImage) {
        passportSrc = buildProxyAssetUrl(u) || u;
        usedPassportUrl = u;
        break;
      }
    }
    if (!passportSrc && docUrls.length) {
    }

    const fileBase =
      firstName || lastName
        ? `Beratungsvertrag ${[firstName, lastName].filter(Boolean).join(" ")}`
        : "Beratungsvertrag";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Beratungsvertrag";

    const blob = await pdf(
      <BeratungsvertragPdfDocument
        form={merged}
        passportImageDataUrl={passportSrc || null}
      />,
    ).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToFirebase(file, "outgoing");
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  }

  async function generateAndUploadVermittlungsvertrag() {
    // Load template defaults from Firestore (same source as Contract template page)
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "vermittlungsvertrag",
    );
    const savedForm =
      templateDoc &&
      typeof templateDoc === "object" &&
      templateDoc.form &&
      typeof templateDoc.form === "object"
        ? templateDoc.form
        : null;

    const firstName = String(formCv?.personalInfo?.name || "").trim();
    const lastName = String(formCv?.personalInfo?.lastName || "").trim();
    const birthPlace = String(formCv?.personalInfo?.birthPlace || "").trim();
    const street = String(addressFields?.street || "").trim();
    const houseNumber = String(addressFields?.houseNumber || "").trim();
    const postalCode = String(addressFields?.postalCode || "").trim();
    const city = String(addressFields?.city || "").trim();
    const country = String(addressFields?.country || "").trim();

    const baseForm = {
      candidateFirstName: "",
      candidateLastName: "",
      candidateStreet: "",
      candidateHouseNumber: "",
      candidatePLZ: "",
      candidateBirthPlace: "",
      candidateLand: "",
      contractDurationYears: "2",
      signatureDate: todayDdMmYyyy(),
      signatureCity: "",
    };

    const merged = {
      ...baseForm,
      ...(savedForm ? savedForm : {}),
      candidateFirstName: firstName,
      candidateLastName: lastName,
      candidateStreet: street,
      candidateHouseNumber: houseNumber,
      candidatePLZ: postalCode,
      candidateBirthPlace: birthPlace,
      candidateLand: country,
      signatureCity: city,
      signatureDate: todayDdMmYyyy(),
    };

    const fileBase =
      firstName || lastName
        ? `Vermittlungsvertrag ${[firstName, lastName]
            .filter(Boolean)
            .join(" ")}`
        : "Vermittlungsvertrag";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Vermittlungsvertrag";

    const blob = await pdf(
      <VermittlungsvertragPdfDocument form={merged} />,
    ).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToFirebase(file, "outgoing");
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  }

  async function generateAndUploadVollmacht() {
    // Load template defaults from Firestore (same source as Contract template page)
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "vollmacht",
    );
    const savedForm =
      templateDoc && typeof templateDoc.form === "object"
        ? templateDoc.form
        : {};

    // Merge with current candidate data
    const firstName = String(formCv?.personalInfo?.name || "").trim();
    const lastName = String(formCv?.personalInfo?.lastName || "").trim();
    const birthDate = String(formCv?.personalInfo?.birthDate || "").trim();
    const city = String(addressFields?.city || "").trim();
    const date = todayDdMmYyyy();

    const merged = {
      ...savedForm,
      firstName,
      lastName,
      birthDate,
      city,
      date,
    };

    const fileBase =
      firstName || lastName
        ? `Vollmacht ${[firstName, lastName].filter(Boolean).join(" ")}`
        : "Vollmacht";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Vollmacht";

    const blob = await pdf(<VollmachtPdfDocument form={merged} />).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToFirebase(file, "outgoing");
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  }

  async function generateAndUploadVollmachtArbeitgeber() {
    // Load template defaults from Firestore (same source as Contract template page)
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "vollmacht_arbeitgeber",
    );
    const savedForm =
      templateDoc && typeof templateDoc.form === "object"
        ? templateDoc.form
        : {};

    // Merge with current candidate data
    const firstName = String(formCv?.personalInfo?.name || "").trim();
    const lastName = String(formCv?.personalInfo?.lastName || "").trim();
    const birthDate = String(formCv?.personalInfo?.birthDate || "").trim();
    const birthPlace = String(formCv?.personalInfo?.birthPlace || "").trim();
    const phone = String(formCv?.personalInfo?.phone || "").trim();
    const email = String(formCv?.personalInfo?.email || "").trim();
    const date = todayDdMmYyyy();

    const merged = {
      ...savedForm,
      candidateFirstName: firstName,
      candidateLastName: lastName,
      candidateBirthDate: birthDate,
      candidateBirthPlace: birthPlace,
      candidateStreet: addressFields?.street || "",
      candidateHouseNumber: addressFields?.houseNumber || "",
      candidatePostalCode: addressFields?.postalCode || "",
      candidateCity: addressFields?.city || "",
      candidateCountry: addressFields?.country || "",
      candidatePhone: phone,
      candidateEmail: email,
      candidatePlaceDate: date,
    };

    const fileBase =
      firstName || lastName
        ? `Vollmacht an Arbeitgeber ${[firstName, lastName]
            .filter(Boolean)
            .join(" ")}`
        : "Vollmacht an Arbeitgeber";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() ||
      "Vollmacht an Arbeitgeber";

    const blob = await pdf(
      <VollmachtArbeitgeberPdfDocument form={merged} />,
    ).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToFirebase(file, "outgoing");
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  }

  async function generateAndUploadRozilikXati() {
    // Load template defaults from Firestore
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "rozilik_xati",
    );
    const savedForm =
      templateDoc && typeof templateDoc.form === "object"
        ? templateDoc.form
        : {};

    // Merge with current candidate data
    const firstName = String(formCv?.personalInfo?.name || "").trim();
    const lastName = String(formCv?.personalInfo?.lastName || "").trim();
    const gender = String(formCv?.personalInfo?.gender || "").trim();
    const birthDate = String(formCv?.personalInfo?.birthDate || "").trim();
    const birthPlace = String(formCv?.personalInfo?.birthPlace || "").trim();
    const phone = String(formCv?.personalInfo?.phone || "").trim();
    const address = String(formCv?.personalInfo?.address || "").trim();

    // Get last education (ausbildung or last education entry)
    let oqishJoyi = "";
    const educationList = Array.isArray(formCv?.education)
      ? formCv.education
      : [];
    if (educationList.length > 0) {
      const sorted = sortTimelineItemsDesc([...educationList]);
      const last = sorted[0];
      oqishJoyi = String(last?.school || last?.institution || "").trim();
    }

    // Map gender to Uzbek
    let jinsi = "";
    if (gender) {
      const g = gender.toLowerCase();
      if (g === "male" || g === "männlich" || g === "erkak") {
        jinsi = "Erkak";
      } else if (g === "female" || g === "weiblich" || g === "ayol") {
        jinsi = "Ayol";
      } else {
        jinsi = gender;
      }
    }

    const date = todayDdMmYyyy();

    const merged = {
      ...savedForm,
      nomzodIsm: firstName,
      nomzodFamilya: lastName,
      nomzodJinsi: jinsi,
      nomzodTugilganSana: birthDate,
      nomzodManzil: address,
      nomzodOqishJoyi: oqishJoyi,
      nomzodTelefon: phone,
      joy: birthPlace,
      sana: date,
    };

    const fileBase =
      firstName || lastName
        ? `Rozilik xati ${[firstName, lastName].filter(Boolean).join(" ")}`
        : "Rozilik xati";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Rozilik xati";

    const blob = await pdf(<RozilikXatiPdfDocument form={merged} />).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToFirebase(file, "outgoing");
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  }

  async function generateAndUploadNomzodRozilikXati() {
    // Load template defaults from Firestore
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "nomzod_rozilik_xati",
    );
    const savedForm =
      templateDoc && typeof templateDoc.form === "object"
        ? templateDoc.form
        : {};

    // Merge with current candidate data
    const firstName = String(formCv?.personalInfo?.name || "").trim();
    const lastName = String(formCv?.personalInfo?.lastName || "").trim();
    const nomzodIsmFamilya = [firstName, lastName].filter(Boolean).join(" ");

    const date = todayDdMmYyyy();

    const merged = {
      ...savedForm,
      sana: date,
      nomzodIsmFamilya: nomzodIsmFamilya,
    };

    const fileBase = nomzodIsmFamilya
      ? `Nomzod rozilik xati ${nomzodIsmFamilya}`
      : "Nomzod rozilik xati";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Nomzod rozilik xati";

    const blob = await pdf(
      <NomzodRozilikXatiPdfDocument form={merged} />,
    ).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToFirebase(file, "outgoing");
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  }

  async function generateAndUploadMitarbeiterwohnung() {
    // Load template defaults from Firestore
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "mitarbeiterwohnung",
    );
    const savedForm =
      templateDoc && typeof templateDoc.form === "object"
        ? templateDoc.form
        : {};

    // Merge with current candidate data
    const firstName = String(formCv?.personalInfo?.name || "").trim();
    const lastName = String(formCv?.personalInfo?.lastName || "").trim();
    const kandidatName = [lastName, firstName].filter(Boolean).join(" ");

    const date = todayDdMmYyyy();

    const merged = {
      ...savedForm,
      datum: date,
      kandidatName: kandidatName,
    };

    const fileBase = kandidatName
      ? `Mitarbeiterwohnung ${kandidatName}`
      : "Mitarbeiterwohnung";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Mitarbeiterwohnung";

    const blob = await pdf(
      <MitarbeiterwohnungPdfDocument form={merged} />,
    ).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToFirebase(file, "outgoing");
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  }

  async function generateAndUploadSprachsbestaetigung() {
    // Load template defaults from Firestore
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "sprachsbestaetigung",
    );
    const savedForm =
      templateDoc && typeof templateDoc.form === "object"
        ? templateDoc.form
        : {};

    // Merge with current candidate data
    const firstName = String(formCv?.personalInfo?.name || "").trim();
    const lastName = String(formCv?.personalInfo?.lastName || "").trim();
    const kandidatName = [lastName, firstName].filter(Boolean).join(" ");

    const date = todayDdMmYyyy();

    const merged = {
      ...savedForm,
      datum: date,
      kandidatName: kandidatName,
    };

    const fileBase = kandidatName
      ? `Sprachsbestaetigung ${kandidatName}`
      : "Sprachsbestaetigung";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Sprachsbestaetigung";

    const blob = await pdf(
      <SprachsbestaetigungPdfDocument form={merged} />,
    ).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToFirebase(file, "outgoing");
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  }

  async function generateAndUploadEinwilligungserklaerung() {
    // Load template defaults from Firestore
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "einwilligungserklaerung",
    );
    const savedForm =
      templateDoc && typeof templateDoc.form === "object"
        ? templateDoc.form
        : {};

    // Merge with current candidate data
    const vorname = String(formCv?.personalInfo?.name || "").trim();
    const nachname = String(formCv?.personalInfo?.lastName || "").trim();
    const geburtsort = String(formCv?.personalInfo?.birthPlace || "").trim();
    const gender = String(formCv?.personalInfo?.gender || "")
      .trim()
      .toLowerCase();
    const anpirede = gender === "male" ? "Herr" : "Frau";

    const date = todayDdMmYyyy();

    const merged = {
      ...savedForm,
      datum: date,
      vorname: vorname,
      nachname: nachname,
      geburtsort: geburtsort,
      anpirede: anpirede,
    };

    const fullName = [nachname, vorname].filter(Boolean).join(" ");
    const fileBase = fullName
      ? `Einwilligungserklaerung ${fullName}`
      : "Einwilligungserklaerung";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Einwilligungserklaerung";

    const blob = await pdf(
      <EinwilligungserklaerungPdfDocument form={merged} />,
    ).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToFirebase(file, "outgoing");
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  }

  async function generateAndUploadFotoVideoRozilik() {
    // Load template defaults from Firestore
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "foto_video_rozilik",
    );
    const savedForm =
      templateDoc && typeof templateDoc.form === "object"
        ? templateDoc.form
        : {};

    // Merge with current candidate data
    const vorname = String(formCv?.personalInfo?.name || "").trim();
    const nachname = String(formCv?.personalInfo?.lastName || "").trim();
    const fullName = [nachname, vorname].filter(Boolean).join(" ");
    const birthDate = String(formCv?.personalInfo?.birthDate || "").trim();
    const birthPlace = String(formCv?.personalInfo?.birthPlace || "").trim();
    const address = String(formCv?.personalInfo?.address || "").trim();

    const date = todayDdMmYyyy();

    const merged = {
      ...savedForm,
      fullName: fullName,
      geburtsdatum: birthDate,
      adresse: address,
      geburtsort: birthPlace,
      datum: date,
    };

    const fileBase = fullName
      ? `Foto-Video-Rozilik ${fullName}`
      : "Foto-Video-Rozilik";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Foto-Video-Rozilik";

    const blob = await pdf(
      <FotoVideoRozilikPdfDocument form={merged} />,
    ).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToFirebase(file, "outgoing");
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  }

  async function generateAndUploadPersonalfragebogen() {
    // Load template defaults from Firestore
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "personalfragebogen",
    );
    const savedForm =
      templateDoc && typeof templateDoc.form === "object"
        ? templateDoc.form
        : {};

    // Merge with current candidate data
    const vorname = String(formCv?.personalInfo?.name || "").trim();
    const nachname = String(formCv?.personalInfo?.lastName || "").trim();
    const birthDate = String(formCv?.personalInfo?.birthDate || "").trim();
    const birthPlace = String(formCv?.personalInfo?.birthPlace || "").trim();
    const address = String(formCv?.personalInfo?.address || "").trim();
    const geschlecht = String(
      docCv?.persoenlicheDaten?.geschlecht || "",
    ).trim();

    // Extract country from berufserfahrung[0].ort (e.g. "Navoiy , Usbekistan" -> "Usbekistan")
    const firstJobOrt = String(docCv?.berufserfahrung?.[0]?.ort || "").trim();
    const ortParts = firstJobOrt.split(",");
    const countryFromOrt =
      ortParts.length > 1 ? ortParts[ortParts.length - 1].trim() : "";
    const staatsangehoerigkeit = countryFromOrt || "usbekisch";

    const date = todayDdMmYyyy();

    const merged = {
      ...savedForm,
      nachname: nachname,
      vorname: vorname,
      wohnadresseUsbekistan: address,
      geburtsdatum: birthDate,
      geburtsort: birthPlace,
      geschlecht: geschlecht,
      staatsangehoerigkeit: staatsangehoerigkeit,
      datum: date,
    };

    const fullName = [nachname, vorname].filter(Boolean).join(" ");
    const fileBase = fullName
      ? `Personalfragebogen ${fullName}`
      : "Personalfragebogen";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Personalfragebogen";

    const blob = await pdf(
      <PersonalfragebogenPdfDocument form={merged} />,
    ).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToFirebase(file, "outgoing");
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  }

  async function handleToggleOutgoingDoc(template, nextEnabled, options = {}) {
    const tpl = template || {};
    const templateId = String(tpl.id || "").trim();
    if (!templateId) return;
    if (remoteMode) return;
    if (outgoingBusyById?.[templateId]) return;
    const forceRegenerate = Boolean(options?.forceRegenerate);

    const prev = getOutgoingDocState(templateId);
    const nextMap = { ...(outgoingDocs || {}) };

    // If turning OFF: delete the document completely (both remote file and state)
    if (!nextEnabled) {
      try {
        setOutgoingBusyById((p) => ({ ...(p || {}), [templateId]: true }));
        const { ok } = await deleteOutgoingDocRemoteFirst(templateId, {
          current: prev,
        });
        if (!ok) {
          toast.error("Hujjatni o'chirishda xatolik.");
        }
      } catch (e) {
        toast.error("Hujjatni o'chirishda xatolik.");
      } finally {
        setOutgoingBusyById((p) => ({ ...(p || {}), [templateId]: false }));
      }
      return;
    }

    // Turning ON:
    // If we already have an uploaded URL, enable without re-uploading (unless forced).
    const existingUrl = String(prev?.url || "").trim();
    if (existingUrl && !forceRegenerate) {
      await persistOutgoingDocs((current) => {
        const next = { ...current };
        next[templateId] = {
          ...(current?.[templateId] || {}),
          enabled: true,
          updatedAt: Date.now(),
        };
        return next;
      });
      return;
    }

    try {
      setOutgoingBusyById((p) => ({ ...(p || {}), [templateId]: true }));

      let generated = null;
      let omitPassportPage = false;
      if (templateId === "beratungsvertrag") {
        const hasPassportAttachment = Array.isArray(formCv?.documents?.passport)
          ? formCv.documents.passport.some((u) => String(u || "").trim())
          : false;
        if (!hasPassportAttachment) {
          const confirmed = await askContinueWithoutPassport();
          if (!confirmed) {
            return;
          }
          omitPassportPage = true;
        }
      }
      if (templateId === "beratungsvertrag") {
        generated = await generateAndUploadBeratungsvertrag({
          omitPassportPage,
        });
      } else if (templateId === "vermittlungsvertrag") {
        generated = await generateAndUploadVermittlungsvertrag();
      } else if (templateId === "vollmacht") {
        generated = await generateAndUploadVollmacht();
      } else if (templateId === "vollmacht_arbeitgeber") {
        generated = await generateAndUploadVollmachtArbeitgeber();
      } else if (templateId === "rozilik_xati") {
        generated = await generateAndUploadRozilikXati();
      } else if (templateId === "nomzod_rozilik_xati") {
        generated = await generateAndUploadNomzodRozilikXati();
      } else if (templateId === "mitarbeiterwohnung") {
        generated = await generateAndUploadMitarbeiterwohnung();
      } else if (templateId === "sprachsbestaetigung") {
        generated = await generateAndUploadSprachsbestaetigung();
      } else if (templateId === "einwilligungserklaerung") {
        generated = await generateAndUploadEinwilligungserklaerung();
      } else if (templateId === "foto_video_rozilik") {
        generated = await generateAndUploadFotoVideoRozilik();
      } else if (templateId === "personalfragebogen") {
        generated = await generateAndUploadPersonalfragebogen();
      } else {
        throw new Error(`Unknown document template: ${templateId}`);
      }

      const persisted = await persistOutgoingDocs((current) => ({
        ...current,
        [templateId]: {
          ...(current?.[templateId] || {}),
          enabled: true,
          url: String(generated?.url || "").trim(),
          fileName: String(generated?.fileName || "").trim() || null,
          uploadedAt: Date.now(),
          updatedAt: Date.now(),
        },
      }));
      if (persisted) {
        toast.success("PDF tayyor bo‘ldi va upload qilindi.");
      }
    } catch (e) {
      toast.error("Fehler beim Erstellen oder Hochladen der PDF.");
    } finally {
      setOutgoingBusyById((p) => ({ ...(p || {}), [templateId]: false }));
    }
  }

  async function handleDeleteOutgoingDoc(templateId) {
    const tplId = String(templateId || "").trim();
    if (!tplId) return;
    if (remoteMode) return;
    if (outgoingBusyById?.[tplId]) return;

    const current = getOutgoingDocState(tplId);

    try {
      setOutgoingBusyById((p) => ({ ...(p || {}), [tplId]: true }));
      const { ok, remoteMissing } = await deleteOutgoingDocRemoteFirst(tplId, {
        current,
      });
      if (ok) {
        toast.success(
          remoteMissing
            ? "Link o‘chirildi (fayl allaqachon yo‘q edi)."
            : "Link o‘chirildi.",
        );
      } else {
        toast.error("Linkni o‘chirishda xatolik.");
      }
    } catch (e) {
      toast.error("Linkni o‘chirishda xatolik.");
    } finally {
      setOutgoingBusyById((p) => ({ ...(p || {}), [tplId]: false }));
    }
  }

  async function handleDeleteAllOutgoingDocs() {
    if (remoteMode) return;
    if (outgoingBulkBusy) return;
    if (outgoingAnyBusy) return;
    if (!candidateCollection || !candidateDocId) return;
    if (Boolean(sendingStepValue)) return;

    const entriesSnapshot = Array.isArray(outgoingEntries)
      ? [...outgoingEntries]
      : [];
    if (!entriesSnapshot.length) return;

    const ids = entriesSnapshot
      .map(([docId]) => String(docId || "").trim())
      .filter(Boolean);
    if (!ids.length) return;

    setOutgoingBulkBusy(true);
    setOutgoingBusyById((prev) => {
      const next = { ...(prev || {}) };
      ids.forEach((id) => {
        next[id] = true;
      });
      return next;
    });

    const missingIds = new Set();
    const removedIds = new Set();
    let hadError = false;

    try {
      for (const [docId, value] of entriesSnapshot) {
        const tplId = String(docId || "").trim();
        if (!tplId) continue;
        try {
          const { ok, remoteMissing } = await deleteOutgoingDocRemoteFirst(
            tplId,
            { current: value },
          );
          if (ok) {
            removedIds.add(tplId);
            if (remoteMissing) missingIds.add(tplId);
          } else {
            hadError = true;
          }
        } catch (error) {
          hadError = true;
        }
      }

      if (removedIds.size) {
        const removedAll = removedIds.size === entriesSnapshot.length;
        const missingSuffix = missingIds.size
          ? " (ba'zi fayllar allaqachon yo‘q edi)."
          : "";
        const successMessage = removedAll
          ? `Barcha linklar o‘chirildi${missingSuffix}`
          : `Ba'zi linklar o‘chirildi${missingSuffix}`;
        toast.success(successMessage);
      }
      if (hadError) {
        toast.error("Ba'zi linklarni o‘chirishda xatolik yuz berdi.");
      }
    } finally {
      setOutgoingBusyById((prev) => {
        const next = { ...(prev || {}) };
        ids.forEach((id) => {
          next[id] = false;
        });
        return next;
      });
      setOutgoingBulkBusy(false);
    }
  }

  const commentHtml = useMemo(() => getCommentHtml(formCv), [formCv]);
  const hasComment = useMemo(
    () => hasRichTextContent(commentHtml),
    [commentHtml],
  );
  const commentChanged = useMemo(
    () => String(commentHtml || "") !== String(commentBaseline || ""),
    [commentHtml, commentBaseline],
  );

  const normalizedDocForm = useMemo(() => {
    if (!docCv) return null;
    return normalizeForm(mapDocToForm(docCv));
  }, [docCv]);

  const normalizedCurrentForm = useMemo(() => normalizeForm(formCv), [formCv]);

  const [savedBaselineJson, setSavedBaselineJson] = useState("");

  const currentFormJson = useMemo(
    () => JSON.stringify(normalizedCurrentForm),
    [normalizedCurrentForm],
  );

  const hasUnsavedChanges = useMemo(() => {
    if (remoteMode) return false;
    if (!savedBaselineJson) return false;
    const formChanged = savedBaselineJson !== currentFormJson;
    const hasDocumentsMarkedForDeletion = Object.values(
      documentsMarkedForDeletion,
    ).some((arr) => arr.length > 0);

    // Debug logging
    if (formChanged && savedBaselineJson && currentFormJson) {
      console.log("=== FORM CHANGED DEBUG ===");
      console.log("Baseline length:", savedBaselineJson.length);
      console.log("Current length:", currentFormJson.length);

      // Find first difference
      const minLen = Math.min(savedBaselineJson.length, currentFormJson.length);
      for (let i = 0; i < minLen; i++) {
        if (savedBaselineJson[i] !== currentFormJson[i]) {
          console.log("First difference at position", i);
          console.log(
            "Baseline:",
            savedBaselineJson.substring(Math.max(0, i - 50), i + 50),
          );
          console.log(
            "Current:",
            currentFormJson.substring(Math.max(0, i - 50), i + 50),
          );
          break;
        }
      }
    }

    return formChanged || hasDocumentsMarkedForDeletion;
  }, [
    savedBaselineJson,
    currentFormJson,
    remoteMode,
    documentsMarkedForDeletion,
  ]);

  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
  const unsavedBlocker = useBlocker(
    Boolean(hasUnsavedChanges) && !Boolean(isSaving),
  );

  useEffect(() => {
    if (unsavedBlocker.state === "blocked") {
      setUnsavedModalOpen(true);
    }
  }, [unsavedBlocker.state]);

  useEffect(() => {
    if (!hasUnsavedChanges && unsavedModalOpen) {
      setUnsavedModalOpen(false);
    }
  }, [hasUnsavedChanges, unsavedModalOpen]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const message =
      "Sie haben ungespeicherte Änderungen. Wenn Sie die Seite verlassen, gehen diese Änderungen verloren.";
    function onBeforeUnload(e) {
      e.preventDefault();
      // Most browsers ignore custom text, but setting returnValue is required to trigger the prompt.
      e.returnValue = message;
      return message;
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);

  function stayOnGeneratePage() {
    setUnsavedModalOpen(false);
    unsavedBlocker.reset?.();
  }

  function leaveGeneratePage() {
    setUnsavedModalOpen(false);
    unsavedBlocker.proceed?.();
  }

  function handleCancel() {
    if (!docCv) return;
    const mapped = mapDocToForm(docCv);
    setFormCv(normalizeForm(mapped));
    setCommentBaseline(getCommentHtml(mapped));
    setIsCommentEditorOpen(false);
    setPhoneTouched(false);
    setPassportTouched(false);
    setEmailTouched(false);
    setRecentlyAdded({ soft: [], pc: [] });
    // Clear documents marked for deletion
    setDocumentsMarkedForDeletion({
      passport: [],
      diplomas: [],
      certificates: [],
    });
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
    // Only auto-update postal code after form is initialized and baseline is set
    // This prevents unwanted changes during initial load
    if (!formInitialized || !baselineInitializedRef.current) return;

    const currentCity = addressFields?.city;

    // Only update postal code if city was actually changed by user
    // Don't update if city is being set for the first time from Firestore
    if (previousCityRef.current && previousCityRef.current !== currentCity) {
      if (currentCity && REGION_POSTAL_CODES[currentCity]) {
        const postalCode = REGION_POSTAL_CODES[currentCity];
        if (addressFields.postalCode !== postalCode) {
          applyAddressFields({
            ...addressFields,
            postalCode: postalCode,
          });
        }
      }
    }

    // Update previous city reference
    previousCityRef.current = currentCity;
  }, [addressFields?.city, formInitialized]);

  useEffect(() => {
    // Auto-update postal code when birthPlace (Geburtsort) changes
    if (!formInitialized || !baselineInitializedRef.current) return;

    const currentBirthPlace = formCv?.personalInfo?.birthPlace;

    // Only update postal code if birthPlace was actually changed by user
    if (
      previousBirthPlaceRef.current &&
      previousBirthPlaceRef.current !== currentBirthPlace
    ) {
      if (currentBirthPlace && REGION_POSTAL_CODES[currentBirthPlace]) {
        const postalCode = REGION_POSTAL_CODES[currentBirthPlace];
        if (addressFields.postalCode !== postalCode) {
          applyAddressFields({
            ...addressFields,
            postalCode: postalCode,
          });
        }
      }
    }

    // Update previous birthPlace reference
    previousBirthPlaceRef.current = currentBirthPlace;
  }, [formCv?.personalInfo?.birthPlace, formInitialized]);

  useEffect(() => {
    const key = String(major || "").trim();
    if (!key) {
      setResolvedMajor({ collectionName: "", title: "", linkId: "" });
      setMetaInfo(null);
      setNotFound(true);
      setLoading(false);
      setMetaLoading(false);
      return () => {};
    }

    setMetaLoading(true);
    let gotFirst = false;
    const unsub = subscribeToMetaByName(
      key,
      (data) => {
        gotFirst = true;
        if (data) {
          setResolvedMajor({
            collectionName:
              data.collectionName || data.slug || data.name || key,
            title: data.title || data.collectionName || key,
            linkId: data.linkId || data.uuid || data.id || key,
          });
          setMetaInfo(data || null);
        } else {
          // Meta doc is optional; candidate collection can still exist.
          setResolvedMajor({
            collectionName: key,
            title: key,
            linkId: key,
          });
          setMetaInfo(null);
        }
        setMetaLoading(false);
      },
      (e) => {
        if (!gotFirst) {
          setResolvedMajor({
            collectionName: key,
            title: key,
            linkId: key,
          });
          setMetaInfo(null);
          setMetaLoading(false);
        }
      },
    );

    return () => unsub?.();
  }, [major]);

  // Preload telegram group names when meta changes (best-effort)
  useEffect(() => {
    const ids = [
      String(metaInfo?.interviewInternal?.telegramGroupId || "").trim(),
      String(metaInfo?.interviewLeadership?.telegramGroupId || "").trim(),
      String(metaInfo?.interviewEmployer?.telegramGroupId || "").trim(),
    ].filter(Boolean);
    if (ids.length === 0) return;
    ids.forEach((id) => {
      if (telegramGroupNameCacheRef.current?.[id]) return;
      // best-effort (no await)
      ensureTelegramGroupName(id);
    });
  }, [
    metaInfo?.interviewInternal?.telegramGroupId,
    metaInfo?.interviewLeadership?.telegramGroupId,
    metaInfo?.interviewEmployer?.telegramGroupId,
    ensureTelegramGroupName,
  ]);

  useEffect(() => {
    if (!remoteMode) return undefined;
    // Fast path: if navigation passed the record via route state, render immediately.
    if (stateRemoteRecord) {
      setRemoteRecord(stateRemoteRecord);
      setRemoteLoading(false);
      return undefined;
    }
    setRemoteLoading(true);
    let cancelled = false;
    (async () => {
      try {
        if (remoteKind === "archived") {
          if (archivedDocId) {
            const snap = await getDoc(doc(db, "archived_users", archivedDocId));
            if (!cancelled) {
              setRemoteRecord(
                snap.exists() ? { id: snap.id, ...snap.data() } : null,
              );
            }
            return;
          }
          // Legacy fallback: allow previewing remote registry records if rid is provided.
          const rec = await getRemoteUserRecord("archived", remoteRid || id);
          if (!cancelled) setRemoteRecord(rec || null);
        } else if (remoteKind === "all") {
          const rec = await getRemoteUserRecord("all", remoteRid || id);
          if (!cancelled) setRemoteRecord(rec || null);
        } else if (remoteKind === "deleted") {
          if (!deletedDocId) {
            if (!cancelled) setRemoteRecord(null);
            return;
          }
          const snap = await getDoc(doc(db, "deleted_users", deletedDocId));
          if (!cancelled) {
            setRemoteRecord(
              snap.exists() ? { id: snap.id, ...snap.data() } : null,
            );
          }
        } else {
          if (!cancelled) setRemoteRecord(null);
        }
      } catch (e) {
        if (!cancelled) setRemoteRecord(null);
      } finally {
        if (!cancelled) setRemoteLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    remoteMode,
    remoteKind,
    remoteRid,
    deletedDocId,
    archivedDocId,
    id,
    stateRemoteRecord,
  ]);

  useEffect(() => {
    if (!remoteMode) return undefined;
    const unsub = subscribeToCollections((list) => {
      setMajors(Array.isArray(list) ? list : []);
    });
    return () => unsub?.();
  }, [remoteMode]);

  useEffect(() => {
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (remoteMode) return undefined;
    if (!col || !docId) {
      setNotFound(true);
      setLoading(false);
      return undefined;
    }

    // Reset states when navigating to new candidate
    setLoading(true);
    setNotFound(false);
    setDocCv(null);
    setFormInitialized(false);
    formInitializedRef.current = false;
    baselineInitializedRef.current = false;
    previousCityRef.current = "";
    previousBirthPlaceRef.current = "";
    setSavedBaselineJson("");

    const ref = doc(db, col, docId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          setDocCv(null);
        } else {
          const data = snap.data() || null;
          if (DEBUG_GENERATE) {
            const debugPayload = {
              path: { collection: col, id: docId },
              data,
              meta: {
                hasPendingWrites: Boolean(snap?.metadata?.hasPendingWrites),
                fromCache: Boolean(snap?.metadata?.fromCache),
              },
            };
            // Expose for easy inspection in DevTools
            try {
              window.__generateCandidateSnapshot = debugPayload;
            } catch {
              // ignore
            }
          }
          const status = data?.status || {};
          setStatusValue(
            normalizeCandidateStatusValue(
              status?.value || CANDIDATE_STATUS_DEFAULT,
            ) || CANDIDATE_STATUS_DEFAULT,
          );
          setStatusUpdatedAt(status?.updatedAt || null);
          setStatusUpdatedBy(status?.updatedBy || "");
          setReaction(data?.reaction || null);
          setDocCv(data);

          // Console'ga kandidat ma'lumotlarini chiqarish
          console.log("=== KANDIDAT MA'LUMOTLARI ===");
          console.log("To'liq ma'lumot:", data);
          console.log("Shaxsiy ma'lumotlar:", data?.persoenlicheDaten);
          console.log("Email Meta:", data?.emailMeta);
          console.log("Kommentar Meta:", data?.commentarMeta);
          console.log("Status:", data?.status);
          console.log("Berufserfahrung:", data?.berufserfahrung);
          console.log("Ausbildung:", data?.ausbildung);
          console.log("Faehigkeiten:", data?.faehigkeiten);
          console.log("Documents:", data?.documents);
          console.log("===========================");

          const cMeta = data?.commentarMeta || {};
          setCommentMeta({
            updatedAt: cMeta?.updatedAt || null,
            updatedByName: cMeta?.updatedByName || "",
            updatedByPhoto: cMeta?.updatedByPhoto || "",
            updatedByUid: cMeta?.updatedByUid || "",
          });
          const eMeta = data?.emailMeta || {};
          setEmailMeta({
            count: eMeta?.count || 0,
            lastSentAt: eMeta?.lastSentAt || null,
            lastSentBy: eMeta?.lastSentBy || "",
            lastSentByUid: eMeta?.lastSentByUid || "",
            lastSentByName: eMeta?.lastSentByName || "",
            lastSentByPhoto: eMeta?.lastSentByPhoto || "",
            lastSentType: eMeta?.lastSentType || "",
          });

          // Fetch avatar from users collection by UID if photo is missing
          if (eMeta?.lastSentByUid && !eMeta?.lastSentByPhoto) {
            getUserFromFirestore(eMeta.lastSentByUid)
              .then((userData) => {
                if (userData && (userData.avatar || userData.photoURL)) {
                  setEmailMetaAvatarFromUsers(
                    userData.avatar || userData.photoURL,
                  );
                }
              })
              .catch(() => {});
          } else {
            setEmailMetaAvatarFromUsers("");
          }

          setNotFound(false);

          // Only update form on initial load, not on subsequent Firestore updates
          // This prevents hasUnsavedChanges from being triggered incorrectly
          if (!formInitializedRef.current) {
            const mapped = mapDocToForm(data);
            console.log("🔄 Mapped form data:", mapped);
            console.log("🎓 Mapped education:", mapped.education);
            const normalized = normalizeForm(mapped);
            console.log("✨ Normalized form data:", normalized);
            console.log("🎓 Normalized education:", normalized.education);
            setFormCv(normalized);
            setFormInitialized(true);
            formInitializedRef.current = true;

            // Set baseline immediately after form is initialized
            if (!baselineInitializedRef.current) {
              const baseline = JSON.stringify(normalized);
              setSavedBaselineJson(baseline);
              baselineInitializedRef.current = true;
            }

            // Don't show "success" validation colors on initial load.
            setPhoneTouched(false);
            setEmailTouched(false);
          }
        }
        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [resolvedMajor.collectionName, id]);

  useEffect(() => {
    if (!remoteMode) return undefined;
    // In remote-mode we render the page using remoteRecord (read-only preview).
    // Email send / stage actions are only available after restoring to Firebase.
    if (remoteLoading) return undefined;

    if (!remoteRecord) {
      setDocCv(null);
      setNotFound(true);
      setLoading(false);
      return undefined;
    }

    try {
      setDocCv(remoteRecord);
      const mapped = mapDocToForm(remoteRecord);
      const normalized = normalizeForm(mapped);
      setFormCv(normalized);
      setFormInitialized(true);
      formInitializedRef.current = true;

      // Set baseline for remote mode
      if (!baselineInitializedRef.current) {
        const baseline = JSON.stringify(normalized);
        setSavedBaselineJson(baseline);
        baselineInitializedRef.current = true;
      }

      setNotFound(false);
      setLoading(false);
    } catch (e) {
      setDocCv(null);
      setNotFound(true);
      setLoading(false);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteMode, remoteLoading, remoteRecord]);

  useEffect(() => {
    if (!formInitialized || passportToastShownRef.current) return;
    const passportNumber = String(
      formCv?.personalInfo?.passportNumber || "",
    ).trim();
    const hasPassportDoc = Array.isArray(formCv?.documents?.passport)
      ? formCv.documents.passport.some((u) => String(u || "").trim())
      : false;

    passportToastShownRef.current = true;
  }, [
    formInitialized,
    formCv?.personalInfo?.passportNumber,
    formCv?.documents?.passport,
  ]);

  useEffect(() => {
    return () => {
      if (missingPassportResolverRef.current) {
        missingPassportResolverRef.current(false);
        missingPassportResolverRef.current = null;
      }
    };
  }, []);

  function pickFirstNonEmptyString(values) {
    for (const v of values) {
      const s = String(v ?? "").trim();
      if (s) return s;
    }
    return "";
  }

  function extractEmailFromSnapshot(record) {
    const r = record && typeof record === "object" ? record : {};
    return pickFirstNonEmptyString([
      r?.persoenlicheDaten?.email,
      r?.personalInfo?.email,
      r?.personalData?.email,
      r?.email,
    ]);
  }

  function extractPassportIdFromSnapshot(record) {
    const r = record && typeof record === "object" ? record : {};
    return pickFirstNonEmptyString([
      r?.passportId,
      r?.passportID,
      r?.passportNumber,
      r?.reisepassNummer,
      r?.persoenlicheDaten?.reisepassNummer,
      r?.persoenlicheDaten?.passportId,
      r?.persoenlicheDaten?.passportID,
      r?.persoenlicheDaten?.passportNumber,
      r?.personalInfo?.passportNumber,
      r?.personalInfo?.reisepassNummer,
      r?.personalData?.passportNumber,
      r?.personalData?.reisepassNummer,
    ]);
  }

  function stripDeletedUserMetaForRestore(record) {
    const r = record && typeof record === "object" ? record : {};
    const omit = new Set([
      "id",
      "sourceMajor",
      "sourceDocId",
      "sourceMajorTitle",
      "deletedAt",
      "deletedBy",
      "email",
    ]);
    const out = {};
    Object.keys(r).forEach((k) => {
      if (!omit.has(k)) out[k] = r[k];
    });
    return out;
  }

  function stripArchivedUserMetaForRestore(record) {
    const r = record && typeof record === "object" ? record : {};
    const omit = new Set([
      "id",
      "sourceMajor",
      "sourceDocId",
      "sourceMajorTitle",
      "archivedAt",
      "archivedBy",
      "email",
    ]);
    const out = {};
    Object.keys(r).forEach((k) => {
      if (!omit.has(k)) out[k] = r[k];
    });
    return out;
  }

  async function restoreFromRemoteMode() {
    if (!remoteMode) return;
    if (restoreBusy) return;
    if (!remoteRecord) {
      toast.error("Remote-Kandidat nicht gefunden.");
      return;
    }
    try {
      setRestoreBusy(true);

      // Resolve default major from record
      const rawMajor = String(
        remoteRecord?.sourceMajor ||
          remoteRecord?.major ||
          remoteRecord?.collectionName ||
          "",
      ).trim();

      let majorKey = rawMajor;
      let resolvedMeta = null;
      if (majorKey) {
        try {
          resolvedMeta = await getMetaByName(majorKey);
        } catch {
          resolvedMeta = null;
        }
      }

      // Always open Berufsfeld selection modal to allow choosing any major
      setMajorModalKey(majorKey || "");
      setMajorModalOpen(true);
      return;

      // Restore based on source
      if (remoteKind === "all") {
        const res = await restoreRemoteRecordToFirebase({
          kind: "all",
          record: remoteRecord,
          restoredBy: user?.email || user?.uid || "admin",
          majorOverride: resolvedMeta.collectionName,
          majorLabel: resolvedMeta.title || resolvedMeta.collectionName,
        });
        toast.success(`Wiederhergestellt: ${res.major} (ID=${res.firebaseId})`);
        navigate(
          `/generate/${resolvedMeta.linkId || res.major}/${res.firebaseId}`,
        );
        return;
      }

      if (remoteKind === "archived") {
        if (archivedDocId) {
          const majorCol = resolvedMeta.collectionName;
          const majorLabel =
            String(remoteRecord?.sourceMajorTitle || "").trim() ||
            resolvedMeta.title ||
            majorCol;
          const payload = stripArchivedUserMetaForRestore(remoteRecord);
          const { id: newId } = await addCandidateWithDualStats(
            majorCol,
            payload,
            {
              majorLabel,
            },
          );

          const email = extractEmailFromSnapshot(payload);
          const passportId = extractPassportIdFromSnapshot(payload);
          if (email) {
            await upsertEmailAndPassIdFirestore({
              email,
              major: majorCol,
              passportId,
            });
          }

          await deleteDoc(doc(db, "archived_users", archivedDocId));

          toast.success(`Wiederhergestellt: ${majorCol} (ID=${newId})`);
          navigate(`/generate/${resolvedMeta.linkId || majorCol}/${newId}`);
          return;
        }

        // Legacy fallback (remote registry)
        const res = await restoreRemoteRecordToFirebase({
          kind: "archived",
          record: remoteRecord,
          restoredBy: user?.email || user?.uid || "admin",
          majorOverride: resolvedMeta.collectionName,
          majorLabel: resolvedMeta.title || resolvedMeta.collectionName,
        });
        toast.success(`Wiederhergestellt: ${res.major} (ID=${res.firebaseId})`);
        navigate(
          `/generate/${resolvedMeta.linkId || res.major}/${res.firebaseId}`,
        );
        return;
      }

      if (remoteKind === "deleted") {
        if (!deletedDocId) {
          toast.error("deletedDocId nicht gefunden.");
          return;
        }
        const majorCol = resolvedMeta.collectionName;
        const majorLabel =
          String(remoteRecord?.sourceMajorTitle || "").trim() ||
          resolvedMeta.title ||
          majorCol;
        const payload = stripDeletedUserMetaForRestore(remoteRecord);
        const { id: newId } = await addCandidateWithDualStats(
          majorCol,
          payload,
          {
            majorLabel,
          },
        );

        const email = extractEmailFromSnapshot(payload);
        const passportId = extractPassportIdFromSnapshot(payload);
        if (email) {
          await upsertEmailAndPassIdFirestore({
            email,
            major: majorCol,
            passportId,
          });
        }

        if (deletedDocId) {
          await deleteDoc(doc(db, "deleted_users", deletedDocId));
        }

        toast.success(`Wiederhergestellt: ${majorCol} (ID=${newId})`);
        navigate(`/generate/${resolvedMeta.linkId || majorCol}/${newId}`);
        return;
      }

      toast.error("Remote-Quelle unbekannt (kind).");
    } catch (e) {
      toast.error("Fehler beim Wiederherstellen.");
    } finally {
      setRestoreBusy(false);
    }
  }

  async function confirmRestoreFromModal() {
    if (!majorModalKey) {
      toast.error("Bitte wählen Sie zuerst einen Bereich (Major) aus.");
      return;
    }
    try {
      setRestoreBusy(true);
      const meta = await getMetaByName(majorModalKey);
      const col = String(meta?.collectionName || "").trim();
      if (!col) {
        toast.error("Bereich (Major) wurde nicht gefunden.");
        return;
      }
      setMajorModalOpen(false);

      if (remoteKind === "archived" || remoteKind === "all") {
        // Keep legacy remote restore support only for `all`. Archived is Firestore-based when archivedDocId exists.
        if (remoteKind === "all") {
          const res = await restoreRemoteRecordToFirebase({
            kind: "all",
            record: remoteRecord,
            restoredBy: user?.email || user?.uid || "admin",
            majorOverride: col,
            majorLabel: meta?.title || col,
          });
          toast.success(
            `Wiederhergestellt: ${meta?.title || res.major} (ID=${
              res.firebaseId
            })`,
          );
          navigate(`/generate/${meta.linkId || col}/${res.firebaseId}`);
          return;
        }
        if (remoteKind === "archived") {
          if (archivedDocId) {
            const majorLabel =
              String(remoteRecord?.sourceMajorTitle || "").trim() ||
              meta?.title ||
              col;
            const payload = stripArchivedUserMetaForRestore(remoteRecord);
            const { id: newId } = await addCandidateWithDualStats(
              col,
              payload,
              {
                majorLabel,
              },
            );
            const email = extractEmailFromSnapshot(payload);
            const passportId = extractPassportIdFromSnapshot(payload);
            if (email) {
              await upsertEmailAndPassIdFirestore({
                email,
                major: col,
                passportId,
              });
            }
            await deleteDoc(doc(db, "archived_users", archivedDocId));
            toast.success(
              `Wiederhergestellt: ${meta?.title || col} (ID=${newId})`,
            );
            navigate(`/generate/${meta.linkId || col}/${newId}`);
            return;
          }

          const res = await restoreRemoteRecordToFirebase({
            kind: "archived",
            record: remoteRecord,
            restoredBy: user?.email || user?.uid || "admin",
            majorOverride: col,
            majorLabel: meta?.title || col,
          });
          toast.success(
            `Wiederhergestellt: ${meta?.title || res.major} (ID=${
              res.firebaseId
            })`,
          );
          navigate(`/generate/${meta.linkId || col}/${res.firebaseId}`);
          return;
        }
      }

      if (remoteKind === "deleted") {
        if (!deletedDocId) {
          toast.error("deletedDocId nicht gefunden.");
          return;
        }

        const majorLabel =
          String(remoteRecord?.sourceMajorTitle || "").trim() ||
          meta?.title ||
          col;
        const payload = stripDeletedUserMetaForRestore(remoteRecord);
        const { id: newId } = await addCandidateWithDualStats(col, payload, {
          majorLabel,
        });
        const email = extractEmailFromSnapshot(payload);
        const passportId = extractPassportIdFromSnapshot(payload);
        if (email) {
          await upsertEmailAndPassIdFirestore({
            email,
            major: col,
            passportId,
          });
        }
        if (deletedDocId) {
          await deleteDoc(doc(db, "deleted_users", deletedDocId));
        }
        toast.success(`Wiederhergestellt: ${meta?.title || col} (ID=${newId})`);
        navigate(`/generate/${meta.linkId || col}/${newId}`);
        return;
      }

      toast.error("Remote-Quelle unbekannt (kind).");
    } catch (e) {
      toast.error("Fehler beim Wiederherstellen.");
    } finally {
      setRestoreBusy(false);
    }
  }

  function mapDocToForm(data) {
    // NOTE: Historically we had multiple Firestore schemas.
    // - New (Create.jsx): `persoenlicheDaten.email`
    // - Older: `personalInfo.email` (or sometimes root `email`)
    // We normalize here so Generate always displays email if it exists anywhere.
    const p = data?.persoenlicheDaten || {};
    const legacyPersonal = data?.personalInfo || data?.personal || {};
    const rawLicense = p?.fuehrerschein;
    const rawLicenseType = p?.fuehrerscheinTyp;
    const licenseTypeFromLegacy =
      typeof rawLicense === "string" &&
      rawLicense &&
      !["ja", "true", "nein", "false"].includes(
        String(rawLicense).trim().toLowerCase(),
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
      rawLicenseType || licenseTypeFromLegacy || "",
    )
      .trim()
      .toUpperCase();

    const rawBerufe = Array.isArray(data?.berufserfahrung)
      ? data.berufserfahrung
      : [];
    const normalizeWorkRecord = (rec) => {
      const r = rec && typeof rec === "object" ? rec : {};
      const beginn = pickFirstNonEmptyString([
        r?.beginn,
        r?.startDate,
        r?.startdatum,
        r?.startDatum,
        r?.von,
        r?.from,
      ]);
      const ende = pickFirstNonEmptyString([
        r?.ende,
        r?.endDate,
        r?.enddatum,
        r?.endDatum,
        r?.bis,
        r?.to,
      ]);
      const position = pickFirstNonEmptyString([r?.position, r?.role]);
      const unternehmen = pickFirstNonEmptyString([r?.unternehmen, r?.company]);
      const ort = pickFirstNonEmptyString([r?.ort, r?.location]);
      const aufgaben = Array.isArray(r?.aufgaben)
        ? r.aufgaben
        : Array.isArray(r?.responsibilities)
          ? r.responsibilities
          : [];
      if (
        !beginn &&
        !ende &&
        !position &&
        !unternehmen &&
        !ort &&
        aufgaben.length === 0
      )
        return null;
      return {
        beginn: String(beginn || ""),
        ende: String(ende || ""),
        position: String(position || ""),
        unternehmen: String(unternehmen || ""),
        ort: String(ort || ""),
        aufgaben,
      };
    };
    const berufe = rawBerufe.map(normalizeWorkRecord).filter(Boolean);

    // Normalize Ausbildung to canonical array of {beginn, ende, bildungseinrichtung, abschluss}
    let ausb = [];
    const rawAusbildung =
      data?.ausbildung ??
      data?.education ??
      data?.ausbildungen ??
      data?.Ausbildung ??
      data?.bildung ??
      null;

    const normalizeEduRecord = (rec) => {
      const r = rec && typeof rec === "object" ? rec : {};
      const beginn = pickFirstNonEmptyString([
        r?.beginn,
        r?.startDate,
        r?.startdatum,
        r?.startDatum,
        r?.von,
        r?.from,
      ]);
      const ende = pickFirstNonEmptyString([
        r?.ende,
        r?.endDate,
        r?.enddatum,
        r?.endDatum,
        r?.bis,
        r?.to,
      ]);
      const bildungseinrichtung = pickFirstNonEmptyString([
        r?.bildungseinrichtung,
        r?.bildungseinrichtungAufDeutsch,
        r?.bildungseinrichtungDeutsch,
        r?.bildungseinrichtung_de,
        r?.bildungseinrichtungDE,
        r?.institution,
        r?.schule,
        r?.university,
        r?.college,
      ]);
      const abschluss = pickFirstNonEmptyString([
        r?.abschluss,
        r?.abschlussAufDeutsch,
        r?.abschlussDeutsch,
        r?.abschluss_de,
        r?.abschlussDE,
        r?.degree,
        r?.studiengang,
      ]);
      if (!beginn && !ende && !bildungseinrichtung && !abschluss) return null;
      return {
        beginn: String(beginn || ""),
        ende: String(ende || ""),
        bildungseinrichtung: String(bildungseinrichtung || ""),
        abschluss: String(abschluss || ""),
      };
    };

    const pushEdu = (rec) => {
      if (Array.isArray(rec)) {
        rec.forEach(pushEdu);
        return;
      }
      const normalized = normalizeEduRecord(rec);
      if (normalized) ausb.push(normalized);
    };

    const normalizeKey = (k) => {
      const base = String(k || "")
        .trim()
        .toLowerCase();
      try {
        // Avoid Unicode property escapes for broad browser compatibility.
        return base
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");
      } catch {
        return base.replace(/[^a-z0-9]/g, "");
      }
    };

    if (DEBUG_GENERATE) {
      console.log("🔍 AUSBILDUNG DEBUG:", {
        raw: rawAusbildung,
        isArray: Array.isArray(rawAusbildung),
        isObject: rawAusbildung && typeof rawAusbildung === "object",
        type: typeof rawAusbildung,
        keys:
          rawAusbildung && typeof rawAusbildung === "object"
            ? Object.keys(rawAusbildung)
            : [],
      });
    }

    if (Array.isArray(rawAusbildung)) {
      rawAusbildung.forEach(pushEdu);
    } else if (rawAusbildung && typeof rawAusbildung === "object") {
      const eduObj = rawAusbildung;
      const entries = Object.entries(eduObj);
      const findValueByAliases = (aliases) => {
        const wanted = new Set(aliases.map(normalizeKey));
        for (const [k, v] of entries) {
          if (wanted.has(normalizeKey(k))) return v;
        }
        return undefined;
      };

      const schoolVal = findValueByAliases([
        "schule",
        "school",
        "maktab",
        "schulen",
      ]);
      const collegeVal = findValueByAliases([
        "kollej",
        "college",
        "kollejlitsey",
        "litsey",
        "lyceum",
        "lice",
      ]);
      const uniVal = findValueByAliases([
        "universitat",
        "universitaet",
        "universitet",
        "university",
        "uni",
      ]);

      if (schoolVal !== undefined) pushEdu(schoolVal);
      if (collegeVal !== undefined) pushEdu(collegeVal);
      if (uniVal !== undefined) pushEdu(uniVal);

      // Fallback: if object doesn't match known keys but contains a single record.
      if (ausb.length === 0) {
        const normalizedRoot = normalizeEduRecord(eduObj);
        if (normalizedRoot) {
          ausb.push(normalizedRoot);
        } else {
          // Last resort: try to parse each value as a record.
          for (const [, v] of entries) pushEdu(v);
        }
      }
    }

    if (DEBUG_GENERATE) {
      console.log("📊 Total education entries extracted:", ausb.length, ausb);
    }

    const normalizeMonth = (value) => {
      const toYyyyMm = (v) => {
        if (v === null || v === undefined) return "";
        if (typeof v === "string") return v.trim();
        if (typeof v === "number") {
          const d = new Date(v);
          if (!Number.isNaN(d.getTime())) {
            const yyyy = String(d.getFullYear());
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            return `${yyyy}-${mm}`;
          }
          return String(v);
        }
        if (v instanceof Date) {
          if (Number.isNaN(v.getTime())) return "";
          const yyyy = String(v.getFullYear());
          const mm = String(v.getMonth() + 1).padStart(2, "0");
          return `${yyyy}-${mm}`;
        }
        if (typeof v === "object") {
          // Firestore Timestamp-like
          if (typeof v.toDate === "function") {
            try {
              return toYyyyMm(v.toDate());
            } catch {
              return "";
            }
          }
          if (typeof v.seconds === "number") {
            return toYyyyMm(new Date(v.seconds * 1000));
          }
        }
        return String(v || "").trim();
      };

      const raw = toYyyyMm(value);
      if (!raw) return "";
      // Convert "yyyy-mm" back to "mm.yyyy" for our form state; keep other formats as-is.
      const from = fromInputMonth(raw);
      return from || raw;
    };

    const f = data?.faehigkeiten || {};
    const docs = data?.documents || {};

    // Read from canonical documents object
    let diplomas = Array.isArray(docs?.diplomas)
      ? docs.diplomas.map((u) => String(u || "").trim()).filter(Boolean)
      : [];

    const certificates = Array.isArray(docs?.certificates)
      ? docs.certificates.map((u) => String(u || "").trim()).filter(Boolean)
      : [];

    const certificatesDetailed = Array.isArray(docs?.certificatesDetailed)
      ? docs.certificatesDetailed.map((cert) => ({
          url: String(cert?.url || "").trim(),
          type: String(cert?.type || "").trim(),
        }))
      : [];

    let passportUnique = Array.isArray(docs?.passport)
      ? docs.passport.map((p) => String(p || "").trim()).filter(Boolean)
      : [];

    // Conservative fallback: only treat a diploma entry as passport if its name
    // looks like a passport (contains "pass" / "reisepass"). This avoids
    // misclassifying real diplomas as passport files.
    if (passportUnique.length === 0 && diplomas.length > 0) {
      const passIdx = diplomas.findIndex((u) =>
        /pass|reisepass/i.test(String(u || "")),
      );
      if (passIdx >= 0) {
        passportUnique = [diplomas[passIdx]];
        diplomas = diplomas.filter((_, i) => i !== passIdx);
      }
    }

    // Avoid showing the same file under both passport and diplomas.
    if (passportUnique.length > 0 && diplomas.length > 0) {
      const passSet = new Set(passportUnique);
      diplomas = diplomas.filter((u) => !passSet.has(u));
    }

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
        passportNumber: normalizePassportNumber(
          p?.reisepassNummer ||
            data?.passportId ||
            p?.passportId ||
            p?.passportNumber ||
            data?.reisepassNummer ||
            "",
        ),
        email: String(
          p.email ||
            legacyPersonal?.email ||
            data?.email ||
            data?.emailAddress ||
            data?.email_address ||
            "",
        ).trim(),
        photo: String(p.foto || ""),
      },
      experience: berufe.map((b) => ({
        startDate: normalizeMonth(b?.beginn),
        endDate: normalizeMonth(b?.ende),
        position: String(b?.position || ""),
        company: String(b?.unternehmen || ""),
        location: String(b?.ort || ""),
        responsibilities: Array.isArray(b?.aufgaben) ? b.aufgaben : [],
      })),
      education: (() => {
        const mappedEducation = ausb.map((a) => ({
          startDate: normalizeMonth(a?.beginn),
          endDate: normalizeMonth(a?.ende),
          institution: String(a?.bildungseinrichtung || ""),
          degree: String(a?.abschluss || ""),
        }));
        if (DEBUG_GENERATE) {
          console.log("📚 Final education array:", mappedEducation);
        }
        return mappedEducation;
      })(),
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
        certificatesDetailed,
        passport: passportUnique,
        noLanguageCertificate: Boolean(docs?.noLanguageCertificate),
      },
      commentar: String(data?.commentar || ""),
    };
  }

  function mapFormToDoc(f) {
    const noChildren = Boolean(f?.personalInfo?.noChildren);
    const passportNumber = normalizePassportNumber(
      f?.personalInfo?.passportNumber || "",
    );

    // Check if languages object is empty
    const languages =
      f.skills?.languages && typeof f.skills.languages === "object"
        ? f.skills.languages
        : {};
    const hasLanguages = Object.keys(languages).length > 0;

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
        reisepassNummer: passportNumber,
        foto: f.personalInfo.photo,
      },
      passportId: passportNumber || null,
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
        sprachen: hasLanguages ? languages : deleteField(),
      },
      documents: {
        diplomas: f.documents?.diplomas || [],
        certificates: f.documents?.certificates || [],
        certificatesDetailed: Array.isArray(f?.documents?.certificatesDetailed)
          ? f.documents.certificatesDetailed.map((cert) => ({
              url: String(cert?.url || "").trim(),
              type: String(cert?.type || "").trim(),
            }))
          : [],
        passport: Array.isArray(f.documents?.passport)
          ? f.documents.passport
          : f.documents?.passport
            ? [f.documents.passport]
            : [],
        noLanguageCertificate: Boolean(f?.documents?.noLanguageCertificate),
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
    } catch (err) {}
  }

  function handleDocumentFileChange(e) {
    if (isLimitedAdmin) return;
    const file = e.target.files?.[0];
    if (!file || !selectedDocumentType) return;

    // Reset the file input
    e.target.value = "";

    // Get German name for toast message
    const typeNames = {
      passport: "Reisepass",
      diplomas: "Diplome",
      certificates: "Zertifikate",
    };
    const typeName = typeNames[selectedDocumentType] || selectedDocumentType;

    // Create a temporary blob URL for preview
    const tempUrl = URL.createObjectURL(file);

    // Add file to pending uploads (will be uploaded on save)
    setPendingDocumentFiles((prev) => ({
      ...prev,
      [selectedDocumentType]: [
        ...(prev[selectedDocumentType] || []),
        { file, tempUrl },
      ],
    }));

    // Update form state with temporary URL for preview
    setFormCv((prev) => {
      const updatedDocs = { ...prev.documents };
      if (!updatedDocs[selectedDocumentType]) {
        updatedDocs[selectedDocumentType] = [];
      }

      // For certificates, also update certificatesDetailed if type is selected
      if (selectedDocumentType === "certificates") {
        // Add to regular certificates array
        updatedDocs[selectedDocumentType] = [
          ...updatedDocs[selectedDocumentType],
          tempUrl,
        ];

        // Also add to certificatesDetailed with empty type (user will set type later)
        const updatedDetailed = Array.isArray(
          prev.documents?.certificatesDetailed,
        )
          ? [...prev.documents.certificatesDetailed, { url: tempUrl, type: "" }]
          : [{ url: tempUrl, type: "" }];

        updatedDocs.certificatesDetailed = updatedDetailed;

        return {
          ...prev,
          documents: updatedDocs,
        };
      } else {
        // For passport and diplomas, just add to regular arrays
        updatedDocs[selectedDocumentType] = [
          ...updatedDocs[selectedDocumentType],
          tempUrl,
        ];

        return {
          ...prev,
          documents: updatedDocs,
        };
      }
    });

    // Reset the selected document type
    setSelectedDocumentType("");

    toast.success(
      `${typeName} hinzugefügt. Klicken Sie auf "Speichern", um hochzuladen.`,
    );
  }

  // Experience handlers
  function addExperience() {
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
    setFormCv((prev) => {
      const next = [...prev.experience];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, experience: sortTimelineItemsDesc(next) };
    });
  }
  function removeExperience(idx) {
    setFormCv((prev) => {
      const next = prev.experience.filter((_, i) => i !== idx);
      return { ...prev, experience: sortTimelineItemsDesc(next) };
    });
  }
  function addResponsibility(expIdx, text) {
    if (!text?.trim()) return;
    setFormCv((prev) => {
      const next = [...prev.experience];
      const resp = [...next[expIdx].responsibilities, text.trim()];
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }
  function removeResponsibility(expIdx, respIdx) {
    setFormCv((prev) => {
      const next = [...prev.experience];
      const resp = next[expIdx].responsibilities.filter(
        (_, i) => i !== respIdx,
      );
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }

  // Education handlers
  function addEducation() {
    setFormCv((prev) => {
      const next = [
        ...(Array.isArray(prev.education) ? prev.education : []),
        { startDate: "", endDate: "", institution: "", degree: "" },
      ];
      return { ...prev, education: sortTimelineItemsDesc(next) };
    });
  }
  function updateEducation(idx, field, value) {
    setFormCv((prev) => {
      const next = [...prev.education];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, education: sortTimelineItemsDesc(next) };
    });
  }
  function removeEducation(idx) {
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
          kind === "soft" ? { ...p, soft: [] } : { ...p, pc: [] },
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
    [formCv.skills.languages],
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
          ([k]) => k !== "" || (k === "" && field === "name" && value !== ""),
        ),
      );
      return { ...prev, skills: { ...prev.skills, languages: nextObj } };
    });
  }
  function removeLanguageRow(rowIdx) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const entries = Object.entries(prev.skills.languages).filter(
        (_, i) => i !== rowIdx,
      );
      const newLanguages = Object.fromEntries(entries);
      console.log("🗑️ Removing language row:", {
        rowIdx,
        oldLanguages: prev.skills.languages,
        newLanguages,
        isEmpty: Object.keys(newLanguages).length === 0,
      });
      return {
        ...prev,
        skills: { ...prev.skills, languages: newLanguages },
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
      // Always persist canonical stage values (backward compatible with legacy status values).
      const normalizedValue =
        normalizeCandidateStatusValue(targetValue) || CANDIDATE_STATUS_DEFAULT;
      const statusMeta = getCandidateStatus(normalizedValue);
      await updateDocument(col, docId, {
        status: {
          value: normalizedValue,
          label: statusMeta.label,
          updatedAt: now,
          updatedBy: user?.email || user?.uid || "admin",
        },
      });
      setStatusValue(normalizedValue);
      setStatusUpdatedAt(now);
      setStatusUpdatedBy(user?.email || user?.uid || "admin");
      if (!silent) {
        toast.success("Status gespeichert.");
      }
      return true;
    } catch (err) {
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

  function getNextStepValue(value, options = {}) {
    const { withLeadership = false } = options;

    // Special case: stage_2 with leadership interview goes to stage_2_result
    if (value === "stage_2" && withLeadership) {
      return "stage_2_result";
    }

    // Special case: stage_2_result always goes to stage_3
    if (value === "stage_2_result") {
      return "stage_3";
    }

    // For other stages, use normal progression (skip stage_2_result if no leadership)
    const steps = CANDIDATE_STATUS_OPTIONS.filter((s) => {
      if (s.value === "stage_2_result" && !withLeadership) {
        return false;
      }
      return true;
    });
    const idx = steps.findIndex((s) => s.value === value);
    if (idx === -1) return null;
    return steps[idx + 1]?.value || null;
  }

  async function sendStatusEmail(
    stepValue,
    { stageDecision: decisionRaw, decisionNote, additionalInfo } = {},
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
          ? stepValue === "stage_2" && selectedExample !== "example2"
            ? createEmptyStageInfo()
            : normalizeStageFormInfo(additionalInfo)
          : createEmptyStageInfo();

      const telegramGroupIdForStage = getTelegramGroupIdForStage(
        metaInfo,
        stepValue,
      );

      if (
        normalizedDecision === "accepted" &&
        (stepValue !== "stage_2" || selectedExample === "example2")
      ) {
        const wantsGeneratedLink = Boolean(info?.useGeneratedLink);
        const hasLink =
          Boolean(info.link) ||
          (wantsGeneratedLink && Boolean(telegramGroupIdForStage));
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

      if (
        normalizedDecision === "accepted" &&
        Boolean(info?.useGeneratedLink) &&
        telegramGroupIdForStage
      ) {
        try {
          const { invite_link } = await generateTelegramInviteLink({
            groupId: telegramGroupIdForStage,
          });
          info.link = invite_link;
          info.linkType = "telegram";
        } catch (e) {
          toast.error("Telegram-Einladungslink konnte nicht erstellt werden.");
          return;
        }
      } else if (
        normalizedDecision === "accepted" &&
        Boolean(info?.useGeneratedLink) &&
        !telegramGroupIdForStage
      ) {
        toast.error("Telegram guruh sozlanmagan (Einstellungen’dan tanlang).");
        return;
      }

      const templateId = makeEmailTemplateId(stepValue, normalizedDecision);
      const templateDoc = emailTemplatesMap?.[templateId] || null;
      const copyOverrides =
        toCopyOverridesFromTemplateDoc(templateDoc) || undefined;

      // Get the base email copy to extract examples
      const baseCopy = getStatusEmailCopy(stepValue, normalizedDecision);

      // Build custom copy overrides based on selected example for stage_2
      let finalCopyOverrides = copyOverrides;
      if (
        stepValue === "stage_2" &&
        normalizedDecision === "accepted" &&
        baseCopy.examples
      ) {
        const selectedExampleData = baseCopy.examples.find(
          (ex) => ex.id === selectedExample,
        );
        if (selectedExampleData) {
          finalCopyOverrides = {
            ...copyOverrides,
            mainText: selectedExampleData.content,
          };
        }
      }

      const dataExchangeLink =
        stepValue === "stage_4" && normalizedDecision === "accepted"
          ? `https://admin.consultinguz.de/dataExchange/${docId}`
          : "";

      // Generate channel invite link for stage_1 accepted candidates
      let channelInviteLink = "";
      if (stepValue === "stage_1" && normalizedDecision === "accepted") {
        try {
          // Get first active channel from Firestore
          const { getDocs, query, collection, where, limit } =
            await import("firebase/firestore");
          const channelsQuery = query(
            collection(db, "telegram_channels"),
            where("active", "==", true),
            limit(1),
          );
          const channelsSnap = await getDocs(channelsQuery);
          if (!channelsSnap.empty) {
            const channelDoc = channelsSnap.docs[0];
            const channelId = channelDoc.id;
            const { invite_link } = await generateTelegramChannelInviteLink({
              channelId,
            });
            channelInviteLink = invite_link;
          }
        } catch (channelErr) {
          console.warn("Channel invite link generation failed:", channelErr);
          // Don't fail the email - channel link is optional
        }
      }

      const { subject, message, htmlContent } = buildStatusEmailTemplate({
        statusValue: stepValue,
        firstName: formCv.personalInfo.name,
        lastName: formCv.personalInfo.lastName,
        stageDecision: normalizedDecision,
        decisionNote,
        additionalInfo: info,
        copyOverrides: finalCopyOverrides,
        dataExchangeLink,
        channelInviteLink,
      });
      const res = await sendBrevoEmail({
        to: recipientEmail,
        subject,
        message,
        htmlContent,
      });
      if (res?.success === false) {
        throw new Error("E-Mail wurde nicht gesendet (success=false).");
      }

      // Send via Telegram if candidate has telegramId
      const candidateTelegramId = docCv?.telegramId;
      if (candidateTelegramId) {
        try {
          await sendStatusViaTelegram({
            telegramId: candidateTelegramId,
            statusValue: stepValue,
            firstName: formCv.personalInfo.name,
            lastName: formCv.personalInfo.lastName,
            stageDecision: normalizedDecision,
            decisionNote,
            additionalInfo: info,
            copyOverrides: finalCopyOverrides,
            dataExchangeLink,
            channelInviteLink,
          });
          toast.success("Nachricht auch per Telegram gesendet! 📱");
        } catch (telegramError) {
          console.error("Telegram send error:", telegramError);
          const errorMsg = telegramError?.message || String(telegramError);
          toast.error(
            `E-Mail wurde gesendet, aber Telegram-Nachricht konnte nicht gesendet werden. Fehler: ${errorMsg}`,
          );
        }
      }

      // Count "sent" telegram invites when email was successfully sent with telegram link
      try {
        const usedTelegramLink =
          String(info?.linkType || "").toLowerCase() === "telegram" &&
          Boolean(telegramGroupIdForStage);

        if (usedTelegramLink) {
          await trackTelegramInviteSent({
            groupId: telegramGroupIdForStage,
            count: 1,
          });
        }
      } catch (e) {
        // Don't fail the email send if counter update fails
        toast.error(
          "E-Mail wurde gesendet, aber Telegram-Zähler konnte nicht aktualisiert werden.",
        );
      }

      toast.success("Status-E-Mail wurde gesendet.");

      // Best-effort: store email send counters for list view (CollectionCv)
      try {
        // Fetch user data from Firestore to get displayName and photoURL
        let userData = null;
        if (user?.uid) {
          userData = await getUserFromFirestore(user.uid);
        }

        const displayName =
          userData?.displayName || user?.displayName || user?.email || "Admin";
        const photoURL =
          userData?.avatar || userData?.photoURL || user?.photoURL || "";

        const stageBase = `stageMeta.${stepValue}`;
        const updatePayload = {
          "emailMeta.count": increment(1),
          "emailMeta.lastSentAt": emailSentAt,
          "emailMeta.lastSentBy": user?.email || user?.uid || "admin",
          "emailMeta.lastSentByUid": user?.uid || "",
          "emailMeta.lastSentByName": displayName,
          "emailMeta.lastSentByPhoto": photoURL,
          "emailMeta.lastSentType": "status",
          "emailMeta.lastSentStage": stepValue,
          "emailMeta.lastSentDecision": normalizedDecision,
          [`${stageBase}.decision`]: normalizedDecision,
          [`${stageBase}.decidedAt`]: emailSentAt,
          [`${stageBase}.decidedBy`]: user?.email || user?.uid || "admin",
          [`${stageBase}.decisionNote`]: String(decisionNote || "").trim(),
        };

        // Mark if stage_2 was sent with leadership interview (example2)
        if (stepValue === "stage_2" && selectedExample === "example2") {
          updatePayload[`${stageBase}.sentWithLeadership`] = true;
        }

        await updateDocument(col, docId, updatePayload);

        // Update local state
        setEmailMeta({
          count: (emailMeta.count || 0) + 1,
          lastSentAt: emailSentAt,
          lastSentBy: user?.email || user?.uid || "admin",
          lastSentByUid: user?.uid || "",
          lastSentByName: displayName,
          lastSentByPhoto: photoURL,
          lastSentType: "status",
        });
      } catch (e) {}

      if (normalizedDecision === "accepted") {
        const withLeadership =
          stepValue === "stage_2" && selectedExample === "example2";
        const nextValue =
          getNextStepValue(stepValue, { withLeadership }) || stepValue;
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

        // Remove user from Telegram groups if they have telegramId
        const candidateTelegramId = docCv?.telegramId;
        if (candidateTelegramId) {
          try {
            toast("Foydalanuvchi Telegram guruhlaridan chiqarilmoqda...", {
              autoClose: 2000,
            });
            const result =
              await removeUserFromTelegramGroups(candidateTelegramId);
            if (result.ok) {
              const msg =
                result.removed > 0
                  ? `Foydalanuvchi ${result.removed} ta guruhdan chiqarildi`
                  : "Foydalanuvchi guruhlarda topilmadi";
              toast.success(msg);
            }
          } catch (removeErr) {
            toast.error(
              "Telegram guruhlaridan chiqarishda xatolik. Davom etilmoqda...",
            );
          }
        }

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
      toast.error(
        "Fehler beim Senden der E-Mail. Bitte später erneut versuchen.",
      );
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

      // 0) Load full candidate doc so we can snapshot it into deleted_users
      const full = await getDocumentDataById(colName, itemId);
      const remotePayload = full && typeof full === "object" ? full : {};

      // 0.5) Delete all document files from Storage (Firebase + json-api)
      const docs = full?.documents || {};
      const allFileUrls = [
        ...(Array.isArray(docs.passport) ? docs.passport : []),
        ...(Array.isArray(docs.diplomas) ? docs.diplomas : []),
        ...(Array.isArray(docs.certificates) ? docs.certificates : []),
        ...(Array.isArray(docs.certificatesDetailed)
          ? docs.certificatesDetailed.map((c) => c?.url).filter(Boolean)
          : []),
      ].filter((url) => typeof url === "string" && url.trim());

      // Also collect outgoing documents
      const outgoing = full?.outgoingDocuments || {};
      const outgoingUrls = Object.values(outgoing)
        .map((doc) => doc?.url)
        .filter((url) => typeof url === "string" && url.trim());

      const allUrls = [...new Set([...allFileUrls, ...outgoingUrls])];

      if (allUrls.length > 0) {
        await Promise.all(
          allUrls.map((url) => deleteUploadedFile(url).catch(() => {})),
        );
      }

      // 1) Remove from Firestore email registry (`email_and_passId`)
      const emailFromDoc = String(full?.persoenlicheDaten?.email || "").trim();
      const targetEmail = String(deleteTarget?.email || emailFromDoc || "")
        .trim()
        .toLowerCase();
      if (targetEmail) {
        await deleteEmailAndPassIdByEmail(targetEmail);
      }

      // 1.5) Store deleted user snapshot in Firestore `deleted_users`
      await saveDeletedUserSnapshotFirestore({
        major: resolvedMajor?.collectionName || colName,
        sourceDocId: itemId,
        majorTitle: resolvedMajor?.title || colName,
        deletedBy: user?.email || user?.uid || "admin",
        payload: {
          major: resolvedMajor?.collectionName || colName,
          ...remotePayload,
        },
      });

      // 2) Delete from Firestore + update LIVE stats (current only)
      await deleteCandidateWithCurrentStats(colName, itemId, {
        majorLabel: resolvedMajor?.title || colName,
      });

      toast.success("Kandidat wurde gelöscht.");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      navigate(`/collectionCv/${resolvedMajor?.linkId || major}`);
    } catch (err) {
      toast.error("Fehler beim Löschen.");
    } finally {
      setIsDeletingCandidate(false);
    }
  }

  async function confirmArchiveCandidate() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Kandidaten zu löschen.");
      return;
    }
    const colName = String(resolvedMajor?.collectionName || "").trim();
    const itemId = String(deleteTarget?.id || "").trim();
    if (!colName || !itemId) return;
    try {
      setIsDeletingCandidate(true);

      // 0) Load full candidate doc (we do NOT delete uploaded file URLs here)
      const full = await getDocumentDataById(colName, itemId);
      const remotePayload = full && typeof full === "object" ? full : {};

      // 1.5) Store archived user snapshot in Firestore `archived_users`
      await saveArchivedUserSnapshotFirestore({
        major: resolvedMajor?.collectionName || colName,
        sourceDocId: itemId,
        majorTitle: resolvedMajor?.title || colName,
        archivedBy: user?.email || user?.uid || "admin",
        payload: {
          major: resolvedMajor?.collectionName || colName,
          ...remotePayload,
        },
      });

      // 2) Delete from Firestore + update LIVE stats (current only)
      await deleteCandidateWithCurrentStats(colName, itemId, {
        majorLabel: resolvedMajor?.title || colName,
      });

      toast.success("Kandidat wurde archiviert.");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      navigate(`/collectionCv/${resolvedMajor?.linkId || major}`);
    } catch (err) {
      toast.error("Fehler beim Archivieren.");
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
        "Im Textbereich muss mindestens 1 Absatz (Haupttext) enthalten sein.",
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
        throw new Error("E-Mail wurde nicht gesendet (success=false).");
      }

      // Send via Telegram if candidate has telegramId
      const candidateTelegramId = docCv?.telegramId;
      if (candidateTelegramId) {
        try {
          await sendEmailViaTelegram({
            telegramId: candidateTelegramId,
            subject: safeSubject,
            htmlContent: finalHtml,
          });
          toast.success("Nachricht auch per Telegram gesendet! 📱");
        } catch (telegramError) {
          toast.error(
            "E-Mail wurde gesendet, aber Telegram-Nachricht konnte nicht gesendet werden.",
          );
        }
      }

      // Count "sent" telegram invites for custom email (if telegram link was included)
      try {
        const usedTelegramLink =
          String(additionalInfo?.linkType || "").toLowerCase() === "telegram";
        const telegramGroupIdForStage = getTelegramGroupIdForStage(
          metaInfo,
          safeStatusValue,
        );

        if (usedTelegramLink && telegramGroupIdForStage) {
          await trackTelegramInviteSent({
            groupId: telegramGroupIdForStage,
            count: 1,
          });
        }
      } catch (e) {
        // Don't fail the email send if counter update fails
      }

      toast.success("Benutzerdefinierte E-Mail wurde gesendet.");

      // Best-effort: store email send counters for list view (CollectionCv)
      try {
        const col = String(resolvedMajor?.collectionName || "").trim();
        const docId = String(id || "").trim();
        if (col && docId) {
          // Fetch user data from Firestore to get displayName and photoURL
          let userData = null;
          if (user?.uid) {
            userData = await getUserFromFirestore(user.uid);
          }

          const displayName =
            userData?.displayName ||
            user?.displayName ||
            user?.email ||
            "Admin";
          const photoURL =
            userData?.avatar || userData?.photoURL || user?.photoURL || "";

          await updateDocument(col, docId, {
            "emailMeta.count": increment(1),
            "emailMeta.lastSentAt": emailSentAt,
            "emailMeta.lastSentBy": user?.email || user?.uid || "admin",
            "emailMeta.lastSentByUid": user?.uid || "",
            "emailMeta.lastSentByName": displayName,
            "emailMeta.lastSentByPhoto": photoURL,
            "emailMeta.lastSentType": "custom",
          });

          // Update local state
          setEmailMeta({
            count: (emailMeta.count || 0) + 1,
            lastSentAt: emailSentAt,
            lastSentBy: user?.email || user?.uid || "admin",
            lastSentByUid: user?.uid || "",
            lastSentByName: displayName,
            lastSentByPhoto: photoURL,
            lastSentType: "custom",
          });
        }
      } catch (e) {}

      setIsCustomEmailModalOpen(false);
    } catch (err) {
      toast.error(
        "Fehler beim Senden der benutzerdefinierten E-Mail. Bitte später erneut versuchen.",
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
      "Kandidatenstufen auf Anfang (Stufe 1) zurücksetzen?\n\nHinweis: Der E-Mail-Zähler wird ebenfalls auf 0 gesetzt.",
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
      toast.error("Fehler beim Zurücksetzen der Stufen.");
    }
  }

  async function resetSingleStage(stageValue) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, die Stufe zurückzusetzen.");
      return;
    }
    if (sendingEmailLockRef.current || sendingStepValue) {
      toast("E-Mail-Vorgang läuft, bitte warten...");
      return;
    }
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;

    try {
      const now = Date.now();
      const statusMeta = getCandidateStatus(stageValue);

      // Prepare update payload
      const updatePayload = {
        status: {
          value: stageValue,
          label: statusMeta.label,
          updatedAt: now,
          updatedBy: user?.email || user?.uid || "admin",
        },
      };

      // Special case: If resetting to stage_2 or earlier, and leadership interview was used,
      // we need to remove the sentWithLeadership flag so stage_2_result is no longer shown
      const hasLeadershipInterview = Boolean(
        docCv?.stageMeta?.stage_2?.sentWithLeadership,
      );

      if (hasLeadershipInterview) {
        // If resetting to stage_2 or stage_1, remove the leadership flag
        if (stageValue === "stage_2" || stageValue === "stage_1") {
          updatePayload["stageMeta.stage_2.sentWithLeadership"] = false;
        }
      }

      await updateDocument(col, docId, updatePayload);

      setStatusValue(stageValue);
      setStatusUpdatedAt(now);
      setStatusUpdatedBy(user?.email || user?.uid || "admin");

      // Update local docCv state to reflect the change
      if (
        hasLeadershipInterview &&
        (stageValue === "stage_2" || stageValue === "stage_1")
      ) {
        setDocCv((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            stageMeta: {
              ...prev.stageMeta,
              stage_2: {
                ...prev.stageMeta?.stage_2,
                sentWithLeadership: false,
              },
            },
          };
        });
      }

      toast.success(`Stufe "${statusMeta.label}" wurde zurückgesetzt.`);
    } catch (e) {
      toast.error("Fehler beim Zurücksetzen der Stufe.");
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
    if (v === "stage_2") {
      // Prefer leadership settings for stage 2; fallback to internal
      return normalizeInterview(
        metaInfo?.interviewLeadership || metaInfo?.interviewInternal,
      );
    }
    if (v === "stage_2_result") {
      // stage_2_result doesn't need interview info, just decision
      return createEmptyStageInfo();
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
      useGeneratedLink: Boolean(raw?.useGeneratedLink),
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
      toast.error("E-mail faqat joriy bosqich uchun yuboriladi.");
      return;
    }
    const initialInfo = getStageAdditionalInfo(stepValue);
    const telegramGroupIdForStage = getTelegramGroupIdForStage(
      metaInfo,
      stepValue,
    );
    const canGenerateTelegramLinkForStage = Boolean(telegramGroupIdForStage);
    // Best-effort: preload group name so modal can show it immediately.
    if (telegramGroupIdForStage) {
      try {
        ensureTelegramGroupName(telegramGroupIdForStage);
      } catch {
        // ignore
      }
    }
    setPendingStageStep(stepValue);
    setStageDecision("accepted");

    const docId = String(id || "").trim();
    const dataExchangeLink =
      stepValue === "stage_4" && docId
        ? `https://admin.consultinguz.de/dataExchange/${docId}`
        : "";

    setStageAdditionalInfoForm({
      dateTime: toDateTimeLocalString(initialInfo?.dateTime),
      link:
        stepValue === "stage_4" && dataExchangeLink
          ? dataExchangeLink
          : String(initialInfo?.link || ""),
      linkType:
        stepValue === "stage_4"
          ? "other"
          : initialInfo?.linkType === "telegram"
            ? "telegram"
            : inferLinkType(initialInfo?.link, "zoom"),
      useGeneratedLink:
        initialInfo?.linkType === "telegram" &&
        canGenerateTelegramLinkForStage &&
        !String(initialInfo?.link || "").trim(),
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

  function openSendDocLinkModal() {
    setIsSendDocLinkModalOpen(true);
  }

  function closeSendDocLinkModal() {
    setIsSendDocLinkModalOpen(false);
  }

  async function handleSendDocLinkSubmit(e, customMessage) {
    e?.preventDefault();
    if (!candidateDocId) {
      toast.error("Keine Dokument-ID vorhanden.");
      return;
    }

    const dataExchangeUrl = `https://admin.consultinguz.de/dataExchange/${candidateDocId}`;
    const candidateEmail = String(formCv.personalInfo.email || "").trim();
    const candidateTelegramId = docCv?.telegramId;

    if (!candidateEmail && !candidateTelegramId) {
      toast.error("Kandidat hat weder E-Mail noch Telegram.");
      return;
    }

    setIsSendingDocLink(true);

    try {
      let emailSent = false;
      let telegramSent = false;

      if (candidateEmail) {
        try {
          const emailSubject = "Dokument-Upload-Link";
          const emailMessage = `${customMessage}\n\n🔗 Link: ${dataExchangeUrl}`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Dokument-Upload</h2>
              <p style="white-space: pre-line;">${customMessage}</p>
              <p style="margin: 20px 0;">
                <a href="${dataExchangeUrl}" 
                   style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  Dokumente hochladen
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">Oder kopieren Sie diesen Link: ${dataExchangeUrl}</p>
            </div>
          `;

          const result = await sendBrevoEmail({
            to: candidateEmail,
            subject: emailSubject,
            message: emailMessage,
            htmlContent: emailHtml,
          });

          if (result.success) {
            emailSent = true;
          } else {
            throw new Error("E-Mail wurde nicht gesendet.");
          }
        } catch (error) {
          console.error("Fehler beim Senden der E-Mail:", error);
          toast.error("Fehler beim Senden der E-Mail.");
        }
      }

      if (candidateTelegramId) {
        try {
          const telegramMessage = `${customMessage}

🔗: ${dataExchangeUrl}

━━━━━━━━━━━━━━━
❗ Agar biror muammo bo'lsa,
👉 @sh_yodgorov bilan bog'laning.

━━━━━━━━━━━━━━━
Ushbu bot va @consulting_uzb kanalida qolishingizni so'raymiz.`;

          await sendEmailViaTelegram({
            telegramId: candidateTelegramId,
            subject: "Hujjat yuklash havolasi",
            htmlContent: telegramMessage,
          });

          telegramSent = true;
        } catch (error) {
          console.error("Fehler beim Senden über Telegram:", error);
          toast.error("Fehler beim Senden über Telegram.");
        }
      }

      if (emailSent || telegramSent) {
        const messages = [];
        if (emailSent) messages.push("E-Mail");
        if (telegramSent) messages.push("Telegram");
        toast.success(
          `Link erfolgreich gesendet via ${messages.join(" und ")}.`,
        );
        closeSendDocLinkModal();
      } else {
        toast.error("Link konnte nicht gesendet werden.");
      }
    } catch (error) {
      console.error("Fehler beim Senden des Links:", error);
      toast.error("Fehler beim Senden des Links.");
    } finally {
      setIsSendingDocLink(false);
    }
  }

  async function handleStageEmailSubmit(e) {
    e?.preventDefault();
    if (!pendingStageStep) {
      setIsStageEmailModalOpen(false);
      return;
    }
    const info =
      pendingStageStep === "stage_2" && selectedExample !== "example2"
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
        ? pendingStageStep === "stage_2" && selectedExample !== "example2"
          ? createEmptyStageInfo()
          : normalizeStageFormInfo(stageAdditionalInfoForm)
        : createEmptyStageInfo();
    try {
      // Preview should reflect the *effective* link choice:
      // - If manual link is used: show it
      // - If auto-generate is selected: show a placeholder (real invite is generated on send)
      const telegramGroupIdForStage = getTelegramGroupIdForStage(
        metaInfo,
        pendingStageStep,
      );
      const wantsGeneratedLink = Boolean(info?.useGeneratedLink);
      if (
        normalizedDecision === "accepted" &&
        (pendingStageStep !== "stage_2" || selectedExample === "example2") &&
        wantsGeneratedLink &&
        telegramGroupIdForStage
      ) {
        info.linkType = "telegram";
        info.link = "Telegram invite link (send paytida avtomatik yaratiladi)";
      }

      const templateId = makeEmailTemplateId(
        pendingStageStep,
        normalizedDecision,
      );
      const templateDoc = emailTemplatesMap?.[templateId] || null;
      const copyOverrides =
        toCopyOverridesFromTemplateDoc(templateDoc) || undefined;

      // Get the base email copy to extract examples
      const baseCopy = getStatusEmailCopy(pendingStageStep, normalizedDecision);

      // Build custom copy overrides based on selected example for stage_2
      let finalCopyOverrides = copyOverrides;
      if (
        pendingStageStep === "stage_2" &&
        normalizedDecision === "accepted" &&
        baseCopy.examples
      ) {
        const selectedExampleData = baseCopy.examples.find(
          (ex) => ex.id === selectedExample,
        );
        if (selectedExampleData) {
          finalCopyOverrides = {
            ...copyOverrides,
            mainText: selectedExampleData.content,
          };
        }
      }

      const { subject, message, htmlContent, examples } =
        buildStatusEmailTemplate({
          statusValue: pendingStageStep,
          firstName: formCv.personalInfo.name,
          lastName: formCv.personalInfo.lastName,
          stageDecision: normalizedDecision,
          decisionNote: "",
          additionalInfo: info,
          copyOverrides: finalCopyOverrides,
        });
      return {
        to: recipientEmail,
        subject,
        message,
        htmlContent,
        examples,
      };
    } catch (err) {
      return {
        to: recipientEmail,
        subject: "",
        message: "",
        htmlContent: "",
        examples: null,
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
    telegramGroupNameById,
    selectedExample,
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
    const intros = [
      // legacy (Uzbek)
      "Arizangiz holatini yangiladik. Quyidagi sharh va keyingi qadamlarni diqqat bilan ko'rib chiqing:",
      // current (German)
      "Wir haben den Status Ihrer Bewerbung aktualisiert. Bitte lesen Sie die folgenden Hinweise und nächsten Schritte sorgfältig durch:",
    ];
    // Remove the exact intro line from both HTML and plain text previews (best-effort).
    let out = raw;
    for (const intro of intros) {
      out = out
        .replace(
          new RegExp(
            `<p[^>]*>\\s*${intro.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&",
            )}\\s*<\\/p>\\s*`,
            "g",
          ),
          "",
        )
        .replace(
          new RegExp(
            `\\s*${intro.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n?`,
            "g",
          ),
          "",
        );
    }
    return out.trim();
  }

  function stripStatusLineFromCustomEmail(value) {
    const raw = String(value || "");
    if (!raw) return raw;
    // HTML header "Status/Holat: <strong>...": remove the entire div line.
    const htmlOut = raw.replace(
      /<div[^>]*>\s*(?:Holat|Status):\s*<strong>[\s\S]*?<\/strong>\s*<\/div>\s*/gi,
      "",
    );
    // Plain text "Status/Holat: ..." line
    return htmlOut
      .replace(/\n?(?:Holat|Status):\s*.*(\n|$)/gi, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const customEmailPreview = useMemo(() => {
    const recipientEmail = String(customEmailForm?.to || "").trim();
    const stage = String(statusValue || "").trim() || CANDIDATE_STATUS_DEFAULT;
    const decision = "accepted";
    const info = getStageAdditionalInfo(stage);
    const { mainText, nextStepNote, hasMain, hasNote } = splitCustomEmailBody(
      customEmailForm?.bodyText,
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
          stripDefaultIntroFromCustomPreview(message),
        ),
        htmlContent: stripStatusLineFromCustomEmail(
          stripDefaultIntroFromCustomPreview(htmlContent),
        ),
      };
    } catch (err) {
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
    console.log("💾 handleSave called");
    if (remoteMode) {
      toast.error(
        "Stellen Sie den Kandidaten zuerst im passenden Bereich (Major) wieder her. Danach können E-Mails versendet werden.",
      );
      return;
    }
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    console.log("📋 Save params:", { col, docId, remoteMode });
    if (!col || !docId) {
      console.log("❌ Save aborted: missing col or docId");
      return;
    }
    const commentHasContent = hasRichTextContent(commentHtml);
    const originalComment = String(docCv?.commentar || "");
    const isCommentUpdated =
      String(commentHtml || "") !== String(originalComment || "");

    let nextCommentMeta = null;
    if (isCommentUpdated) {
      // Fetch user data from Firestore to get displayName and photoURL
      let userData = null;
      if (user?.uid) {
        userData = await getUserFromFirestore(user.uid);
      }

      const displayName =
        userData?.displayName ||
        user?.displayName ||
        user?.email ||
        user?.phoneNumber ||
        "Unbekannt";
      const photoURL =
        userData?.avatar || userData?.photoURL || user?.photoURL || "";

      nextCommentMeta = {
        updatedAt: Date.now(),
        updatedByUid: user?.uid || "",
        updatedByName: displayName,
        updatedByPhoto: photoURL,
      };
    }

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
          "Bitte vollständige Adresse eingeben (Straße, Hausnummer, PLZ, Ort, Land).",
        );
        return;
      }
      const noKids = Boolean(formCv.personalInfo.noChildren);
      const kidsCount = String(formCv.personalInfo.childrenCount || "").trim();
      if (!noKids && !kidsCount) {
        toast.error(
          "Bitte Kinderanzahl eingeben oder 'Keine Kinder' auswählen.",
        );
        return;
      }
    }

    try {
      setIsSaving(true);

      // Upload pending document files to Firebase Storage and build URL mapping
      const hasPendingFiles =
        pendingDocumentFiles.passport.length > 0 ||
        pendingDocumentFiles.diplomas.length > 0 ||
        pendingDocumentFiles.certificates.length > 0;

      // Map of tempUrl -> realUrl for replacing in formCv
      const urlReplacements = {};

      if (hasPendingFiles && !isLimitedAdmin) {
        const folderMap = {
          passport: "passports",
          diplomas: "diplomas",
          certificates: "certificates",
        };

        // Upload all pending files
        for (const docType of ["passport", "diplomas", "certificates"]) {
          const pendingFiles = pendingDocumentFiles[docType] || [];
          if (pendingFiles.length === 0) continue;

          for (const { file, tempUrl } of pendingFiles) {
            // Upload file to Firebase
            const realUrl = await uploadFileToFirebase(
              file,
              folderMap[docType],
            );
            urlReplacements[tempUrl] = realUrl;

            // Revoke the blob URL to free memory
            URL.revokeObjectURL(tempUrl);
          }
        }

        // Clear pending files
        setPendingDocumentFiles({
          passport: [],
          diplomas: [],
          certificates: [],
        });
      }

      // Helper function to replace temp URLs with real URLs
      const replaceUrl = (url) => urlReplacements[url] || url;

      // Create a copy of formCv with replaced URLs for payload
      const formCvWithRealUrls = {
        ...formCv,
        documents: {
          ...formCv.documents,
          passport: Array.isArray(formCv.documents?.passport)
            ? formCv.documents.passport.map(replaceUrl)
            : [],
          diplomas: Array.isArray(formCv.documents?.diplomas)
            ? formCv.documents.diplomas.map(replaceUrl)
            : [],
          certificates: Array.isArray(formCv.documents?.certificates)
            ? formCv.documents.certificates.map(replaceUrl)
            : [],
          certificatesDetailed: Array.isArray(
            formCv.documents?.certificatesDetailed,
          )
            ? formCv.documents.certificatesDetailed.map((cert) => ({
                ...cert,
                url: replaceUrl(cert.url),
              }))
            : [],
        },
      };

      // Update formCv state with real URLs
      if (Object.keys(urlReplacements).length > 0) {
        setFormCv(formCvWithRealUrls);
      }

      const payload = isLimitedAdmin
        ? {
            commentar: String(commentHtml || ""),
            berufserfahrung: Array.isArray(formCv.experience)
              ? formCv.experience.map((exp) => ({
                  beginn: exp?.startDate,
                  ende: exp?.endDate,
                  position: exp?.position,
                  unternehmen: exp?.company,
                  ort: exp?.location,
                  aufgaben: Array.isArray(exp?.responsibilities)
                    ? exp.responsibilities
                    : [],
                }))
              : [],
            ausbildung: Array.isArray(formCv.education)
              ? formCv.education.map((edu) => ({
                  beginn: edu?.startDate,
                  ende: edu?.endDate,
                  bildungseinrichtung: edu?.institution,
                  abschluss: edu?.degree || "",
                }))
              : [],
          }
        : mapFormToDoc(formCvWithRealUrls);
      if (nextCommentMeta) {
        payload.commentarMeta = nextCommentMeta;
      }

      // Normalize languages for persistence (Firestore merge does not remove missing map keys).
      const languageEntries = formCv.skills?.languages
        ? Object.entries(formCv.skills.languages).filter(
            ([key, val]) =>
              key && key.trim() !== "" && val && val.trim() !== "",
          )
        : [];
      const cleanedLanguages = Object.fromEntries(languageEntries);
      const hasLanguages = languageEntries.length > 0;

      console.log("🔍 Language deletion check:", {
        isLimitedAdmin,
        languages: formCv.skills?.languages,
        languageKeys: formCv.skills?.languages
          ? Object.keys(formCv.skills.languages)
          : [],
        languageEntries,
        cleanedLanguages,
        hasLanguages,
      });

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

      // ---- Process documents marked for deletion ----
      const updatedPayload = { ...payload };
      let hasDocumentChanges = false;

      for (const documentType of ["passport", "diplomas", "certificates"]) {
        const markedForDeletion =
          documentsMarkedForDeletion[documentType] || [];
        if (markedForDeletion.length > 0) {
          hasDocumentChanges = true;
          // Delete from JSON API first
          for (const { url } of markedForDeletion) {
            try {
              await deleteUploadedFile(url);
            } catch (err) {
              if (Number(err?.status) === 404) {
              } else {
              }
            }
          }

          // Remove documents from payload
          const currentDocs = updatedPayload.documents?.[documentType] || [];
          const remainingDocs = currentDocs.filter(
            (url, index) =>
              !markedForDeletion.some((marked) => marked.index === index),
          );

          if (!updatedPayload.documents) {
            updatedPayload.documents = {};
          }
          updatedPayload.documents[documentType] = remainingDocs;
        }
      }

      // If documents were changed, recreate payload from updated formCv to ensure consistency
      if (hasDocumentChanges && !isLimitedAdmin) {
        // Create a temporary updated form to generate the correct payload
        const tempUpdatedForm = { ...formCv };
        if (!tempUpdatedForm.documents) {
          tempUpdatedForm.documents = {
            passport: [],
            diplomas: [],
            certificates: [],
          };
        }

        for (const documentType of ["passport", "diplomas", "certificates"]) {
          const markedForDeletion =
            documentsMarkedForDeletion[documentType] || [];
          if (markedForDeletion.length > 0) {
            const currentDocs = tempUpdatedForm.documents[documentType] || [];
            const remainingDocs = currentDocs.filter(
              (url, index) =>
                !markedForDeletion.some((marked) => marked.index === index),
            );
            tempUpdatedForm.documents[documentType] = remainingDocs;
          }
        }

        // Recreate payload with updated form
        const finalPayload = mapFormToDoc(tempUpdatedForm);
        if (nextCommentMeta) {
          finalPayload.commentarMeta = nextCommentMeta;
        }

        // Update Firestore with the correct payload
        await updateCandidateWithDualStats(col, docId, finalPayload, {
          majorLabel: col,
        });
      } else {
        // Use the updated payload for limited admin or when no document changes
        if (isLimitedAdmin) {
          await updateDocument(col, docId, updatedPayload);
        } else {
          await updateCandidateWithDualStats(col, docId, updatedPayload, {
            majorLabel: col,
          });
        }
      }

      // Ensure languages updates are authoritative (overwrite the map or delete it).
      if (!isLimitedAdmin) {
        try {
          await updateDoc(doc(db, col, docId), {
            "faehigkeiten.sprachen": hasLanguages
              ? cleanedLanguages
              : deleteField(),
          });
          console.log(
            hasLanguages
              ? "✅ Languages map overwritten in Firebase"
              : "✅ Languages field deleted from Firebase",
          );
        } catch (langErr) {
          console.error("❌ Error updating languages field:", langErr);
        }
      }

      // Create/update metadata for DataExchange
      // Silently ignore if metadata document doesn't exist
      try {
        await updateDocument("candidate_metadata", docId, {
          collectionName: col,
          updatedAt: Date.now(),
        });
      } catch (metaErr) {
        // Ignore metadata update errors
      }

      // JSON API all_users sync removed as per requirements

      if (shouldSyncEmail) {
        try {
          await updateEmailRemote(oldEmail, newEmail, col);
        } catch (err) {
          toast.error(
            "In Firebase gespeichert, aber Fehler beim Aktualisieren der externen E-Mail-Datenbank.",
          );
        }

        // Update email_and_pass_id collection
        try {
          // Delete old email entry
          if (oldEmail) {
            await deleteEmailAndPassIdByEmail(oldEmail);
          }
          // Add new email entry
          if (newEmail) {
            const passportId = normalizePassportNumber(
              formCv.personalInfo.passportNumber || "",
            );
            await upsertEmailAndPassIdFirestore({
              email: newEmail,
              major: col,
              passportId: passportId || "",
            });
          }
        } catch (err) {
          toast.error(
            "E-Mail wurde in Firebase gespeichert, aber Fehler beim Aktualisieren der E-Mail-Registrierung.",
          );
        }
      }
      if (shouldSyncEmail) {
        toast(
          "E-Mail wurde geändert: Kandidatenstufen wurden auf stage_1 zurückgesetzt.",
        );
      }
      if (isLimitedAdmin) {
        setCommentBaseline(String(commentHtml || ""));
      }

      // Clear documents marked for deletion and update form state
      const hadDocumentsToDelete = Object.values(
        documentsMarkedForDeletion,
      ).some((arr) => arr.length > 0);

      if (hadDocumentsToDelete) {
        // Update formCv to reflect the deleted documents
        setFormCv((prev) => {
          const updated = { ...prev };
          if (!updated.documents) {
            updated.documents = {
              passport: [],
              diplomas: [],
              certificates: [],
            };
          }

          for (const documentType of ["passport", "diplomas", "certificates"]) {
            const markedForDeletion =
              documentsMarkedForDeletion[documentType] || [];
            if (markedForDeletion.length > 0) {
              const currentDocs = updated.documents[documentType] || [];
              const remainingDocs = currentDocs.filter(
                (url, index) =>
                  !markedForDeletion.some((marked) => marked.index === index),
              );
              updated.documents[documentType] = remainingDocs;
            }
          }

          return updated;
        });

        // Clear the deletion marks
        setDocumentsMarkedForDeletion({
          passport: [],
          diplomas: [],
          certificates: [],
        });
      }

      // Update baseline - must happen after all state updates complete
      // Use setTimeout to ensure React has processed all state updates
      setTimeout(() => {
        setSavedBaselineJson(JSON.stringify(normalizedCurrentForm));
      }, 0);

      if (nextCommentMeta) {
        setCommentMeta(nextCommentMeta);
      }
      if (commentHasContent) {
        setIsCommentEditorOpen(false);
      }

      // Show appropriate success message
      if (hadDocumentsToDelete) {
        toast.success(
          isLimitedAdmin
            ? "Kommentar und Dokumente wurden gespeichert."
            : "Änderungen und Dokumente wurden gespeichert.",
        );
      } else {
        toast.success(
          isLimitedAdmin
            ? "Kommentar wurde gespeichert."
            : "Änderungen wurden gespeichert.",
        );
      }
    } catch (e) {
      toast.error("Fehler beim Speichern.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDocumentReady() {
    if (remoteMode) {
      toast.error("Document ready can only be set in edit mode.");
      return;
    }

    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();

    if (!col || !docId) {
      toast.error("Candidate information not found.");
      return;
    }

    const currentStatus = docCv?.documentReady || false;
    const newStatus = !currentStatus;

    try {
      const candidateRef = doc(db, col, docId);

      if (newStatus) {
        // Setting to ready
        await updateDoc(candidateRef, {
          documentReady: true,
          documentReadyAt: Date.now(),
          documentReadyBy: user?.email || user?.uid || "admin",
        });

        // Update local state
        setDocCv((prev) => ({
          ...prev,
          documentReady: true,
          documentReadyAt: Date.now(),
          documentReadyBy: user?.email || user?.uid || "admin",
        }));

        toast.success("Dokument als bereit markiert!");
      } else {
        // Setting to not ready
        await updateDoc(candidateRef, {
          documentReady: false,
          documentReadyAt: null,
          documentReadyBy: null,
        });

        // Update local state
        setDocCv((prev) => ({
          ...prev,
          documentReady: false,
          documentReadyAt: null,
          documentReadyBy: null,
        }));

        toast.success("Dokument als nicht bereit markiert!");
      }
    } catch (err) {
      toast.error("Error updating document ready status.");
      console.error("Error updating document ready:", err);
    }
  }

  async function handleDocumentSend() {
    if (remoteMode) {
      toast.error("Document send can only be set in edit mode.");
      return;
    }

    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();

    if (!col || !docId) {
      toast.error("Candidate information not found.");
      return;
    }

    const currentStatus = docCv?.isDocumentSend || false;
    const newStatus = !currentStatus;

    try {
      const candidateRef = doc(db, col, docId);

      if (newStatus) {
        await updateDoc(candidateRef, {
          isDocumentSend: true,
          isDocumentSendAt: Date.now(),
          isDocumentSendBy: user?.email || user?.uid || "admin",
        });

        setDocCv((prev) => ({
          ...prev,
          isDocumentSend: true,
          isDocumentSendAt: Date.now(),
          isDocumentSendBy: user?.email || user?.uid || "admin",
        }));

        toast.success("Dokument als gesendet markiert!");
      } else {
        await updateDoc(candidateRef, {
          isDocumentSend: false,
          isDocumentSendAt: null,
          isDocumentSendBy: null,
        });

        setDocCv((prev) => ({
          ...prev,
          isDocumentSend: false,
          isDocumentSendAt: null,
          isDocumentSendBy: null,
        }));

        toast.success("Dokument als nicht gesendet markiert!");
      }
    } catch (err) {
      toast.error("Error updating document send status.");
      console.error("Error updating document send:", err);
    }
  }

  async function handleDownloadPdf() {
    if (remoteMode) {
      toast.error(
        "Stellen Sie den Kandidaten zuerst im passenden Bereich (Major) wieder her.",
      );
      return;
    }
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
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ConsultingUz ${safeFileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
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
  const passportNumber = normalizePassportNumber(
    formCv.personalInfo.passportNumber || "",
  );
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

  function askContinueWithoutPassport() {
    if (missingPassportResolverRef.current) {
      missingPassportResolverRef.current(false);
    }
    return new Promise((resolve) => {
      missingPassportResolverRef.current = resolve;
      setMissingPassportModalOpen(true);
    });
  }

  function resolveMissingPassportModal(value) {
    const resolver = missingPassportResolverRef.current;
    missingPassportResolverRef.current = null;
    if (typeof resolver === "function") {
      resolver(value);
    }
  }

  function handleMissingPassportConfirm() {
    setMissingPassportModalOpen(false);
    resolveMissingPassportModal(true);
  }

  function handleMissingPassportCancel() {
    setMissingPassportModalOpen(false);
    resolveMissingPassportModal(false);
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
  const passportOk = isPassportNumberValid(passportNumber);
  const passportWarn = passportNumber.length > 0 && !passportOk;
  const phoneShowOk = phoneTouched && phoneOk;
  const passportShowOk = passportTouched && passportOk;
  const emailShowOk = emailTouched && emailOk;

  // Style overrides for FormInput component

  const layoutClass =
    "flex flex-col lg:flex-row gap-6 items-start lg:items-stretch";

  const formCardLimited =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto";
  const formCardAdmin =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[640px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto";

  const formSectionClass = isLimitedAdmin
    ? `${formCardLimited} flex-1 min-w-0 lg:self-stretch lg:basis-[60%] lg:max-w-[60%] lg:flex-none pb-14`
    : `${formCardAdmin} flex-1 min-w-0 lg:self-stretch lg:basis-[60%] lg:max-w-[60%] lg:flex-none`;

  const canSaveComment = commentChanged && !isSaving && !loading && !notFound;
  const showCommentPreview = !isCommentEditorOpen;
  const commentActionLabel = !isCommentEditorOpen ? "Hinzufügen" : "Abbrechen";
  const showLimitedCommentSaveButton =
    isLimitedAdmin &&
    isCommentEditorOpen &&
    commentChanged &&
    !loading &&
    !notFound;

  const showLimitedAdminSaveButton =
    isLimitedAdmin && !isSaving && !loading && !notFound && hasUnsavedChanges;

  function formatCommentDate(val) {
    if (!val) return "";
    try {
      if (val?.seconds)
        return new Date(val.seconds * 1000).toLocaleString("de-DE");
      if (typeof val === "number") return new Date(val).toLocaleString("de-DE");
      const parsed = new Date(val);
      if (!Number.isNaN(parsed.getTime()))
        return parsed.toLocaleString("de-DE");
    } catch (err) {}
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
                  {commentMeta?.updatedByName || "Unbekannter Benutzer"}
                </div>
                {commentMeta?.updatedAt && (
                  <div className="text-[11px] text-base-content/60">
                    Aktualisiert: {formatCommentDate(commentMeta.updatedAt)}
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
          Kein Kommentar vorhanden.
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

  function handleClearComment() {
    if (!isSuperAdmin) {
      toast.error("Sie haben keine Berechtigung, den Kommentar zu löschen.");
      return;
    }
    const ok = window.confirm(
      "Kommentar wirklich löschen?\n\nHinweis: Diese Änderung wird erst in Firestore gespeichert, wenn Sie auf „Speichern“ klicken.",
    );
    if (!ok) return;
    setCommentHtml("");
    setIsCommentEditorOpen(false);
  }

  function saveCommentToHistory(html) {
    const currentHtml = String(html || "");
    setCommentHistory((prev) => {
      const currentIndex = commentHistoryIndex;
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(currentHtml);
      return newHistory;
    });
    setCommentHistoryIndex((prev) => prev + 1);
  }

  function undoComment() {
    if (commentHistoryIndex > 0) {
      const newIndex = commentHistoryIndex - 1;
      setCommentHistoryIndex(newIndex);
      setCommentHtml(commentHistory[newIndex]);
    }
  }

  function redoComment() {
    if (commentHistoryIndex < commentHistory.length - 1) {
      const newIndex = commentHistoryIndex + 1;
      setCommentHistoryIndex(newIndex);
      setCommentHtml(commentHistory[newIndex]);
    }
  }

  function canUndoComment() {
    return commentHistoryIndex > 0;
  }

  function canRedoComment() {
    return commentHistoryIndex < commentHistory.length - 1;
  }

  async function handleCorrectComment() {
    if (!commentHtml || !commentHtml.trim()) {
      toast.error("Kein Kommentar zum Korrigieren vorhanden.");
      return;
    }

    saveCommentToHistory(commentHtml);

    setIsCorrectingComment(true);
    try {
      const correctedHtml = await correctCommentWithAI(commentHtml);
      setCommentHtml(correctedHtml);
      saveCommentToHistory(correctedHtml);
      toast.success("Kommentar wurde erfolgreich korrigiert!");
    } catch (error) {
      console.error("Error correcting comment:", error);
      toast.error(
        "Fehler beim Korrigieren des Kommentars: " +
          (error.message || "Unbekannter Fehler"),
      );
    } finally {
      setIsCorrectingComment(false);
    }
  }

  async function handleReaction(reactionType) {
    if (!isSuperAdmin) {
      toast.error("Faqat super_admin reaktsiya qo'ya oladi.");
      return;
    }

    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;

    try {
      const candidateRef = doc(db, col, docId);
      const newReaction = reaction === reactionType ? null : reactionType;

      await updateDoc(candidateRef, {
        reaction: newReaction,
        reactionUpdatedAt: Date.now(),
      });

      setReaction(newReaction);

      toast.success(
        newReaction === "like"
          ? "👍 Gefällt mir"
          : newReaction === "dislike"
            ? "👎 Gefällt mir nicht"
            : "Reaktion entfernt",
      );
    } catch (err) {
      toast.error("Fehler beim Speichern der Reaktion.");
    }
  }

  async function handleCorrectExperience(idx) {
    const exp = formCv.experience[idx];
    if (!exp) {
      toast.error("Berufserfahrung nicht gefunden.");
      return;
    }

    const aufgabenOnly = aufgabenOnlyMode[idx] || false;

    // Save current state to history before making changes
    saveExperienceToHistory(idx, exp);

    setCorrectingExperienceIndex(idx);
    try {
      const correctedExp = await correctExperienceWithAI(exp, aufgabenOnly);

      // Update the entire experience entry
      setFormCv((prev) => {
        const next = [...prev.experience];
        next[idx] = correctedExp;
        return { ...prev, experience: sortTimelineItemsDesc(next) };
      });

      // Save the corrected state to history
      saveExperienceToHistory(idx, correctedExp);

      toast.success(
        aufgabenOnly
          ? "Aufgaben wurden erfolgreich korrigiert!"
          : "Berufserfahrung wurde erfolgreich korrigiert!",
      );
    } catch (error) {
      console.error("Error correcting experience:", error);
      toast.error(
        "Fehler beim Korrigieren: " + (error.message || "Unbekannter Fehler"),
      );
    } finally {
      setCorrectingExperienceIndex(null);
    }
  }

  function toggleAufgabenOnlyMode(idx) {
    setAufgabenOnlyMode((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }

  function saveExperienceToHistory(idx, experienceData) {
    setExperienceHistoryIndex((prevIndex) => {
      const currentIndex = prevIndex[idx] ?? -1;

      setExperienceHistory((prevHistory) => {
        const history = prevHistory[idx] || [];

        // Remove any future history if we're not at the end
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(experienceData);

        // Keep only last 20 states to avoid memory issues
        const trimmedHistory = newHistory.slice(-20);

        return {
          ...prevHistory,
          [idx]: trimmedHistory,
        };
      });

      return {
        ...prevIndex,
        [idx]: currentIndex + 1,
      };
    });
  }

  function undoExperience(idx) {
    const history = experienceHistory[idx] || [];
    const currentIndex = experienceHistoryIndex[idx] ?? -1;

    if (currentIndex > 0) {
      const previousState = history[currentIndex - 1];

      setFormCv((prev) => {
        const next = [...prev.experience];
        next[idx] = previousState;
        return { ...prev, experience: sortTimelineItemsDesc(next) };
      });

      setExperienceHistoryIndex((prev) => ({
        ...prev,
        [idx]: currentIndex - 1,
      }));
    }
  }

  function redoExperience(idx) {
    const history = experienceHistory[idx] || [];
    const currentIndex = experienceHistoryIndex[idx] ?? -1;

    if (currentIndex < history.length - 1) {
      const nextState = history[currentIndex + 1];

      setFormCv((prev) => {
        const next = [...prev.experience];
        next[idx] = nextState;
        return { ...prev, experience: sortTimelineItemsDesc(next) };
      });

      setExperienceHistoryIndex((prev) => ({
        ...prev,
        [idx]: currentIndex + 1,
      }));
    }
  }

  function canUndoExperience(idx) {
    const currentIndex = experienceHistoryIndex[idx] ?? -1;
    return currentIndex > 0;
  }

  function canRedoExperience(idx) {
    const history = experienceHistory[idx] || [];
    const currentIndex = experienceHistoryIndex[idx] ?? -1;
    return currentIndex < history.length - 1;
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
    ? "Wird geladen..."
    : isSaving
      ? "Wird gespeichert..."
      : isDownloading
        ? "PDF wird erstellt..."
        : isSavingStatus
          ? "Status wird gespeichert..."
          : sendingStepValue
            ? "E-Mail wird gesendet..."
            : metaLoading
              ? "Daten werden geladen..."
              : "Bitte warten...";

  return (
    <div className="p-2 min-h-screen">
      {remoteMode ? (
        <SelectMajorModal
          open={majorModalOpen}
          majors={majors}
          selectedKey={majorModalKey}
          onSelectKey={setMajorModalKey}
          onCancel={() => {
            if (restoreBusy) return;
            setMajorModalOpen(false);
            setMajorModalKey("");
          }}
          onConfirm={confirmRestoreFromModal}
          confirming={Boolean(restoreBusy)}
          title="Bereich (Major) auswählen"
          subtitle="Wählen Sie einen Bereich (Major) für die Wiederherstellung. Danach können E-Mails versendet werden."
        />
      ) : null}
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
        onDelete={confirmDeleteCandidate}
        onArchive={confirmArchiveCandidate}
        onConfirm={confirmDeleteCandidate}
        candidateName={deleteTarget?.name}
        isDeleting={isDeletingCandidate}
        seconds={5}
        skipCountdown={true}
      />
      {missingPassportModalOpen ? (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">Reisepass topilmadi</h3>
            <p className="text-sm text-base-content/70">
              Reisepass hujjati topilmadi. Shunga qaramay Beratungsvertrag ni
              passport sahifasisiz davom ettirishni xohlaysizmi?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleMissingPassportCancel}
              >
                Yo'q, bekor qilish
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleMissingPassportConfirm}
              >
                Ha, davom etish
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <UnsavedChangesModal
        open={unsavedModalOpen && unsavedBlocker.state === "blocked"}
        title="Ungespeicherte Änderungen"
        message="Sie haben ungespeicherte Änderungen. Wenn Sie zu einer anderen Seite wechseln oder die Seite neu laden, gehen diese Änderungen verloren. Möchten Sie fortfahren?"
        stayText="Bleiben"
        leaveText="Fortfahren"
        onStay={stayOnGeneratePage}
        onLeave={leaveGeneratePage}
      />

      {/* Fixed action bar under the global navbar (hidden on print) */}
      <div className="fixed inset-x-0 top-16 z-30 border-b border-base-300 bg-base-200/90 backdrop-blur print:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2 lg:px-6">
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
            {!remoteMode && !loading && !notFound && (
              <div className="flex gap-2">
                <button
                  type="button"
                  className={[
                    "btn btn-sm btn-circle",
                    reaction === "like"
                      ? "btn-success text-white"
                      : "btn-ghost hover:btn-success hover:text-white",
                    !isSuperAdmin ? "opacity-50 cursor-not-allowed" : "",
                  ].join(" ")}
                  onClick={() => handleReaction("like")}
                  title={
                    isSuperAdmin ? "Gefällt mir" : "Faqat super_admin uchun"
                  }
                  disabled={loading || notFound || !isSuperAdmin}
                >
                  <FaThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className={[
                    "btn btn-sm btn-circle",
                    reaction === "dislike"
                      ? "btn-error text-white"
                      : "btn-ghost hover:btn-error hover:text-white",
                    !isSuperAdmin ? "opacity-50 cursor-not-allowed" : "",
                  ].join(" ")}
                  onClick={() => handleReaction("dislike")}
                  title={
                    isSuperAdmin
                      ? "Gefällt mir nicht"
                      : "Faqat super_admin uchun"
                  }
                  disabled={loading || notFound || !isSuperAdmin}
                >
                  <FaThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {(!isLimitedAdmin || showLimitedAdminSaveButton) && !remoteMode && (
              <>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSave}
                  disabled={
                    isSaving || loading || notFound || !hasUnsavedChanges
                  }
                >
                  <FaSave />
                  <span>Speichern</span>
                </button>
                <button
                  className="btn btn-sm"
                  onClick={handleCancel}
                  disabled={
                    isSaving || loading || notFound || !hasUnsavedChanges
                  }
                >
                  Abbrechen
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={handleDownloadPdf}
                  disabled={loading || notFound || isDownloading}
                >
                  <FaDownload />{" "}
                  {isDownloading ? "Wird geladen..." : "Herunterladen"}
                </button>
                <button
                  className={[
                    "btn btn-sm",
                    docCv?.documentReady ? "btn-success" : "btn-outline",
                  ].join(" ")}
                  onClick={handleDocumentReady}
                  disabled={loading || notFound || remoteMode}
                  title={
                    docCv?.documentReady
                      ? "Dokument als nicht bereit markieren"
                      : "Dokument als bereit markieren"
                  }
                >
                  <HiMiniDocumentCheck />
                  <span className="hidden sm:inline">
                    {docCv?.documentReady ? "Bereit" : "Als Bereit Markieren"}
                  </span>
                </button>
                <button
                  className={[
                    "btn btn-sm",
                    docCv?.isDocumentSend ? "btn-info" : "btn-outline",
                  ].join(" ")}
                  onClick={handleDocumentSend}
                  disabled={loading || notFound || remoteMode}
                  title={
                    docCv?.isDocumentSend
                      ? "Dokument als nicht gesendet markieren"
                      : "Dokument als gesendet markieren"
                  }
                >
                  <FaPaperPlane />
                  <span className="hidden sm:inline">
                    {docCv?.isDocumentSend ? "Gesendet" : "Als Gesendet"}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Spacer so content doesn't go under the fixed action bar */}
      <div className="h-14 print:hidden" />

      <div className="w-full">
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
                <div className="card-body space-y-4 min-h-[calc(100vh-2rem)]pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h2 className="card-title text-2xl font-bold">
                        Daten bearbeiten
                      </h2>
                      {docCv?.telegramId ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0088cc]/10 text-[#0088cc] text-sm font-medium"
                          title="Über Telegram registriert"
                        >
                          <FaTelegram className="w-3.5 h-3.5" />
                          <span className="text-xs">Telegram</span>
                        </span>
                      ) : null}
                      {docCv?.lead ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium"
                          title={`Lead: ${docCv.lead}`}
                        >
                          <span className="text-xs font-semibold">
                            {docCv.lead}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {isLimitedAdmin && (
                    <div className="flex justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                          Profilfoto
                        </p>
                        {photo ? (
                          <button
                            type="button"
                            className="rounded-md border border-base-300 overflow-hidden shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            onClick={openPhotoModal}
                          >
                            <img
                              src={photo}
                              alt="Kandidatenfoto"
                              className="w-[128pt] h-[160pt] object-cover"
                            />
                          </button>
                        ) : (
                          <div className="w-[128pt] h-[160pt] border border-dashed border-base-300 rounded-md bg-base-200 flex items-center justify-center text-xs uppercase tracking-wide text-base-content/60">
                            Kein Foto vorhanden
                          </div>
                        )}
                        {photo && (
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            onClick={openPhotoModal}
                          >
                            Vergrößern
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <fieldset
                    disabled={isLimitedAdmin || remoteMode}
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
                        {isMobile ? (
                          <button
                            type="button"
                            onClick={() => setShowBirthPlacePicker(true)}
                            className={`
                              w-full h-12 px-4 rounded-lg border-2 text-left flex items-center justify-between
                              transition-all active:scale-98
                              ${
                                formCv.personalInfo.birthPlace
                                  ? "border-success bg-success/5 text-base-content"
                                  : "border-base-300 bg-base-100 text-base-content/60"
                              }
                            `}
                          >
                            <span className="text-base">
                              {formCv.personalInfo.birthPlace ||
                                "Bitte auswählen"}
                            </span>
                            <svg
                              className="w-5 h-5 opacity-50"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        ) : (
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
                        )}
                      </div>
                      <div className="form-control w-full">
                        <label className="label" htmlFor="g-marital">
                          <span className="label-text">Familienstand</span>
                        </label>
                        {isMobile ? (
                          <button
                            type="button"
                            onClick={() => setShowMaritalStatusPicker(true)}
                            className={`
                              w-full h-12 px-4 rounded-lg border-2 text-left flex items-center justify-between
                              transition-all active:scale-98
                              ${
                                formCv.personalInfo.maritalStatus
                                  ? "border-success bg-success/5 text-base-content"
                                  : "border-base-300 bg-base-100 text-base-content/60"
                              }
                            `}
                          >
                            <span className="text-base">
                              {formCv.personalInfo.maritalStatus ||
                                "Bitte auswählen"}
                            </span>
                            <svg
                              className="w-5 h-5 opacity-50"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        ) : (
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
                        )}
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
                                          prev.personalInfo.childrenCount || "",
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
                        {/* Führerschein moved to Fähigkeiten section */}
                      </div>
                      <div className="md:col-span-2">
                        <PhoneInputWithCountry
                          label="Telefonnummer"
                          required
                          value={formCv.personalInfo.phone}
                          onChange={(next) => {
                            setPhoneTouched(true);
                            setFormCv((prev) => ({
                              ...prev,
                              personalInfo: {
                                ...prev.personalInfo,
                                phone: next,
                              },
                            }));
                          }}
                          inputClassName={
                            phoneShowOk
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
                        label="Passnummer"
                        placeholder="AA 0000000"
                        value={passportNumber}
                        onChange={(e) => {
                          setPassportTouched(true);
                          const norm = normalizePassportNumber(e.target.value);
                          setFormCv((prev) => ({
                            ...prev,
                            personalInfo: {
                              ...prev.personalInfo,
                              passportNumber: norm,
                            },
                          }));
                        }}
                        inputClassName={
                          passportShowOk
                            ? "input-success"
                            : passportWarn
                              ? "input-warning"
                              : ""
                        }
                        helperText={
                          passportWarn ? (
                            <span className="text-warning">
                              Bitte Passnummer im Format AA 0000000 eingeben.
                            </span>
                          ) : (
                            ""
                          )
                        }
                      />
                      <FormInput
                        label="E-Mail"
                        placeholder="E-Mail"
                        type="email"
                        value={formCv.personalInfo.email}
                        onChange={(e) => {
                          setEmailTouched(true);
                          setFormCv((prev) => ({
                            ...prev,
                            personalInfo: {
                              ...prev.personalInfo,
                              email: e.target.value,
                            },
                          }));
                        }}
                        inputClassName={
                          emailShowOk
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
                  </fieldset>

                  <fieldset
                    disabled={remoteMode}
                    className="space-y-4 disabled:opacity-70"
                  >
                    <CollapsibleSection
                      title="Berufserfahrung"
                      count={experienceCount}
                      defaultOpen={false}
                    >
                      <ExperienceSection
                        experience={formCv.experience}
                        onAddExperience={addExperience}
                        onUpdateExperience={updateExperience}
                        onRemoveExperience={removeExperience}
                        onAddResponsibility={addResponsibility}
                        onRemoveResponsibility={removeResponsibility}
                        onCorrectExperience={handleCorrectExperience}
                        correctingIndex={correctingExperienceIndex}
                        aufgabenOnlyMode={aufgabenOnlyMode}
                        onToggleAufgabenOnly={toggleAufgabenOnlyMode}
                        onUndoExperience={undoExperience}
                        onRedoExperience={redoExperience}
                        canUndo={canUndoExperience}
                        canRedo={canRedoExperience}
                      />
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Ausbildung"
                      count={educationCount}
                      defaultOpen={false}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm text-base-content/70">
                            Ausbildungseinträge
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={addEducation}
                          >
                            Hinzufügen
                          </button>
                        </div>

                        {educationCount === 0 ? (
                          <div className="text-sm text-base-content/60">
                            Keine Einträge.
                          </div>
                        ) : null}

                        <div className="space-y-3">
                          {(Array.isArray(formCv.education)
                            ? formCv.education
                            : []
                          ).map((edu, idx) => {
                            const endIsBisHeute =
                              String(edu?.endDate || "").trim() === "bis heute";
                            return (
                              <CollapsibleSection
                                key={idx}
                                title={`Ausbildung #${idx + 1}`}
                                defaultOpen={false}
                                contentClassName="p-4 pt-0 space-y-3"
                                meta={
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-xs relative z-10"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      removeEducation(idx);
                                    }}
                                    aria-label={`Ausbildung #${
                                      idx + 1
                                    } löschen`}
                                  >
                                    <FaTrash />
                                  </button>
                                }
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="label">
                                      <span className="label-text">
                                        Startdatum
                                      </span>
                                    </label>
                                    <input
                                      type="month"
                                      className={inputBase}
                                      value={toInputMonth(edu?.startDate)}
                                      onChange={(e) =>
                                        updateEducation(
                                          idx,
                                          "startDate",
                                          fromInputMonth(e.target.value),
                                        )
                                      }
                                    />
                                  </div>

                                  <div>
                                    <label className="label">
                                      <span className="label-text">
                                        Enddatum
                                      </span>
                                    </label>
                                    <input
                                      type="month"
                                      className={inputBase}
                                      value={toInputMonth(edu?.endDate)}
                                      onChange={(e) =>
                                        updateEducation(
                                          idx,
                                          "endDate",
                                          fromInputMonth(e.target.value),
                                        )
                                      }
                                      disabled={endIsBisHeute}
                                    />
                                    <label className="cursor-pointer flex items-center gap-2 mt-2">
                                      <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm"
                                        checked={endIsBisHeute}
                                        onChange={(e) => {
                                          updateEducation(
                                            idx,
                                            "endDate",
                                            e.target.checked ? "bis heute" : "",
                                          );
                                        }}
                                      />
                                      <span className="text-sm">
                                        bis heute (aktuell)
                                      </span>
                                    </label>
                                  </div>

                                  <div className="md:col-span-2">
                                    <label className="label">
                                      <span className="label-text">
                                        Bildungseinrichtung (auf Deutsch)
                                      </span>
                                    </label>
                                    <input
                                      type="text"
                                      className={inputBase}
                                      placeholder="z.B. Gymnasium Nr. 1"
                                      value={String(edu?.institution || "")}
                                      onChange={(e) =>
                                        updateEducation(
                                          idx,
                                          "institution",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="md:col-span-2">
                                    <label className="label">
                                      <span className="label-text">
                                        Abschluss (auf Deutsch)
                                      </span>
                                    </label>
                                    <input
                                      type="text"
                                      className={inputBase}
                                      placeholder="z.B. Abitur"
                                      value={String(edu?.degree || "")}
                                      onChange={(e) =>
                                        updateEducation(
                                          idx,
                                          "degree",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              </CollapsibleSection>
                            );
                          })}
                        </div>
                      </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Fähigkeiten"
                      className="!overflow-visible"
                      contentClassName="!overflow-visible"
                      openClassName="relative z-[80]"
                      defaultOpen={false}
                    >
                      <div className="mb-4 rounded-box border border-base-300 bg-base-200/40 p-4">
                        <div className="form-control w-full">
                          <div className="label">
                            <span className="label-text font-semibold">
                              Führerschein
                            </span>
                          </div>
                          <label className="cursor-pointer flex items-center gap-2">
                            <input
                              id="g-driving"
                              type="checkbox"
                              className="checkbox"
                              checked={Boolean(
                                formCv.personalInfo.hasDrivingLicense,
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
                                          prev.personalInfo
                                            .drivingLicenseType || "",
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
                                className="relative w-full"
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
                                      formCv.personalInfo.drivingLicenseType ||
                                        "",
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

                                {isDrivingLicenseDropdownOpen && (
                                  <div className="absolute left-0 right-0 mt-1 max-h-72 rounded-box border border-base-300 bg-base-100 shadow-lg z-[9999] overflow-hidden flex flex-col">
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
                                          formCv.personalInfo
                                            .drivingLicenseType || "",
                                        )
                                          .trim()
                                          .toUpperCase()
                                          .split(",")
                                          .map((s) => s.trim())
                                          .filter(Boolean);
                                        const isSelected =
                                          selected.includes(upper);

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
                                                setIsDrivingLicenseDropdownOpen(
                                                  false,
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
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
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

                    <CollapsibleSection
                      title="Sprachen"
                      count={languagesCount}
                      defaultOpen={false}
                    >
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
                      defaultOpen={false}
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
                            formCv.documents.passport.map((url, i) => {
                              const isMarkedForDeletion =
                                documentsMarkedForDeletion.passport.some(
                                  (marked) => marked.index === i,
                                );
                              return (
                                <div
                                  key={i}
                                  className={`flex gap-2 items-center p-2 border rounded ${
                                    isMarkedForDeletion
                                      ? "bg-error/10 border-error/50 opacity-60"
                                      : "bg-base-100"
                                  }`}
                                >
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`link text-sm truncate flex-1 ${
                                      isMarkedForDeletion
                                        ? "link-error line-through"
                                        : "link-primary"
                                    }`}
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
                                  {!isLimitedAdmin && (
                                    <button
                                      type="button"
                                      className="btn btn-square btn-sm btn-ghost text-error"
                                      title={
                                        isMarkedForDeletion
                                          ? "Löschung wird beim Speichern ausgeführt"
                                          : "Dokument löschen"
                                      }
                                      onClick={() =>
                                        deleteDocumentRemoteFirst(
                                          url,
                                          "passport",
                                          i,
                                        )
                                      }
                                    >
                                      <FaTrash />
                                    </button>
                                  )}
                                </div>
                              );
                            })
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
                            formCv.documents.diplomas.map((url, i) => {
                              const isMarkedForDeletion =
                                documentsMarkedForDeletion.diplomas.some(
                                  (marked) => marked.index === i,
                                );
                              return (
                                <div
                                  key={i}
                                  className={`flex gap-2 items-center p-2 border rounded ${
                                    isMarkedForDeletion
                                      ? "bg-error/10 border-error/50 opacity-60"
                                      : "bg-base-100"
                                  }`}
                                >
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`link text-sm truncate flex-1 ${
                                      isMarkedForDeletion
                                        ? "link-error line-through"
                                        : "link-primary"
                                    }`}
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
                                  {!isLimitedAdmin && (
                                    <button
                                      type="button"
                                      className="btn btn-square btn-sm btn-ghost text-error"
                                      title={
                                        isMarkedForDeletion
                                          ? "Löschung wird beim Speichern ausgeführt"
                                          : "Dokument löschen"
                                      }
                                      onClick={() =>
                                        deleteDocumentRemoteFirst(
                                          url,
                                          "diplomas",
                                          i,
                                        )
                                      }
                                    >
                                      <FaTrash />
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Certificates */}
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">
                          Zertifikate
                        </h4>
                        <div className="flex flex-col gap-2">
                          {(!formCv.documents?.certificatesDetailed ||
                            formCv.documents.certificatesDetailed.length ===
                              0) &&
                          (!formCv.documents?.certificates ||
                            formCv.documents.certificates.length === 0) ? (
                            <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
                              Keine Zertifikate vorhanden.
                            </div>
                          ) : (
                            <div className="mt-2">
                              <div className="text-xs opacity-70 mb-1">
                                Nur PDF
                              </div>
                              <ul className="space-y-2">
                                {/* Show certificatesDetailed if available */}
                                {Array.isArray(
                                  formCv.documents?.certificatesDetailed,
                                ) &&
                                  formCv.documents.certificatesDetailed.map(
                                    (cert, i) => {
                                      const isMarkedForDeletion =
                                        documentsMarkedForDeletion.certificates.some(
                                          (marked) => marked.index === i,
                                        );
                                      return (
                                        <li
                                          key={cert.url || i}
                                          className={`flex flex-col gap-2 rounded-box border border-base-300 px-3 py-2 ${
                                            isMarkedForDeletion
                                              ? "bg-error/10 border-error/50 opacity-60"
                                              : "bg-base-100"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                              <div className="truncate font-medium">
                                                <a
                                                  href={cert.url}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className={`link truncate flex-1 ${
                                                    isMarkedForDeletion
                                                      ? "link-error line-through"
                                                      : "link-primary"
                                                  }`}
                                                >
                                                  {cert.url}
                                                </a>
                                              </div>
                                            </div>
                                            <a
                                              href={cert.url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="btn btn-square btn-sm btn-ghost text-primary"
                                              title="Link öffnen"
                                            >
                                              <FaExternalLinkAlt />
                                            </a>
                                            {!isLimitedAdmin && (
                                              <button
                                                type="button"
                                                className="btn btn-square btn-sm btn-ghost text-error"
                                                title={
                                                  isMarkedForDeletion
                                                    ? "Löschung wird beim Speichern ausgeführt"
                                                    : "Dokument löschen"
                                                }
                                                onClick={() =>
                                                  deleteDocumentRemoteFirst(
                                                    cert.url,
                                                    "certificates",
                                                    i,
                                                  )
                                                }
                                              >
                                                <FaTrash />
                                              </button>
                                            )}
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
                                                !cert.type?.trim()
                                                  ? "select-warning"
                                                  : ""
                                              }`}
                                              aria-label="Typ des Sprachzertifikats"
                                              value={cert.type || ""}
                                              onChange={(e) => {
                                                setFormCv((prev) => {
                                                  const updatedDetailed = [
                                                    ...prev.documents
                                                      .certificatesDetailed,
                                                  ];
                                                  updatedDetailed[i] = {
                                                    ...updatedDetailed[i],
                                                    type: e.target.value,
                                                  };

                                                  // Also update the regular certificates array
                                                  const updatedDocs = {
                                                    ...prev.documents,
                                                    certificatesDetailed:
                                                      updatedDetailed,
                                                  };
                                                  updatedDocs.certificates =
                                                    updatedDetailed
                                                      .map((c) => c.url)
                                                      .filter(
                                                        (url) =>
                                                          url &&
                                                          typeof url ===
                                                            "string",
                                                      );

                                                  const updatedForm = {
                                                    ...prev,
                                                    documents: updatedDocs,
                                                  };

                                                  // Auto-save certificate type change to Firebase
                                                  setTimeout(async () => {
                                                    try {
                                                      const candidateDocId =
                                                        String(id || "").trim();
                                                      const collectionName =
                                                        String(
                                                          resolvedMajor?.collectionName ||
                                                            "",
                                                        ).trim();

                                                      if (
                                                        candidateDocId &&
                                                        collectionName
                                                      ) {
                                                        const docData =
                                                          mapFormToDoc(
                                                            updatedForm,
                                                          );

                                                        await updateDocument(
                                                          collectionName,
                                                          candidateDocId,
                                                          {
                                                            documents:
                                                              docData.documents,
                                                          },
                                                        );
                                                      }
                                                    } catch (saveErr) {}
                                                  }, 500);

                                                  return updatedForm;
                                                });
                                              }}
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
                                          {!cert.type?.trim() ? (
                                            <p className="text-warning text-sm">
                                              Bitte wählen Sie, zu welchem
                                              Zertifikat die Datei gehört.
                                            </p>
                                          ) : null}
                                        </li>
                                      );
                                    },
                                  )}

                                {/* Show legacy certificates if no certificatesDetailed */}
                                {!Array.isArray(
                                  formCv.documents?.certificatesDetailed,
                                ) ||
                                formCv.documents.certificatesDetailed.length ===
                                  0
                                  ? formCv.documents?.certificates?.map(
                                      (url, i) => {
                                        const isMarkedForDeletion =
                                          documentsMarkedForDeletion.certificates.some(
                                            (marked) => marked.index === i,
                                          );
                                        return (
                                          <div
                                            key={i}
                                            className={`flex gap-2 items-center p-2 border rounded ${
                                              isMarkedForDeletion
                                                ? "bg-error/10 border-error/50 opacity-60"
                                                : "bg-base-100"
                                            }`}
                                          >
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className={`link text-sm truncate flex-1 ${
                                                isMarkedForDeletion
                                                  ? "link-error line-through"
                                                  : "link-primary"
                                              }`}
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
                                            {!isLimitedAdmin && (
                                              <button
                                                type="button"
                                                className="btn btn-square btn-sm btn-ghost text-error"
                                                title={
                                                  isMarkedForDeletion
                                                    ? "Löschung wird beim Speichern ausgeführt"
                                                    : "Dokument löschen"
                                                }
                                                onClick={() =>
                                                  deleteDocumentRemoteFirst(
                                                    url,
                                                    "certificates",
                                                    i,
                                                  )
                                                }
                                              >
                                                <FaTrash />
                                              </button>
                                            )}
                                          </div>
                                        );
                                      },
                                    )
                                  : null}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Document Upload */}
                      {!isLimitedAdmin && (
                        <div className="mb-2">
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">
                            Neues Dokument hochladen
                          </h4>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <select
                              className={selectBase}
                              value={selectedDocumentType}
                              onChange={(e) =>
                                setSelectedDocumentType(e.target.value)
                              }
                            >
                              <option value="">Dokumenttyp wählen</option>
                              <option value="passport">Reisepass</option>
                              <option value="diplomas">Diplome</option>
                              <option value="certificates">Zertifikate</option>
                            </select>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              className={fileInputBase}
                              onChange={handleDocumentFileChange}
                              disabled={!selectedDocumentType}
                            />
                          </div>
                          {selectedDocumentType && (
                            <div className="mt-2 text-xs opacity-70">
                              Akzeptierte Formate: PDF, JPG, PNG, WEBP
                            </div>
                          )}
                        </div>
                      )}
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Von Kandidat erhaltene Dokumente"
                      count={
                        docCv?.incomingDocuments
                          ? Object.keys(docCv.incomingDocuments).length
                          : 0
                      }
                      defaultOpen={false}
                    >
                      {/* Admin toggle for allowing candidate to delete documents */}
                      {(userRole === "admin" || userRole === "super_admin") && (
                        <div className="flex items-center justify-between mb-3 p-2 bg-base-200 rounded-lg">
                          <span className="text-sm font-medium">
                            Kandidat darf Dokumente löschen
                          </span>
                          <label className="flex items-center gap-2 cursor-pointer">
                            {savingAllowDelete && (
                              <span className="loading loading-spinner loading-xs"></span>
                            )}
                            <input
                              type="checkbox"
                              className="toggle toggle-sm toggle-primary"
                              checked={allowIncomingDelete}
                              onChange={(e) =>
                                handleToggleAllowIncomingDelete(
                                  e.target.checked,
                                )
                              }
                              disabled={savingAllowDelete}
                            />
                          </label>
                        </div>
                      )}
                      {(() => {
                        const incomingDocs = docCv?.incomingDocuments || {};
                        const outgoingDocsMap = docCv?.outgoingDocuments || {};
                        const entries = Object.entries(incomingDocs).filter(
                          ([, v]) =>
                            v &&
                            typeof v === "object" &&
                            String(v?.url || "").trim(),
                        );

                        if (entries.length === 0) {
                          return (
                            <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
                              Keine Dokumente vom Kandidaten erhalten.
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3">
                            {entries.map(([docId, docData]) => {
                              const outgoingDoc = outgoingDocsMap[docId];
                              const docLabel = String(
                                outgoingDoc?.title || "",
                              ).trim();
                              const fileName =
                                String(docData?.fileName || "").trim() ||
                                "Dokument";
                              const url = String(docData?.url || "").trim();
                              const uploadedAt = docData?.uploadedAt;

                              return (
                                <div
                                  key={docId}
                                  className="border border-base-300 rounded-lg p-3 bg-base-50"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      {docLabel && (
                                        <div className="badge badge-primary badge-sm mb-2">
                                          {docLabel}
                                        </div>
                                      )}
                                      <div className="font-semibold text-sm">
                                        {fileName}
                                      </div>
                                      {uploadedAt && (
                                        <div className="text-xs text-base-content/60 mt-1">
                                          Hochgeladen:{" "}
                                          {new Date(uploadedAt).toLocaleString(
                                            "de-DE",
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-sm btn-outline gap-1"
                                        title="Öffnen"
                                      >
                                        <FaExternalLinkAlt />
                                      </a>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline gap-1"
                                        onClick={() =>
                                          handleDownloadIncomingDoc(
                                            url,
                                            fileName,
                                          )
                                        }
                                        title="Herunterladen"
                                      >
                                        <FaDownload />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-error gap-1"
                                        onClick={() =>
                                          handleDeleteIncomingDoc(docId)
                                        }
                                        disabled={deletingIncomingDoc[docId]}
                                        title="Löschen"
                                      >
                                        {deletingIncomingDoc[docId] ? (
                                          <span className="loading loading-spinner loading-xs"></span>
                                        ) : (
                                          <FaTrash />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
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
                            Allgemeiner Kommentar (zum Kandidaten)
                          </span>
                        </label>
                        {showCommentPreview && renderCommentPreview()}
                        {isCommentEditorOpen && (
                          <RichTextEditor
                            value={commentHtml}
                            onChange={setCommentHtml}
                            placeholder='Allgemeine Notiz: "Der Kandidat passt sehr gut, nur das Foto sollte aktualisiert werden."'
                          />
                        )}
                        {isCommentEditorOpen && (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-2 mt-3">
                            {(canUndoComment() || canRedoComment()) && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-ghost"
                                  onClick={undoComment}
                                  disabled={
                                    !canUndoComment() || isCorrectingComment
                                  }
                                  title="Rückgängig"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                    />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-ghost"
                                  onClick={redoComment}
                                  disabled={
                                    !canRedoComment() || isCorrectingComment
                                  }
                                  title="Wiederherstellen"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
                                    />
                                  </svg>
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              className="btn btn-sm btn-primary gap-2"
                              onClick={handleCorrectComment}
                              disabled={
                                isSaving ||
                                loading ||
                                notFound ||
                                isCorrectingComment ||
                                !hasComment
                              }
                              title="Kommentar mit KI korrigieren"
                            >
                              {isCorrectingComment ? (
                                <>
                                  <span className="loading loading-spinner loading-xs" />
                                  Korrigieren...
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                    />
                                  </svg>
                                  KI
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={handleCommentPrimaryAction}
                              disabled={isSaving || loading || notFound}
                            >
                              {commentActionLabel}
                            </button>
                            {isSuperAdmin && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline btn-error"
                                onClick={handleClearComment}
                                disabled={isSaving || loading || notFound}
                                title="Kommentar löschen (nur Super-Admin)"
                              >
                                Löschen
                              </button>
                            )}
                          </div>
                        )}
                        {!isCommentEditorOpen && (
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
                        )}
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
                            Notiz zum Kandidaten
                          </p>
                        </div>
                        {showCommentPreview && renderCommentPreview("flex-1")}
                        {isCommentEditorOpen && (
                          <RichTextEditor
                            value={commentHtml}
                            onChange={setCommentHtml}
                            placeholder='Allgemeine Notiz: "Der Kandidat passt sehr gut, nur das Foto sollte aktualisiert werden."'
                            className="flex-1"
                            editorClassName="min-h-[220px]"
                          />
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {isCommentEditorOpen && hasComment && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline btn-info w-full"
                              onClick={handleCorrectComment}
                              disabled={
                                isSaving ||
                                loading ||
                                notFound ||
                                isCorrectingComment
                              }
                              title="Kommentar mit KI korrigieren"
                            >
                              {isCorrectingComment ? (
                                <>
                                  <span className="loading loading-spinner loading-xs" />
                                  Korrigieren...
                                </>
                              ) : (
                                <>
                                  <img
                                    src="/ai-icon.svg"
                                    alt="AI"
                                    className="w-4 h-4"
                                  />
                                  Korrigieren
                                </>
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline w-full"
                            onClick={handleCommentPrimaryAction}
                            disabled={isSaving || loading || notFound}
                          >
                            {commentActionLabel}
                          </button>
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
      {!remoteMode && !isLimitedAdmin && !loading && !notFound && (
        <div className="mt-6">
          {/* Email Meta Info */}
          {emailMeta.lastSentAt && (
            <div className="mb-4 flex items-center gap-3 p-3 bg-base-200 rounded-lg border border-base-300">
              <div className="avatar">
                <div className="w-10 h-10 rounded-full">
                  {emailMeta.lastSentByPhoto || emailMetaAvatarFromUsers ? (
                    <img
                      src={
                        emailMeta.lastSentByPhoto || emailMetaAvatarFromUsers
                      }
                      alt={emailMeta.lastSentByName || "User"}
                    />
                  ) : (
                    <div className="w-full h-full bg-primary text-primary-content flex items-center justify-center font-semibold">
                      {(emailMeta.lastSentByName || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {emailMeta.lastSentByName || "Unbekannter Benutzer"}
                </div>
                <div className="text-xs text-base-content/60">
                  Letzte E-Mail gesendet:{" "}
                  {new Date(emailMeta.lastSentAt).toLocaleString("de-DE")}
                  {emailMeta.count > 0 &&
                    ` • ${emailMeta.count} E-Mails gesamt`}
                </div>
              </div>
            </div>
          )}

          <CandidateStatusStepper
            currentValue={statusValue}
            onSendEmail={handleSendStatusEmail}
            sendingValue={sendingStepValue}
            disabled={isLimitedAdmin}
            resetStages={resetCandidateStages}
            openCustomEmailModal={openCustomEmailModal}
            onResetStage={resetSingleStage}
            hasLeadershipInterview={Boolean(
              docCv?.stageMeta?.stage_2?.sentWithLeadership,
            )}
          />

          {/* Outgoing documents to the candidate */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card bg-base-100 border border-base-300 shadow-xl">
              <div className="card-body">
                <div>
                  <h3 className="card-title">
                    An Kandidaten zu sendende Dokumente
                  </h3>
                  <p className="text-sm text-base-content/70">
                    Wenn der Schalter aktiviert ist, wird das PDF generiert und
                    automatisch hochgeladen.
                  </p>
                </div>

                <div className="flex justify-end mb-3">
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={handleDeleteAllOutgoingDocs}
                    disabled={
                      outgoingBulkBusy ||
                      outgoingAnyBusy ||
                      !outgoingEntries.length ||
                      !candidateCollection ||
                      !candidateDocId ||
                      Boolean(sendingStepValue)
                    }
                    title="Alle gesendeten Links löschen"
                  >
                    {outgoingBulkBusy ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : null}
                    <span>Alle löschen</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {DOCUMENT_TEMPLATES.filter(
                    (tpl) =>
                      ![
                        "erklaerung_beschaeftigung",
                        "zusatzblatt_a",
                        "zusatzblatt_b",
                        "zusatzblatt_c",
                        "zusatzblatt_d",
                      ].includes(tpl.id),
                  ).map((tpl) => {
                    const st = getOutgoingDocState(tpl.id);
                    const checked = Boolean(st?.enabled);
                    const busy = Boolean(outgoingBusyById?.[tpl.id]);
                    const disabled =
                      busy ||
                      !candidateCollection ||
                      !candidateDocId ||
                      Boolean(sendingStepValue);
                    return (
                      <div
                        key={tpl.id}
                        className="rounded-xl border border-base-300 bg-base-100 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              to={tpl.to}
                              className="link link-hover font-semibold truncate inline-flex items-center gap-2"
                              title="Vorlage öffnen"
                            >
                              <span className="truncate">{tpl.title}</span>
                              <FaExternalLinkAlt className="opacity-70" />
                            </Link>
                            {tpl.description ? (
                              <div className="text-xs text-base-content/60 mt-1">
                                {tpl.description}
                              </div>
                            ) : null}
                            {String(st?.url || "").trim() ? (
                              <div className="text-xs text-base-content/60 mt-1">
                                Upload:{" "}
                                <a
                                  className="link"
                                  href={String(st.url)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Link
                                </a>
                              </div>
                            ) : null}
                            {tpl.id === "beratungsvertrag" && checked ? (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline"
                                  onClick={() =>
                                    handleToggleOutgoingDoc(tpl, true, {
                                      forceRegenerate: true,
                                    })
                                  }
                                  disabled={disabled}
                                  title="PDF neu generieren und erneut hochladen"
                                >
                                  Neu generieren
                                </button>
                              </div>
                            ) : null}
                            {tpl.id === "vermittlungsvertrag" && checked ? (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline"
                                  onClick={() =>
                                    handleToggleOutgoingDoc(tpl, true, {
                                      forceRegenerate: true,
                                    })
                                  }
                                  disabled={disabled}
                                  title="PDF neu generieren und erneut hochladen"
                                >
                                  Neu generieren
                                </button>
                              </div>
                            ) : null}
                            {tpl.id === "vollmacht" && checked ? (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline"
                                  onClick={() =>
                                    handleToggleOutgoingDoc(tpl, true, {
                                      forceRegenerate: true,
                                    })
                                  }
                                  disabled={disabled}
                                  title="PDF neu generieren und erneut hochladen"
                                >
                                  Neu generieren
                                </button>
                              </div>
                            ) : null}
                          </div>

                          <label className="flex items-center gap-2 shrink-0">
                            {busy ? (
                              <span className="loading loading-spinner loading-sm" />
                            ) : null}
                            <input
                              type="checkbox"
                              className="toggle toggle-primary"
                              checked={checked}
                              onChange={(e) =>
                                handleToggleOutgoingDoc(tpl, e.target.checked)
                              }
                              disabled={disabled}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                  {DOCUMENT_TEMPLATES.length === 0 ? (
                    <div className="text-sm opacity-70">
                      Derzeit keine Vorlagen verfügbar.
                    </div>
                  ) : null}
                </div>

                {/* Erklärung zum Beschäftigungsverhältnis - separate section with Öffnen buttons */}
                <div className="divider text-sm font-medium opacity-70 mt-6">
                  Erklärung zum Beschäftigungsverhältnis
                </div>
                <p className="text-xs text-base-content/60 mb-3">
                  Klicken Sie auf "Öffnen", um das Formular mit Kandidatendaten
                  zu öffnen und PDF herunterzuladen.
                </p>
                <div className="space-y-2">
                  <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold">
                          Erklärung zum Beschäftigungsverhältnis
                        </div>
                        <p className="text-xs text-base-content/60 mt-1">
                          Hauptformular für die Bundesagentur für Arbeit
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setIsErklaerungModalOpen(true)}
                        disabled={
                          !formCv.personalInfo.firstName ||
                          !formCv.personalInfo.lastName
                        }
                      >
                        Öffnen
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold">
                          Zusatzblatt A - Anerkennungsverfahren
                        </div>
                        <p className="text-xs text-base-content/60 mt-1">
                          Beschäftigung im Rahmen des Anerkennungsverfahrens
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary shrink-0"
                        onClick={() => setIsZusatzblattAModalOpen(true)}
                      >
                        Öffnen
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold">
                          Zusatzblatt B - ICT / Personalaustausch
                        </div>
                        <p className="text-xs text-base-content/60 mt-1">
                          Unternehmensinterner Transfer (ICT)
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary shrink-0"
                        onClick={() => setIsZusatzblattBModalOpen(true)}
                      >
                        Öffnen
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold">
                          Zusatzblatt C - Berufskraftfahrer
                        </div>
                        <p className="text-xs text-base-content/60 mt-1">
                          Beschäftigung als Berufskraftfahrer/in
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary shrink-0"
                        onClick={() => setIsZusatzblattCModalOpen(true)}
                      >
                        Öffnen
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold">
                          Zusatzblatt D - Kurzfristige Beschäftigung
                        </div>
                        <p className="text-xs text-base-content/60 mt-1">
                          Kurzfristige Beschäftigung (max. 70 Tage)
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary shrink-0"
                        onClick={() => setIsZusatzblattDModalOpen(true)}
                      >
                        Öffnen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 border border-base-300 shadow-xl">
              <div className="card-body">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="card-title">Gesendete Dokumente (Links)</h3>
                    <p className="text-sm text-base-content/70">
                      Hochgeladene Dateilinks werden hier angezeigt.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-success gap-2"
                      onClick={openSendDocLinkModal}
                      disabled={!candidateDocId}
                      title="Link an Kandidat senden (E-Mail und/oder Telegram)"
                    >
                      <FaPaperPlane className="text-xs" />
                      Link senden
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary gap-2"
                      onClick={async () => {
                        const dataExchangeUrl = `https://admin.consultinguz.de/dataExchange/${candidateDocId}`;
                        try {
                          if (
                            navigator?.clipboard &&
                            typeof navigator.clipboard.writeText === "function"
                          ) {
                            await navigator.clipboard.writeText(
                              dataExchangeUrl,
                            );
                            toast.success("DataExchange-Link kopiert.");
                          } else {
                            throw new Error("clipboard-unavailable");
                          }
                        } catch {
                          try {
                            const ta = document.createElement("textarea");
                            ta.value = dataExchangeUrl;
                            ta.style.position = "fixed";
                            ta.style.opacity = "0";
                            document.body.appendChild(ta);
                            ta.focus();
                            ta.select();
                            document.execCommand("copy");
                            document.body.removeChild(ta);
                            toast.success("DataExchange-Link kopiert.");
                          } catch {
                            toast.error("Fehler beim Kopieren des Links.");
                          }
                        }
                      }}
                      disabled={!candidateDocId}
                    >
                      <FaExternalLinkAlt className="text-xs" />
                      Copy Link
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline gap-2"
                      onClick={() => {
                        const dataExchangeUrl = `${window.location.origin}/dataExchange/${candidateDocId}`;
                        window.open(dataExchangeUrl, "_blank");
                      }}
                      disabled={!candidateDocId}
                    >
                      <FaExternalLinkAlt className="text-xs" />
                      Öffnen
                    </button>
                  </div>
                </div>

                {(() => {
                  const entries = Object.entries(outgoingDocs || {}).filter(
                    ([, v]) =>
                      v && typeof v === "object" && String(v?.url || "").trim(),
                  );
                  if (entries.length === 0) {
                    return (
                      <div className="text-sm opacity-70">
                        Derzeit keine hochgeladenen Dokumente.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {entries.map(([docId, v]) => {
                        const tpl =
                          DOCUMENT_TEMPLATES.find((t) => t.id === docId) ||
                          null;
                        const title = tpl?.title || docId;
                        const url = String(v?.url || "").trim();
                        const busy = Boolean(outgoingBusyById?.[docId]);
                        const disabled =
                          busy ||
                          !candidateCollection ||
                          !candidateDocId ||
                          Boolean(sendingStepValue);
                        return (
                          <div
                            key={docId}
                            className="rounded-xl border border-base-300 bg-base-100 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold truncate">
                                  {title}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <a
                                  className="btn btn-sm btn-outline"
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <FaExternalLinkAlt />
                                </a>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline"
                                  onClick={async () => {
                                    try {
                                      if (
                                        navigator?.clipboard &&
                                        typeof navigator.clipboard.writeText ===
                                          "function"
                                      ) {
                                        await navigator.clipboard.writeText(
                                          url,
                                        );
                                        toast.success("Link kopiert.");
                                      } else {
                                        throw new Error(
                                          "clipboard-unavailable",
                                        );
                                      }
                                    } catch {
                                      try {
                                        const ta =
                                          document.createElement("textarea");
                                        ta.value = url;
                                        ta.style.position = "fixed";
                                        ta.style.opacity = "0";
                                        document.body.appendChild(ta);
                                        ta.focus();
                                        ta.select();
                                        document.execCommand("copy");
                                        document.body.removeChild(ta);
                                        toast.success("Link kopiert.");
                                      } catch {
                                        toast.error(
                                          "Fehler beim Kopieren des Links.",
                                        );
                                      }
                                    }
                                  }}
                                >
                                  Copy
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline btn-error"
                                  onClick={() => handleDeleteOutgoingDoc(docId)}
                                  disabled={disabled}
                                  title="Link löschen (Remote und Firestore)"
                                >
                                  {busy ? (
                                    <span className="loading loading-spinner loading-sm" />
                                  ) : (
                                    <FaTrash />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
          <div className="mt-3 p-3 bg-base-200 rounded-lg border border-base-300">
            <div className="text-sm font-medium text-base-content opacity-80">
              Letzte Aktualisierung:{" "}
              <span className="font-normal">
                {statusUpdatedAt
                  ? (() => {
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
                    })()
                  : "—"}
              </span>
              {statusUpdatedBy ? (
                <span className="font-normal">
                  {" • Von: "}
                  <span className="text-primary">{statusUpdatedBy}</span>
                </span>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      )}

      {remoteMode && !loading && !notFound && (
        <div className="mt-6">
          <div className="card bg-base-100 border border-base-300 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Kandidatenstufen</h3>
              <p className="text-sm text-base-content/70">
                Um E-Mails senden zu können, müssen Sie den Kandidaten zuerst in
                den passenden Bereich (Collection/Major){" "}
                <span className="font-semibold">wiederherstellen</span>.
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate(-1)}
                  disabled={restoreBusy}
                >
                  Zurück
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={restoreFromRemoteMode}
                  disabled={restoreBusy || remoteLoading || !remoteRecord}
                >
                  {restoreBusy ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : null}
                  In Bereich (Major) wiederherstellen
                </button>
              </div>
            </div>
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
        title="Status-E-Mail senden"
        subtitle={
          pendingStageStep === "stage_2"
            ? "In der Stufe-2-E-Mail werden Link und Datum/Uhrzeit nicht gesendet."
            : isLimitedAdmin
              ? "Sie haben keine Berechtigung, E-Mails zu senden."
              : metaLoading
                ? "Zusätzliche Informationen werden geladen..."
                : "Bei Annahme werden Datum/Uhrzeit und Link (oder Standort) zur E-Mail hinzugefügt."
        }
        decision={stageDecision}
        setDecision={setStageDecision}
        onSubmit={handleStageEmailSubmit}
        isSending={Boolean(sendingStepValue)}
        previewRows={[]}
        showPreviewWhenAccepted
        showAdditionalInfoEditor={
          !isLimitedAdmin &&
          stageDecision === "accepted" &&
          (pendingStageStep !== "stage_2" || selectedExample === "example2")
        }
        additionalInfoForm={stageAdditionalInfoForm}
        setAdditionalInfoForm={setStageAdditionalInfoForm}
        canGenerateTelegramLink={Boolean(
          pendingStageStep &&
          getTelegramGroupIdForStage(metaInfo, pendingStageStep),
        )}
        autoTelegramGroupLabel={(() => {
          try {
            const gid = pendingStageStep
              ? getTelegramGroupIdForStage(metaInfo, pendingStageStep)
              : "";
            if (!gid) return "";
            return String(telegramGroupNameById?.[gid] || gid).trim();
          } catch {
            return "";
          }
        })()}
        emailPreview={stageEmailPreview}
        examples={stageEmailPreview?.examples || null}
        selectedExample={selectedExample}
        setSelectedExample={setSelectedExample}
        hasTelegramId={Boolean(docCv?.telegramId)}
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

      <SendDocumentLinkModal
        open={isSendDocLinkModalOpen}
        onClose={closeSendDocLinkModal}
        onSubmit={handleSendDocLinkSubmit}
        isSending={isSendingDocLink}
        candidateEmail={String(formCv.personalInfo.email || "").trim()}
        hasTelegramId={Boolean(docCv?.telegramId)}
        documentLink={`https://admin.consultinguz.de/dataExchange/${candidateDocId}`}
        candidateName={`${formCv.personalInfo.lastName || ""} ${formCv.personalInfo.name || ""}`.trim()}
      />

      <ErklaerungBeschaeftigungModal
        open={isErklaerungModalOpen}
        onClose={() => setIsErklaerungModalOpen(false)}
        candidateData={formCv}
      />

      <ZusatzblattAModal
        open={isZusatzblattAModalOpen}
        onClose={() => setIsZusatzblattAModalOpen(false)}
        candidateData={formCv}
      />

      <ZusatzblattBModal
        open={isZusatzblattBModalOpen}
        onClose={() => setIsZusatzblattBModalOpen(false)}
        candidateData={formCv}
      />

      <ZusatzblattCModal
        open={isZusatzblattCModalOpen}
        onClose={() => setIsZusatzblattCModalOpen(false)}
        candidateData={formCv}
      />

      <ZusatzblattDModal
        open={isZusatzblattDModalOpen}
        onClose={() => setIsZusatzblattDModalOpen(false)}
        candidateData={formCv}
      />

      {isMobile && showBirthPlacePicker && (
        <div
          className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200"
          onClick={() => setShowBirthPlacePicker(false)}
        >
          <div
            className="fixed inset-x-0 bottom-0 bg-base-100 rounded-t-3xl max-h-[70vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="shrink-0 pt-3 pb-2 flex justify-center">
              <div className="w-12 h-1 bg-base-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="shrink-0 px-4 pb-3 border-b border-base-200">
              <h3 className="font-bold text-lg text-center">Geburtsort</h3>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-3 space-y-1">
                {UZBEK_REGIONS.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setFormCv((prev) => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          birthPlace: city,
                        },
                      }));
                      setShowBirthPlacePicker(false);
                    }}
                    className={`
                      w-full text-left px-4 py-4 rounded-xl transition-all text-base font-medium
                      active:scale-98
                      ${
                        formCv.personalInfo.birthPlace === city
                          ? "bg-primary text-primary-content"
                          : "hover:bg-base-200 active:bg-base-300"
                      }
                    `}
                  >
                    {city}
                    {formCv.personalInfo.birthPlace === city && (
                      <span className="float-right">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isMobile && showMaritalStatusPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200"
          onClick={() => setShowMaritalStatusPicker(false)}
        >
          <div
            className="fixed inset-x-0 bottom-0 bg-base-100 rounded-t-3xl max-h-[70vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="shrink-0 pt-3 pb-2 flex justify-center">
              <div className="w-12 h-1 bg-base-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="shrink-0 px-4 pb-3 border-b border-base-200">
              <h3 className="font-bold text-lg text-center">Familienstand</h3>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-3 space-y-1">
                {["ledig", "verheiratet", "geschieden", "verwitwet"].map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setFormCv((prev) => ({
                          ...prev,
                          personalInfo: {
                            ...prev.personalInfo,
                            maritalStatus: status,
                          },
                        }));
                        setShowMaritalStatusPicker(false);
                      }}
                      className={`
                      w-full text-left px-4 py-4 rounded-xl transition-all text-base font-medium
                      active:scale-98
                      ${
                        formCv.personalInfo.maritalStatus === status
                          ? "bg-primary text-primary-content"
                          : "hover:bg-base-200 active:bg-base-300"
                      }
                    `}
                    >
                      {status}
                      {formCv.personalInfo.maritalStatus === status && (
                        <span className="float-right">✓</span>
                      )}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Generate;
