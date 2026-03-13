import { useState } from "react";
import { db } from "../../../firebase/config";
import { doc, updateDoc, collection, query, orderBy, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";
import {
  deleteCandidateWithCurrentStats,
  getDocumentDataById,
  deleteEmailAndPassIdByEmail,
  saveArchivedUserSnapshotFirestore,
  saveDeletedUserSnapshotFirestore,
} from "../../../utils";
import {
  exportCandidatesToExcel,
  exportFullCandidatesToExcel,
} from "../../../utils/excelExport";

export function useCandidateActions({ resolvedMajor, items, filteredItems, title, isLimitedAdmin, isSuperAdmin }) {
  const [deletingId, setDeletingId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportingFull, setExportingFull] = useState(false);

  function openDeleteModal(item) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Kandidaten zu löschen.");
      return;
    }
    if (!item?.id) return;
    setDeleteTarget({ id: item.id, name: item.name || "", email: item.email || "" });
    setDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (deletingId) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Kandidaten zu löschen.");
      return;
    }
    const colName = String(resolvedMajor?.collectionName || "").trim();
    const itemId = deleteTarget?.id;
    if (!colName || !itemId) return;
    try {
      setDeletingId(itemId);
      const full = await getDocumentDataById(colName, itemId);
      const remotePayload = full && typeof full === "object" ? full : {};
      const emailFromDoc = String(full?.persoenlicheDaten?.email || "").trim();
      const targetEmail = String(deleteTarget?.email || emailFromDoc || "").trim().toLowerCase();
      if (targetEmail) {
        await deleteEmailAndPassIdByEmail(targetEmail);
      }
      await saveDeletedUserSnapshotFirestore({
        major: resolvedMajor?.collectionName || colName,
        sourceDocId: itemId,
        majorTitle: resolvedMajor?.title || colName,
        deletedBy: "admin",
        payload: { major: resolvedMajor?.collectionName || colName, ...remotePayload },
      });
      await deleteCandidateWithCurrentStats(colName, itemId, {
        majorLabel: resolvedMajor?.title || colName,
      });
      toast.success("Kandidat erfolgreich gelöscht.");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Fehler beim Löschen.");
    } finally {
      setDeletingId(null);
    }
  }

  async function confirmArchive() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Kandidaten zu löschen.");
      return;
    }
    const colName = String(resolvedMajor?.collectionName || "").trim();
    const itemId = deleteTarget?.id;
    if (!colName || !itemId) return;
    try {
      setDeletingId(itemId);
      const full = await getDocumentDataById(colName, itemId);
      const remotePayload = full && typeof full === "object" ? full : {};
      await saveArchivedUserSnapshotFirestore({
        major: resolvedMajor?.collectionName || colName,
        sourceDocId: itemId,
        majorTitle: resolvedMajor?.title || colName,
        archivedBy: "admin",
        payload: { major: resolvedMajor?.collectionName || colName, ...remotePayload },
      });
      await deleteCandidateWithCurrentStats(colName, itemId, {
        majorLabel: resolvedMajor?.title || colName,
      });
      toast.success("Kandidat archiviert.");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Fehler beim Archivieren.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleReaction(itemId, reactionType) {
    if (!isSuperAdmin) {
      toast.error("Faqat super_admin reaktsiya qo'ya oladi.");
      return;
    }
    const colName = String(resolvedMajor?.collectionName || "").trim();
    if (!colName || !itemId) return;
    try {
      const candidateRef = doc(db, colName, itemId);
      const currentItem = items.find((item) => item.id === itemId);
      const newReaction = currentItem?.reaction === reactionType ? null : reactionType;
      await updateDoc(candidateRef, { reaction: newReaction, reactionUpdatedAt: Date.now() });
      toast.success(
        newReaction === "like" ? "\uD83D\uDC4D Gef\u00e4llt mir"
          : newReaction === "dislike" ? "\uD83D\uDC4E Gef\u00e4llt mir nicht"
          : "Reaktion entfernt",
      );
    } catch (err) {
      toast.error("Fehler beim Speichern der Reaktion.");
    }
  }

  function handleExportExcel() {
    if (exporting || filteredItems.length === 0) return;
    setExporting(true);
    try {
      exportCandidatesToExcel(filteredItems, title);
      toast.success(`${filteredItems.length} Kandidaten exportiert.`);
    } catch (err) {
      toast.error(err.message || "Fehler beim Exportieren.");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportFullExcel() {
    if (exportingFull || items.length === 0) return;
    const colName = String(resolvedMajor?.collectionName || "").trim();
    if (!colName) { toast.error("Berufsfeld nicht gefunden."); return; }
    setExportingFull(true);
    try {
      toast("To'liq ma'lumotlar yuklanmoqda...", { duration: 2000 });
      const q = query(collection(db, colName), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const fullDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      exportFullCandidatesToExcel(fullDocs, title);
      toast.success(`${fullDocs.length} kandidat to'liq ma'lumotlari eksport qilindi.`);
    } catch (err) {
      toast.error(err.message || "Fehler beim Exportieren.");
    } finally {
      setExportingFull(false);
    }
  }

  return {
    deletingId, deleteModalOpen, deleteTarget,
    openDeleteModal, closeDeleteModal, confirmDelete, confirmArchive,
    handleReaction,
    exporting, exportingFull, handleExportExcel, handleExportFullExcel,
  };
}
