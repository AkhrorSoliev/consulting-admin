import { useMemo } from "react";
import toast from "react-hot-toast";
import { updateDocument, deleteUploadedFile } from "../../../utils";
import {
  normalizeForm as normalizeFormUtil,
  mapDocToForm as mapDocToFormUtil,
  mapFormToDoc as mapFormToDocUtil,
} from "../../generate/utils";
import { usePageState } from "./usePageState";
import { useComputedValues } from "./useComputedValues";
import { usePageEffects } from "./usePageEffects";
import { useIncomingDocuments } from "./useIncomingDocuments";
import { useDataLoading } from "./useDataLoading";
import { useRemoteRestore } from "./useRemoteRestore";
import { useExperienceEditor } from "./useExperienceEditor";
import { useFormCrud } from "./useFormCrud";
import { useStatusEmail } from "./useStatusEmail";
import { useOutgoingDocuments } from "./useOutgoingDocuments";
import { useCommentEditor } from "./useCommentEditor.jsx";
import { useSaveCandidate } from "./useSaveCandidate";
import { useCandidateActions } from "./useCandidateActions";

export function useGeneratePage() {
  const s = usePageState();

  function normalizeForm(form) { return normalizeFormUtil(form, s.initialForm); }
  function mapDocToForm(data) { return mapDocToFormUtil(data, s.DEBUG_GENERATE); }
  function mapFormToDoc(f) { return mapFormToDocUtil(f); }
  async function copyToClipboard(text, successMsg = "Link kopiert.") {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success(successMsg);
      } else { throw new Error("unavailable"); }
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.focus(); ta.select();
        document.execCommand("copy"); document.body.removeChild(ta);
        toast.success(successMsg);
      } catch { toast.error("Fehler beim Kopieren des Links."); }
    }
  }

  const isLimitedAdmin = s.userRole === "limited_admin";
  const isSuperAdmin = s.userRole === "super_admin";
  const canRate = s.userRole === "admin" || isSuperAdmin;

  const dl = useDataLoading({ ...s, normalizeForm, mapDocToForm });
  const rr = useRemoteRestore({
    ...s, remoteRecord: dl.remoteRecord, resolvedMajor: dl.resolvedMajor,
    setResolvedMajor: dl.setResolvedMajor, majors: dl.majors,
  });
  const ee = useExperienceEditor({ formCv: s.formCv, setFormCv: s.setFormCv, isLimitedAdmin });
  const fc = useFormCrud({ ...s, isLimitedAdmin });
  const candidateCollection = String(dl.resolvedMajor?.collectionName || "").trim();
  const candidateDocId = String(s.id || "").trim();

  const ce = useCommentEditor({
    formCv: s.formCv, setFormCv: s.setFormCv, docCv: s.docCv,
    isLimitedAdmin, isSuperAdmin, loading: s.loading, notFound: s.notFound,
  });
  const ca = useCandidateActions({
    ...s, isLimitedAdmin, resolvedMajor: dl.resolvedMajor,
    addressFields: dl.addressFields, commentMeta: ce.commentMeta,
  });
  const se = useStatusEmail({
    ...s, isLimitedAdmin, resolvedMajor: dl.resolvedMajor,
    metaInfo: dl.metaInfo, metaLoading: dl.metaLoading,
    emailTemplatesMap: dl.emailTemplatesMap,
    setDeleteTarget: ca.setDeleteTarget, setDeleteModalOpen: ca.setDeleteModalOpen,
  });

  // Populate lateSettersRef so useCandidateSnapshot (called earlier via
  // useDataLoading) can invoke these setters inside its onSnapshot callback.
  s.lateSettersRef.current.setStatusValue = se.setStatusValue;
  s.lateSettersRef.current.setStatusUpdatedAt = se.setStatusUpdatedAt;
  s.lateSettersRef.current.setStatusUpdatedBy = se.setStatusUpdatedBy;
  s.lateSettersRef.current.setCommentMeta = ce.setCommentMeta;
  s.lateSettersRef.current.setEmailMeta = se.setEmailMeta;

  const cv = useComputedValues({
    formCv: s.formCv, phoneTouched: s.phoneTouched,
    passportTouched: s.passportTouched, emailTouched: s.emailTouched,
    isLimitedAdmin, setIsPhotoModalOpen: s.setIsPhotoModalOpen,
    setPhotoModalSrc: s.setPhotoModalSrc,
    missingPassportResolverRef: s.missingPassportResolverRef,
    setMissingPassportModalOpen: s.setMissingPassportModalOpen,
    loading: s.loading, notFound: s.notFound, isSaving: false,
    isDownloading: ca.isDownloading, isSavingStatus: se.isSavingStatus,
    sendingStepValue: se.sendingStepValue, metaLoading: dl.metaLoading,
    hasUnsavedChanges: false,
  });
  const od = useOutgoingDocuments({
    docCv: s.docCv, formCv: s.formCv, addressFields: dl.addressFields,
    remoteMode: s.remoteMode, candidateCollection, candidateDocId,
    sendingStepValue: se.sendingStepValue,
    askContinueWithoutPassport: cv.askContinueWithoutPassport,
    updateDocument, deleteUploadedFile,
  });

  const normalizedCurrentForm = useMemo(() => normalizeForm(s.formCv), [s.formCv]);
  const currentFormJson = useMemo(() => JSON.stringify(normalizedCurrentForm), [normalizedCurrentForm]);
  const hasUnsavedChanges = useMemo(() => {
    if (s.remoteMode || !s.savedBaselineJson) return false;
    const formChanged = s.savedBaselineJson !== currentFormJson;
    const hasDeletions = Object.values(s.documentsMarkedForDeletion).some((a) => a.length > 0);
    return formChanged || hasDeletions;
  }, [s.savedBaselineJson, currentFormJson, s.remoteMode, s.documentsMarkedForDeletion]);

  const sc = useSaveCandidate({
    ...s, isLimitedAdmin, resolvedMajor: dl.resolvedMajor,
    addressFields: dl.addressFields, commentHtml: ce.commentHtml,
    commentBaseline: ce.commentBaseline, isCommentEditorOpen: ce.isCommentEditorOpen,
    setIsCommentEditorOpen: ce.setIsCommentEditorOpen,
    setCommentBaseline: ce.setCommentBaseline, commentMeta: ce.commentMeta,
    setCommentMeta: ce.setCommentMeta, normalizeForm, mapFormToDoc,
    statusValue: se.statusValue, setStatusValue: se.setStatusValue,
    statusUpdatedAt: se.statusUpdatedAt, setStatusUpdatedAt: se.setStatusUpdatedAt,
    statusUpdatedBy: se.statusUpdatedBy, setStatusUpdatedBy: se.setStatusUpdatedBy,
    normalizedCurrentForm,
  });

  const isPageBusy = s.loading || sc.isSaving || ca.isDownloading ||
    se.isSavingStatus || Boolean(se.sendingStepValue) || dl.metaLoading;
  const busyLabel = s.loading ? "Wird geladen..." : sc.isSaving ? "Wird gespeichert..."
    : ca.isDownloading ? "PDF wird erstellt..." : se.isSavingStatus ? "Status wird gespeichert..."
    : se.sendingStepValue ? "E-Mail wird gesendet..." : dl.metaLoading ? "Daten werden geladen..."
    : "Bitte warten...";
  const showLimitedAdminSaveButton =
    isLimitedAdmin && !sc.isSaving && !s.loading && !s.notFound && hasUnsavedChanges;

  const id_ = useIncomingDocuments({ ...s, candidateDocId, candidateCollection });
  const pe = usePageEffects({
    ...s, metaInfo: dl.metaInfo, candidateDocId,
    hasUnsavedChanges, isSaving: sc.isSaving,
  });

  function handleCancel() {
    if (!s.docCv) return;
    const mapped = mapDocToForm(s.docCv);
    s.setFormCv(normalizeForm(mapped));
    ce.setCommentBaseline(ce.getCommentHtml(mapped));
    ce.setIsCommentEditorOpen(false);
    s.setPhoneTouched(false); s.setPassportTouched(false); s.setEmailTouched(false);
    fc.setRecentlyAdded({ soft: [], pc: [] });
    s.setDocumentsMarkedForDeletion({ passport: [], diplomas: [], certificates: [] });
  }

  return {
    ...s, ...dl, ...rr, ...ee, ...fc, ...se, ...od, ...ce,
    ...ca, ...cv, ...id_, ...pe,
    handleSave: sc.handleSave, isSaving: sc.isSaving,
    isLimitedAdmin, isSuperAdmin, canRate, candidateCollection, candidateDocId,
    isPageBusy, busyLabel, showLimitedAdminSaveButton, hasUnsavedChanges,
    handleCancel, copyToClipboard, mapFormToDoc, normalizeForm, mapDocToForm,
  };
}
