import { useMemo } from "react";
import {
  getPhoneBodyDigits,
  isEmailValid,
  isPhoneComplete,
  isPassportNumberValid,
  normalizePassportNumber,
} from "../../../utils/validation";

/**
 * All derived / computed values extracted from GenerateLegacy.
 *
 * Pure derivations from formCv, touch-flags, role, and busy flags.
 */
export function useComputedValues({
  formCv,
  phoneTouched,
  passportTouched,
  emailTouched,
  isLimitedAdmin,
  // Photo modal helpers
  setIsPhotoModalOpen,
  setPhotoModalSrc,
  // Missing-passport modal helpers
  missingPassportResolverRef,
  setMissingPassportModalOpen,
  // Busy flags (for isPageBusy / busyLabel)
  loading,
  notFound,
  isSaving,
  isDownloading,
  isSavingStatus,
  sendingStepValue,
  metaLoading,
  hasUnsavedChanges,
}) {
  // ── Personal info shortcuts ──
  const phone = String(formCv.personalInfo.phone || "").trim();
  const passportNumber = normalizePassportNumber(
    formCv.personalInfo.passportNumber || "",
  );
  const email = String(formCv.personalInfo.email || "").trim();
  const noChildren = Boolean(formCv.personalInfo.noChildren);
  const childrenCount = String(formCv.personalInfo.childrenCount || "").trim();
  const photo = String(formCv.personalInfo.photo || "").trim();

  // ── Photo modal ──
  function openPhotoModal() {
    if (!photo) return;
    setPhotoModalSrc(photo);
    setIsPhotoModalOpen(true);
  }

  function closePhotoModal() {
    setIsPhotoModalOpen(false);
    setPhotoModalSrc("");
  }

  // ── Missing-passport confirmation (Promise-based) ──
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

  // ── CSS class constants ──
  const inputBase = "input input-bordered w-full";
  const selectBase = "select select-bordered w-full";
  const fileInputBase =
    "file-input file-input-bordered file-input-primary w-full";

  // ── Validation indicators ──
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

  // ── Layout classes ──
  const layoutClass =
    "flex flex-col lg:flex-row gap-6 items-start lg:items-stretch";

  const formCardLimited =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto";
  const formCardAdmin =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[640px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto";

  const formSectionClass = isLimitedAdmin
    ? `${formCardLimited} flex-1 min-w-0 lg:self-stretch lg:basis-[60%] lg:max-w-[60%] lg:flex-none pb-14`
    : `${formCardAdmin} flex-1 min-w-0 lg:self-stretch lg:basis-[60%] lg:max-w-[60%] lg:flex-none`;

  // ── Limited-admin save button visibility ──
  const showLimitedAdminSaveButton =
    isLimitedAdmin && !isSaving && !loading && !notFound && hasUnsavedChanges;

  // ── Page busy overlay ──
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

  return {
    // Personal info shortcuts
    phone, passportNumber, email, noChildren, childrenCount, photo,
    // Photo modal
    openPhotoModal, closePhotoModal,
    // Missing-passport modal
    askContinueWithoutPassport, resolveMissingPassportModal,
    handleMissingPassportConfirm, handleMissingPassportCancel,
    // CSS classes
    inputBase, selectBase, fileInputBase,
    // Validation
    phoneOk, phoneWarn, phoneDigits,
    emailOk, emailWarn,
    passportOk, passportWarn,
    phoneShowOk, passportShowOk, emailShowOk,
    // Layout
    layoutClass, formSectionClass,
    // Busy
    showLimitedAdminSaveButton, isPageBusy, busyLabel,
  };
}
