import { db } from "../../firebase/config";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { normalizeMajorMeta } from "./helpers";
import { getMetaByName } from "./crud";

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
