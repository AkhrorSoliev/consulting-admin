import { useEffect } from "react";
import {
  isPassportNumberValid,
  normalizePassportNumber,
} from "../../../utils/validation";

/**
 * Live passport duplicate checking via the registry Cloud Function.
 */
export function usePassportCheck({
  watchPassportNumber,
  isPassportModalOpen,
  enteredPassport,
  setIsPassportModalOpen,
  setIsPassportChecking,
  setExistingPassportMajor,
  setEnteredPassport,
  lastPassportCheckRef,
  passportCheckSeqRef,
  lastPassportExistsModalRef,
  getFieldState,
  setError,
  clearErrors,
  checkRegistryLive,
  CHECK_REGISTRY_ENDPOINT,
}) {
  useEffect(() => {
    const raw = String(watchPassportNumber || "");
    const passport = normalizePassportNumber(raw);

    if (
      isPassportModalOpen &&
      passport &&
      passport !== normalizePassportNumber(enteredPassport)
    ) {
      setIsPassportModalOpen(false);
    }

    const st = getFieldState("personalInfo.passportNumber");
    if (
      st?.error?.type === "remoteExists" &&
      passport &&
      passport !== String(lastPassportCheckRef.current?.passport || "")
    ) {
      clearErrors("personalInfo.passportNumber");
    }

    if (!passport || !isPassportNumberValid(passport)) {
      setIsPassportChecking(false);
      return;
    }

    if (passport === String(lastPassportCheckRef.current?.passport || "")) {
      setIsPassportChecking(false);
      return;
    }

    const seq = (passportCheckSeqRef.current += 1);
    const t = setTimeout(async () => {
      setIsPassportChecking(true);
      try {
        const r = await checkRegistryLive({ passportId: passport });
        if (passportCheckSeqRef.current !== seq) return;
        if (!r.ok) return;

        const exists = Boolean(r?.json?.passport?.exists);
        lastPassportCheckRef.current = { passport, exists };
        if (exists) {
          const major = String(r?.json?.passport?.major || "Unbekannt");
          setExistingPassportMajor(major);
          setEnteredPassport(passport);
          setError("personalInfo.passportNumber", {
            type: "remoteExists",
            message: `Diese Passnummer ist bereits für „${major}“ registriert.`,
          });
          if (lastPassportExistsModalRef.current !== passport) {
            setIsPassportModalOpen(true);
            lastPassportExistsModalRef.current = passport;
          }
        } else {
          const now = getFieldState("personalInfo.passportNumber");
          if (now?.error?.type === "remoteExists") {
            clearErrors("personalInfo.passportNumber");
          }
        }
      } catch (e) {
      } finally {
        if (passportCheckSeqRef.current === seq) {
          setIsPassportChecking(false);
        }
      }
    }, 650);

    return () => clearTimeout(t);
  }, [
    watchPassportNumber,
    CHECK_REGISTRY_ENDPOINT,
    clearErrors,
    getFieldState,
    setError,
    isPassportModalOpen,
    enteredPassport,
    checkRegistryLive,
    setIsPassportChecking,
    setExistingPassportMajor,
    setEnteredPassport,
    setIsPassportModalOpen,
    lastPassportCheckRef,
    passportCheckSeqRef,
    lastPassportExistsModalRef,
  ]);
}
