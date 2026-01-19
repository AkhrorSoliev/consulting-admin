import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useUserRole from "../../hooks/useUserRole";
import { FiTrash2 } from "react-icons/fi";
import { MdOutlineRestorePage } from "react-icons/md";
import { FaTelegram, FaFileExcel } from "react-icons/fa";
import { exportFullCandidatesToExcel } from "../../utils/excelExport";
import {
  addCandidateWithDualStats,
  deleteConsultingUploadUrlsStrict,
  deleteEmailAndPassIdByEmail,
  extractConsultingUploadUrlsFromSnapshot,
  getMetaByName,
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
  const [exporting, setExporting] = useState(false);

  const [majors, setMajors] = useState([]);
  const [majorModalOpen, setMajorModalOpen] = useState(false);
  const [majorModalKey, setMajorModalKey] = useState("");
  const [pendingRecord, setPendingRecord] = useState(null);

  function handleExportExcel() {
    if (exporting || items.length === 0) return;
    setExporting(true);
    try {
      const docsWithMajor = items.map((item) => ({
        ...item,
        major: item.sourceMajor || item.major || "Gelöscht",
      }));
      exportFullCandidatesToExcel(docsWithMajor, "Geloeschte_Benutzer");
      toast.success(`${items.length} gelöschte Kandidaten exportiert.`);
    } catch (err) {
      toast.error(err.message || "Fehler beim Exportieren.");
    } finally {
      setExporting(false);
    }
  }

  // Multi-select state (localStorage persistent)
  const SELECTED_KEYS_STORAGE = "deletedUsersSelectedKeys";
  const [selectedKeys, setSelectedKeys] = useState(() => {
    try {
      const raw = localStorage.getItem(SELECTED_KEYS_STORAGE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  function toggleSelect(key) {
    setSelectedKeys((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      try {
        localStorage.setItem(SELECTED_KEYS_STORAGE, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function clearSelection() {
    setSelectedKeys([]);
    try {
      localStorage.removeItem(SELECTED_KEYS_STORAGE);
    } catch {}
  }

  function handleBulkDelete() {
    if (!isPrivileged || selectedKeys.length === 0) return;
    setConfirmState({
      kind: "bulk_delete",
      keys: [...selectedKeys],
      title: `Ausgewählte Kandidaten löschen?`,
      message: `${selectedKeys.length} Kandidaten werden endgültig gelöscht. Diese Aktion kann nicht rückgängig gemacht werden!`,
      confirmLabel: `Löschen (${selectedKeys.length})`,
      cancelLabel: "Abbrechen",
      confirmVariant: "btn-error",
      seconds: 0,
    });
  }

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

  const leadStats = useMemo(() => {
    const byLead = {};
    let telegramCount = 0;
    items.forEach((r) => {
      const lead = String(r?.lead || "").trim();
      if (lead) {
        byLead[lead] = (byLead[lead] || 0) + 1;
      }
      if (r?.telegramId) {
        telegramCount++;
      }
    });
    const leadList = Object.entries(byLead)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    return { leadList, telegramCount, total: items.length };
  }, [items]);

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

  async function restoreToOriginal(record) {
    if (!isPrivileged) return;
    const originalMajor = String(
      record?.sourceMajor || record?.major || ""
    ).trim();
    const originalMajorLabel =
      String(record?.sourceMajorTitle || "").trim() || originalMajor;

    if (!originalMajor) {
      toast.error(
        "Originaler Bereich nicht gefunden. Bitte wählen Sie einen Bereich."
      );
      openMajorModal(record);
      return;
    }

    setConfirmState({
      kind: "restore",
      record,
      majorKey: originalMajor,
      majorLabel: originalMajorLabel,
      title: "In Bereich (Major) wiederherstellen?",
      message: `Bereich: ${
        originalMajorLabel || originalMajor
      }\n\nHinweis: Der Kandidat wird in den ursprünglichen Bereich wiederhergestellt.`,
      confirmLabel: "Wiederherstellen",
      confirmVariant: "btn-primary",
    });
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
        }\n\nHinweis: Der Kandidat wird in Firebase wiederhergestellt.`,
        confirmLabel: "Wiederherstellen",
        confirmVariant: "btn-primary",
      });
    } catch (e) {
      toast.error("Fehler beim Wiederherstellen.");
    } finally {
      setRestoringKey("");
    }
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
      confirmLabel: "Löschen",
      confirmVariant: "btn-error",
      confirmIcon: <FiTrash2 size={18} />,
      seconds: 5,
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
        const major = String(c.majorKey || "").trim();
        if (!major) throw new Error("major is missing on deleted snapshot");
        const majorLabel = String(c.majorLabel || "").trim() || major;
        const payload = stripDeletedUserMetaForRestore(record);

        // 1) Track direction history - preserve existing history and add current direction
        const previousMajor = String(
          record?.sourceMajor || record?.major || ""
        ).trim();
        const previousMajorTitle =
          String(record?.sourceMajorTitle || "").trim() || previousMajor;
        const directionHistory = Array.isArray(payload.directionHistory)
          ? [...payload.directionHistory]
          : [];

        // Add the direction candidate was in before being deleted (not "deleted" itself)
        if (previousMajor) {
          directionHistory.push({
            major: previousMajor,
            majorTitle: previousMajorTitle,
            movedAt: Date.now(),
            movedToMajor: major,
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
          restoredToMajor: major,
        };

        const { id: newId } = await addCandidateWithDualStats(
          major,
          enhancedPayload,
          {
            majorLabel,
          }
        );

        const email = extractEmailFromSnapshot(enhancedPayload);
        const passportId = extractPassportIdFromSnapshot(enhancedPayload);
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
        toast.error("Fehler beim Wiederherstellen.");
      } finally {
        setRestoringKey("");
      }
      return;
    }

    if (c.kind === "bulk_delete") {
      // Bulk delete selected users
      const keys = Array.isArray(c.keys) ? c.keys : [];
      if (keys.length === 0) return;
      setDeletingKey("bulk");
      let errorCount = 0;
      for (const key of keys) {
        const record = items.find((r) => String(r.id) === String(key));
        if (record) {
          try {
            const urls = extractConsultingUploadUrlsFromSnapshot(record);
            if (Array.isArray(urls) && urls.length > 0) {
              try {
                await deleteConsultingUploadUrlsStrict(urls);
              } catch (err) {
                // ignore error, continue to delete from Firestore
              }
            }
            const email = extractEmailFromSnapshot(record);
            if (email) {
              await deleteEmailAndPassIdByEmail(
                String(email).trim().toLowerCase()
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
          `${successCount} Kandidat(en) gelöscht, ${errorCount} Fehler.`
        );
      } else {
        toast.error(`Fehler beim Löschen.`);
      }
      setConfirmState(null);
      setDeletingKey("");
      clearSelection();
      await load();
      return;
    }
    if (c.kind === "hard_delete") {
      const docId = String(record?.id || "").trim();
      const key = docId || "x";
      try {
        setDeletingKey(key);

        const urls = extractConsultingUploadUrlsFromSnapshot(record);
        // Faqat document bo'lsa json-api.uz ga request jo'natamiz
        if (Array.isArray(urls) && urls.length > 0) {
          try {
            await deleteConsultingUploadUrlsStrict(urls);
          } catch (err) {
            // ignore error, continue to delete from Firestore
          }
        }

        const email = extractEmailFromSnapshot(record);
        if (email) {
          await deleteEmailAndPassIdByEmail(String(email).trim().toLowerCase());
        }

        await deleteDoc(doc(db, "deleted_users", docId));
        toast.success("Kandidat erfolgreich gelöscht.");
        setConfirmState(null);
        await load();
      } catch (e) {
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
        cancelLabel={confirmState?.cancelLabel}
        seconds={0}
        busy={Boolean(restoringKey) || Boolean(deletingKey)}
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
        subtitle="Wählen Sie bitte ein Berufsfeld für die Wiederherstellung des Kandidaten."
      />
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold">Gelöschte Benutzer</div>
          <div className="text-xs text-base-content/60">
            Quelle: Firestore (deleted_users)
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {selectedKeys.length > 0 && (
            <>
              <button
                type="button"
                className="btn btn-error"
                onClick={handleBulkDelete}
                disabled={loading || Boolean(deletingKey)}
              >
                Ausgewählte löschen ({selectedKeys.length})
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={clearSelection}
                disabled={loading || Boolean(deletingKey)}
              >
                Abbrechen
              </button>
            </>
          )}
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
          <button
            type="button"
            className="btn btn-success gap-2"
            onClick={handleExportExcel}
            disabled={exporting || loading || items.length === 0}
            title="Gelöschte Kandidaten als Excel exportieren"
          >
            {exporting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <FaFileExcel className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* Lead & Telegram Statistics */}
      {!loading && items.length > 0 && (
        <div className="mb-6 p-4 rounded-box border border-base-300 bg-base-100 shadow-sm">
          <div className="flex flex-wrap gap-4 items-start">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <span className="font-semibold text-primary">{leadStats.total}</span>
              <span className="text-sm text-base-content/70">Gesamt</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0088cc]/10 border border-[#0088cc]/20">
              <FaTelegram className="w-5 h-5 text-[#0088cc]" />
              <span className="font-semibold text-[#0088cc]">{leadStats.telegramCount}</span>
              <span className="text-sm text-base-content/70">Telegram</span>
            </div>
            {leadStats.leadList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {leadStats.leadList.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20"
                  >
                    <span className="font-semibold text-purple-600 dark:text-purple-400">{item.count}</span>
                    <span className="text-sm text-purple-600 dark:text-purple-400">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
            const telegramId = String(r?.telegramId || "").trim() || "";
            const lead = String(r?.lead || "").trim() || "";
            const key = String(r?.id || idx);
            const restoring =
              restoringKey && String(restoringKey) === String(key);
            const deleting = deletingKey && String(deletingKey) === String(key);
            const disabled = Boolean(restoringKey) || Boolean(deletingKey);
            const checked = selectedKeys.includes(key);
            return (
              <div className="relative">
                <input
                  type="checkbox"
                  className="absolute top-2 left-2 z-10 scale-125"
                  checked={checked}
                  onChange={() => toggleSelect(key)}
                  disabled={disabled}
                  title="Tanlash"
                />
                <RemoteUserCard
                  key={String(r?.id || idx)}
                  name={full}
                  photo={photo}
                  email={email === "—" ? "" : email}
                  major={major === "—" ? "" : major}
                  firebaseId={String(r?.sourceDocId || "").trim() || ""}
                  telegramId={telegramId}
                  lead={lead}
                  tone="error"
                  onClick={() => {
                    const majorParam =
                      major && major !== "—" ? major : "unknown";
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
                        onClick={() => restoreToOriginal(r)}
                        disabled={disabled}
                        title="In ursprünglichen Bereich wiederherstellen"
                      >
                        {restoring ? (
                          <>
                            <span className="loading loading-spinner loading-xs sm:loading-sm" />
                            <span className="hidden xs:inline">
                              Original...
                            </span>
                            <span className="xs:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden xs:inline">Original</span>
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
                        className="btn btn-xs sm:btn-sm btn-outline"
                        onClick={() => restore(r)}
                        disabled={disabled}
                        title="Berufsfeld auswählen"
                      >
                        {restoring ? (
                          <>
                            <span className="loading loading-spinner loading-xs sm:loading-sm" />
                            <span className="hidden xs:inline">
                              Auswählen...
                            </span>
                            <span className="xs:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden xs:inline">Auswählen</span>
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
                            <span className="hidden xs:inline">
                              Deleting...
                            </span>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
