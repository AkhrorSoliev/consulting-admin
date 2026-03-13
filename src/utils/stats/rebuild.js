/**
 * Functions for rebuilding / seeding stats documents from existing Firestore data.
 */
import { db } from "../../firebase/config";
import { collection, getDocs, query, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { GLOBAL_STATS_DOC_ID, CURRENT_STATS_DOC_ID, statsDocRef } from "./subscriptions";
import { ensureStatsDocAtLeast } from "./ensure";
import { safeKey } from "./helpers";
import { computeStatsSnapshotFromExistingData, processPayload } from "./snapshotProcessor";

export async function rebuildStatsDocsFromExistingData(
  docIds,
  { toastProgress = true, overwriteGlobal = false } = {}
) {
  const list = Array.isArray(docIds) ? docIds.filter(Boolean) : [];
  if (list.length === 0) throw new Error("rebuildStatsDocsFromExistingData: no docIds");

  try {
    if (toastProgress) toast("Statistika qayta hisoblanmoqda...");

    const metaSnap = await getDocs(query(collection(db, "meta")));
    const allMajors = metaSnap.docs
      .map((d) => ({
        name: String(d.data()?.name || d.id || "").trim(),
        isDeleted: Boolean(d.data()?.isDeleted),
      }))
      .filter((m) => m.name);
    const majors = allMajors.filter((m) => !m.isDeleted).map((m) => m.name);

    const { stats } = computeStatsSnapshotFromExistingData();
    stats.totals.directions = majors.length;

    for (const major of majors) {
      // eslint-disable-next-line no-await-in-loop
      const snap = await getDocs(collection(db, major));
      const docs = snap.docs.map((d) => d.data() || {});
      stats.totals.candidates += docs.length;
      stats.totals.byMajor[major] = (stats.totals.byMajor[major] || 0) + docs.length;
      stats.totals.byMajorLead[major] = stats.totals.byMajorLead[major] || {};

      docs.forEach((payload) => {
        const leadRaw =
          payload?.lead ?? payload?.tracking?.lead ??
          payload?.meta?.lead ?? payload?.source?.lead;
        const leadKey = safeKey(leadRaw, "");
        if (leadKey) {
          stats.totals.byMajorLead[major][leadKey] =
            (stats.totals.byMajorLead[major][leadKey] || 0) + 1;
        }
        processPayload(stats, payload);
      });
    }

    await Promise.all(
      list.map(async (id) => {
        const safeId = String(id || "").trim();
        if (!safeId) return;
        if (safeId === GLOBAL_STATS_DOC_ID && !overwriteGlobal) {
          await ensureStatsDocAtLeast(GLOBAL_STATS_DOC_ID, stats);
          return;
        }
        await setDoc(statsDocRef(safeId), stats, { merge: false });
      })
    );
    if (toastProgress) toast.success("Statistik erfolgreich gespeichert.");
    return stats;
  } catch (err) {
    if (toastProgress) toast.error("Fehler beim Neuberechnen der Statistik.");
    throw err;
  }
}

export async function rebuildGlobalStatsFromExistingData(opts) {
  return rebuildStatsDocsFromExistingData([GLOBAL_STATS_DOC_ID], opts);
}

export async function rebuildCurrentStatsFromExistingData(opts) {
  return rebuildStatsDocsFromExistingData([CURRENT_STATS_DOC_ID], opts);
}

export async function seedBothStatsFromExistingData(opts) {
  return rebuildStatsDocsFromExistingData(
    [CURRENT_STATS_DOC_ID, GLOBAL_STATS_DOC_ID], opts
  );
}
