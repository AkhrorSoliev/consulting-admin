import { FaUsers, FaEye, FaTrashRestore } from "react-icons/fa";

export default function ArchivedDirectionCard({
  direction,
  candidateCount,
  loadingCounts,
  restoring,
  onViewCandidates,
  onRestore,
}) {
  return (
    <div className="card bg-base-100 border border-warning/30 shadow-md hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="card-title text-lg">
            {direction.title || direction.collectionName}
          </h3>
          <span className="badge badge-warning badge-sm">Arxiv</span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <FaUsers className="h-4 w-4 text-primary" />
            <span className="font-medium">Kandidatlar:</span>
            {loadingCounts ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <span className="font-bold text-primary">
                {candidateCount || 0}
              </span>
            )}
          </div>

          <div className="text-xs text-base-content/60">
            <p>
              <span className="font-medium">Collection:</span>{" "}
              {direction.collectionName}
            </p>
            {direction.deletedAt && (
              <p>
                <span className="font-medium">O'chirilgan:</span>{" "}
                {new Date(direction.deletedAt).toLocaleString("uz-UZ")}
              </p>
            )}
            {direction.candidatesCountAtDeletion !== undefined && (
              <p className="text-warning">
                O'chirilganda: {direction.candidatesCountAtDeletion} ta
              </p>
            )}
          </div>
        </div>

        <div className="card-actions justify-end mt-4 gap-2">
          <button
            className="btn btn-sm btn-primary gap-2"
            onClick={() => onViewCandidates(direction)}
            disabled={!candidateCount}
          >
            <FaEye />
            Ko'rish
          </button>
          <button
            className="btn btn-sm btn-success gap-2"
            onClick={() => onRestore(direction)}
            disabled={restoring === direction.id}
          >
            {restoring === direction.id ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <FaTrashRestore />
            )}
            Tiklash
          </button>
        </div>
      </div>
    </div>
  );
}
