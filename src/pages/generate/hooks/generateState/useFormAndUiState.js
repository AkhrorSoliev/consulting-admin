import { useState, useRef, useEffect } from "react";
import { parseGermanAddress } from "../../utils/addressUtils";

export function useFormAndUiState(initialForm) {
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

  // Unsaved changes baseline
  const [savedBaselineJson, setSavedBaselineJson] = useState("");

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

  return {
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

    // Unsaved changes baseline
    savedBaselineJson,
    setSavedBaselineJson,
  };
}
