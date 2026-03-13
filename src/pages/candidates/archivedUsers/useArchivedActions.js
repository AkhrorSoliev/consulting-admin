import { useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { getMetaByName } from "../../../utils";
import {
  handleBulkDeleteConfirm,
  handleRestoreConfirm,
  handleMoveToDeletedConfirm,
} from "./confirmHandlers";

export default function useArchivedActions({ isPrivileged, items, load, clearSelection }) {
  const { user } = useSelector((s) => s.auth);
  const [restoringKey, setRestoringKey] = useState("");
  const [movingKey, setMovingKey] = useState("");
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

  async function restore(record) {
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
        message: `Major: ${meta?.title || col}\n\nHinweis: Der Kandidat wird in Firebase wiederhergestellt und mit all_users synchronisiert.`,
        confirmLabel: "Wiederherstellen",
        confirmVariant: "btn-primary",
      });
    } catch (e) {
      toast.error("Fehler beim Wiederherstellen.");
    } finally {
      setRestoringKey("");
    }
  }

  function moveToDeleted(record) {
    if (!isPrivileged) return;
    setConfirmState({
      kind: "move_to_deleted",
      record,
      title: "In 'Gelöschte' verschieben?",
      message: "Hinweis: Dieser Kandidat wird von archived_users nach deleted_users verschoben.\nEine Wiederherstellung ist später möglich (Restore aus 'Gelöschte').",
      confirmLabel: "Verschieben",
      confirmVariant: "btn-error",
      seconds: 3,
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
    if (confirmState?.kind === "bulk_delete") {
      await handleBulkDeleteConfirm({ confirmState, items, user, clearSelection, load });
      setConfirmState(null);
      return;
    }
    if (confirmState?.kind === "restore") {
      await handleRestoreConfirm({ confirmState, setRestoringKey, load });
      setConfirmState(null);
      return;
    }
    if (confirmState?.kind === "move_to_deleted") {
      await handleMoveToDeletedConfirm({ confirmState, setMovingKey, user, load });
      setConfirmState(null);
    }
  }

  return {
    restoringKey, movingKey, confirmState, setConfirmState,
    majorModalOpen, majorModalKey, setMajorModalKey,
    closeMajorModal, restore, confirmRestoreFromModal,
    moveToDeleted, handleBulkDelete, confirmModalAction,
  };
}
