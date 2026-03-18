import { useEffect } from "react";
import { isEmailValid } from "../../../utils/validation";

/**
 * Live email duplicate checking via the registry Cloud Function.
 */
export function useEmailCheck({
  watchEmail,
  isEmailModalOpen,
  enteredEmail,
  setIsEmailModalOpen,
  setIsEmailChecking,
  setExistingMajor,
  setEnteredEmail,
  lastEmailCheckRef,
  emailCheckSeqRef,
  lastEmailExistsModalRef,
  getFieldState,
  setError,
  clearErrors,
  checkRegistryLive,
  CHECK_REGISTRY_ENDPOINT,
}) {
  useEffect(() => {
    const raw = String(watchEmail || "").trim();
    const email = raw.toLowerCase();

    if (
      isEmailModalOpen &&
      email &&
      email !==
        String(enteredEmail || "")
          .trim()
          .toLowerCase()
    ) {
      setIsEmailModalOpen(false);
    }

    const st = getFieldState("personalInfo.email");
    if (
      st?.error?.type === "remoteExists" &&
      email &&
      email !== String(lastEmailCheckRef.current?.email || "")
    ) {
      clearErrors("personalInfo.email");
    }

    if (!email || !isEmailValid(email)) {
      setIsEmailChecking(false);
      return;
    }

    if (email === String(lastEmailCheckRef.current?.email || "")) {
      setIsEmailChecking(false);
      return;
    }

    const seq = (emailCheckSeqRef.current += 1);
    const t = setTimeout(async () => {
      setIsEmailChecking(true);
      try {
        const r = await checkRegistryLive({ email });
        if (emailCheckSeqRef.current !== seq) return;
        if (!r.ok) return;

        const exists = Boolean(r?.json?.email?.exists);
        lastEmailCheckRef.current = { email, exists };
        if (exists) {
          const major = String(r?.json?.email?.major || "Unbekannt");
          setExistingMajor(major);
          setEnteredEmail(email);
          setError("personalInfo.email", {
            type: "remoteExists",
            message: `Diese E-Mail ist bereits für „${major}“ registriert.`,
          });
          if (lastEmailExistsModalRef.current !== email) {
            setIsEmailModalOpen(true);
            lastEmailExistsModalRef.current = email;
          }
        } else {
          const now = getFieldState("personalInfo.email");
          if (now?.error?.type === "remoteExists") {
            clearErrors("personalInfo.email");
          }
        }
      } catch (e) {
      } finally {
        if (emailCheckSeqRef.current === seq) {
          setIsEmailChecking(false);
        }
      }
    }, 650);

    return () => clearTimeout(t);
  }, [
    watchEmail,
    CHECK_REGISTRY_ENDPOINT,
    clearErrors,
    getFieldState,
    setError,
    isEmailModalOpen,
    enteredEmail,
    checkRegistryLive,
    setIsEmailChecking,
    setExistingMajor,
    setEnteredEmail,
    setIsEmailModalOpen,
    lastEmailCheckRef,
    emailCheckSeqRef,
    lastEmailExistsModalRef,
  ]);
}
