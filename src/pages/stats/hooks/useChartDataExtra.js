import { useMemo } from "react";

export default function useChartDataExtra({
  maritalStats,
  genderStats,
  experienceBuckets,
  regionCounts,
  regionCertCounts,
}) {
  const maritalPieData = useMemo(
    () => ({
      labels: ["Ledig", "Verheiratet"],
      datasets: [{
        data: [maritalStats.single, maritalStats.married],
        backgroundColor: ["#8B5CF6", "#EC4899"],
        hoverOffset: 4,
      }],
    }),
    [maritalStats]
  );

  const genderPieData = useMemo(
    () => ({
      labels: ["Männlich", "Weiblich", "Unbekannt"],
      datasets: [{
        data: [genderStats.male, genderStats.female, genderStats.unknown],
        backgroundColor: ["#3B82F6", "#EC4899", "#9CA3AF"],
        hoverOffset: 4,
      }],
    }),
    [genderStats]
  );

  const experienceBarData = useMemo(
    () => ({
      labels: experienceBuckets.map((b) => b.bucket),
      datasets: [{
        label: "Nutzer",
        data: experienceBuckets.map((b) => b.count),
        backgroundColor: "#0EA5E9",
        borderRadius: 6,
      }],
    }),
    [experienceBuckets]
  );

  const regionBarData = useMemo(
    () => ({
      labels: regionCounts.map((r) => r.region),
      datasets: [{
        label: "Kandidatlar",
        data: regionCounts.map((r) => r.count),
        backgroundColor: "#8B5CF6",
        borderRadius: 6,
      }],
    }),
    [regionCounts]
  );

  const regionCertStackedData = useMemo(
    () => ({
      labels: regionCertCounts.map((r) => r.region),
      datasets: [
        {
          label: "Sertifikat bor",
          data: regionCertCounts.map((r) => r.hasCert),
          backgroundColor: "#10B981",
          borderRadius: 4,
        },
        {
          label: "Sertifikat yo'q",
          data: regionCertCounts.map((r) => r.noCert),
          backgroundColor: "#EF4444",
          borderRadius: 4,
        },
      ],
    }),
    [regionCertCounts]
  );

  return {
    maritalPieData,
    genderPieData,
    experienceBarData,
    regionBarData,
    regionCertStackedData,
  };
}
