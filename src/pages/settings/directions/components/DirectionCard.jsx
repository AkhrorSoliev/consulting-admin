import {
  FaTrashRestore,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaUsers,
} from "react-icons/fa";

export default function DirectionCard({
  direction,
  restoring,
  deleting,
  candidateCounts,
  loadingCounts,
  onRestore,
  onPermanentDelete,
}) {
  return (
    <div
      className={`card bg-base-100 border ${
        direction.isDeleted ? "border-warning/30" : "border-base-300"
      } shadow-sm`}
    >
      <div className="card-body p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">
                {direction.title || direction.collectionName}
              </h3>
              {direction.isDeleted ? (
                <span className="badge badge-warning badge-sm gap-1">
                  <FaTimesCircle className="h-3 w-3" />
                  Gelöscht
                </span>
              ) : (
                <span className="badge badge-success badge-sm gap-1">
                  <FaCheckCircle className="h-3 w-3" />
                  Aktiv
                </span>
              )}
            </div>
            <div className="text-sm text-base-content/60 space-y-1">
              <p>
                <span className="font-medium">Collection:</span>{" "}
                {direction.collectionName}
              </p>
              <p>
                <span className="font-medium">UUID:</span>{" "}
                <code className="text-xs bg-base-200 px-1 rounded">
                  {direction.uuid || direction.id}
                </code>
              </p>
              <p className="flex items-center gap-2">
                <FaUsers className="h-3 w-3" />
                <span className="font-medium">Kandidaten:</span>{" "}
                {loadingCounts ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <span
                    className={`font-semibold ${
                      candidateCounts[direction.id] > 0
                        ? "text-primary"
                        : ""
                    }`}
                  >
                    {candidateCounts[direction.id] || 0}
                  </span>
                )}
              </p>
              {direction.candidatesCountAtDeletion !== undefined && (
                <p className="text-warning">
                  <span className="font-medium">Bei Löschung:</span>{" "}
                  {direction.candidatesCountAtDeletion} Kandidaten
                  vorhanden
                </p>
              )}
              {direction.deletedAt && (
                <p>
                  <span className="font-medium">Gelöscht:</span>{" "}
                  {new Date(direction.deletedAt).toLocaleString(
                    "uz-UZ"
                  )}
                </p>
              )}
              {direction.restoredAt && (
                <p>
                  <span className="font-medium">
                    Wiederhergestellt:
                  </span>{" "}
                  {new Date(direction.restoredAt).toLocaleString(
                    "uz-UZ"
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {direction.isDeleted ? (
              <>
                <button
                  className="btn btn-success btn-sm gap-2"
                  onClick={() => onRestore(direction)}
                  disabled={restoring === direction.id}
                >
                  {restoring === direction.id ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <FaTrashRestore />
                  )}
                  Wiederherstellen
                </button>
                <button
                  className="btn btn-error btn-sm gap-2"
                  onClick={() => onPermanentDelete(direction)}
                  disabled={deleting === direction.id}
                >
                  {deleting === direction.id ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <FaTrash />
                  )}
                  Dauerhaft löschen
                </button>
              </>
            ) : (
              <div className="text-right">
                <div className="badge badge-success badge-outline mb-2">
                  Aktive Richtung
                </div>
                <div className="text-xs text-base-content/50">
                  Zum Löschen Sidebar verwenden
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
