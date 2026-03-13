import useArchivedDirections from "./archivedDirections/useArchivedDirections";
import ArchivedInfoAlert from "./archivedDirections/ArchivedInfoAlert";
import ArchivedDirectionCard from "./archivedDirections/ArchivedDirectionCard";

export default function CandidatesArchivedDirections() {
  const {
    archivedDirections,
    candidateCounts,
    loading,
    loadingCounts,
    restoring,
    handleViewCandidates,
    handleRestore,
  } = useArchivedDirections();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          Arxivlangan Yo'nalishlar va Kandidatlar
        </h2>
        <p className="text-base-content/70">
          O'chirilgan yo'nalishlardagi kandidatlarni ko'rish va boshqarish
        </p>
      </div>

      <ArchivedInfoAlert />

      {/* Stats */}
      <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
        <div className="stat">
          <div className="stat-title">Arxivlangan Yo'nalishlar</div>
          <div className="stat-value text-warning">
            {archivedDirections.length}
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Jami Kandidatlar</div>
          <div className="stat-value text-primary">
            {loadingCounts ? (
              <span className="loading loading-spinner loading-md"></span>
            ) : (
              Object.values(candidateCounts).reduce(
                (sum, count) => sum + count,
                0
              )
            )}
          </div>
        </div>
      </div>

      {/* Archived Directions List */}
      {archivedDirections.length === 0 ? (
        <div className="text-center py-12 opacity-70">
          <h3 className="text-xl font-medium">Arxivlangan yo'nalishlar yo'q</h3>
          <p className="mt-2">Barcha yo'nalishlar faol holatda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archivedDirections.map((direction) => (
            <ArchivedDirectionCard
              key={direction.id}
              direction={direction}
              candidateCount={candidateCounts[direction.id]}
              loadingCounts={loadingCounts}
              restoring={restoring}
              onViewCandidates={handleViewCandidates}
              onRestore={handleRestore}
            />
          ))}
        </div>
      )}
    </div>
  );
}
