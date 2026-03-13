import { deleteField, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebase/config";
import toast from "react-hot-toast";
import {
  updateDocument,
  updateCandidateWithDualStats,
  deleteUploadedFile,
  updateEmailRemote,
  upsertEmailAndPassIdFirestore,
  deleteEmailAndPassIdByEmail,
} from "../../../../utils";
import { normalizePassportNumber } from "../../../../utils/validation";

/** Processes documents marked for deletion and returns the updated payload. */
export async function processDocumentDeletions({
  payload,
  documentsMarkedForDeletion,
}) {
  const updatedPayload = { ...payload };
  let hasDocumentChanges = false;

  for (const documentType of ["passport", "diplomas", "certificates"]) {
    const markedForDeletion =
      documentsMarkedForDeletion[documentType] || [];
    if (markedForDeletion.length > 0) {
      hasDocumentChanges = true;
      for (const { url } of markedForDeletion) {
        try {
          await deleteUploadedFile(url);
        } catch (err) {
          if (Number(err?.status) === 404) {
            // file already gone
          } else {
            // other error, still continue
          }
        }
      }

      const currentDocs = updatedPayload.documents?.[documentType] || [];
      const remainingDocs = currentDocs.filter(
        (url, index) =>
          !markedForDeletion.some((marked) => marked.index === index),
      );

      if (!updatedPayload.documents) {
        updatedPayload.documents = {};
      }
      updatedPayload.documents[documentType] = remainingDocs;
    }
  }

  return { updatedPayload, hasDocumentChanges };
}

/**
 * Saves the candidate payload to Firestore, handling document-change
 * rebuilds and limited-admin paths.
 */
export async function saveToFirestore({
  col,
  docId,
  payload,
  hasDocumentChanges,
  documentsMarkedForDeletion,
  formCv,
  mapFormToDoc,
  nextCommentMeta,
  isLimitedAdmin,
}) {
  if (hasDocumentChanges && !isLimitedAdmin) {
    const tempUpdatedForm = { ...formCv };
    if (!tempUpdatedForm.documents) {
      tempUpdatedForm.documents = {
        passport: [],
        diplomas: [],
        certificates: [],
      };
    }

    for (const documentType of ["passport", "diplomas", "certificates"]) {
      const markedForDeletion =
        documentsMarkedForDeletion[documentType] || [];
      if (markedForDeletion.length > 0) {
        const currentDocs = tempUpdatedForm.documents[documentType] || [];
        const remainingDocs = currentDocs.filter(
          (url, index) =>
            !markedForDeletion.some((marked) => marked.index === index),
        );
        tempUpdatedForm.documents[documentType] = remainingDocs;
      }
    }

    const finalPayload = mapFormToDoc(tempUpdatedForm);
    if (nextCommentMeta) {
      finalPayload.commentarMeta = nextCommentMeta;
    }

    await updateCandidateWithDualStats(col, docId, finalPayload, {
      majorLabel: col,
    });
  } else if (isLimitedAdmin) {
    await updateDocument(col, docId, payload);
  } else {
    await updateCandidateWithDualStats(col, docId, payload, {
      majorLabel: col,
    });
  }
}

/**
 * Overwrites or deletes the languages map in Firestore.
 */
export async function persistLanguages({
  col,
  docId,
  hasLanguages,
  cleanedLanguages,
  isLimitedAdmin,
}) {
  if (isLimitedAdmin) return;

  try {
    await updateDoc(doc(db, col, docId), {
      "faehigkeiten.sprachen": hasLanguages
        ? cleanedLanguages
        : deleteField(),
    });
    console.log(
      hasLanguages
        ? "✅ Languages map overwritten in Firebase"
        : "✅ Languages field deleted from Firebase",
    );
  } catch (langErr) {
    console.error("❌ Error updating languages field:", langErr);
  }
}

/**
 * Updates candidate_metadata collection.
 */
export async function persistMetadata({ col, docId }) {
  try {
    await updateDocument("candidate_metadata", docId, {
      collectionName: col,
      updatedAt: Date.now(),
    });
  } catch (metaErr) {
    // Ignore metadata update errors
  }
}

/**
 * Syncs email changes to the remote API and email_and_pass_id collection.
 */
export async function syncEmail({
  shouldSyncEmail,
  oldEmail,
  newEmail,
  col,
  formCv,
}) {
  if (!shouldSyncEmail) return;

  try {
    await updateEmailRemote(oldEmail, newEmail, col);
  } catch (err) {
    toast.error(
      "In Firebase gespeichert, aber Fehler beim Aktualisieren der externen E-Mail-Datenbank.",
    );
  }

  try {
    if (oldEmail) {
      await deleteEmailAndPassIdByEmail(oldEmail);
    }
    if (newEmail) {
      const passportId = normalizePassportNumber(
        formCv.personalInfo.passportNumber || "",
      );
      await upsertEmailAndPassIdFirestore({
        email: newEmail,
        major: col,
        passportId: passportId || "",
      });
    }
  } catch (err) {
    toast.error(
      "E-Mail wurde in Firebase gespeichert, aber Fehler beim Aktualisieren der E-Mail-Registrierung.",
    );
  }

  toast(
    "E-Mail wurde geändert: Kandidatenstufen wurden auf stage_1 zurückgesetzt.",
  );
}
