import { FaFileExcel } from "react-icons/fa";

export default function ArchivedUsersToolbar({
  loading,
  query,
  setQuery,
  onRefresh,
  onExportExcel,
  exporting,
  itemCount,
  selectedKeys,
  onBulkDelete,
  onClearSelection,
  restoringKey,
  movingKey,
}) {
  const disabled = loading || Boolean(restoringKey) || Boolean(movingKey);

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div>
        <div className="text-lg font-semibold">Archivierte Benutzer</div>
        <div className="text-xs text-base-content/60">
          Quelle: Firestore (archived_users)
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {selectedKeys.length > 0 && (
          <>
            <button
              type="button"
              className="btn btn-error"
              onClick={onBulkDelete}
              disabled={disabled}
            >
              Ausgewählte löschen ({selectedKeys.length})
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClearSelection}
              disabled={disabled}
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
          onClick={onRefresh}
          disabled={loading}
        >
          Aktualisieren
        </button>
        <button
          type="button"
          className="btn btn-success gap-2"
          onClick={onExportExcel}
          disabled={exporting || loading || itemCount === 0}
          title="Archivierte Kandidaten als Excel exportieren"
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
  );
}
