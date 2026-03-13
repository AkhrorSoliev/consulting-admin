/**
 * StatsSection - thin shell that composes sub-components from ./stats/.
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import useStatsData from "./stats/hooks/useStatsData";
import useChartData from "./stats/hooks/useChartData";
import useChartDataExtra from "./stats/hooks/useChartDataExtra";
import KpiCards from "./stats/components/KpiCards";
import { Row1 } from "./stats/components/ChartRows";
import DoughnutRow from "./stats/components/DoughnutRow";
import LeadStatsCard from "./stats/components/LeadStatsCard";
import MajorLeadCard from "./stats/components/MajorLeadCard";
import RegionSection from "./stats/components/RegionSection";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

export default function StatsSection({ title, subtitle, statsDoc, collectionNames, kind }) {
  const kindLabel = kind === "allTime" ? "ALL-TIME" : "LIVE";
  const totalCollections =
    statsDoc?.totals?.directions ?? (collectionNames || []).length;
  const totalUsers = statsDoc?.totals?.candidates ?? 0;

  const stats = useStatsData(statsDoc);
  const charts = useChartData(stats);
  const extraCharts = useChartDataExtra(stats);

  return (
    <div className="space-y-6">
      {title && (
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && <p className="text-sm opacity-70">{subtitle}</p>}
        </div>
      )}

      <KpiCards
        kindLabel={kindLabel}
        kind={kind}
        totalUsers={totalUsers}
        totalCollections={totalCollections}
        avgAge={stats.avgAge}
        diplomaStats={stats.diplomaStats}
      />

      <Row1
        perCollectionBarData={charts.perCollectionBarData}
        experienceBarData={extraCharts.experienceBarData}
      />

      <DoughnutRow
        diplomaDoughnutData={charts.diplomaDoughnutData}
        certDoughnutData={charts.certDoughnutData}
        maritalPieData={extraCharts.maritalPieData}
      />

      <LeadStatsCard
        leadCounts={stats.leadCounts}
        leadCharts={stats.leadCharts}
        leadBarData={charts.leadBarData}
        leadPieData={charts.leadPieData}
      />

      <MajorLeadCard perMajorLeadCounts={stats.perMajorLeadCounts} />

      <RegionSection
        regionCounts={stats.regionCounts}
        regionCertCounts={stats.regionCertCounts}
        regionBarData={extraCharts.regionBarData}
        regionCertStackedData={extraCharts.regionCertStackedData}
      />
    </div>
  );
}
