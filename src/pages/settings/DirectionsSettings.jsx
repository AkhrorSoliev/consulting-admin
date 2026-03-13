import useDirections from "./directions/hooks/useDirections";
import DirectionsHeader from "./directions/components/DirectionsHeader";
import DirectionCard from "./directions/components/DirectionCard";
import { StatsCards, FilterTabs } from "./directions/components/StatsAndFilters";
import DirectionsWarning from "./directions/components/DirectionsWarning";

export default function DirectionsSettings() {
  const {
    directions,
    loading,
    filter,
    setFilter,
    restoring,
    deleting,
    candidateCounts,
    loadingCounts,
    handleRestore,
    handlePermanentDelete,
    filteredDirections,
    activeCount,
    deletedCount,
  } = useDirections();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DirectionsHeader />

      <StatsCards
        total={directions.length}
        activeCount={activeCount}
        deletedCount={deletedCount}
      />

      <FilterTabs
        filter={filter}
        setFilter={setFilter}
        total={directions.length}
        activeCount={activeCount}
        deletedCount={deletedCount}
      />

      {/* Directions List */}
      <div className="space-y-3">
        {filteredDirections.length === 0 ? (
          <div className="text-center py-12 opacity-70">
            <p>Keine Richtungen gefunden</p>
          </div>
        ) : (
          filteredDirections.map((direction) => (
            <DirectionCard
              key={direction.id}
              direction={direction}
              restoring={restoring}
              deleting={deleting}
              candidateCounts={candidateCounts}
              loadingCounts={loadingCounts}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
            />
          ))
        )}
      </div>

      {deletedCount > 0 && <DirectionsWarning />}
    </div>
  );
}
