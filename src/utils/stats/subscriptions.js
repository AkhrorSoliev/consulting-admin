/**
 * Stats collection constants, doc references, subscriptions, and simple increments.
 */
import { db } from "../../firebase/config";
import {
  doc,
  increment,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

export const STATS_COLLECTION = "stats";
export const GLOBAL_STATS_DOC_ID = "global";
export const CURRENT_STATS_DOC_ID = "current";

export function statsDocRef(docId) {
  return doc(db, STATS_COLLECTION, String(docId || "").trim());
}

export async function incrementDirectionsTotal() {
  const allTimeRef = statsDocRef(GLOBAL_STATS_DOC_ID);
  const currentRef = statsDocRef(CURRENT_STATS_DOC_ID);
  await setDoc(
    allTimeRef,
    {
      totals: { directions: increment(1) },
      meta: { updatedAt: Date.now(), countersVersion: 1 },
    },
    { merge: true }
  );
  await setDoc(
    currentRef,
    {
      totals: { directions: increment(1) },
      meta: { updatedAt: Date.now(), countersVersion: 1 },
    },
    { merge: true }
  );
}

export function subscribeToGlobalStats(callback) {
  return subscribeToStatsDoc(GLOBAL_STATS_DOC_ID, callback);
}

export function subscribeToCurrentStats(callback) {
  return subscribeToStatsDoc(CURRENT_STATS_DOC_ID, callback);
}

export function subscribeToStatsDoc(docId, callback) {
  const ref = statsDocRef(docId);
  return onSnapshot(
    ref,
    (snap) => {
      callback(snap.exists() ? snap.data() : null);
    },
    (err) => {
      callback(null, err);
    }
  );
}
