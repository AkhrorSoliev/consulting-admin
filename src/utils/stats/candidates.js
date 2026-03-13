/**
 * Firestore transaction helpers for adding, updating, and deleting candidates
 * while keeping stats documents in sync.
 */
import { db } from "../../firebase/config";
import {
  collection,
  doc,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { GLOBAL_STATS_DOC_ID, CURRENT_STATS_DOC_ID, statsDocRef } from "./subscriptions";
import { buildCandidateStatsIncrementsWithFactor } from "./buildIncrements";
import {
  buildCandidateStatsNumbers,
  diffCounters,
  deltaToIncrements,
  mergeCandidatePayloadForStats,
} from "./buildNumbers";

export async function addCandidateWithStats(major, payload, options = {}) {
  return addCandidateWithDualStats(major, payload, options);
}

export async function addCandidateWithDualStats(major, payload, options = {}) {
  const safeMajor = String(major || "").trim();
  if (!safeMajor) throw new Error("addCandidateWithStats: major is empty");

  const colRef = collection(db, safeMajor);
  const candidateRef = doc(colRef);
  const allTimeRef = statsDocRef(GLOBAL_STATS_DOC_ID);
  const currentRef = statsDocRef(CURRENT_STATS_DOC_ID);
  const increments = buildCandidateStatsIncrementsWithFactor(
    safeMajor, payload, 1, options
  );

  try {
    await runTransaction(db, async (tx) => {
      tx.set(candidateRef, payload);
      tx.set(allTimeRef, { meta: { countersVersion: 1, updatedAt: Date.now() } }, { merge: true });
      tx.set(currentRef, { meta: { countersVersion: 1, updatedAt: Date.now() } }, { merge: true });
      tx.update(allTimeRef, increments);
      tx.update(currentRef, increments);
    });
    return { id: candidateRef.id, statsUpdated: true };
  } catch (err) {
    if (err?.code === "permission-denied") {
      await setDoc(candidateRef, payload);
      return { id: candidateRef.id, statsUpdated: false, reason: "stats-permission-denied" };
    }
    throw err;
  }
}

export async function deleteCandidateWithCurrentStats(major, docId, options = {}) {
  const safeMajor = String(major || "").trim();
  const safeId = String(docId || "").trim();
  if (!safeMajor || !safeId)
    throw new Error("deleteCandidateWithCurrentStats: invalid args");

  const candidateRef = doc(db, safeMajor, safeId);
  const currentRef = statsDocRef(CURRENT_STATS_DOC_ID);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(candidateRef);
    const payload = snap.exists() ? snap.data() : null;
    tx.delete(candidateRef);
    if (payload) {
      const dec = buildCandidateStatsIncrementsWithFactor(safeMajor, payload, -1, options);
      tx.set(currentRef, { meta: { countersVersion: 1, updatedAt: Date.now() } }, { merge: true });
      tx.update(currentRef, dec);
    }
  });
}

export async function updateCandidateWithCurrentStats(major, docId, payload, options = {}) {
  const safeMajor = String(major || "").trim();
  const safeId = String(docId || "").trim();
  if (!safeMajor || !safeId)
    throw new Error("updateCandidateWithCurrentStats: invalid args");

  const candidateRef = doc(db, safeMajor, safeId);
  const currentRef = statsDocRef(CURRENT_STATS_DOC_ID);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(candidateRef);
    const oldPayload = snap.exists() ? snap.data() : null;
    if (!oldPayload) {
      tx.set(candidateRef, payload, { merge: true });
      const inc = buildCandidateStatsIncrementsWithFactor(safeMajor, payload, 1, options);
      tx.set(currentRef, { meta: { countersVersion: 1, updatedAt: Date.now() } }, { merge: true });
      tx.update(currentRef, inc);
      return;
    }

    const oldNums = buildCandidateStatsNumbers(safeMajor, oldPayload, options);
    const mergedForStats = mergeCandidatePayloadForStats(oldPayload, payload);
    const newNums = buildCandidateStatsNumbers(safeMajor, mergedForStats, options);
    const delta = diffCounters(oldNums, newNums);
    const inc = deltaToIncrements(delta);
    inc["meta.updatedAt"] = Date.now();
    inc["meta.countersVersion"] = 1;

    tx.set(candidateRef, payload, { merge: true });
    if (Object.keys(inc).length > 0) {
      tx.set(currentRef, { meta: { countersVersion: 1, updatedAt: Date.now() } }, { merge: true });
      tx.update(currentRef, inc);
    }
  });
}

export async function updateCandidateWithDualStats(major, docId, payload, options = {}) {
  const safeMajor = String(major || "").trim();
  const safeId = String(docId || "").trim();
  if (!safeMajor || !safeId)
    throw new Error("updateCandidateWithDualStats: invalid args");

  const candidateRef = doc(db, safeMajor, safeId);
  const allTimeRef = statsDocRef(GLOBAL_STATS_DOC_ID);
  const currentRef = statsDocRef(CURRENT_STATS_DOC_ID);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(candidateRef);
    const oldPayload = snap.exists() ? snap.data() : null;
    if (!oldPayload) {
      tx.set(candidateRef, payload, { merge: true });
      const incCreate = buildCandidateStatsIncrementsWithFactor(safeMajor, payload, 1, options);
      tx.set(allTimeRef, { meta: { countersVersion: 1, updatedAt: Date.now() } }, { merge: true });
      tx.set(currentRef, { meta: { countersVersion: 1, updatedAt: Date.now() } }, { merge: true });
      tx.update(allTimeRef, incCreate);
      tx.update(currentRef, incCreate);
      return;
    }

    const oldNums = buildCandidateStatsNumbers(safeMajor, oldPayload, options);
    const mergedForStats = mergeCandidatePayloadForStats(oldPayload, payload);
    const newNums = buildCandidateStatsNumbers(safeMajor, mergedForStats, options);
    const delta = diffCounters(oldNums, newNums);
    const inc = deltaToIncrements(delta);
    inc["meta.updatedAt"] = Date.now();
    inc["meta.countersVersion"] = 1;

    tx.set(candidateRef, payload, { merge: true });
    if (Object.keys(inc).length > 0) {
      tx.set(allTimeRef, { meta: { countersVersion: 1, updatedAt: Date.now() } }, { merge: true });
      tx.set(currentRef, { meta: { countersVersion: 1, updatedAt: Date.now() } }, { merge: true });
      tx.update(allTimeRef, inc);
      tx.update(currentRef, inc);
    }
  });
}
