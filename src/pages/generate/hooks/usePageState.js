import { useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useUserRole } from "../../../hooks/useUserRole";
import { ensureTelegramGroupNameFactory } from "../../generate/utils";
import { INITIAL_FORM } from "../../generate/constants/formDefaults";

/**
 * All useState / useRef / URL-param declarations extracted from GenerateLegacy.
 */
export function usePageState() {
  // ── URL params ──
  const { major, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const sp = useMemo(
    () => new URLSearchParams(String(location?.search || "")),
    [location?.search],
  );
  const remoteMode = sp.get("remote") === "1";
  const remoteKind = String(sp.get("kind") || "").trim().toLowerCase();
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
      if (typeof window !== "undefined") {
        const u = new URLSearchParams(window.location.search);
        if (u.get("debug") === "1") return true;
      }
      return String(import.meta.env.VITE_DEBUG_GENERATE || "") === "true";
    } catch {
      return false;
    }
  }, []);

  // ── Core document state ──
  const [docCv, setDocCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [rating, setRating] = useState(null);

  // ── Telegram group names ──
  const telegramGroupNameCacheRef = useRef({});
  const [telegramGroupNameById, setTelegramGroupNameById] = useState({});

  const ensureTelegramGroupName = useMemo(() => {
    return ensureTelegramGroupNameFactory({
      getDocFn: getDoc,
      docFn: doc,
      dbRef: db,
      cacheRef: telegramGroupNameCacheRef,
      setMap: setTelegramGroupNameById,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auth / roles ──
  const { user } = useSelector((state) => state.auth);
  const { role: userRole } = useUserRole();

  // ── Modals ──
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoModalSrc, setPhotoModalSrc] = useState("");
  const [missingPassportModalOpen, setMissingPassportModalOpen] = useState(false);
  const missingPassportResolverRef = useRef(null);

  const [isErklaerungModalOpen, setIsErklaerungModalOpen] = useState(false);
  const [isZusatzblattAModalOpen, setIsZusatzblattAModalOpen] = useState(false);
  const [isZusatzblattBModalOpen, setIsZusatzblattBModalOpen] = useState(false);
  const [isZusatzblattCModalOpen, setIsZusatzblattCModalOpen] = useState(false);
  const [isZusatzblattDModalOpen, setIsZusatzblattDModalOpen] = useState(false);

  // ── Responsive / pickers ──
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });
  const [showBirthPlacePicker, setShowBirthPlacePicker] = useState(false);
  const [showMaritalStatusPicker, setShowMaritalStatusPicker] = useState(false);

  // ── Driving license dropdown ──
  const [isDrivingLicenseDropdownOpen, setIsDrivingLicenseDropdownOpen] =
    useState(false);
  const drivingLicenseDropdownRef = useRef(null);

  // ── Form state ──
  const initialForm = useMemo(
    () => ({
      personalInfo: {
        name: "", lastName: "", gender: "", address: "",
        birthDate: "", birthPlace: "", maritalStatus: "",
        childrenCount: "", noChildren: false,
        hasDrivingLicense: false, drivingLicenseType: "",
        phone: "", passportNumber: "", email: "", photo: "",
      },
      experience: [],
      education: [],
      skills: { softSkills: [], pcSkills: [], languages: {} },
      documents: {
        diplomas: [], certificates: [], certificatesDetailed: [],
        passport: [], noLanguageCertificate: false,
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
  const [showBackgroundImage, setShowBackgroundImage] = useState(true);
  const [formInitialized, setFormInitialized] = useState(false);
  const formInitializedRef = useRef(false);
  const baselineInitializedRef = useRef(false);
  const passportToastShownRef = useRef(false);
  const [emailMetaAvatarFromUsers, setEmailMetaAvatarFromUsers] = useState("");

  // ── Incoming doc deletion ──
  const [allowIncomingDelete, setAllowIncomingDelete] = useState(true);
  const [savingAllowDelete, setSavingAllowDelete] = useState(false);
  const [deletingIncomingDoc, setDeletingIncomingDoc] = useState({});

  // ── Document upload ──
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [pendingDocumentFiles, setPendingDocumentFiles] = useState({
    passport: [], diplomas: [], certificates: [],
  });
  const [documentsMarkedForDeletion, setDocumentsMarkedForDeletion] = useState({
    passport: [], diplomas: [], certificates: [],
  });

  // ── Unsaved changes baseline ──
  const [savedBaselineJson, setSavedBaselineJson] = useState("");
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);

  // ── Late-setters ref (for hook wiring) ──
  const lateSettersRef = useRef({});

  return {
    major, id, navigate, location, sp, remoteMode, remoteKind, remoteRid,
    deletedDocId, archivedDocId, stateRemoteRecord, DEBUG_GENERATE,
    docCv, setDocCv, loading, setLoading, notFound, setNotFound,
    reaction, setReaction, rating, setRating,
    telegramGroupNameCacheRef, telegramGroupNameById, setTelegramGroupNameById, ensureTelegramGroupName,
    user, userRole,
    isPhotoModalOpen, setIsPhotoModalOpen, photoModalSrc, setPhotoModalSrc,
    missingPassportModalOpen, setMissingPassportModalOpen, missingPassportResolverRef,
    isErklaerungModalOpen, setIsErklaerungModalOpen,
    isZusatzblattAModalOpen, setIsZusatzblattAModalOpen,
    isZusatzblattBModalOpen, setIsZusatzblattBModalOpen,
    isZusatzblattCModalOpen, setIsZusatzblattCModalOpen,
    isZusatzblattDModalOpen, setIsZusatzblattDModalOpen,
    isMobile, setIsMobile, showBirthPlacePicker, setShowBirthPlacePicker,
    showMaritalStatusPicker, setShowMaritalStatusPicker,
    isDrivingLicenseDropdownOpen, setIsDrivingLicenseDropdownOpen, drivingLicenseDropdownRef,
    initialForm, formCv, setFormCv,
    phoneTouched, setPhoneTouched, passportTouched, setPassportTouched, emailTouched, setEmailTouched,
    showDocuments, setShowDocuments, showComment, setShowComment, showCommentDate, setShowCommentDate,
    showBackgroundImage, setShowBackgroundImage, formInitialized, setFormInitialized,
    formInitializedRef, baselineInitializedRef, passportToastShownRef,
    emailMetaAvatarFromUsers, setEmailMetaAvatarFromUsers,
    allowIncomingDelete, setAllowIncomingDelete, savingAllowDelete, setSavingAllowDelete,
    deletingIncomingDoc, setDeletingIncomingDoc,
    selectedDocumentType, setSelectedDocumentType,
    pendingDocumentFiles, setPendingDocumentFiles,
    documentsMarkedForDeletion, setDocumentsMarkedForDeletion,
    savedBaselineJson, setSavedBaselineJson, unsavedModalOpen, setUnsavedModalOpen,
    lateSettersRef,
  };
}
