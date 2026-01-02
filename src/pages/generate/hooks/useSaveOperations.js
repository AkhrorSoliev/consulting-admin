import { useCallback } from "react";
import toast from "react-hot-toast";
import {
  updateCandidateWithDualStats,
  updateEmailRemote,
  upsertEmailAndPassIdFirestore,
} from "../../../utils";
import { normalizePassportNumber } from "../../../utils/validation";

export function useSaveOperations(
  candidateCollection,
  candidateDocId,
  remoteMode,
  user,
  performActualDeletions
) {
  const handleSave = useCallback(
    async (
      normalizedForm,
      setIsSaving,
      setSavedBaselineJson,
      oldEmail,
      oldPassport
    ) => {
      if (remoteMode) {
        toast.error("Remote mode da saqlash mumkin emas.");
        return false;
      }

      if (!candidateCollection || !candidateDocId) {
        toast.error("Collection yoki ID topilmadi.");
        return false;
      }

      setIsSaving(true);
      try {
        // Perform actual file deletions first
        await performActualDeletions();

        const updateData = {
          ...normalizedForm,
          updatedAt: Date.now(),
          updatedBy: user?.uid || "",
          updatedByName: user?.displayName || user?.email || "",
          updatedByPhoto: user?.photoURL || "",
        };

        await updateCandidateWithDualStats(
          candidateCollection,
          candidateDocId,
          updateData
        );

        // Update email index if changed
        const newEmail = String(
          normalizedForm?.personalInfo?.email || ""
        ).trim();
        const oldEmailNorm = String(oldEmail || "").trim();
        if (newEmail && newEmail !== oldEmailNorm) {
          try {
            await updateEmailRemote(oldEmailNorm, newEmail);
          } catch (emailErr) {}
        }

        // Update passport index if changed
        const newPassport = normalizePassportNumber(
          normalizedForm?.personalInfo?.passportNumber || ""
        );
        const oldPassportNorm = normalizePassportNumber(oldPassport || "");
        if (newPassport && newPassport !== oldPassportNorm) {
          try {
            await upsertEmailAndPassIdFirestore(
              newEmail || oldEmailNorm,
              newPassport,
              candidateCollection
            );
          } catch (passErr) {}
        }

        setSavedBaselineJson(JSON.stringify(normalizedForm));
        toast.success("Muvaffaqiyatli saqlandi!");
        return true;
      } catch (error) {
        toast.error("Saqlashda xatolik yuz berdi.");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [
      candidateCollection,
      candidateDocId,
      remoteMode,
      user,
      performActualDeletions,
    ]
  );

  return {
    handleSave,
  };
}
