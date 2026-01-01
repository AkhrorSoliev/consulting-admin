import { useState, useRef, useEffect, useMemo } from "react";
import { CANDIDATE_STATUS_DEFAULT } from "../../../constants/candidateStatus";
import { createEmptyStageInfo } from "../utils/stageUtils";
import { parseGermanAddress } from "../utils/addressUtils";

export function useGenerateState(initialForm) {
  // Document state
  const [docCv, setDocCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Status state
  const [statusValue, setStatusValue] = useState(CANDIDATE_STATUS_DEFAULT);
  const [statusUpdatedAt, setStatusUpdatedAt] = useState(null);
  const [statusUpdatedBy, setStatusUpdatedBy] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [sendingStepValue, setSendingStepValue] = useState(null);
  const sendingEmailLockRef = useRef(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);

  // Meta info state
  const [metaInfo, setMetaInfo] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const telegramGroupNameCacheRef = useRef({});
  const [telegramGroupNameById, setTelegramGroupNameById] = useState({});
  const [resolvedMajor, setResolvedMajor] = useState({
    collectionName: "",
    title: "",
    linkId: "",
  });

  // Remote mode state
  const [remoteRecord, setRemoteRecord] = useState(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [majors, setMajors] = useState([]);
  const [majorModalOpen, setMajorModalOpen] = useState(false);
  const [majorModalKey, setMajorModalKey] = useState("");

  // Stage email modal state
  const [isStageEmailModalOpen, setIsStageEmailModalOpen] = useState(false);
  const [pendingStageStep, setPendingStageStep] = useState(null);
  const [stageDecision, setStageDecision] = useState("accepted");
  const [stageAdditionalInfoForm, setStageAdditionalInfoForm] =
    useState(createEmptyStageInfo);
  const [selectedExample, setSelectedExample] = useState("example1");
  const [emailTemplatesMap, setEmailTemplatesMap] = useState({});

  // Custom email modal state
  const [isCustomEmailModalOpen, setIsCustomEmailModalOpen] = useState(false);
  const [customEmailForm, setCustomEmailForm] = useState({
    to: "",
    emailTitle: "Ariza holati yangilandi",
    subject: "",
    bodyText: "",
  });

  // Photo modal state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoModalSrc, setPhotoModalSrc] = useState("");
  const [missingPassportModalOpen, setMissingPassportModalOpen] =
    useState(false);
  const missingPassportResolverRef = useRef(null);

  // UI state
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });
  const [showBirthPlacePicker, setShowBirthPlacePicker] = useState(false);
  const [showMaritalStatusPicker, setShowMaritalStatusPicker] = useState(false);
  const [isDrivingLicenseDropdownOpen, setIsDrivingLicenseDropdownOpen] =
    useState(false);
  const drivingLicenseDropdownRef = useRef(null);

  // Form state
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
  const passportToastShownRef = useRef(false);

  // Comment state
  const [isCommentEditorOpen, setIsCommentEditorOpen] = useState(false);
  const [commentBaseline, setCommentBaseline] = useState("");
  const [commentMeta, setCommentMeta] = useState({
    updatedAt: null,
    updatedByName: "",
    updatedByPhoto: "",
    updatedByUid: "",
  });

  // Document upload state
  const [selectedDocumentType, setSelectedDocumentType] = useState("");

  // Address state
  const [addressFields, setAddressFields] = useState(() =>
    parseGermanAddress(initialForm.personalInfo.address)
  );
  const lastSyncedAddressRef = useRef("");
  const internalAddressUpdateRef = useRef(false);

  // Unsaved changes state
  const [savedBaselineJson, setSavedBaselineJson] = useState("");
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);

  // Window resize effect
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Driving license dropdown effect
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

  // Stage decision effect
  useEffect(() => {
    if (stageDecision === "rejected") {
      setStageAdditionalInfoForm(createEmptyStageInfo());
    }
  }, [stageDecision]);

  return {
    // Document state
    docCv,
    setDocCv,
    loading,
    setLoading,
    notFound,
    setNotFound,
    isSaving,
    setIsSaving,
    isDownloading,
    setIsDownloading,

    // Status state
    statusValue,
    setStatusValue,
    statusUpdatedAt,
    setStatusUpdatedAt,
    statusUpdatedBy,
    setStatusUpdatedBy,
    isSavingStatus,
    setIsSavingStatus,
    sendingStepValue,
    setSendingStepValue,
    sendingEmailLockRef,

    // Delete modal state
    deleteModalOpen,
    setDeleteModalOpen,
    deleteTarget,
    setDeleteTarget,
    isDeletingCandidate,
    setIsDeletingCandidate,

    // Meta info state
    metaInfo,
    setMetaInfo,
    metaLoading,
    setMetaLoading,
    telegramGroupNameCacheRef,
    telegramGroupNameById,
    setTelegramGroupNameById,
    resolvedMajor,
    setResolvedMajor,

    // Remote mode state
    remoteRecord,
    setRemoteRecord,
    remoteLoading,
    setRemoteLoading,
    restoreBusy,
    setRestoreBusy,
    majors,
    setMajors,
    majorModalOpen,
    setMajorModalOpen,
    majorModalKey,
    setMajorModalKey,

    // Stage email modal state
    isStageEmailModalOpen,
    setIsStageEmailModalOpen,
    pendingStageStep,
    setPendingStageStep,
    stageDecision,
    setStageDecision,
    stageAdditionalInfoForm,
    setStageAdditionalInfoForm,
    selectedExample,
    setSelectedExample,
    emailTemplatesMap,
    setEmailTemplatesMap,

    // Custom email modal state
    isCustomEmailModalOpen,
    setIsCustomEmailModalOpen,
    customEmailForm,
    setCustomEmailForm,

    // Photo modal state
    isPhotoModalOpen,
    setIsPhotoModalOpen,
    photoModalSrc,
    setPhotoModalSrc,
    missingPassportModalOpen,
    setMissingPassportModalOpen,
    missingPassportResolverRef,

    // UI state
    isMobile,
    setIsMobile,
    showBirthPlacePicker,
    setShowBirthPlacePicker,
    showMaritalStatusPicker,
    setShowMaritalStatusPicker,
    isDrivingLicenseDropdownOpen,
    setIsDrivingLicenseDropdownOpen,
    drivingLicenseDropdownRef,

    // Form state
    formCv,
    setFormCv,
    phoneTouched,
    setPhoneTouched,
    passportTouched,
    setPassportTouched,
    emailTouched,
    setEmailTouched,
    showDocuments,
    setShowDocuments,
    showComment,
    setShowComment,
    showCommentDate,
    setShowCommentDate,
    isGeneratingSoft,
    setIsGeneratingSoft,
    isGeneratingPc,
    setIsGeneratingPc,
    recentlyAdded,
    setRecentlyAdded,
    formInitialized,
    setFormInitialized,
    passportToastShownRef,

    // Comment state
    isCommentEditorOpen,
    setIsCommentEditorOpen,
    commentBaseline,
    setCommentBaseline,
    commentMeta,
    setCommentMeta,

    // Document upload state
    selectedDocumentType,
    setSelectedDocumentType,

    // Address state
    addressFields,
    setAddressFields,
    lastSyncedAddressRef,
    internalAddressUpdateRef,

    // Unsaved changes state
    savedBaselineJson,
    setSavedBaselineJson,
    unsavedModalOpen,
    setUnsavedModalOpen,
  };
}
