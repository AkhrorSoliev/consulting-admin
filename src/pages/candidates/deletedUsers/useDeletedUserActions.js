import { useState } from "react";
import toast from "react-hot-toast";
import { getMetaByName } from "../../../utils";
import { executeRestore } from "./restoreCandidate";
import { executeHardDelete, executeBulkDelete } from "./deleteCandidate";

export default function useDeletedUserActions({
  isPrivileged,
  items,
  load,
  clearSelection,
}) {
  const [restoringKey, setRestoringKey] = useState("");
  const [deletingKey, setDeletingKey] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const [majorModalOpen, setMajorModalOpen] = useState(false);
  const [majorModalKey, setMajorModalKey] = useState("");
  const [pendingRecord, setPendingRecord] = useState(null);

  function openMajorModal(record) {
    setPendingRecord(record || null);
    setMajorModalKey("");
    setMajorModalOpen(true);
  }

  function closeMajorModal() {
    if (restoringKey) return;
    setMajorModalOpen(false);
    setMajorModalKey("");
    setPendingRecord(null);
  }

  function restoreToOriginal(record) {
    if (!isPrivileged) return;
    const originalMajor = String(
      record?.sourceMajor || record?.major || "",
    ).trim();
    const originalMajorLabel =
      String(record?.sourceMajorTitle || "").trim() || originalMajor;

    if (!originalMajor) {
      toast.error(
        "Originaler Bereich nicht gefunden. Bitte wählen Sie einen Bereich.",
      );
      openMajorModal(record);
      return;
    }

    setConfirmState({
      kind: "restore",
      record,
      majorKey: originalMajor,
      majorLabel: originalMajorLabel,
      title: "In Bereich (Major) wiederherstellen?",
      message: `Bereich: ${
        originalMajorLabel || originalMajor
      }\n\nHinweis: Der Kandidat wird in den ursprünglichen Bereich wiederhergestellt.`,
      confirmLabel: "Wiederherstellen",
      confirmVariant: "btn-primary",
    });
  }

  function restore(record) {
    if (!isPrivileged) return;
    openMajorModal(record);
  }

  async function confirmRestoreFromModal() {
    if (!isPrivileged || !pendingRecord) return;
    if (!majorModalKey) {
      toast.error("Bitte wählen Sie zuerst ein Berufsfeld.");
      return;
    }
    const key = String(pendingRecord?.id || "").trim() || "x";
    try {
      setRestoringKey(key);
      const meta = await getMetaByName(majorModalKey);
      const col = String(meta?.collectionName || "").trim();
      if (!col) {
        toast.error("Berufsfeld nicht gefunden. Bitte erneut wählen.");
        return;
      }
      closeMajorModal();
      setConfirmState({
        kind: "restore",
        record: pendingRecord,
        majorKey: col,
        majorLabel: meta?.title || col,
        title: "Kandidaten wiederherstellen?",
        message: `Major: ${
          meta?.title || col
        }\n\nHinweis: Der Kandidat wird in Firebase wiederhergestellt.`,
        confirmLabel: "Wiederherstellen",
        confirmVariant: "btn-primary",
      });
    } catch (e) {
      toast.error("Fehler beim Wiederherstellen.");
    } finally {
      setRestoringKey("");
    }
  }

  function deleteForever(record) {
    if (!isPrivileged) return;
    const docId = String(record?.id || "").trim();
    if (!docId) {
      toast.error("deleted_users docId nicht gefunden.");
      return;
    }
    setConfirmState({
      kind: "hard_delete",
      record,
      title: "Endgültig löschen?",
      message:
        "Hinweis: Der Kandidat wird aus der Collection deleted_users entfernt.\nUpload-Dateilinks werden ebenfalls gelöscht.\nNicht wiederherstellbar.",
      confirmLabel: "Löschen",
      confirmVariant: "btn-error",
      confirmIcon: "trash",
      seconds: 5,
    });
  }

  function handleBulkDelete(selectedKeys) {
    if (!isPrivileged || selectedKeys.length === 0) return;
    setConfirmState({
      kind: "bulk_delete",
      keys: [...selectedKeys],
      title: `Ausgewählte Kandidaten löschen?`,
      message: `${selectedKeys.length} Kandidaten werden endgültig gelöscht. Diese Aktion kann nicht rückgängig gemacht werden!`,
      confirmLabel: `Löschen (${selectedKeys.length})`,
      cancelLabel: "Abbrechen",
      confirmVariant: "btn-error",
      seconds: 0,
    });
  }

  async function confirmModalAction() {
    const c = confirmState;
    if (!c) return;

    if (c.kind === "restore") {
      const key = String(c.record?.id || "").trim() || "x";
      try {
        setRestoringKey(key);
        await executeRestore(c.record, c);
        setConfirmState(null);
        await load();
      } catch (e) {
        toast.error("Fehler beim Wiederherstellen.");
      } finally {
        setRestoringKey("");
      }
      return;
    }
    if (c.kind === "bulk_delete") {
      const keys = Array.isArray(c.keys) ? c.keys : [];
      if (keys.length === 0) return;
      setDeletingKey("bulk");
      await executeBulkDelete(keys, items);
      setConfirmState(null);
      setDeletingKey("");
      clearSelection();
      await load();
      return;
    }
    if (c.kind === "hard_delete") {
      const key = String(c.record?.id || "").trim() || "x";
      try {
        setDeletingKey(key);
        await executeHardDelete(c.record);
        setConfirmState(null);
        await load();
      } catch (e) {
        toast.error("Fehler beim Löschen.");
      } finally {
        setDeletingKey("");
      }
    }
  }

  return {
    restoringKey,
    deletingKey,
    confirmState,
    setConfirmState,
    majorModalOpen,
    majorModalKey,
    setMajorModalKey,
    closeMajorModal,
    restoreToOriginal,
    restore,
    confirmRestoreFromModal,
    deleteForever,
    handleBulkDelete,
    confirmModalAction,
  };
}
