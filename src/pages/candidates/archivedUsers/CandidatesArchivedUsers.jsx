import { useState } from "react";
import toast from "react-hot-toast";
import useUserRole from "../../../hooks/useUserRole";
import ConfirmActionModal from "../../../components/ConfirmActionModal";
import SelectMajorModal from "../../../components/SelectMajorModal";
import { exportFullCandidatesToExcel } from "../../../utils/excelExport";
import useArchivedUsers from "./useArchivedUsers";
import useArchivedActions from "./useArchivedActions";
import ArchivedUsersToolbar from "./ArchivedUsersToolbar";
import ArchivedUsersList from "./ArchivedUsersList";
import LeadStats from "./LeadStats";

const SELECTED_KEYS_STORAGE = "archivedUsersSelectedKeys";

export default function CandidatesArchivedUsers() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });
  const isPrivileged =
    !loadingRole && (role === "super_admin" || role === "admin");

  const [selectedKeys, setSelectedKeys] = useState(() => {
    try {
      const raw = localStorage.getItem(SELECTED_KEYS_STORAGE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [exporting, setExporting] = useState(false);

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

  const { loading, items, query, setQuery, majors, filtered, leadStats, load } =
    useArchivedUsers({ isPrivileged });

  const {
    restoringKey, movingKey, confirmState, setConfirmState,
    majorModalOpen, majorModalKey, setMajorModalKey,
    closeMajorModal, restore, confirmRestoreFromModal,
    moveToDeleted, handleBulkDelete, confirmModalAction,
  } = useArchivedActions({ isPrivileged, items, load, clearSelection });

  function handleExportExcel() {
    if (exporting || items.length === 0) return;
    setExporting(true);
    try {
      const docsWithMajor = items.map((item) => ({
        ...item,
        major: item.sourceMajor || item.major || "Archiviert",
      }));
      exportFullCandidatesToExcel(docsWithMajor, "Archivierte_Benutzer");
      toast.success(`${items.length} archivierte Kandidaten exportiert.`);
    } catch (err) {
      toast.error(err.message || "Fehler beim Exportieren.");
    } finally {
      setExporting(false);
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
        cancelLabel={confirmState?.cancelLabel}
        seconds={0}
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
      <ArchivedUsersToolbar
        loading={loading}
        query={query}
        setQuery={setQuery}
        onRefresh={load}
        onExportExcel={handleExportExcel}
        exporting={exporting}
        itemCount={items.length}
        selectedKeys={selectedKeys}
        onBulkDelete={() => handleBulkDelete(selectedKeys)}
        onClearSelection={clearSelection}
        restoringKey={restoringKey}
        movingKey={movingKey}
      />
      {!loading && items.length > 0 && <LeadStats leadStats={leadStats} />}
      {loading ? (
        <div className="grid place-items-center py-10">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-6 rounded-box border border-base-300 bg-base-200/30 text-sm text-base-content/70">
          Keine archivierten Benutzer gefunden.
        </div>
      ) : (
        <ArchivedUsersList
          filtered={filtered}
          restoringKey={restoringKey}
          movingKey={movingKey}
          selectedKeys={selectedKeys}
          toggleSelect={toggleSelect}
          onRestore={restore}
          onMoveToDeleted={moveToDeleted}
        />
      )}
    </div>
  );
}
