import { useMemo, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";

/** All useState, useRef, and useMemo declarations for the Create form. */
export default function useCreateFormState() {
  const initialCv = useMemo(
    () => ({
      personalInfo: {
        name: "", lastName: "", gender: "", address: "",
        birthDate: "", birthPlace: "", maritalStatus: "",
        childrenCount: "", noChildren: false, hasDrivingLicense: false,
        drivingLicenseType: [], phone: "", email: "", passportNumber: "", photo: "",
      },
      experience: [],
      education: {
        schule: { startDate: "", endDate: "", institution: "", degree: "" },
        kollej: { startDate: "", endDate: "", institution: "", degree: "" },
        universitat: { startDate: "", endDate: "", institution: "", degree: "" },
      },
      skills: { softSkills: [], languages: {}, pcSkills: [] },
    }),
    [],
  );

  const [cv, setCv] = useState(initialCv);
  const [isGeneratingSoft, setIsGeneratingSoft] = useState(false);
  const [isGeneratingPc, setIsGeneratingPc] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState({ soft: [], pc: [] });
  const [isSubmitted, setIsSubmitted] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isRequiredDocsOpen, setIsRequiredDocsOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [existingMajor, setExistingMajor] = useState("");
  const [enteredEmail, setEnteredEmail] = useState("");
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false);
  const [existingPassportMajor, setExistingPassportMajor] = useState("");
  const [enteredPassport, setEnteredPassport] = useState("");
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [existingTelegramMajor, setExistingTelegramMajor] = useState("");
  const [isTelegramChecking, setIsTelegramChecking] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoModalSrc, setPhotoModalSrc] = useState("");
  const [searchParams] = useSearchParams();
  const [diplomaFiles, setDiplomaFiles] = useState([]);
  const [langCertFiles, setLangCertFiles] = useState([]);
  const [noLanguageCertificates, setNoLanguageCertificates] = useState(false);
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
  const [captchaSize, setCaptchaSize] = useState("normal");
  const captchaRef = useRef(null);
  const [showEducationWarning, setShowEducationWarning] = useState(false);
  const [showExperienceWarning, setShowExperienceWarning] = useState(false);
  const [educationErrors, setEducationErrors] = useState([]);
  const [experienceErrors, setExperienceErrors] = useState([]);
  const [showLanguageWarning, setShowLanguageWarning] = useState(false);
  const [languageErrors, setLanguageErrors] = useState([]);
  const [noCollege, setNoCollege] = useState(false);
  const [noUniversity, setNoUniversity] = useState(false);
  const [isLinkBlocked, setIsLinkBlocked] = useState(false);
  const [blockedLinkTitle, setBlockedLinkTitle] = useState("");
  const [leadValue, setLeadValue] = useState("");
  const [majorInfo, setMajorInfo] = useState({
    collectionName: "", title: "", linkId: "", showTitle: false,
  });
  const [majorLoading, setMajorLoading] = useState(false);
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [isPassportChecking, setIsPassportChecking] = useState(false);
  const lastEmailCheckRef = useRef({ email: "", exists: false });
  const lastPassportCheckRef = useRef({ passport: "", exists: false });
  const emailCheckSeqRef = useRef(0);
  const passportCheckSeqRef = useRef(0);
  const lastEmailExistsModalRef = useRef("");
  const lastPassportExistsModalRef = useRef("");
  const formScrollRef = useRef(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showBirthPlacePicker, setShowBirthPlacePicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showMaritalStatusPicker, setShowMaritalStatusPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });
  const [isInputFocused, setIsInputFocused] = useState(false);
  const STEPS = useMemo(
    () => [
      { key: "personal", label: "Pers\u00F6nliche Daten" },
      { key: "experience", label: "Berufserfahrung" },
      { key: "education", label: "Ausbildung" },
      { key: "languages", label: "Sprachen" },
      { key: "skills", label: "F\u00E4higkeiten" },
      { key: "documents", label: "Dokumente" },
      { key: "confirm", label: "Best\u00E4tigen" },
    ],
    [],
  );
  const FINAL_STEP = STEPS.length - 1;
  const [currentStep, setCurrentStep] = useState(0);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(0);

  return {
    initialCv, cv, setCv,
    isGeneratingSoft, setIsGeneratingSoft, isGeneratingPc, setIsGeneratingPc,
    recentlyAdded, setRecentlyAdded, isSubmitted, setIsSubmitted,
    isSubmitting, setIsSubmitting,
    isPrivacyOpen, setIsPrivacyOpen, isGuideOpen, setIsGuideOpen,
    isRequiredDocsOpen, setIsRequiredDocsOpen,
    isEmailModalOpen, setIsEmailModalOpen, existingMajor, setExistingMajor,
    enteredEmail, setEnteredEmail,
    isPassportModalOpen, setIsPassportModalOpen,
    existingPassportMajor, setExistingPassportMajor,
    enteredPassport, setEnteredPassport,
    isTelegramModalOpen, setIsTelegramModalOpen,
    existingTelegramMajor, setExistingTelegramMajor,
    isTelegramChecking, setIsTelegramChecking,
    isPdfPreviewOpen, setIsPdfPreviewOpen,
    isPhotoModalOpen, setIsPhotoModalOpen, photoModalSrc, setPhotoModalSrc,
    searchParams,
    diplomaFiles, setDiplomaFiles, langCertFiles, setLangCertFiles,
    noLanguageCertificates, setNoLanguageCertificates,
    passportFiles, setPassportFiles, isUploading, setIsUploading,
    diplomaError, setDiplomaError, diplomaSizeError, setDiplomaSizeError,
    langCertSizeError, setLangCertSizeError, langCertTypeError, setLangCertTypeError,
    passportError, setPassportError, passportSizeError, setPassportSizeError,
    photoSizeError, setPhotoSizeError,
    captchaToken, setCaptchaToken, captchaSize, setCaptchaSize, captchaRef,
    showEducationWarning, setShowEducationWarning,
    showExperienceWarning, setShowExperienceWarning,
    educationErrors, setEducationErrors, experienceErrors, setExperienceErrors,
    showLanguageWarning, setShowLanguageWarning, languageErrors, setLanguageErrors,
    noCollege, setNoCollege, noUniversity, setNoUniversity,
    isLinkBlocked, setIsLinkBlocked, blockedLinkTitle, setBlockedLinkTitle,
    leadValue, setLeadValue, majorInfo, setMajorInfo, majorLoading, setMajorLoading,
    isEmailChecking, setIsEmailChecking, isPassportChecking, setIsPassportChecking,
    lastEmailCheckRef, lastPassportCheckRef,
    emailCheckSeqRef, passportCheckSeqRef,
    lastEmailExistsModalRef, lastPassportExistsModalRef,
    formScrollRef,
    showCityPicker, setShowCityPicker, showBirthPlacePicker, setShowBirthPlacePicker,
    showCountryPicker, setShowCountryPicker,
    showMaritalStatusPicker, setShowMaritalStatusPicker,
    isMobile, setIsMobile, isInputFocused, setIsInputFocused,
    STEPS, FINAL_STEP, currentStep, setCurrentStep,
    maxUnlockedStep, setMaxUnlockedStep,
  };
}
