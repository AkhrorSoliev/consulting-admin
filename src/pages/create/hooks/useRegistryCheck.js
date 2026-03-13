import { useCallback } from "react";
import { useEmailCheck } from "./useEmailCheck";
import { usePassportCheck } from "./usePassportCheck";

/**
 * Email and passport live-checking against the registry Cloud Function.
 * Returns the checkRegistryLive helper and the endpoint constants.
 */
export default function useRegistryCheck({
  watchEmail,
  watchPassportNumber,
  isEmailModalOpen,
  enteredEmail,
  isPassportModalOpen,
  enteredPassport,
  setIsEmailModalOpen,
  setIsPassportModalOpen,
  setIsEmailChecking,
  setIsPassportChecking,
  setExistingMajor,
  setEnteredEmail,
  setExistingPassportMajor,
  setEnteredPassport,
  lastEmailCheckRef,
  lastPassportCheckRef,
  emailCheckSeqRef,
  passportCheckSeqRef,
  lastEmailExistsModalRef,
  lastPassportExistsModalRef,
  getFieldState,
  setError,
  clearErrors,
}) {
  const CHECK_REGISTRY_ENDPOINT =
    import.meta.env.VITE_CHECK_REGISTRY_URL ||
    (import.meta.env.VITE_FUNCTIONS_BASE &&
      `${import.meta.env.VITE_FUNCTIONS_BASE}/checkRegistry`);

  const checkRegistryLive = useCallback(
    async ({ email, passportId, telegramId }) => {
      if (!CHECK_REGISTRY_ENDPOINT) {
        return { ok: false, skipped: true };
      }
      const ac = new AbortController();
      const t = window.setTimeout(() => ac.abort(), 5000);
      try {
        const res = await fetch(CHECK_REGISTRY_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ac.signal,
          body: JSON.stringify({
            ...(email ? { email } : {}),
            ...(passportId ? { passportId } : {}),
            ...(telegramId ? { telegramId } : {}),
          }),
        });
        const json = await res.json().catch(() => ({}));
        return { ok: Boolean(res.ok && json?.ok), status: res.status, json };
      } catch (e) {
        return { ok: false, error: "network", details: String(e?.message || e) };
      } finally {
        window.clearTimeout(t);
      }
    },
    [CHECK_REGISTRY_ENDPOINT],
  );

  useEmailCheck({
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
  });

  usePassportCheck({
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
  });

  return {
    checkRegistryLive,
    CHECK_REGISTRY_ENDPOINT,
  };
}
