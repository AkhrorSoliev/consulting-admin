import { useState } from "react";
import toast from "react-hot-toast";
import { hasRichTextContent } from "../../../utils";
import { buildCommentMeta } from "./saveCandidate/buildCommentMeta";
import { validateForm } from "./saveCandidate/validateForm";
import {
  uploadPendingDocuments,
  replaceDocumentUrls,
} from "./saveCandidate/uploadDocuments";
import {
  buildPayload,
  normalizeLanguages,
  detectEmailChange,
} from "./saveCandidate/buildPayload";
import {
  processDocumentDeletions,
  saveToFirestore,
  persistLanguages,
  persistMetadata,
  syncEmail,
} from "./saveCandidate/persistCandidate";
import { postSaveCleanup } from "./saveCandidate/postSaveCleanup";

/**
 * Custom hook that encapsulates the handleSave logic from GenerateLegacy.
 *
 * Returns `{ handleSave, isSaving }`.
 */
export function useSaveCandidate({
  id,
  resolvedMajor,
  formCv,
  setFormCv,
  docCv,
  isLimitedAdmin,
  user,
  addressFields,
  commentHtml,
  commentBaseline,
  isCommentEditorOpen,
  setIsCommentEditorOpen,
  setCommentBaseline,
  commentMeta,
  setCommentMeta,
  normalizeForm,
  mapFormToDoc,
  documentsMarkedForDeletion,
  setDocumentsMarkedForDeletion,
  pendingDocumentFiles,
  setPendingDocumentFiles,
  remoteMode,
  statusValue,
  setStatusValue,
  statusUpdatedAt,
  setStatusUpdatedAt,
  statusUpdatedBy,
  setStatusUpdatedBy,
  normalizedCurrentForm,
  savedBaselineJson,
  setSavedBaselineJson,
}) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    console.log("💾 handleSave called");
    if (remoteMode) {
      toast.error(
        "Stellen Sie den Kandidaten zuerst im passenden Bereich (Major) wieder her. Danach können E-Mails versendet werden.",
      );
      return;
    }
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    console.log("📋 Save params:", { col, docId, remoteMode });
    if (!col || !docId) {
      console.log("❌ Save aborted: missing col or docId");
      return;
    }

    const commentHasContent = hasRichTextContent(commentHtml);
    const nextCommentMeta = await buildCommentMeta({
      commentHtml,
      docCv,
      user,
    });

    if (!validateForm({ formCv, isLimitedAdmin, addressFields })) {
      return;
    }

    try {
      setIsSaving(true);

      // 1. Upload pending document files
      const urlReplacements = await uploadPendingDocuments({
        pendingDocumentFiles,
        isLimitedAdmin,
        setPendingDocumentFiles,
      });

      // 2. Replace temp URLs with real URLs
      const formCvWithRealUrls = replaceDocumentUrls(formCv, urlReplacements);
      if (Object.keys(urlReplacements).length > 0) {
        setFormCv(formCvWithRealUrls);
      }

      // 3. Build payload
      const payload = buildPayload({
        isLimitedAdmin,
        formCv,
        formCvWithRealUrls,
        commentHtml,
        nextCommentMeta,
        mapFormToDoc,
      });

      // 4. Normalize languages
      const { cleanedLanguages, hasLanguages } = normalizeLanguages(formCv);

      // 5. Detect email change and patch payload
      const { shouldSyncEmail, oldEmail, newEmail, emailPayloadPatch } =
        detectEmailChange({
          isLimitedAdmin,
          docCv,
          formCv,
          user,
          setStatusValue,
          setStatusUpdatedAt,
          setStatusUpdatedBy,
        });
      if (emailPayloadPatch) {
        Object.assign(payload, emailPayloadPatch);
      }

      // 6. Process document deletions
      const { updatedPayload, hasDocumentChanges } =
        await processDocumentDeletions({ payload, documentsMarkedForDeletion });

      // 7. Save to Firestore
      await saveToFirestore({
        col,
        docId,
        payload: updatedPayload,
        hasDocumentChanges,
        documentsMarkedForDeletion,
        formCv,
        mapFormToDoc,
        nextCommentMeta,
        isLimitedAdmin,
      });

      // 8. Persist languages
      await persistLanguages({
        col,
        docId,
        hasLanguages,
        cleanedLanguages,
        isLimitedAdmin,
      });

      // 9. Update metadata
      await persistMetadata({ col, docId });

      // 10. Sync email if changed
      await syncEmail({
        shouldSyncEmail,
        oldEmail,
        newEmail,
        col,
        formCv,
      });

      // 11. Post-save cleanup and toast messages
      postSaveCleanup({
        commentHtml,
        commentHasContent,
        nextCommentMeta,
        isLimitedAdmin,
        documentsMarkedForDeletion,
        setFormCv,
        setDocumentsMarkedForDeletion,
        setCommentBaseline,
        setCommentMeta,
        setIsCommentEditorOpen,
        setSavedBaselineJson,
        normalizedCurrentForm,
      });
    } catch (e) {
      toast.error("Fehler beim Speichern.");
    } finally {
      setIsSaving(false);
    }
  }

  return { handleSave, isSaving };
}
