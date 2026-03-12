// Collection/Direction metadata
export {
  createCollection,
  getMetaByName,
  subscribeToMetaByName,
  updateMetaByName,
  subscribeToCollections,
  deleteCollectionByName,
} from "./collections";

// Date/Time utilities & timeline/skills
export {
  toInputDate,
  fromInputDate,
  toInputMonth,
  fromInputMonth,
  sortTimelineItemsDesc,
  generateSkills,
} from "./dateTime";

// File upload/download/delete
export {
  imageFileToBase64,
  uploadFileToConsulting,
  uploadFilesToConsulting,
  uploadFileToFirebase,
  uploadFilesToFirebase,
  deleteFileFromFirebase,
  deleteUploadedFile,
  deleteUploadedFiles,
} from "./fileUpload";

// Generic Firestore document CRUD
export {
  addDocument,
  updateDocument,
  deleteDocumentById,
  getDocumentDataById,
} from "./documentCrud";

// Remote API (json-api.uz) — users, emails, passports, file cleanup
export {
  listRemoteUsers,
  getRemoteUserRecord,
  deleteRemoteUserRecord,
  checkUserRemoteByFirebaseId,
  upsertUserRemoteAllUsers,
  addUserRemoteDeleted,
  addUserRemoteArchived,
  checkEmailRemote,
  checkPassportRemote,
  registerEmailRemote,
  registerPassportRemote,
  deleteEmailRemote,
  updateEmailRemote,
  deleteUploadedFileRemote,
  deleteUploadedFilesRemote,
  extractConsultingUploadUrlsFromSnapshot,
  deleteConsultingUploadUrlsBestEffort,
  deleteConsultingUploadUrlsStrict,
} from "./remoteApi";

// Firestore email/passport registry & user snapshots
export {
  checkEmailFirestore,
  checkPassportFirestore,
  deleteEmailAndPassIdByEmail,
  upsertEmailAndPassIdFirestore,
  saveDeletedUserSnapshotFirestore,
  saveArchivedUserSnapshotFirestore,
} from "./firestoreRegistry";

// Kommentar helpers
export {
  DEFAULT_COMMENT_TEMPLATE_HTML,
  hasRichTextContent,
  getCommentHtmlOrDefault,
  commentHtmlToPlainText,
} from "./commentar";

// Stats
export {
  addCandidateWithStats,
  addCandidateWithDualStats,
  buildCandidateStatsIncrements,
  buildCandidateStatsIncrementsWithFactor,
  deleteCandidateWithCurrentStats,
  updateCandidateWithCurrentStats,
  updateCandidateWithDualStats,
  rebuildGlobalStatsFromExistingData,
  rebuildCurrentStatsFromExistingData,
  rebuildStatsDocsFromExistingData,
  seedBothStatsFromExistingData,
  ensureStatsDocAtLeast,
  subscribeToGlobalStats,
  subscribeToCurrentStats,
  subscribeToStatsDoc,
  STATS_COLLECTION,
  GLOBAL_STATS_DOC_ID,
  CURRENT_STATS_DOC_ID,
  statsDocRef,
} from "./stats";

// User sync
export {
  syncUserToFirestore,
  getUserFromFirestore,
  getUserData,
  getUserByEmail,
} from "./userSync";
