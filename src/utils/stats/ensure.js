/**
 * Monotonic "ensure at least" logic for stats documents.
 * Ensures a stats doc is never below a provided floor snapshot.
 */
import { db } from "../../firebase/config";
import { increment, runTransaction } from "firebase/firestore";
import { statsDocRef } from "./subscriptions";

function flattenNumbers(obj, prefix = "", out = {}) {
  if (!obj || typeof obj !== "object") return out;
  Object.entries(obj).forEach(([k, v]) => {
    const key = String(k);
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof v === "number" && !Number.isNaN(v)) {
      out[path] = v;
      return;
    }
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flattenNumbers(v, path, out);
    }
  });
  return out;
}

function getNumberAtPath(obj, path) {
  if (!obj || typeof obj !== "object") return 0;
  const parts = String(path || "").split(".");
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return 0;
    cur = cur[p];
  }
  const n = Number(cur);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Ensures a stats doc is NEVER below the provided floor snapshot.
 * It only ever increments fields that are smaller than floor values (monotonic).
 * Safe to run repeatedly; once caught up it becomes a no-op.
 */
export async function ensureStatsDocAtLeast(docId, floorStats) {
  const ref = statsDocRef(docId);
  const floorFlat = flattenNumbers(floorStats || {});
  const floorKeys = Object.keys(floorFlat);
  if (floorKeys.length === 0) return { updated: false };

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists() ? snap.data() : {};
    const inc = {};
    let changed = false;

    floorKeys.forEach((path) => {
      const floorVal = Number(floorFlat[path] || 0);
      const curVal = getNumberAtPath(cur, path);
      if (curVal < floorVal) {
        inc[path] = increment(floorVal - curVal);
        changed = true;
      }
    });

    if (changed) {
      inc["meta.updatedAt"] = Date.now();
      inc["meta.countersVersion"] = 1;
      tx.set(
        ref,
        { meta: { countersVersion: 1, updatedAt: Date.now() } },
        { merge: true }
      );
      tx.update(ref, inc);
    }
    return { updated: changed };
  });
}
