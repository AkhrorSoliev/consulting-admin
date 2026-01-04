import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import toast from "react-hot-toast";
import { getMetaByName } from "./index";

/**
 * Restore a soft-deleted direction (meta document)
 * @param {string} name - Direction name or ID
 * @returns {Promise<{restored: boolean, reason?: string}>}
 */
export async function restoreDirection(name) {
  try {
    const meta = await getMetaByName(name);
    if (!meta) {
      toast.error("Yo'nalish topilmadi.");
      return { restored: false, reason: "not-found" };
    }

    if (!meta.isDeleted) {
      toast.info("Bu yo'nalish allaqachon faol.");
      return { restored: false, reason: "already-active" };
    }

    const metaId = meta?.id || name;
    const metaDocRef = doc(db, "meta", metaId);

    await setDoc(
      metaDocRef,
      {
        isDeleted: false,
        restoredAt: Date.now(),
      },
      { merge: true }
    );

    toast.success(
      `Yo'nalish "${meta.title || meta.collectionName}" qayta tiklandi!`
    );
    return { restored: true };
  } catch (error) {
    toast.error(`Xatolik: ${error.message}`);
    return { restored: false, reason: "error", error };
  }
}

/**
 * Permanently delete a direction (hard delete)
 * WARNING: This will remove the meta document completely
 * @param {string} name - Direction name or ID
 * @returns {Promise<{deleted: boolean, reason?: string}>}
 */
export async function permanentlyDeleteDirection(name) {
  try {
    const meta = await getMetaByName(name);
    if (!meta) {
      toast.error("Yo'nalish topilmadi.");
      return { deleted: false, reason: "not-found" };
    }

    const metaId = meta?.id || name;
    const metaDocRef = doc(db, "meta", metaId);

    // Hard delete - remove document completely
    await deleteDoc(metaDocRef);

    toast.success(
      `Yo'nalish "${meta.title || meta.collectionName}" butunlay o'chirildi!`
    );
    return { deleted: true };
  } catch (error) {
    toast.error(`Xatolik: ${error.message}`);
    return { deleted: false, reason: "error", error };
  }
}
