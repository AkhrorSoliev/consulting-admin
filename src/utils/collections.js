import toast from "react-hot-toast";
import { db } from "../firebase/config";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  where,
  limit,
} from "firebase/firestore";
import { incrementDirectionsTotal } from "./stats";

function generateUuid() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback: simple random string
  return "xxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function normalizeMajorMeta(docSnap) {
  const data =
    typeof docSnap?.data === "function" ? docSnap.data() : docSnap?.data || {};
  const id = docSnap?.id || "";
  const collectionName =
    data.collectionName || data.slug || data.name || id || "";
  const uuid = data.uuid || data.id || id || "";
  const title =
    data.title || data.label || data.fullName || data.name || collectionName;
  const slug = data.slug || data.name || collectionName;
  return {
    ...data,
    id,
    uuid,
    linkId: uuid || id,
    collectionName,
    slug,
    name: data.name || slug,
    title,
    createdAt: data.createdAt,
    createdBy: data.createdBy,
    raw: data,
  };
}

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
      toast.error(`„${normalizedName}" ist bereits vorhanden.`);
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
      `„${rawTitle || normalizedName}" wurde zur Meta-Liste hinzugefügt!`,
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

export function subscribeToMetaByName(name, callback, onError) {
  const safe = String(name || "").trim();
  const cb = typeof callback === "function" ? callback : () => {};
  const errCb = typeof onError === "function" ? onError : (e) => {};

  if (!safe) {
    try {
      cb(null);
    } catch {
      // ignore
    }
    return () => {};
  }

  let cancelled = false;
  let unsub = null;
  let triedResolve = false;

  function cleanup() {
    cancelled = true;
    try {
      unsub?.();
    } catch {
      // ignore
    }
    unsub = null;
  }

  function subscribeDocId(docId) {
    const id = String(docId || "").trim();
    if (!id) return;
    const ref = doc(db, "meta", id);
    unsub = onSnapshot(
      ref,
      (snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          cb(null);
          return;
        }
        cb(normalizeMajorMeta(snap));
      },
      (e) => {
        if (cancelled) return;
        errCb(e);
      },
    );
  }

  const directRef = doc(db, "meta", safe);
  unsub = onSnapshot(
    directRef,
    (snap) => {
      if (cancelled) return;
      if (snap.exists()) {
        cb(normalizeMajorMeta(snap));
        return;
      }

      if (triedResolve) {
        cb(null);
        return;
      }
      triedResolve = true;

      (async () => {
        try {
          const resolved = await getMetaByName(safe);
          if (cancelled) return;
          const targetId = String(resolved?.id || "").trim();
          if (targetId && targetId !== safe) {
            try {
              unsub?.();
            } catch {
              // ignore
            }
            unsub = null;
            subscribeDocId(targetId);
          } else {
            cb(null);
          }
        } catch (e) {
          if (!cancelled) errCb(e);
        }
      })();
    },
    (e) => {
      if (!cancelled) errCb(e);
    },
  );

  return cleanup;
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

export function subscribeToCollections(callback) {
  try {
    const metaColRef = collection(db, "meta");
    const q = query(metaColRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map((d) => normalizeMajorMeta(d))
        .filter(
          (n) =>
            typeof n.collectionName === "string" &&
            n.collectionName.trim().length > 0 &&
            n.isDeleted !== true,
        );
      callback(list);
    });

    return unsubscribe;
  } catch (error) {}
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
        `Sammlung „${colName}" und ${candidatesCount} Kandidaten wurden gelöscht!`,
      );
    } else {
      if (candidatesCount > 0) {
        toast.info(
          `Sammlung „${colName}" wurde deaktiviert. ${candidatesCount} Kandidaten bleiben erhalten.`,
          { duration: 5000 },
        );
      } else {
        toast.success(`Sammlung „${colName}" wurde gelöscht!`);
      }
    }

    const metaDocRef = doc(db, "meta", metaId);
    await deleteDoc(metaDocRef);
  } catch (error) {
    toast.error(`Fehler: ${error.message}`);
  }
}
