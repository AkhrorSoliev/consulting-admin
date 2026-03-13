import { useEffect, useMemo } from "react";
import { useBlocker } from "react-router-dom";

/**
 * Side effects extracted from GenerateLegacy:
 *  - window resize (isMobile)
 *  - driving license dropdown outside-click
 *  - telegram group name preloading
 *  - unsaved-changes blocker (useBlocker + beforeunload)
 *  - passport toast guard
 *  - missingPassportResolverRef cleanup
 */
export function usePageEffects({
  // Responsive
  setIsMobile,
  // Driving license
  isDrivingLicenseDropdownOpen,
  setIsDrivingLicenseDropdownOpen,
  drivingLicenseDropdownRef,
  // Telegram
  metaInfo,
  telegramGroupNameCacheRef,
  ensureTelegramGroupName,
  // Incoming-doc metadata
  candidateDocId,
  // Unsaved changes
  hasUnsavedChanges,
  isSaving,
  unsavedModalOpen,
  setUnsavedModalOpen,
  // Passport toast
  formInitialized,
  formCv,
  passportToastShownRef,
  // Missing passport resolver cleanup
  missingPassportResolverRef,
}) {
  // ── 1. Window resize → isMobile ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsMobile]);

  // ── 2. Driving-license dropdown outside click ──
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
  }, [
    isDrivingLicenseDropdownOpen,
    setIsDrivingLicenseDropdownOpen,
    drivingLicenseDropdownRef,
  ]);

  // ── 3. Telegram group name preloading ──
  useEffect(() => {
    const ids = [
      String(metaInfo?.interviewInternal?.telegramGroupId || "").trim(),
      String(metaInfo?.interviewLeadership?.telegramGroupId || "").trim(),
      String(metaInfo?.interviewEmployer?.telegramGroupId || "").trim(),
    ].filter(Boolean);
    if (ids.length === 0) return;
    ids.forEach((gid) => {
      if (telegramGroupNameCacheRef.current?.[gid]) return;
      ensureTelegramGroupName(gid);
    });
  }, [
    metaInfo?.interviewInternal?.telegramGroupId,
    metaInfo?.interviewLeadership?.telegramGroupId,
    metaInfo?.interviewEmployer?.telegramGroupId,
    ensureTelegramGroupName,
    telegramGroupNameCacheRef,
  ]);

  // ── 4. Unsaved-changes blocker ──
  const unsavedBlocker = useBlocker(
    Boolean(hasUnsavedChanges) && !Boolean(isSaving),
  );

  useEffect(() => {
    if (unsavedBlocker.state === "blocked") {
      setUnsavedModalOpen(true);
    }
  }, [unsavedBlocker.state, setUnsavedModalOpen]);

  useEffect(() => {
    if (!hasUnsavedChanges && unsavedModalOpen) {
      setUnsavedModalOpen(false);
    }
  }, [hasUnsavedChanges, unsavedModalOpen, setUnsavedModalOpen]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const message =
      "Sie haben ungespeicherte Änderungen. Wenn Sie die Seite verlassen, gehen diese Änderungen verloren.";
    function onBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = message;
      return message;
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);

  // ── 5. Passport toast guard ──
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

  // ── 6. Missing-passport resolver cleanup ──
  useEffect(() => {
    return () => {
      if (missingPassportResolverRef.current) {
        missingPassportResolverRef.current(false);
        missingPassportResolverRef.current = null;
      }
    };
  }, [missingPassportResolverRef]);

  // ── Navigation helpers ──
  function stayOnGeneratePage() {
    setUnsavedModalOpen(false);
    unsavedBlocker.reset?.();
  }

  function leaveGeneratePage() {
    setUnsavedModalOpen(false);
    unsavedBlocker.proceed?.();
  }

  return {
    unsavedBlocker,
    stayOnGeneratePage,
    leaveGeneratePage,
  };
}
