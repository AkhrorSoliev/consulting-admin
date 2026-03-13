import toast from "react-hot-toast";
import { db } from "../../firebase/config";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { incrementDirectionsTotal } from "../stats";
import { generateUuid, normalizeMajorMeta } from "./helpers";

export async function createCollection(name, createdBy) {
  try {
    const rawTitle = String(name || "").trim();
    const normalizedName = rawTitle.trim().toLowerCase().replace(/\s+/g, "-");

    if (!normalizedName) {
      toast.error("Der Name des Berufsfelds darf nicht leer sein.");
      return { created: false, reason: "empty" };
    }

    const dupSnap = await getDocs(
      query(
        collection(db, "meta"),
        where("collectionName", "==", normalizedName),
        limit(1),
      ),
    );
    if (!dupSnap.empty) {
      toast.error(`\u201E${normalizedName}\u201C ist bereits vorhanden.`);
      return { created: false, reason: "exists" };
    }

    const uuid = generateUuid();
    const metaDocRef = doc(db, "meta", uuid);

    const createdBySafe = String(createdBy || "").trim() || "tizim";
    await setDoc(metaDocRef, {
      uuid,
      name: normalizedName,
      slug: normalizedName,
      collectionName: normalizedName,
      title: rawTitle || normalizedName,
      linkActive: true,
      createdAt: Date.now(),
      createdBy: createdBySafe,
    });

    try {
      await incrementDirectionsTotal();
    } catch (err) {
      // non-blocking
    }

    toast.success(
      `\u201E${rawTitle || normalizedName}\u201C wurde zur Meta-Liste hinzugef\u00FCgt!`,
    );
    return {
      created: true,
      name: normalizedName,
      uuid,
      collectionName: normalizedName,
      title: rawTitle || normalizedName,
    };
  } catch (error) {
    toast.error(`Fehler: ${error.message}`);
    return { created: false, reason: "error", error };
  }
}

export async function getMetaByName(name) {
  const safe = String(name || "").trim();
  if (!safe) return null;

  const directRef = doc(db, "meta", safe);
  const directSnap = await getDoc(directRef);
  if (directSnap.exists()) {
    return normalizeMajorMeta(directSnap);
  }

  const byUuidSnap = await getDocs(
    query(collection(db, "meta"), where("uuid", "==", safe), limit(1)),
  );
  if (!byUuidSnap.empty) {
    return normalizeMajorMeta(byUuidSnap.docs[0]);
  }

  const byNameSnap = await getDocs(
    query(
      collection(db, "meta"),
      where("collectionName", "==", safe),
      limit(1),
    ),
  );
  if (!byNameSnap.empty) {
    return normalizeMajorMeta(byNameSnap.docs[0]);
  }

  return null;
}

export async function updateMetaByName(name, data) {
  const safe = String(name || "").trim();
  if (!safe) throw new Error("updateMetaByName: name is empty");
  const resolved = await getMetaByName(safe);
  const targetId = resolved?.id || safe;
  const metaDocRef = doc(db, "meta", targetId);
  await updateDoc(metaDocRef, data);
  return { id: targetId };
}

export async function deleteCollectionByName(name, options = {}) {
  try {
    const meta = await getMetaByName(name);
    const colName = meta?.collectionName || name;
    const metaId = meta?.id || name;
    const colRef = collection(db, colName);
    const docsSnapshot = await getDocs(colRef);
    const candidatesCount = docsSnapshot.docs.length;

    const deleteCandidates = options?.deleteCandidates === true;

    if (deleteCandidates) {
      const deletePromises = docsSnapshot.docs.map((d) =>
        deleteDoc(doc(db, colName, d.id)),
      );
      await Promise.all(deletePromises);
      toast.success(
        `Sammlung \u201E${colName}\u201C und ${candidatesCount} Kandidaten wurden gel\u00F6scht!`,
      );
    } else {
      if (candidatesCount > 0) {
        toast.info(
          `Sammlung \u201E${colName}\u201C wurde deaktiviert. ${candidatesCount} Kandidaten bleiben erhalten.`,
          { duration: 5000 },
        );
      } else {
        toast.success(`Sammlung \u201E${colName}\u201C wurde gel\u00F6scht!`);
      }
    }

    const metaDocRef = doc(db, "meta", metaId);
    await deleteDoc(metaDocRef);
  } catch (error) {
    toast.error(`Fehler: ${error.message}`);
  }
}
