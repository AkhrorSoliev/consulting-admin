import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useUserRole from "../../hooks/useUserRole";
import { FiTrash2 } from "react-icons/fi";
import { MdOutlineRestorePage } from "react-icons/md";
import {
  addCandidateWithDualStats,
  deleteConsultingUploadUrlsStrict,
  deleteEmailAndPassIdByEmail,
  extractConsultingUploadUrlsFromSnapshot,
  upsertEmailAndPassIdFirestore,
} from "../../utils";
import RemoteUserCard from "../../components/RemoteUserCard";
import ConfirmActionModal from "../../components/ConfirmActionModal";
import { db } from "../../firebase/config";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query as fsQuery,
} from "firebase/firestore";

function pickFirstNonEmptyString(values) {
  for (const v of values) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

function extractEmailFromSnapshot(record) {
  const r = record && typeof record === "object" ? record : {};
  return pickFirstNonEmptyString([
    r?.persoenlicheDaten?.email,
    r?.personalInfo?.email,
    r?.personalData?.email,
    r?.email,
  ]);
}

function extractPassportIdFromSnapshot(record) {
  const r = record && typeof record === "object" ? record : {};
  return pickFirstNonEmptyString([
    r?.passportId,
    r?.passportID,
    r?.passportNumber,
    r?.reisepassNummer,
    r?.persoenlicheDaten?.reisepassNummer,
    r?.persoenlicheDaten?.passportId,
    r?.persoenlicheDaten?.passportID,
    r?.persoenlicheDaten?.passportNumber,
    r?.personalInfo?.passportNumber,
    r?.personalInfo?.reisepassNummer,
    r?.personalData?.passportNumber,
    r?.personalData?.reisepassNummer,
  ]);
}

function stripDeletedUserMetaForRestore(record) {
  const r = record && typeof record === "object" ? record : {};
  const omit = new Set([
    "id",
    "sourceMajor",
    "sourceDocId",
    "sourceMajorTitle",
    "deletedAt",
    "deletedBy",
    // derived helper field we store in deleted snapshot
    "email",
  ]);
  const out = {};
  Object.keys(r).forEach((k) => {
    if (!omit.has(k)) out[k] = r[k];
  });
  return out;
}

export default function CandidatesDeletedUsers() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { role, loadingRole } = useUserRole({ forceRefresh: true });
  const isPrivileged =
    !loadingRole && (role === "super_admin" || role === "admin");

  const [loading, setLoading] = useState(true);
  const [restoringKey, setRestoringKey] = useState("");
  const [deletingKey, setDeletingKey] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");

  async function load() {
    if (!isPrivileged) return;
    try {
      setLoading(true);
      const q = fsQuery(
        collection(db, "deleted_users"),
        orderBy("deletedAt", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Laden (Gelöschte).");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrivileged]);

  const filtered = useMemo(() => {
    const q = String(query || "")
      .trim()
      .toLowerCase();
    if (!q) return items;
    return items.filter((r) => {
      const name =
        String(r?.persoenlicheDaten?.name || "") +
        " " +
        String(r?.persoenlicheDaten?.nachname || "");
      const email = String(r?.persoenlicheDaten?.email || r?.email || "");
      const major = String(r?.major || "");
      return (
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        major.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  async function restore(record) {
    if (!isPrivileged) return;
    const major = String(record?.sourceMajor || record?.major || "").trim();
    const majorLabel = String(record?.sourceMajorTitle || "").trim() || major;

    setConfirmState({
      kind: "restore",
      record,
      title: "Kandidat wiederherstellen?",
      message: `Major: ${
        major || "—"
      }\n\nHinweis: Der Kandidat wird in Firebase wiederhergestellt.`,
      confirmLabel: "Restore",
      confirmVariant: "btn-primary",
    });
  }

  async function deleteForever(record) {
    if (!isPrivileged) return;
    const docId = String(record?.id || "").trim();
    if (!docId) {
      toast.error("deleted_users docId nicht gefunden.");
      return;
    }

    setConfirmState({
      kind: "hard_delete",
      record,
      title: "Endgültig löschen?",
      message:
        "Hinweis: Der Kandidat wird aus der Collection deleted_users entfernt.\nUpload-Dateilinks werden ebenfalls gelöscht.\nNicht wiederherstellbar.",
      confirmLabel: "Delete",
      confirmVariant: "btn-error",
      seconds: 5,
    });
  }

  async function confirmModalAction() {
    const c = confirmState;
    if (!c) return;
    const record = c.record;

    if (c.kind === "restore") {
      const major = String(record?.sourceMajor || record?.major || "").trim();
      const majorLabel = String(record?.sourceMajorTitle || "").trim() || major;
      const key = String(record?.id || "").trim() || "x";
      try {
        setRestoringKey(key);
        if (!major) throw new Error("major is missing on deleted snapshot");
        const payload = stripDeletedUserMetaForRestore(record);

        const { id: newId } = await addCandidateWithDualStats(major, payload, {
          majorLabel,
        });

        const email = extractEmailFromSnapshot(payload);
        const passportId = extractPassportIdFromSnapshot(payload);
        if (email) {
          await upsertEmailAndPassIdFirestore({ email, major, passportId });
        }

        if (String(record?.id || "").trim()) {
          await deleteDoc(doc(db, "deleted_users", String(record.id).trim()));
        }

        toast.success(`Wiederhergestellt: ${major} (id=${newId})`);
        setConfirmState(null);
        await load();
      } catch (e) {
        console.error(e);
        toast.error("Fehler beim Wiederherstellen.");
      } finally {
        setRestoringKey("");
      }
      return;
    }

    if (c.kind === "hard_delete") {
      const docId = String(record?.id || "").trim();
      const key = docId || "x";
      try {
        setDeletingKey(key);

        const urls = extractConsultingUploadUrlsFromSnapshot(record);
        // STRICT: if even one remote upload delete fails, do not delete the Firestore snapshot.
        // This prevents orphaned files in json-api.uz storage.
        await deleteConsultingUploadUrlsStrict(urls);

        const email = extractEmailFromSnapshot(record);
        if (email) {
          await deleteEmailAndPassIdByEmail(String(email).trim().toLowerCase());
        }

        await deleteDoc(doc(db, "deleted_users", docId));
        toast.success("Endgültig gelöscht (deleted_users + Dateien).");
        setConfirmState(null);
        await load();
      } catch (e) {
        console.error(e);
        toast.error("Fehler beim Löschen.");
      } finally {
        setDeletingKey("");
      }
    }
  }

  if (!loadingRole && !isPrivileged) {
    return (
      <div className="text-sm text-base-content/70">Keine Berechtigung.</div>
    );
  }

  return (
    <div className="space-y-4">
      <ConfirmActionModal
        open={Boolean(confirmState)}
        onClose={() => {
          if (Boolean(restoringKey) || Boolean(deletingKey)) return;
          setConfirmState(null);
        }}
        onConfirm={confirmModalAction}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        confirmVariant={confirmState?.confirmVariant}
        seconds={confirmState?.seconds || 0}
        busy={Boolean(restoringKey) || Boolean(deletingKey)}
      />
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold">Gelöschte Benutzer</div>
          <div className="text-xs text-base-content/60">
            Quelle: Firestore (deleted_users)
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="search"
            className="input input-bordered w-full sm:w-72"
            placeholder="Suche (Name / Email / Major)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={load}
            disabled={loading}
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-10">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-6 rounded-box border border-base-300 bg-base-200/30 text-sm text-base-content/70">
          Keine gelöschten Benutzer gefunden.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filtered.map((r, idx) => {
            const first = String(r?.persoenlicheDaten?.name || "").trim();
            const last = String(r?.persoenlicheDaten?.nachname || "").trim();
            const full = [first, last].filter(Boolean).join(" ") || "—";
            const email =
              String(r?.persoenlicheDaten?.email || r?.email || "").trim() ||
              "—";
            const photo =
              String(
                r?.persoenlicheDaten?.foto || r?.foto || r?.photo || ""
              ).trim() || "";
            const major =
              String(r?.sourceMajor || r?.major || "").trim() || "—";
            const key = String(r?.id || idx);
            const restoring =
              restoringKey && String(restoringKey) === String(key);
            const deleting = deletingKey && String(deletingKey) === String(key);
            const disabled = Boolean(restoringKey) || Boolean(deletingKey);
            return (
              <RemoteUserCard
                key={String(r?.id || idx)}
                name={full}
                photo={photo}
                email={email === "—" ? "" : email}
                major={major === "—" ? "" : major}
                firebaseId={String(r?.sourceDocId || "").trim() || ""}
                tone="error"
                onClick={() => {
                  const majorParam = major && major !== "—" ? major : "unknown";
                  const idParam =
                    String(r?.sourceDocId || "").trim() || "deleted";
                  navigate(
                    `/generate/${majorParam}/${idParam}?remote=1&kind=deleted&deletedDocId=${encodeURIComponent(
                      String(r?.id || "")
                    )}`,
                    { state: { remoteRecord: r } }
                  );
                }}
                footer={
                  <div className="flex flex-col sm:flex-row justify-end gap-1 sm:gap-2">
                    <button
                      type="button"
                      className="btn btn-xs sm:btn-sm btn-primary"
                      onClick={() => restore(r)}
                      disabled={disabled}
                      title="Wiederherstellen"
                    >
                      {restoring ? (
                        <>
                          <span className="loading loading-spinner loading-xs sm:loading-sm" />
                          <span className="hidden xs:inline">Restore...</span>
                          <span className="xs:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden xs:inline">Restore</span>
                          <MdOutlineRestorePage
                            size={16}
                            className="xs:hidden"
                          />
                          <MdOutlineRestorePage
                            size={18}
                            className="hidden xs:inline"
                          />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs sm:btn-sm btn-error btn-outline"
                      onClick={() => deleteForever(r)}
                      disabled={disabled}
                      title="Endgültig löschen (nicht wiederherstellbar)"
                    >
                      {deleting ? (
                        <>
                          <span className="loading loading-spinner loading-xs sm:loading-sm" />
                          <span className="hidden xs:inline">Deleting...</span>
                          <span className="xs:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden xs:inline">Delete</span>
                          <FiTrash2 size={14} className="xs:hidden" />
                          <FiTrash2 size={16} className="hidden xs:inline" />
                        </>
                      )}
                    </button>
                  </div>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
