import { useMemo } from "react";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function StatsSection({ title, subtitle, statsDoc, collectionNames, kind }) {
  const kindLabel = kind === "allTime" ? "ALL‑TIME" : "LIVE";
  const totalCollections =
    statsDoc?.totals?.directions ?? (collectionNames || []).length;
  const totalUsers = statsDoc?.totals?.candidates ?? 0;

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
    return {
      has: Number(cand?.has) || 0,
      none: Number(cand?.none) || 0,
    };
  }, [statsDoc]);

  const certStats = useMemo(() => {
    const cand = statsDoc?.attachments?.languageCertificates?.candidates || {};
    return {
      has: Number(cand?.has) || 0,
      none: Number(cand?.none) || 0,
    };
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
    return {
      single: Number(m?.single) || 0,
      married: Number(m?.married) || 0,
    };
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
    const excludedRegions = ["Andijon", "Namangan", "Samarkand", "Tashkent", "Bukhara", 'Samarkanf', 'Taschkent'];
    return Object.entries(map)
      .map(([region, count]) => ({ region, count: Number(count) || 0 }))
      .filter((x) => x.count > 0)
      .filter((x) => {
        const hasRegionOrRepublik = /Region|Republik/i.test(x.region);
        if (hasRegionOrRepublik) return true;
        return !excludedRegions.some((exc) => x.region.toLowerCase().includes(exc.toLowerCase()));
      })
      .sort((a, b) => (b.count || 0) - (a.count || 0));
  }, [statsDoc]);

  const regionCertCounts = useMemo(() => {
    const map = statsDoc?.regions?.byRegionCert || {};
    const excludedRegions = ["Andijon", "Namangan", "Samarkand", "Tashkent", "Bukhara", 'Samarkanf', 'Taschkent'];
    return Object.entries(map)
      .map(([region, data]) => ({
        region,
        hasCert: Number(data?.hasCert) || 0,
        noCert: Number(data?.noCert) || 0,
        total: (Number(data?.hasCert) || 0) + (Number(data?.noCert) || 0),
      }))
      .filter((x) => x.total > 0)
      .filter((x) => {
        const hasRegionOrRepublik = /Region|Republik/i.test(x.region);
        if (hasRegionOrRepublik) return true;
        return !excludedRegions.some((exc) => x.region.toLowerCase().includes(exc.toLowerCase()));
      })
      .sort((a, b) => (b.total || 0) - (a.total || 0));
  }, [statsDoc]);

  const COLORS = [
    "#6366F1",
    "#22C55E",
    "#EAB308",
    "#F97316",
    "#EF4444",
    "#06B6D4",
    "#A855F7",
    "#84CC16",
  ];

  const leadBarData = useMemo(
    () => ({
      labels: leadCharts.labels,
      datasets: [
        {
          label: "Anzahl",
          data: leadCharts.values,
          backgroundColor: leadCharts.values.map(
            (_, i) => COLORS[i % COLORS.length]
          ),
          borderRadius: 8,
          barThickness: 18,
        },
      ],
    }),
    [leadCharts, COLORS]
  );

  const leadPieData = useMemo(
    () => ({
      labels: leadCharts.labels,
      datasets: [
        {
          label: "Anzahl",
          data: leadCharts.values,
          backgroundColor: leadCharts.values.map(
            (_, i) => COLORS[i % COLORS.length]
          ),
          borderWidth: 1,
          hoverOffset: 6,
        },
      ],
    }),
    [leadCharts, COLORS]
  );

  const perCollectionBarData = useMemo(
    () => ({
      labels: (perCollectionCounts || []).map((c) => c.name),
      datasets: [
        {
          label: "Nutzer",
          data: (perCollectionCounts || []).map((c) => c.count || 0),
          backgroundColor: "#6366F1",
          borderRadius: 6,
        },
      ],
    }),
    [perCollectionCounts]
  );

  const ageBucketsBarData = useMemo(
    () => ({
      labels: (ageBuckets || []).map((b) => b.bucket),
      datasets: [
        {
          label: "Anzahl",
          data: (ageBuckets || []).map((b) => b.count || 0),
          backgroundColor: "#22C55E",
          borderRadius: 6,
        },
      ],
    }),
    [ageBuckets]
  );

  const levelCountsBarData = useMemo(
    () => ({
      labels: (levelCounts || []).map((l) => l.level),
      datasets: [
        {
          label: "Anzahl",
          data: (levelCounts || []).map((l) => l.count || 0),
          backgroundColor: "#F59E0B",
          borderRadius: 6,
        },
      ],
    }),
    [levelCounts]
  );

  const topLanguagesPieData = useMemo(
    () => ({
      labels: (topLanguages || []).map((l) => l.name),
      datasets: [
        {
          label: "Anzahl",
          data: (topLanguages || []).map((l) => l.count || 0),
          backgroundColor: (topLanguages || []).map(
            (_, i) => COLORS[i % COLORS.length]
          ),
          borderWidth: 1,
        },
      ],
    }),
    [topLanguages, COLORS]
  );

  const diplomaDoughnutData = useMemo(
    () => ({
      labels: ["Mit Diplom", "Ohne Diplom"],
      datasets: [
        {
          data: [diplomaStats.has, diplomaStats.none],
          backgroundColor: ["#3B82F6", "#9CA3AF"],
          hoverOffset: 4,
        },
      ],
    }),
    [diplomaStats]
  );

  const certDoughnutData = useMemo(
    () => ({
      labels: ["Zertifikat vorhanden", "Kein Zertifikat"],
      datasets: [
        {
          data: [certStats.has, certStats.none],
          backgroundColor: ["#10B981", "#D1D5DB"],
          hoverOffset: 4,
        },
      ],
    }),
    [certStats]
  );

  const certTypesBarData = useMemo(
    () => ({
      labels: certTypeCounts.map((x) => x.type),
      datasets: [
        {
          label: "Anzahl (Dateien)",
          data: certTypeCounts.map((x) => x.count),
          backgroundColor: "#10B981",
          borderRadius: 6,
        },
      ],
    }),
    [certTypeCounts]
  );

  const maritalPieData = useMemo(
    () => ({
      labels: ["Ledig", "Verheiratet"],
      datasets: [
        {
          data: [maritalStats.single, maritalStats.married],
          backgroundColor: ["#8B5CF6", "#EC4899"],
          hoverOffset: 4,
        },
      ],
    }),
    [maritalStats]
  );

  const genderPieData = useMemo(
    () => ({
      labels: ["Männlich", "Weiblich", "Unbekannt"],
      datasets: [
        {
          data: [genderStats.male, genderStats.female, genderStats.unknown],
          backgroundColor: ["#3B82F6", "#EC4899", "#9CA3AF"],
          hoverOffset: 4,
        },
      ],
    }),
    [genderStats]
  );

  const experienceBarData = useMemo(
    () => ({
      labels: experienceBuckets.map((b) => b.bucket),
      datasets: [
        {
          label: "Nutzer",
          data: experienceBuckets.map((b) => b.count),
          backgroundColor: "#0EA5E9",
          borderRadius: 6,
        },
      ],
    }),
    [experienceBuckets]
  );

  const regionBarData = useMemo(
    () => ({
      labels: regionCounts.map((r) => r.region),
      datasets: [
        {
          label: "Kandidatlar",
          data: regionCounts.map((r) => r.count),
          backgroundColor: "#8B5CF6",
          borderRadius: 6,
        },
      ],
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

  const defaultBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  const leadBarOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x}` } },
      },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 } },
        y: {
          ticks: {
            autoSkip: false,
            callback: function (val) {
              // Chart.js gibt Tick-Wert; in Label umwandeln
              const label = this.getLabelForValue(val);
              const s = String(label || "");
              return s.length > 22 ? `${s.slice(0, 22)}…` : s;
            },
          },
        },
      },
    }),
    []
  );

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
  };

  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  const horizontalBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 } },
      y: {
        ticks: {
          autoSkip: false,
          callback: function (val) {
            const label = this.getLabelForValue(val);
            const s = String(label || "");
            return s.length > 20 ? `${s.slice(0, 20)}…` : s;
          },
        },
      },
    },
  };

  const horizontalStackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: { legend: { position: "top" } },
    scales: {
      x: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
      y: {
        stacked: true,
        ticks: {
          autoSkip: false,
          callback: function (val) {
            const label = this.getLabelForValue(val);
            const s = String(label || "");
            return s.length > 20 ? `${s.slice(0, 20)}…` : s;
          },
        },
      },
    },
  };

  return (
    <section className="space-y-6">
      {title ? (
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle ? <p className="opacity-70">{subtitle}</p> : null}
        </div>
      ) : null}

      {totalUsers === 0 ? (
        <div className="text-center py-10 opacity-70">
          <h3 className="text-xl font-medium">Keine Daten verfügbar</h3>
          <p>Es wurden noch keine Bewerbungen eingereicht.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat bg-base-100 shadow rounded-box border border-base-200">
              <div className="stat-title">Nutzer Gesamt ({kindLabel})</div>
              <div className="stat-value text-primary">{totalUsers}</div>
              <div className="stat-desc">
                {kind === "allTime"
                  ? "Historische Summe (wird bei Löschung nicht reduziert)"
                  : "Aktueller Stand (wird bei Löschung reduziert)"}
              </div>
            </div>

            <div className="stat bg-base-100 shadow rounded-box border border-base-200">
              <div className="stat-title">Sammlungen ({kindLabel})</div>
              <div className="stat-value text-secondary">
                {totalCollections}
              </div>
              <div className="stat-desc">
                {kind === "allTime" ? "Historische Liste" : "Aktive Kategorien"}
              </div>
            </div>

            <div className="stat bg-base-100 shadow rounded-box border border-base-200">
              <div className="stat-title">Ø Alter ({kindLabel})</div>
              <div className="stat-value text-accent">{avgAge ?? "-"}</div>
              <div className="stat-desc">Jahre</div>
            </div>

            <div className="stat bg-base-100 shadow rounded-box border border-base-200">
              <div className="stat-title">Mit Diplom ({kindLabel})</div>
              <div className="stat-value text-info">{diplomaStats.has}</div>
              <div className="stat-desc">
                (
                {totalUsers > 0
                  ? ((diplomaStats.has / totalUsers) * 100).toFixed(0)
                  : 0}
                %)
              </div>
            </div>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">
                  Verteilung nach Berufsfeld
                </h2>
                <div className="h-64 md:h-80">
                  <Bar
                    data={perCollectionBarData}
                    options={defaultBarOptions}
                  />
                </div>
              </div>
            </div>
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">
                  Berufserfahrung (Jahre)
                </h2>
                <div className="h-64 md:h-80">
                  <Bar data={experienceBarData} options={defaultBarOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Leads */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Lead-Statistik</h2>
                {leadCounts.length === 0 ? (
                  <div className="opacity-70 text-sm">
                    Keine Lead-Daten verfügbar.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="stat bg-base-200/30 rounded-box border border-base-200">
                        <div className="stat-title">Einzigartige Leads</div>
                        <div className="stat-value text-primary text-2xl">
                          {leadCharts.unique}
                        </div>
                      </div>
                      <div className="stat bg-base-200/30 rounded-box border border-base-200">
                        <div className="stat-title">Gesamt Leads</div>
                        <div className="stat-value text-secondary text-2xl">
                          {leadCharts.total}
                        </div>
                      </div>
                      <div className="stat bg-base-200/30 rounded-box border border-base-200">
                        <div className="stat-title">Top Lead</div>
                        <div className="stat-value text-accent text-2xl">
                          {leadCounts?.[0]?.count ?? 0}
                        </div>
                        <div className="stat-desc">
                          {leadCounts?.[0]?.name ?? "-"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-box border border-base-200 p-4">
                        <div className="font-medium mb-3">
                          Top Leads (Balkendiagramm)
                        </div>
                        <div className="h-72">
                          <Bar data={leadBarData} options={leadBarOptions} />
                        </div>
                        {leadCharts.others > 0 ? (
                          <div className="text-xs opacity-70 mt-2">
                            "Andere" = Summe außerhalb der Top 12
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-box border border-base-200 p-4">
                        <div className="font-medium mb-3">
                          Anteil (Kreisdiagramm)
                        </div>
                        <div className="h-72">
                          <Pie data={leadPieData} options={pieOptions} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Berufsfeld + Lead</h2>
                <div className="space-y-3">
                  {perMajorLeadCounts
                    .filter((x) => Array.isArray(x.leads) && x.leads.length > 0)
                    .slice(0, 20)
                    .map((row) => (
                      <div
                        key={row.majorName}
                        className="rounded-box border border-base-200 p-3"
                      >
                        <div className="font-medium mb-2">{row.majorName}</div>
                        <div className="overflow-x-auto">
                          <table className="table table-xs">
                            <thead>
                              <tr>
                                <th>Lead</th>
                                <th className="text-right">Anzahl</th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.leads.slice(0, 10).map((l) => (
                                <tr key={`${row.majorName}:${l.leadName}`}>
                                  <td>{l.leadName}</td>
                                  <td className="text-right">{l.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  {perMajorLeadCounts.filter((x) => x.leads?.length > 0)
                    .length === 0 ? (
                    <div className="opacity-70 text-sm">
                      Keine Berufsfeld+Lead Daten verfügbar.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body items-center text-center">
                <h2 className="card-title text-base mb-2">Diplom-Status</h2>
                <div className="h-48 w-full max-w-xs">
                  <Doughnut data={diplomaDoughnutData} options={pieOptions} />
                </div>
              </div>
            </div>
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body items-center text-center">
                <h2 className="card-title text-base mb-2">Sprachzertifikate</h2>
                <div className="h-48 w-full max-w-xs">
                  <Doughnut data={certDoughnutData} options={pieOptions} />
                </div>
              </div>
            </div>
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body items-center text-center">
                <h2 className="card-title text-base mb-2">Familienstand</h2>
                <div className="h-48 w-full max-w-xs">
                  <Pie data={maritalPieData} options={pieOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2b */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">
                  Sprachzertifikat-Typen (Top)
                </h2>
                <div className="h-64 md:h-80">
                  {certTypeCounts.length > 0 ? (
                    <Bar data={certTypesBarData} options={defaultBarOptions} />
                  ) : (
                    <div className="h-full grid place-items-center opacity-60 text-sm">
                      Zertifikat-Typen nicht verfügbar.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">
                  Geschlechterverteilung
                </h2>
                <div className="h-64 md:h-80 flex justify-center">
                  <Pie data={genderPieData} options={pieOptions} />
                </div>
              </div>
            </div>
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Top 10 Sprachen</h2>
                <div className="h-64 md:h-80 flex justify-center">
                  <Pie data={topLanguagesPieData} options={pieOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Altersgruppen</h2>
                <div className="h-64 md:h-80">
                  <Bar data={ageBucketsBarData} options={defaultBarOptions} />
                </div>
              </div>
            </div>
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Sprachniveaus</h2>
                <div className="h-64 md:h-80">
                  <Bar data={levelCountsBarData} options={defaultBarOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Row 5 - Viloyatlar bo'yicha statistika */}
          <div className="card bg-base-100 shadow border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                📍 Viloyatlar bo'yicha statistika
              </h2>
              {regionCounts.length === 0 ? (
                <div className="text-center py-10 opacity-70">
                  <p>Viloyat ma'lumotlari mavjud emas.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* KPI cards for regions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="stat bg-base-200/30 rounded-box border border-base-200">
                      <div className="stat-title">Jami viloyatlar</div>
                      <div className="stat-value text-primary text-2xl">
                        {regionCounts.length}
                      </div>
                    </div>
                    <div className="stat bg-base-200/30 rounded-box border border-base-200">
                      <div className="stat-title">Eng ko'p kandidat</div>
                      <div className="stat-value text-secondary text-2xl">
                        {regionCounts[0]?.count || 0}
                      </div>
                      <div className="stat-desc">
                        {regionCounts[0]?.region || "-"}
                      </div>
                    </div>
                    <div className="stat bg-base-200/30 rounded-box border border-base-200">
                      <div className="stat-title">Sertifikatli kandidatlar</div>
                      <div className="stat-value text-success text-2xl">
                        {regionCertCounts.reduce((sum, r) => sum + r.hasCert, 0)}
                      </div>
                      <div className="stat-desc">
                        Barcha viloyatlardan
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Viloyatlar bo'yicha kandidatlar soni */}
                    <div className="rounded-box border border-base-200 p-4">
                      <div className="font-medium mb-3">
                        Viloyatlar bo'yicha kandidatlar soni
                      </div>
                      <div style={{ height: Math.max(300, regionCounts.length * 28) }}>
                        <Bar data={regionBarData} options={horizontalBarOptions} />
                      </div>
                    </div>

                    {/* Viloyatlar bo'yicha sertifikat holati */}
                    <div className="rounded-box border border-base-200 p-4">
                      <div className="font-medium mb-3">
                        Viloyatlar bo'yicha sertifikat holati
                      </div>
                      <div style={{ height: Math.max(300, regionCertCounts.length * 28) }}>
                        <Bar
                          data={regionCertStackedData}
                          options={horizontalStackedBarOptions}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Jadval ko'rinishida */}
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>Viloyat</th>
                          <th className="text-right">Jami</th>
                          <th className="text-right">Sertifikat bor</th>
                          <th className="text-right">Sertifikat yo'q</th>
                          <th className="text-right">Sertifikat %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regionCertCounts.map((r) => (
                          <tr key={r.region}>
                            <td className="font-medium">{r.region}</td>
                            <td className="text-right">{r.total}</td>
                            <td className="text-right text-success">{r.hasCert}</td>
                            <td className="text-right text-error">{r.noCert}</td>
                            <td className="text-right">
                              {r.total > 0
                                ? ((r.hasCert / r.total) * 100).toFixed(1)
                                : 0}
                              %
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold">
                          <td>Jami</td>
                          <td className="text-right">
                            {regionCertCounts.reduce((sum, r) => sum + r.total, 0)}
                          </td>
                          <td className="text-right text-success">
                            {regionCertCounts.reduce((sum, r) => sum + r.hasCert, 0)}
                          </td>
                          <td className="text-right text-error">
                            {regionCertCounts.reduce((sum, r) => sum + r.noCert, 0)}
                          </td>
                          <td className="text-right">
                            {(() => {
                              const total = regionCertCounts.reduce(
                                (sum, r) => sum + r.total,
                                0
                              );
                              const hasCert = regionCertCounts.reduce(
                                (sum, r) => sum + r.hasCert,
                                0
                              );
                              return total > 0
                                ? ((hasCert / total) * 100).toFixed(1)
                                : 0;
                            })()}
                            %
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
