import { useMemo } from "react";

const EXCLUDED_REGIONS = [
  "Andijon", "Namangan", "Samarkand", "Tashkent", "Bukhara", "Samarkanf", "Taschkent",
];

function filterRegions(entries) {
  return entries
    .filter((x) => {
      const hasRegionOrRepublik = /Region|Republik/i.test(x.region);
      if (hasRegionOrRepublik) return true;
      return !EXCLUDED_REGIONS.some(
        (exc) => x.region.toLowerCase().includes(exc.toLowerCase())
      );
    });
}

export default function useStatsData(statsDoc) {
  const perCollectionCounts = useMemo(() => {
    const byMajor = statsDoc?.totals?.byMajor || {};
    return Object.entries(byMajor)
      .map(([name, count]) => ({ name, count: Number(count) || 0 }))
      .sort((a, b) => (b.count || 0) - (a.count || 0));
  }, [statsDoc]);

  const leadCounts = useMemo(() => {
    const byLead = statsDoc?.totals?.byLead || {};
    return Object.entries(byLead)
      .map(([name, count]) => ({ name, count: Number(count) || 0 }))
      .filter((x) => x.count > 0)
      .sort((a, b) => (b.count || 0) - (a.count || 0));
  }, [statsDoc]);

  const leadCharts = useMemo(() => {
    const items = Array.isArray(leadCounts) ? leadCounts : [];
    const TOP = 12;
    const top = items.slice(0, TOP);
    const others = items.slice(TOP).reduce((sum, x) => sum + (x.count || 0), 0);
    const labels = [
      ...top.map((x) => x.name),
      ...(others > 0 ? ["Andere"] : []),
    ];
    const values = [
      ...top.map((x) => x.count || 0),
      ...(others > 0 ? [others] : []),
    ];
    return {
      labels,
      values,
      top,
      others,
      unique: items.length,
      total: items.reduce((sum, x) => sum + (x.count || 0), 0),
    };
  }, [leadCounts]);

  const perMajorLeadCounts = useMemo(() => {
    const map = statsDoc?.totals?.byMajorLead || {};
    return Object.entries(map).map(([majorName, leadsObj]) => {
      const leads = Object.entries(leadsObj || {})
        .map(([leadName, count]) => ({ leadName, count: Number(count) || 0 }))
        .filter((x) => x.count > 0)
        .sort((a, b) => (b.count || 0) - (a.count || 0));
      return { majorName, leads };
    });
  }, [statsDoc]);

  const ageBuckets = useMemo(() => {
    const map = statsDoc?.demographics?.ageBuckets || {};
    const defs = ["18-24", "25-34", "35-44", "45-54", "55+"];
    return defs.map((bucket) => ({
      bucket,
      count: Number(map?.[bucket]) || 0,
    }));
  }, [statsDoc]);

  const avgAge = useMemo(() => {
    const cnt = Number(statsDoc?.demographics?.age?.count) || 0;
    const sum = Number(statsDoc?.demographics?.age?.sum) || 0;
    if (cnt <= 0) return null;
    return Math.round((sum / cnt) * 10) / 10;
  }, [statsDoc]);

  const levelCounts = useMemo(() => {
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const map = statsDoc?.skills?.languageLevels || {};
    return levels.map((level) => ({
      level,
      count: Number(map?.[level]) || 0,
    }));
  }, [statsDoc]);

  const topLanguages = useMemo(() => {
    const map = statsDoc?.skills?.languages?.counts || {};
    return Object.entries(map)
      .map(([name, count]) => ({ name, count: Number(count) || 0 }))
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 10);
  }, [statsDoc]);

  const diplomaStats = useMemo(() => {
    const cand = statsDoc?.attachments?.diplomas?.candidates || {};
    return { has: Number(cand?.has) || 0, none: Number(cand?.none) || 0 };
  }, [statsDoc]);

  const certStats = useMemo(() => {
    const cand = statsDoc?.attachments?.languageCertificates?.candidates || {};
    return { has: Number(cand?.has) || 0, none: Number(cand?.none) || 0 };
  }, [statsDoc]);

  const certTypeCounts = useMemo(() => {
    const map = statsDoc?.attachments?.languageCertificates?.byType || {};
    return Object.entries(map)
      .map(([type, count]) => ({ type, count: Number(count) || 0 }))
      .filter((x) => x.count > 0)
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 12);
  }, [statsDoc]);

  const maritalStats = useMemo(() => {
    const m = statsDoc?.demographics?.marital || {};
    return { single: Number(m?.single) || 0, married: Number(m?.married) || 0 };
  }, [statsDoc]);

  const genderStats = useMemo(() => {
    const g = statsDoc?.demographics?.gender || {};
    return {
      male: Number(g?.male) || 0,
      female: Number(g?.female) || 0,
      unknown: Number(g?.unknown) || 0,
    };
  }, [statsDoc]);

  const experienceBuckets = useMemo(() => {
    const map = statsDoc?.career?.experienceBuckets || {};
    const keys = ["0-1 Jahr", "1-3 Jahre", "3-5 Jahre", "5+ Jahre"];
    return keys.map((bucket) => ({
      bucket,
      count: Number(map?.[bucket]) || 0,
    }));
  }, [statsDoc]);

  const regionCounts = useMemo(() => {
    const map = statsDoc?.regions?.byRegion || {};
    return filterRegions(
      Object.entries(map)
        .map(([region, count]) => ({ region, count: Number(count) || 0 }))
        .filter((x) => x.count > 0)
    ).sort((a, b) => (b.count || 0) - (a.count || 0));
  }, [statsDoc]);

  const regionCertCounts = useMemo(() => {
    const map = statsDoc?.regions?.byRegionCert || {};
    return filterRegions(
      Object.entries(map)
        .map(([region, data]) => ({
          region,
          hasCert: Number(data?.hasCert) || 0,
          noCert: Number(data?.noCert) || 0,
          total: (Number(data?.hasCert) || 0) + (Number(data?.noCert) || 0),
        }))
        .filter((x) => x.total > 0)
    ).sort((a, b) => (b.total || 0) - (a.total || 0));
  }, [statsDoc]);

  return {
    perCollectionCounts,
    leadCounts,
    leadCharts,
    perMajorLeadCounts,
    ageBuckets,
    avgAge,
    levelCounts,
    topLanguages,
    diplomaStats,
    certStats,
    certTypeCounts,
    maritalStats,
    genderStats,
    experienceBuckets,
    regionCounts,
    regionCertCounts,
  };
}
