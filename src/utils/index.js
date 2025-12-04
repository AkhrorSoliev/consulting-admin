import toast from "react-hot-toast";
import { db } from "../firebase/config";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
  onSnapshot,
} from "firebase/firestore";

export async function createCollection(name) {
  try {
    // 1. Collectionni yaratish (birinchi document qo'yish orqali)
    await setDoc(doc(collection(db, name)), {
      createdAt: Date.now(),
      initialized: true,
    });

    // 2. Meta hujjat manzili
    const metaRef = doc(db, "meta", "collectionsList");

    // 3. Meta hujjat mavjudmi?
    const metaSnap = await getDoc(metaRef);

    if (!metaSnap.exists()) {
      await setDoc(metaRef, {
        names: [name],
      });
    } else {
      await updateDoc(metaRef, {
        names: arrayUnion(name),
      });
    }

    toast.success(`Collection "${name}" muvaffaqiyatli yaratildi!`);
  } catch (error) {
    toast.error(`Xato yuz berdi: ${error.message}`);
    console.error("createCollection error:", error);
  }
}

export function subscribeToCollections(callback) {
  try {
    const metaRef = doc(db, "meta", "collectionsList");

    // REALTIME listener
    const unsubscribe = onSnapshot(metaRef, (snapshot) => {
      if (snapshot.exists()) {
        const names = snapshot.data().names || [];
        callback(names);
      } else {
        callback([]);
      }
    });

    return unsubscribe; // kerak bo‘lsa componentda tozalaysiz
  } catch (error) {
    console.error("subscribeToCollections error:", error);
  }
}
