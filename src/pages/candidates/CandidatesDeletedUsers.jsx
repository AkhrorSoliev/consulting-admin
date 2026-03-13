/**
 * CandidatesDeletedUsers - thin shell that composes sub-components from ./deletedUsers/.
 */

import { useState } from "react";
import toast from "react-hot-toast";
import useUserRole from "../../hooks/useUserRole";
import ConfirmActionModal from "../../components/ConfirmActionModal";
import SelectMajorModal from "../../components/SelectMajorModal";
import { exportFullCandidatesToExcel } from "../../utils/excelExport";
import useDeletedUsers from "./deletedUsers/useDeletedUsers";
import useDeletedUserActions from "./deletedUsers/useDeletedUserActions";
import Toolbar from "./deletedUsers/Toolbar";
import DeletedUserCard from "./deletedUsers/DeletedUserCard";
import LeadStats from "./deletedUsers/LeadStats";
import Pagination from "./deletedUsers/Pagination";

export default function CandidatesDeletedUsers() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });
  const isPrivileged =
    !loadingRole && (role === "super_admin" || role === "admin");

  const {
    loading, items, query, setQuery, filtered,
    currentPage, setCurrentPage, totalPages, paginatedItems,
    majors, leadStats, load,
    selectedKeys, setSelectedKeys, toggleSelect, clearSelection,
  } = useDeletedUsers(isPrivileged);

  const [exporting, setExporting] = useState(false);

  const {
    restoringKey, deletingKey,
    confirmState, setConfirmState,
    majorModalOpen, majorModalKey, setMajorModalKey,
    closeMajorModal, pendingRecord,
    restore, confirmRestoreFromModal,
    hardDelete, handleBulkDelete,
    confirmModalAction,
  } = useDeletedUserActions({ isPrivileged, items, load, clearSelection });

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
        subtitle="Falls beim Kandidaten kein Berufsfeld vorhanden ist (oder es gelöscht wurde), wählen Sie bitte ein Berufsfeld für die Wiederherstellung."
      />
      <Toolbar
        query={query}
        setQuery={setQuery}
        loading={loading}
        exporting={exporting}
        itemCount={items.length}
        selectedKeys={selectedKeys}
        deletingKey={deletingKey}
        onBulkDelete={() => handleBulkDelete(selectedKeys)}
        onClearSelection={clearSelection}
        onRefresh={load}
        onExportExcel={handleExportExcel}
      />
      {!loading && items.length > 0 && <LeadStats leadStats={leadStats} />}
      {loading ? (
        <div className="grid place-items-center py-10">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-6 rounded-box border border-base-300 bg-base-200/30 text-sm text-base-content/70">
          Keine gelöschten Benutzer gefunden.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedItems.map((record) => (
              <DeletedUserCard
                key={record.id}
                record={record}
                restoringKey={restoringKey}
                deletingKey={deletingKey}
                selectedKeys={selectedKeys}
                toggleSelect={toggleSelect}
                onRestore={restore}
                onHardDelete={hardDelete}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={filtered.length}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
