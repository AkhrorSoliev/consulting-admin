import { useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toInputDate } from "../../../utils";
import { formatGermanAddress } from "../dataHelpers";
import { REGION_POSTAL_CODES } from "../../../constants/regionPostalCodes";
import useCreateFormState from "./useCreateFormState";
import useCreateEffects from "./useCreateEffects";
import useMajorSetup from "./useMajorSetup";
import useRegistryCheck from "./useRegistryCheck";
import useExperienceCrud from "./useExperienceCrud";
import useSkillsLanguageCrud from "./useSkillsLanguageCrud";
import useStepValidation from "./useStepValidation";
import useFormSubmission from "./useFormSubmission";
import usePreviewCv from "./usePreviewCv";
import useOnInvalid from "./useOnInvalid";

const TELEGRAM_SUPPORT_URL = "https://t.me/consultinguz_chat";
const LANG_CERT_TYPES = [
  "DAF Sprachzentrum Zertifikat",
  "Goethe-Zertifikat",
  "TestDaF",
  "telc Deutsch",
  "OSD",
];
const DRIVING_LICENSE_OPTIONS = ["A", "B", "BE", "C", "D"];
const MAX_PHOTO_BYTES = 250 * 1024;

/** Orchestrator hook: wires all sub-hooks together and returns everything the JSX needs. */
export default function useCreatePage() {
  const s = useCreateFormState();

  const {
    register, control, handleSubmit: rhfHandleSubmit, setValue, setError,
    clearErrors, setFocus, watch, trigger, getFieldState,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      personalInfo: {
        name: s.initialCv.personalInfo.name,
        lastName: s.initialCv.personalInfo.lastName,
        gender: s.initialCv.personalInfo.gender,
        address: s.initialCv.personalInfo.address,
        addressStreet: "", addressHouseNumber: "", addressPostalCode: "",
        addressCity: "", addressCountry: "",
        birthDate: toInputDate(s.initialCv.personalInfo.birthDate),
        birthPlace: s.initialCv.personalInfo.birthPlace,
        maritalStatus: s.initialCv.personalInfo.maritalStatus,
        childrenCount: s.initialCv.personalInfo.childrenCount,
        noChildren: s.initialCv.personalInfo.noChildren,
        hasDrivingLicense: s.initialCv.personalInfo.hasDrivingLicense,
        drivingLicenseType: s.initialCv.personalInfo.drivingLicenseType,
        phone: s.initialCv.personalInfo.phone,
        email: s.initialCv.personalInfo.email,
        passportNumber: s.initialCv.personalInfo.passportNumber,
        photo: s.initialCv.personalInfo.photo,
      },
    },
  });

  // Watched fields
  const addressStreet = watch("personalInfo.addressStreet");
  const addressHouseNumber = watch("personalInfo.addressHouseNumber");
  const addressPostalCode = watch("personalInfo.addressPostalCode");
  const addressCity = watch("personalInfo.addressCity");
  const addressCountry = watch("personalInfo.addressCountry");
  const watchBirthPlace = watch("personalInfo.birthPlace");
  const watchEmail = watch("personalInfo.email");
  const watchPassportNumber = watch("personalInfo.passportNumber");
  const watchMaritalStatus = watch("personalInfo.maritalStatus");

  const languageRows = useMemo(
    () => Object.entries(s.cv.skills.languages).map(([name, level]) => ({ name, level })),
    [s.cv.skills.languages],
  );

  // --- Sub-hooks ---
  const { checkRegistryLive, CHECK_REGISTRY_ENDPOINT } = useRegistryCheck({
    watchEmail, watchPassportNumber,
    isEmailModalOpen: s.isEmailModalOpen, enteredEmail: s.enteredEmail,
    isPassportModalOpen: s.isPassportModalOpen, enteredPassport: s.enteredPassport,
    setIsEmailModalOpen: s.setIsEmailModalOpen, setIsPassportModalOpen: s.setIsPassportModalOpen,
    setIsEmailChecking: s.setIsEmailChecking, setIsPassportChecking: s.setIsPassportChecking,
    setExistingMajor: s.setExistingMajor, setEnteredEmail: s.setEnteredEmail,
    setExistingPassportMajor: s.setExistingPassportMajor, setEnteredPassport: s.setEnteredPassport,
    lastEmailCheckRef: s.lastEmailCheckRef, lastPassportCheckRef: s.lastPassportCheckRef,
    emailCheckSeqRef: s.emailCheckSeqRef, passportCheckSeqRef: s.passportCheckSeqRef,
    lastEmailExistsModalRef: s.lastEmailExistsModalRef, lastPassportExistsModalRef: s.lastPassportExistsModalRef,
    getFieldState, setError, clearErrors,
  });

  useCreateEffects({
    setCaptchaSize: s.setCaptchaSize, setIsMobile: s.setIsMobile,
    setIsRequiredDocsOpen: s.setIsRequiredDocsOpen, setIsInputFocused: s.setIsInputFocused,
    setIsPrivacyOpen: s.setIsPrivacyOpen, setIsGuideOpen: s.setIsGuideOpen,
    setIsPdfPreviewOpen: s.setIsPdfPreviewOpen,
    isPrivacyOpen: s.isPrivacyOpen, isGuideOpen: s.isGuideOpen, isPdfPreviewOpen: s.isPdfPreviewOpen,
    cv: s.cv, setShowEducationWarning: s.setShowEducationWarning, setEducationErrors: s.setEducationErrors,
    setShowExperienceWarning: s.setShowExperienceWarning, setExperienceErrors: s.setExperienceErrors,
    setShowLanguageWarning: s.setShowLanguageWarning, setLanguageErrors: s.setLanguageErrors,
    languageRows, majorInfo: s.majorInfo, majorLoading: s.majorLoading, setIsSubmitted: s.setIsSubmitted,
    watchBirthPlace, setValue,
    addressStreet, addressHouseNumber, addressPostalCode, addressCity, addressCountry,
    formatGermanAddress, REGION_POSTAL_CODES,
  });

  useMajorSetup({
    searchParams: s.searchParams,
    setMajorLoading: s.setMajorLoading, setIsLinkBlocked: s.setIsLinkBlocked,
    setBlockedLinkTitle: s.setBlockedLinkTitle, setLeadValue: s.setLeadValue,
    setMajorInfo: s.setMajorInfo, setIsTelegramChecking: s.setIsTelegramChecking,
    setExistingTelegramMajor: s.setExistingTelegramMajor,
    setIsTelegramModalOpen: s.setIsTelegramModalOpen,
    checkRegistryLive, CHECK_REGISTRY_ENDPOINT,
  });

  const experienceCrud = useExperienceCrud({
    setCv: s.setCv, setShowEducationWarning: s.setShowEducationWarning, setEducationErrors: s.setEducationErrors,
  });

  const skillsCrud = useSkillsLanguageCrud({
    cv: s.cv, setCv: s.setCv,
    setIsGeneratingSoft: s.setIsGeneratingSoft, setIsGeneratingPc: s.setIsGeneratingPc,
    setRecentlyAdded: s.setRecentlyAdded,
  });

  const stepVal = useStepValidation({
    currentStep: s.currentStep, setCurrentStep: s.setCurrentStep,
    setMaxUnlockedStep: s.setMaxUnlockedStep, FINAL_STEP: s.FINAL_STEP,
    cv: s.cv, setCv: s.setCv, languageRows,
    diplomaFiles: s.diplomaFiles, langCertFiles: s.langCertFiles,
    noLanguageCertificates: s.noLanguageCertificates, passportFiles: s.passportFiles,
    setShowEducationWarning: s.setShowEducationWarning, setEducationErrors: s.setEducationErrors,
    setShowExperienceWarning: s.setShowExperienceWarning, setExperienceErrors: s.setExperienceErrors,
    setShowLanguageWarning: s.setShowLanguageWarning, setLanguageErrors: s.setLanguageErrors,
    setDiplomaError: s.setDiplomaError, setLangCertTypeError: s.setLangCertTypeError,
    setPassportError: s.setPassportError,
    trigger, getFieldState, watch, formScrollRef: s.formScrollRef,
  });

  const { onSubmit } = useFormSubmission({
    cv: s.cv, languageRows,
    diplomaFiles: s.diplomaFiles, langCertFiles: s.langCertFiles,
    noLanguageCertificates: s.noLanguageCertificates, passportFiles: s.passportFiles,
    captchaToken: s.captchaToken, captchaRef: s.captchaRef, setCaptchaToken: s.setCaptchaToken,
    majorInfo: s.majorInfo, majorLoading: s.majorLoading, leadValue: s.leadValue, searchParams: s.searchParams,
    setIsUploading: s.setIsUploading, setIsSubmitting: s.setIsSubmitting, setIsSubmitted: s.setIsSubmitted,
    setShowEducationWarning: s.setShowEducationWarning, setEducationErrors: s.setEducationErrors,
    setShowExperienceWarning: s.setShowExperienceWarning, setExperienceErrors: s.setExperienceErrors,
    setShowLanguageWarning: s.setShowLanguageWarning, setLanguageErrors: s.setLanguageErrors,
    setDiplomaError: s.setDiplomaError, setLangCertTypeError: s.setLangCertTypeError, setPassportError: s.setPassportError,
    setExistingMajor: s.setExistingMajor, setEnteredEmail: s.setEnteredEmail, setIsEmailModalOpen: s.setIsEmailModalOpen,
    setExistingPassportMajor: s.setExistingPassportMajor, setEnteredPassport: s.setEnteredPassport,
    setIsPassportModalOpen: s.setIsPassportModalOpen, setError,
  });

  const previewCv = usePreviewCv({
    cv: s.cv, noCollege: s.noCollege, noUniversity: s.noUniversity,
    watchName: watch("personalInfo.name"), watchLastName: watch("personalInfo.lastName"),
    watchGender: watch("personalInfo.gender"), watchBirthDate: watch("personalInfo.birthDate"),
    watchBirthPlace, watchMaritalStatus,
    watchChildrenCount: watch("personalInfo.childrenCount"),
    watchNoChildren: watch("personalInfo.noChildren"),
    watchHasDrivingLicense: watch("personalInfo.hasDrivingLicense"),
    watchDrivingLicenseType: watch("personalInfo.drivingLicenseType"),
    watchAddress: watch("personalInfo.address"),
    watchPhone: watch("personalInfo.phone"), watchEmail,
    watchPassportNumber, watchPhoto: watch("personalInfo.photo"),
  });

  const openPhotoModal = useCallback(() => {
    const photo = String(previewCv?.personalInfo?.photo || "").trim();
    if (!photo) return;
    s.setPhotoModalSrc(photo);
    s.setIsPhotoModalOpen(true);
  }, [previewCv, s]);

  const closePhotoModal = useCallback(() => {
    s.setIsPhotoModalOpen(false);
    s.setPhotoModalSrc("");
  }, [s]);

  const onInvalid = useOnInvalid({ setFocus });

  return {
    ...s, ...experienceCrud, ...skillsCrud, ...stepVal,
    register, control, rhfHandleSubmit, setValue, setError, clearErrors, setFocus,
    watch, trigger, getFieldState, errors,
    languageRows, previewCv, onSubmit, onInvalid, openPhotoModal, closePhotoModal,
    addressStreet, addressHouseNumber, addressPostalCode, addressCity, addressCountry,
    watchBirthPlace, watchEmail, watchPassportNumber, watchMaritalStatus,
    TELEGRAM_SUPPORT_URL, LANG_CERT_TYPES, DRIVING_LICENSE_OPTIONS, MAX_PHOTO_BYTES,
  };
}
