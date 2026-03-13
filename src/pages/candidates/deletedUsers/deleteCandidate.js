import toast from "react-hot-toast";
import { db } from "../../../firebase/config";
import { deleteDoc, doc } from "firebase/firestore";
import {
  deleteEmailAndPassIdByEmail,
  extractConsultingUploadUrlsFromSnapshot,
  deleteUploadedFile,
} from "../../../utils";
import { extractEmailFromSnapshot } from "./utils";

export async function executeHardDelete(record) {
  const docId = String(record?.id || "").trim();
  const urls = extractConsultingUploadUrlsFromSnapshot(record);
  if (Array.isArray(urls) && urls.length > 0) {
    await Promise.all(
      urls.map((url) => deleteUploadedFile(url).catch(() => {})),
    );
  }
  const email = extractEmailFromSnapshot(record);
  if (email) {
    await deleteEmailAndPassIdByEmail(String(email).trim().toLowerCase());
  }
  await deleteDoc(doc(db, "deleted_users", docId));
  toast.success("Kandidat erfolgreich gelöscht.");
}

export async function executeBulkDelete(keys, items) {
  let errorCount = 0;
  for (const key of keys) {
    const record = items.find((r) => String(r.id) === String(key));
    if (record) {
      try {
        const urls = extractConsultingUploadUrlsFromSnapshot(record);
        if (Array.isArray(urls) && urls.length > 0) {
          try {
            await Promise.all(
              urls.map((url) => deleteUploadedFile(url).catch(() => {})),
            );
          } catch (err) {
            // ignore, continue to delete from Firestore
          }
        }
        const email = extractEmailFromSnapshot(record);
        if (email) {
          await deleteEmailAndPassIdByEmail(
            String(email).trim().toLowerCase(),
          );
        }
        await deleteDoc(doc(db, "deleted_users", key));
      } catch (e) {
        errorCount++;
      }
    }
  }
  const successCount = keys.length - errorCount;
  if (successCount > 0 && errorCount === 0) {
    toast.success(`${successCount} Kandidat(en) erfolgreich gelöscht.`);
  } else if (successCount > 0 && errorCount > 0) {
    toast.success(
      `${successCount} Kandidat(en) gelöscht, ${errorCount} Fehler.`,
    );
  } else {
    toast.error(`Fehler beim Löschen.`);
  }
}
