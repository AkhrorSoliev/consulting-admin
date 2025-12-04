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
  deleteDoc,
  getDocs,
  arrayRemove,
} from "firebase/firestore";

export async function createCollection(name) {
  try {
    await setDoc(doc(collection(db, name)), {
      createdAt: Date.now(),
      initialized: true,
    });

    const metaRef = doc(db, "meta", "collectionsList");

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

    const unsubscribe = onSnapshot(metaRef, (snapshot) => {
      if (snapshot.exists()) {
        const names = snapshot.data().names || [];
        callback(names);
      } else {
        callback([]);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error("subscribeToCollections error:", error);
  }
}

export async function deleteCollectionByName(name) {
  try {
    const colRef = collection(db, name);
    const docsSnapshot = await getDocs(colRef);

    const deletePromises = docsSnapshot.docs.map((d) =>
      deleteDoc(doc(db, name, d.id))
    );
    await Promise.all(deletePromises);

    const metaRef = doc(db, "meta", "collectionsList");
    await updateDoc(metaRef, {
      names: arrayRemove(name),
    });

    toast.success(`Collection "${name}" o‘chirildi!`);
  } catch (error) {
    toast.error(`Xatolik: ${error.message}`);
    console.error("deleteCollectionByName error:", error);
  }
}
