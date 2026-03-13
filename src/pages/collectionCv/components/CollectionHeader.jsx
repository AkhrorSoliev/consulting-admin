import { FaFileExcel } from "react-icons/fa";

export default function CollectionHeader({
  title,
  loading,
  filteredCount,
  metaLoading,
  majorCreatedAtLabel,
  majorCreatedByLabel,
  searchQuery,
  setSearchQuery,
  exporting,
  exportingFull,
  itemsCount,
  onExportExcel,
  onExportFullExcel,
}) {
  return (
    <div className="mb-4 sm:mb-6 flex items-center justify-between flex-col md:flex-row lg:flex-row">
      <div className="w-full md:w-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-medium tracking-tight">
          Berufsfeld: <span className="font-bold">{title}</span>
        </h1>
        <p className="text-sm opacity-70">
          Gefunden: {loading ? "..." : filteredCount} Kandidaten
        </p>
        <p className="text-sm opacity-70">
          Erstellt am: {metaLoading ? "..." : majorCreatedAtLabel}
        </p>
        <p className="text-sm opacity-70">
          Erstellt von: {metaLoading ? "..." : majorCreatedByLabel}
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-2 w-full md:w-auto">
        <div className="flex gap-2 flex-wrap">
          <input
            type="search"
            id="search"
            name="search"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full lg:w-64"
            placeholder="Nach Name suchen..."
            aria-label="Nach Name suchen"
          />
          <button
            type="button"
            className="btn btn-success btn-sm gap-2"
            onClick={onExportExcel}
            disabled={exporting || loading || filteredCount === 0}
            title="Qisqa Excel eksport"
          >
            {exporting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <FaFileExcel className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            type="button"
            className="btn btn-outline btn-success btn-sm gap-2"
            onClick={onExportFullExcel}
            disabled={exportingFull || loading || itemsCount === 0}
            title="To'liq ma'lumotlar bilan Excel eksport"
          >
            {exportingFull ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <FaFileExcel className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">To'liq Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
