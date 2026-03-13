import { useMemo } from "react";
import useChartDataExtra from "./useChartDataExtra";

export const COLORS = [
  "#6366F1", "#22C55E", "#EAB308", "#F97316",
  "#EF4444", "#06B6D4", "#A855F7", "#84CC16",
];

export default function useChartData(stats) {
  const {
    leadCharts, perCollectionCounts, ageBuckets, levelCounts,
    topLanguages, diplomaStats, certStats, certTypeCounts,
  } = stats;

  const leadBarData = useMemo(
    () => ({
      labels: leadCharts.labels,
      datasets: [{
        label: "Anzahl",
        data: leadCharts.values,
        backgroundColor: leadCharts.values.map((_, i) => COLORS[i % COLORS.length]),
        borderRadius: 8,
        barThickness: 18,
      }],
    }),
    [leadCharts]
  );

  const leadPieData = useMemo(
    () => ({
      labels: leadCharts.labels,
      datasets: [{
        label: "Anzahl",
        data: leadCharts.values,
        backgroundColor: leadCharts.values.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 1,
        hoverOffset: 6,
      }],
    }),
    [leadCharts]
  );

  const perCollectionBarData = useMemo(
    () => ({
      labels: (perCollectionCounts || []).map((c) => c.name),
      datasets: [{
        label: "Nutzer",
        data: (perCollectionCounts || []).map((c) => c.count || 0),
        backgroundColor: "#6366F1",
        borderRadius: 6,
      }],
    }),
    [perCollectionCounts]
  );

  const ageBucketsBarData = useMemo(
    () => ({
      labels: (ageBuckets || []).map((b) => b.bucket),
      datasets: [{
        label: "Anzahl",
        data: (ageBuckets || []).map((b) => b.count || 0),
        backgroundColor: "#22C55E",
        borderRadius: 6,
      }],
    }),
    [ageBuckets]
  );

  const levelCountsBarData = useMemo(
    () => ({
      labels: (levelCounts || []).map((l) => l.level),
      datasets: [{
        label: "Anzahl",
        data: (levelCounts || []).map((l) => l.count || 0),
        backgroundColor: "#F59E0B",
        borderRadius: 6,
      }],
    }),
    [levelCounts]
  );

  const topLanguagesPieData = useMemo(
    () => ({
      labels: (topLanguages || []).map((l) => l.name),
      datasets: [{
        label: "Anzahl",
        data: (topLanguages || []).map((l) => l.count || 0),
        backgroundColor: (topLanguages || []).map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 1,
      }],
    }),
    [topLanguages]
  );

  const diplomaDoughnutData = useMemo(
    () => ({
      labels: ["Mit Diplom", "Ohne Diplom"],
      datasets: [{
        data: [diplomaStats.has, diplomaStats.none],
        backgroundColor: ["#3B82F6", "#9CA3AF"],
        hoverOffset: 4,
      }],
    }),
    [diplomaStats]
  );

  const certDoughnutData = useMemo(
    () => ({
      labels: ["Zertifikat vorhanden", "Kein Zertifikat"],
      datasets: [{
        data: [certStats.has, certStats.none],
        backgroundColor: ["#10B981", "#D1D5DB"],
        hoverOffset: 4,
      }],
    }),
    [certStats]
  );

  const certTypesBarData = useMemo(
    () => ({
      labels: certTypeCounts.map((x) => x.type),
      datasets: [{
        label: "Anzahl (Dateien)",
        data: certTypeCounts.map((x) => x.count),
        backgroundColor: "#10B981",
        borderRadius: 6,
      }],
    }),
    [certTypeCounts]
  );

  const extra = useChartDataExtra(stats);

  return {
    leadBarData,
    leadPieData,
    perCollectionBarData,
    ageBucketsBarData,
    levelCountsBarData,
    topLanguagesPieData,
    diplomaDoughnutData,
    certDoughnutData,
    certTypesBarData,
    ...extra,
  };
}
