import {
  useEmailTemplates,
  useResolveMajor,
  useRemoteRecord,
  useCandidateSnapshot,
  useAddressSync,
} from "./dataLoading";

/**
 * Custom hook that consolidates all data-loading useEffects from GenerateLegacy.
 *
 * Subscribes to Firestore documents/collections, resolves meta info and major,
 * loads remote records, syncs address fields, and manages email templates.
 */
export function useDataLoading({
  id,
  major,
  remoteMode,
  remoteKind,
  remoteRid,
  deletedDocId,
  archivedDocId,
  stateRemoteRecord,
  user,
  userRole,
  formCv,
  setFormCv,
  initialForm,
  setDocCv,
  setLoading,
  setNotFound,
  setFormInitialized,
  formInitializedRef,
  baselineInitializedRef,
  setSavedBaselineJson,
  normalizeForm,
  mapDocToForm,
  setRating,
  setReaction,
  setEmailMetaAvatarFromUsers,
  formInitialized,
  DEBUG_GENERATE,
  // Ref holding setters from hooks that are initialized after useDataLoading.
  // Populated by the parent component before effects run.
  // Shape: { setStatusValue, setStatusUpdatedAt, setStatusUpdatedBy, setEmailMeta, setCommentMeta }
  lateSettersRef,
}) {
  // ── 1) Email templates ──────────────────────────────────────────────
  const { emailTemplatesMap } = useEmailTemplates({ userRole });

  // ── 2-3) Resolve major & majors list ────────────────────────────────
  const { resolvedMajor, setResolvedMajor, metaInfo, metaLoading, majors } =
    useResolveMajor({ major, remoteMode, setNotFound, setLoading });

  // ── 4-7) Remote record loading & form init ──────────────────────────
  const { remoteRecord, remoteLoading } = useRemoteRecord({
    remoteMode,
    remoteKind,
    remoteRid,
    deletedDocId,
    archivedDocId,
    id,
    stateRemoteRecord,
    setDocCv,
    setNotFound,
    setLoading,
    setFormCv,
    setFormInitialized,
    formInitializedRef,
    baselineInitializedRef,
    setSavedBaselineJson,
    normalizeForm,
    mapDocToForm,
  });

  // ── 8-10) Address sync & postal-code auto-fill ──────────────────────
  const {
    addressFields,
    setAddressFields,
    applyAddressFields,
    lastSyncedAddressRef,
    internalAddressUpdateRef,
    previousCityRef,
    previousBirthPlaceRef,
  } = useAddressSync({
    initialForm,
    formCv,
    setFormCv,
    formInitialized,
    baselineInitializedRef,
  });

  // ── 5) Candidate document snapshot ──────────────────────────────────
  useCandidateSnapshot({
    resolvedMajor,
    id,
    remoteMode,
    setDocCv,
    setLoading,
    setNotFound,
    setFormInitialized,
    formInitializedRef,
    baselineInitializedRef,
    setSavedBaselineJson,
    setFormCv,
    normalizeForm,
    mapDocToForm,
    setRating,
    setReaction,
    setEmailMetaAvatarFromUsers,
    formInitialized,
    DEBUG_GENERATE,
    lateSettersRef,
    previousCityRef,
    previousBirthPlaceRef,
  });

  return {
    resolvedMajor,
    setResolvedMajor,
    majors,
    metaInfo,
    metaLoading,
    remoteRecord,
    remoteLoading,
    emailTemplatesMap,
    addressFields,
    setAddressFields,
    applyAddressFields,
    lastSyncedAddressRef,
    internalAddressUpdateRef,
    previousCityRef,
    previousBirthPlaceRef,
  };
}
