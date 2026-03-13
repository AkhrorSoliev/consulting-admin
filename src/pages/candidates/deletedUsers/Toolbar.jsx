import { FaFileExcel } from "react-icons/fa";

export default function Toolbar({
  query,
  setQuery,
  loading,
  exporting,
  itemCount,
  selectedKeys,
  deletingKey,
  onBulkDelete,
  onClearSelection,
  onRefresh,
  onExportExcel,
}) {
  return (
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
              onClick={onBulkDelete}
              disabled={loading || Boolean(deletingKey)}
            >
              Ausgewählte löschen ({selectedKeys.length})
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClearSelection}
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
  );
}
