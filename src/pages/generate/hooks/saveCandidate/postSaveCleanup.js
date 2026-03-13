import toast from "react-hot-toast";

/**
 * Performs post-save state cleanup: updates formCv to reflect deleted
 * documents, clears deletion marks, updates baselines, and shows toasts.
 */
export function postSaveCleanup({
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
}) {
  if (isLimitedAdmin) {
    setCommentBaseline(String(commentHtml || ""));
  }

  // Clear documents marked for deletion and update form state
  const hadDocumentsToDelete = Object.values(
    documentsMarkedForDeletion,
  ).some((arr) => arr.length > 0);

  if (hadDocumentsToDelete) {
    setFormCv((prev) => {
      const updated = { ...prev };
      if (!updated.documents) {
        updated.documents = {
          passport: [],
          diplomas: [],
          certificates: [],
        };
      }

      for (const documentType of ["passport", "diplomas", "certificates"]) {
        const markedForDeletion =
          documentsMarkedForDeletion[documentType] || [];
        if (markedForDeletion.length > 0) {
          const currentDocs = updated.documents[documentType] || [];
          const remainingDocs = currentDocs.filter(
            (url, index) =>
              !markedForDeletion.some((marked) => marked.index === index),
          );
          updated.documents[documentType] = remainingDocs;
        }
      }

      return updated;
    });

    setDocumentsMarkedForDeletion({
      passport: [],
      diplomas: [],
      certificates: [],
    });
  }

  // Update baseline after state updates
  setTimeout(() => {
    setSavedBaselineJson(JSON.stringify(normalizedCurrentForm));
  }, 0);

  if (nextCommentMeta) {
    setCommentMeta(nextCommentMeta);
  }
  if (commentHasContent) {
    setIsCommentEditorOpen(false);
  }

  // Show appropriate success message
  if (hadDocumentsToDelete) {
    toast.success(
      isLimitedAdmin
        ? "Kommentar und Dokumente wurden gespeichert."
        : "Änderungen und Dokumente wurden gespeichert.",
    );
  } else {
    toast.success(
      isLimitedAdmin
        ? "Kommentar wurde gespeichert."
        : "Änderungen wurden gespeichert.",
    );
  }
}
