/**
 * Home - thin shell that composes sub-components from ./home/.
 */

import { useUserRole } from "../hooks/useUserRole";
import { useCollectionNames } from "./home/hooks/useCollectionNames";
import { useLiveStats } from "./home/hooks/useLiveStats";
import { useGlobalStats } from "./home/hooks/useGlobalStats";
import { useExportCandidates } from "./home/hooks/useExportCandidates";
import DashboardHeader from "./home/components/DashboardHeader";
import StatsContent from "./home/components/StatsContent";

function Home() {
  const { role } = useUserRole();
  const canInitAllTime = role === "admin" || role === "super_admin";

  const collectionNames = useCollectionNames();
  const { liveStats, loading, error } = useLiveStats(collectionNames);
  const { allTimeStats, statsError } = useGlobalStats({
    canInitAllTime,
    liveStats,
  });
  const { exportingAllCandidates, handleExportAllCandidates } =
    useExportCandidates(collectionNames);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <DashboardHeader
        exportingAllCandidates={exportingAllCandidates}
        loading={loading}
        collectionNamesEmpty={collectionNames.length === 0}
        onExport={handleExportAllCandidates}
      />

      <StatsContent
        loading={loading}
        error={error}
        statsError={statsError}
        liveStats={liveStats}
        allTimeStats={allTimeStats}
        collectionNames={collectionNames}
      />
    </div>
  );
}

export default Home;
