// Stats barrel - re-exports all public API from sub-modules.

export {
  STATS_COLLECTION,
  GLOBAL_STATS_DOC_ID,
  CURRENT_STATS_DOC_ID,
  statsDocRef,
  incrementDirectionsTotal,
  subscribeToGlobalStats,
  subscribeToCurrentStats,
  subscribeToStatsDoc,
} from "./subscriptions";

export {
  buildCandidateStatsIncrements,
  buildCandidateStatsIncrementsWithFactor,
} from "./buildIncrements";

export {
  addCandidateWithStats,
  addCandidateWithDualStats,
  deleteCandidateWithCurrentStats,
  updateCandidateWithCurrentStats,
  updateCandidateWithDualStats,
} from "./candidates";

export {
  rebuildStatsDocsFromExistingData,
  rebuildGlobalStatsFromExistingData,
  rebuildCurrentStatsFromExistingData,
  seedBothStatsFromExistingData,
} from "./rebuild";

export { ensureStatsDocAtLeast } from "./ensure";
