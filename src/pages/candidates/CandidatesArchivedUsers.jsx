import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useUserRole from "../../hooks/useUserRole";
import {
  addCandidateWithDualStats,
  deleteEmailAndPassIdByEmail,
  getMetaByName,
  saveDeletedUserSnapshotFirestore,
  subscribeToCollections,
  upsertEmailAndPassIdFirestore,
} from "../../utils";
import RemoteUserCard from "../../components/RemoteUserCard";
import SelectMajorModal from "../../components/SelectMajorModal";
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
import { FiTrash2 } from "react-icons/fi";
import { MdOutlineRestorePage } from "react-icons/md";

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

function stripArchivedUserMetaForRestore(record) {
  const r = record && typeof record === "object" ? record : {};
  const omit = new Set([
    "id",
    "sourceMajor",
    "sourceDocId",
    "sourceMajorTitle",
    "archivedAt",
    "archivedBy",
    "email",
  ]);
  const out = {};
  Object.keys(r).forEach((k) => {
    if (!omit.has(k)) out[k] = r[k];
  });
  return out;
}

export default function CandidatesArchivedUsers() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { role, loadingRole } = useUserRole({ forceRefresh: true });
  const isPrivileged =
    !loadingRole && (role === "super_admin" || role === "admin");

  const [loading, setLoading] = useState(true);
  const [restoringKey, setRestoringKey] = useState("");
  const [movingKey, setMovingKey] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");

  const [majors, setMajors] = useState([]);
  const [majorModalOpen, setMajorModalOpen] = useState(false);
  const [majorModalKey, setMajorModalKey] = useState("");
  const [pendingRecord, setPendingRecord] = useState(null);

  async function load() {
    if (!isPrivileged) return;
    try {
      setLoading(true);
      const q = fsQuery(
        collection(db, "archived_users"),
        orderBy("archivedAt", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Fehler beim Laden (Archiv).");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrivileged]);

  useEffect(() => {
    const unsub = subscribeToCollections((list) => {
      setMajors(Array.isArray(list) ? list : []);
    });
    return () => unsub?.();
  }, []);

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

  function openMajorModal(record) {
    setPendingRecord(record || null);
    setMajorModalKey("");
    setMajorModalOpen(true);
  }

  function closeMajorModal() {
    if (restoringKey) return;
    setMajorModalOpen(false);
    setMajorModalKey("");
    setPendingRecord(null);
  }

  async function restore(record) {
    if (!isPrivileged) return;
    openMajorModal(record);
  }

  async function confirmRestoreFromModal() {
    if (!isPrivileged) return;
    if (!pendingRecord) return;
    if (!majorModalKey) {
      toast.error("Bitte wählen Sie zuerst ein Berufsfeld.");
      return;
    }

    const key = String(pendingRecord?.id || "").trim() || "x";
    try {
      setRestoringKey(key);
      const meta = await getMetaByName(majorModalKey);
      const col = String(meta?.collectionName || "").trim();
      if (!col) {
        toast.error("Berufsfeld nicht gefunden. Bitte erneut wählen.");
        return;
      }

      closeMajorModal();
      setConfirmState({
        kind: "restore",
        record: pendingRecord,
        majorKey: col,
        majorLabel: meta?.title || col,
        title: "Kandidaten wiederherstellen?",
        message: `Major: ${
          meta?.title || col
        }\n\nHinweis: Der Kandidat wird in Firebase wiederhergestellt und mit all_users synchronisiert.`,
        confirmLabel: "Wiederherstellen",
        confirmVariant: "btn-primary",
      });
    } catch (e) {
      toast.error("Fehler beim Wiederherstellen.");
    } finally {
      setRestoringKey("");
    }
  }

  async function moveToDeleted(record) {
    if (!isPrivileged) return;
    setConfirmState({
      kind: "move_to_deleted",
      record,
      title: "In 'Gelöschte' verschieben?",
      message:
        "Hinweis: Dieser Kandidat wird von archived_users nach deleted_users verschoben.\nEine Wiederherstellung ist später möglich (Restore aus 'Gelöschte').",
      confirmLabel: "Verschieben",
      confirmVariant: "btn-error",
      seconds: 3,
    });
  }

  async function confirmModalAction() {
    const c = confirmState;
    if (!c) return;
    const record = c.record;

    if (c.kind === "restore") {
      const key = String(record?.id || "").trim() || "x";
      try {
        setRestoringKey(key);
        const majorCol = String(c.majorKey || "").trim();
        if (!majorCol) throw new Error("major missing for restore");

        const payload = stripArchivedUserMetaForRestore(record);

        // 1) Track direction history - preserve existing history and add current direction
        const previousMajor = String(
          record?.sourceMajor || record?.major || ""
        ).trim();
        const previousMajorTitle =
          String(record?.sourceMajorTitle || "").trim() || previousMajor;
        const directionHistory = Array.isArray(payload.directionHistory)
          ? [...payload.directionHistory]
          : [];

        // Add the direction candidate was in before being archived (not "archived" itself)
        if (previousMajor) {
          directionHistory.push({
            major: previousMajor,
            majorTitle: previousMajorTitle,
            movedAt: Date.now(),
            movedToMajor: majorCol,
          });
        }

        // 2) Preserve old registration date and add new one
        const oldRegistrationDate =
          payload.registrationDate || payload.createdAt || Date.now();
        const registrationHistory = Array.isArray(payload.registrationHistory)
          ? [...payload.registrationHistory]
          : [];

        if (oldRegistrationDate) {
          registrationHistory.push({
            date: oldRegistrationDate,
            major: previousMajor || "unknown",
            type: "original",
          });
        }

        // 3) Create new registration date (current timestamp) to ensure it appears at top
        const newRegistrationDate = Date.now();

        // 4) Add all tracking fields to payload
        const enhancedPayload = {
          ...payload,
          directionHistory,
          registrationHistory,
          registrationDate: newRegistrationDate,
          createdAt: newRegistrationDate,
          restoredAt: newRegistrationDate,
          restoredFrom: previousMajor || "unknown",
          restoredToMajor: majorCol,
        };

        const { id: newId } = await addCandidateWithDualStats(
          majorCol,
          enhancedPayload,
          {
            majorLabel: String(c.majorLabel || "").trim() || majorCol,
          }
        );

        const email = extractEmailFromSnapshot(enhancedPayload);
        const passportId = extractPassportIdFromSnapshot(enhancedPayload);
        if (email) {
          await upsertEmailAndPassIdFirestore({
            email,
            major: majorCol,
            passportId,
          });
        }

        await deleteDoc(doc(db, "archived_users", String(record.id).trim()));

        toast.success(`Wiederhergestellt: ${majorCol} (id=${newId})`);
        setConfirmState(null);
        await load();
      } catch (e) {
        toast.error("Fehler beim Wiederherstellen.");
      } finally {
        setRestoringKey("");
      }
      return;
    }

    if (c.kind === "move_to_deleted") {
      const key = String(record?.id || "").trim() || "x";
      try {
        setMovingKey(key);
        const major = String(record?.sourceMajor || record?.major || "").trim();
        const sourceDocId = String(
          record?.sourceDocId || record?.firebaseId || ""
        ).trim();
        if (!major || !sourceDocId)
          throw new Error("archived snapshot is missing major/sourceDocId");

        const email = extractEmailFromSnapshot(record);
        if (email) {
          await deleteEmailAndPassIdByEmail(String(email).trim().toLowerCase());
        }

        await saveDeletedUserSnapshotFirestore({
          major,
          sourceDocId,
          majorTitle: String(record?.sourceMajorTitle || "").trim() || major,
          deletedBy: user?.email || user?.uid || "admin",
          payload: {
            major,
            ...stripArchivedUserMetaForRestore(record),
          },
        });

        await deleteDoc(doc(db, "archived_users", String(record.id).trim()));

        toast.success("In Gelöschte verschoben.");
        setConfirmState(null);
        await load();
      } catch (e) {
        toast.error("Fehler beim Löschen.");
      } finally {
        setMovingKey("");
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
          if (Boolean(restoringKey) || Boolean(movingKey)) return;
          setConfirmState(null);
        }}
        onConfirm={confirmModalAction}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        confirmVariant={confirmState?.confirmVariant}
        seconds={confirmState?.seconds || 0}
        busy={Boolean(restoringKey) || Boolean(movingKey)}
      />
      <SelectMajorModal
        open={majorModalOpen}
        majors={majors}
        selectedKey={majorModalKey}
        onSelectKey={setMajorModalKey}
        onCancel={closeMajorModal}
        onConfirm={confirmRestoreFromModal}
        confirming={Boolean(restoringKey)}
        title="Berufsfeld auswählen"
        subtitle="Falls beim Kandidaten kein Berufsfeld vorhanden ist (oder es gelöscht wurde), wählen Sie bitte ein Berufsfeld für die Wiederherstellung."
      />
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold">Archivierte Benutzer</div>
          <div className="text-xs text-base-content/60">
            Quelle: Firestore (archived_users)
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
          Keine archivierten Benutzer gefunden.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-6">
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
            const busy = restoringKey && String(restoringKey) === String(key);
            const moving = movingKey && String(movingKey) === String(key);
            const disabled = Boolean(restoringKey) || Boolean(movingKey);
            return (
              <RemoteUserCard
                key={String(r?.id || idx)}
                name={full}
                photo={photo}
                email={email === "—" ? "" : email}
                major={major === "—" ? "" : major}
                firebaseId={String(r?.sourceDocId || "").trim() || ""}
                tone="warning"
                onClick={() => {
                  const majorParam = major && major !== "—" ? major : "unknown";
                  const idParam =
                    String(r?.sourceDocId || "").trim() || "archived";
                  navigate(
                    `/generate/${majorParam}/${idParam}?remote=1&kind=archived&archivedDocId=${encodeURIComponent(
                      String(r?.id || "")
                    )}`,
                    { state: { remoteRecord: r } }
                  );
                }}
                footer={
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary whitespace-nowrap"
                      onClick={() => restore(r)}
                      disabled={disabled}
                      title="Wiederherstellen"
                    >
                      <span className="hidden sm:inline">Wiederherstellen</span>
                      <MdOutlineRestorePage size={18} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-error btn-outline whitespace-nowrap"
                      onClick={() => moveToDeleted(r)}
                      disabled={disabled}
                      title="O‘chirish (deleted ga ko‘chadi)"
                    >
                      {moving ? (
                        <>
                          <span className="loading loading-spinner loading-sm" />
                          {/* keep width stable */}
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">Löschen</span>
                          <FiTrash2 size={16} />
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
