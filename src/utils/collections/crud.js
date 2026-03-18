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
      toast.error(`„${normalizedName}“ ist bereits vorhanden.`);
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
      `„${rawTitle || normalizedName}“ wurde zur Meta-Liste hinzugefügt!`,
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
        `Sammlung „${colName}“ und ${candidatesCount} Kandidaten wurden gelöscht!`,
      );
    } else {
      if (candidatesCount > 0) {
        toast.info(
          `Sammlung „${colName}“ wurde deaktiviert. ${candidatesCount} Kandidaten bleiben erhalten.`,
          { duration: 5000 },
        );
      } else {
        toast.success(`Sammlung „${colName}“ wurde gelöscht!`);
      }
    }

    const metaDocRef = doc(db, "meta", metaId);
    await deleteDoc(metaDocRef);
  } catch (error) {
    toast.error(`Fehler: ${error.message}`);
  }
}
