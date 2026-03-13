import { FaFileExcel } from "react-icons/fa";

export default function DashboardHeader({
  exportingAllCandidates,
  loading,
  collectionNamesEmpty,
  onExport,
}) {
  return (
    <div className="mb-8">
      <div className="text-primary flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Dashboard & Statistiken
          </h1>
          <p className="text-base opacity-70">
            Live (aktuell) und Gesamt (historisch) Statistiken.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-success gap-2"
            onClick={onExport}
            disabled={exportingAllCandidates || loading || collectionNamesEmpty}
            title="Alle Kandidaten im Excel-Format herunterladen"
          >
            {exportingAllCandidates ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <FaFileExcel className="w-4 h-4" />
            )}
            <span>Alle Kandidaten (Excel)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
