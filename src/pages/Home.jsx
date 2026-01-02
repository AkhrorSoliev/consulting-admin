import { useEffect, useMemo, useRef, useState } from "react";
import {
  subscribeToCollections,
  subscribeToGlobalStats,
  ensureStatsDocAtLeast,
} from "../utils";
import { useUserRole } from "../hooks/useUserRole";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
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

function StatsSection({ title, subtitle, statsDoc, collectionNames, kind }) {
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
        </div>
      )}
    </section>
  );
}

function Home() {
  const [collectionNames, setCollectionNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [liveStats, setLiveStats] = useState(null);
  const [allTimeStats, setAllTimeStats] = useState(null);
  const [statsError, setStatsError] = useState("");
  const { role } = useUserRole();
  const canInitAllTime = role === "admin" || role === "super_admin";
  const ensureTimerRef = useRef(null);
  const ensureInFlightRef = useRef(false);

  useEffect(() => {
    const unsub = subscribeToCollections((names) => {
      setCollectionNames(names || []);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatsError("");
    const unsub = subscribeToGlobalStats((data, err) => {
      if (cancelled) return;
      if (err) {
        setStatsError("Fehler beim Laden der Statistik.");
        setAllTimeStats(null);
        return;
      }
      setAllTimeStats(data);
    });
    return () => {
      cancelled = true;
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // Auto-Initialisierung / Auto-Reparatur ALL-TIME (kein Button).
  // Regeln:
  // - ALL-TIME darf NIEMALS unter LIVE liegen.
  // - Wir erhöhen nur `stats/global` Felder, die kleiner als LIVE sind (monoton).
  useEffect(() => {
    if (!canInitAllTime) return;
    if (!liveStats) return;

    // Transaktions-Spam vermeiden: nur versuchen, wenn ALL-TIME fehlt oder Summen dahinter liegen.
    const liveTotal = Number(liveStats?.totals?.candidates || 0);
    const allTotal = allTimeStats
      ? Number(allTimeStats?.totals?.candidates || 0)
      : null;
    const shouldFix = allTotal === null || allTotal < liveTotal;
    if (!shouldFix) return;

    // Debounce / Throttle: eine Reparatur kurz nach LIVE-Stabilisierung einplanen
    if (ensureInFlightRef.current) return;
    if (ensureTimerRef.current) window.clearTimeout(ensureTimerRef.current);
    ensureTimerRef.current = window.setTimeout(async () => {
      try {
        ensureInFlightRef.current = true;
        await ensureStatsDocAtLeast("global", liveStats);
      } catch (e) {
      } finally {
        ensureInFlightRef.current = false;
      }
    }, 600);
  }, [canInitAllTime, liveStats, allTimeStats]);

  useEffect(() => {
    return () => {
      if (ensureTimerRef.current) window.clearTimeout(ensureTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const names = (Array.isArray(collectionNames) ? collectionNames : [])
      .map((c) =>
        typeof c === "string"
          ? c
          : c.collectionName || c.slug || c.name || c.id || c.uuid || ""
      )
      .filter(Boolean);
    if (names.length === 0) {
      setLiveStats(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    // ---- Hilfsfunktionen (gleiche Logik wie zuvor) ----
    const toAge = (ddmmyyyy) => {
      try {
        if (!ddmmyyyy || typeof ddmmyyyy !== "string") return null;
        const m = ddmmyyyy.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (!m) return null;
        const [, dd, mm, yyyy] = m;
        const birth = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
        if (Number.isNaN(birth.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const mDiff = today.getMonth() - birth.getMonth();
        if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        if (age < 1 || age > 120) return null;
        return age;
      } catch {
        return null;
      }
    };

    const ageBucket = (age) => {
      if (age >= 18 && age <= 24) return "18-24";
      if (age >= 25 && age <= 34) return "25-34";
      if (age >= 35 && age <= 44) return "35-44";
      if (age >= 45 && age <= 54) return "45-54";
      if (age >= 55) return "55+";
      return null;
    };

    const normalizeGender = (val) => {
      const g = String(val || "")
        .trim()
        .toLowerCase();
      if (["männlich", "maennlich", "m", "male"].includes(g)) return "male";
      if (["weiblich", "w", "female", "f"].includes(g)) return "female";
      return "unknown";
    };

    const normalizeMarital = (val) => {
      const s = String(val || "")
        .trim()
        .toLowerCase();
      if (!s) return "unknown";
      if (s.includes("ledig")) return "single";
      if (s.includes("verheiratet")) return "married";
      return "other";
    };

    const normalizeLevel = (val) => {
      const lv = String(val || "")
        .trim()
        .toUpperCase();
      const allowed = ["A1", "A2", "B1", "B2", "C1", "C2"];
      return allowed.includes(lv) ? lv : "UNKNOWN";
    };

    const parseMonth = (raw) => {
      const s = String(raw || "").trim();
      if (!s) return null;
      if (s.toLowerCase() === "bis heute") return null;
      let m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (m) return new Date(Number(m[3]), Number(m[2]) - 1, 1);
      m = s.match(/^(\d{2})\.(\d{4})$/);
      if (m) return new Date(Number(m[2]), Number(m[1]) - 1, 1);
      m = s.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
      if (m) return new Date(Number(m[1]), Number(m[2]) - 1, 1);
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const expBucket = (payload) => {
      const exp = Array.isArray(payload?.berufserfahrung)
        ? payload.berufserfahrung
        : [];
      if (exp.length === 0) return "0-1 Jahr";
      let totalMonths = 0;
      exp.forEach((e) => {
        const start = parseMonth(e?.beginn);
        const end =
          String(e?.ende || "")
            .trim()
            .toLowerCase() === "bis heute"
            ? new Date()
            : parseMonth(e?.ende);
        if (!start) return;
        const endD = end || new Date();
        const months =
          (endD.getFullYear() - start.getFullYear()) * 12 +
          (endD.getMonth() - start.getMonth());
        if (months > 0) totalMonths += months;
      });
      const years = totalMonths / 12;
      if (years <= 1) return "0-1 Jahr";
      if (years <= 3) return "1-3 Jahre";
      if (years <= 5) return "3-5 Jahre";
      return "5+ Jahre";
    };

    const extractDiplomas = (payload) => {
      const att = payload?.attachments || {};
      const docs = payload?.documents || {};
      const dok = payload?.dokumente || {};
      if (Array.isArray(att?.diplomas)) return att.diplomas;
      if (Array.isArray(docs?.diplomas)) return docs.diplomas;
      if (Array.isArray(dok?.diplome)) return dok.diplome;
      return [];
    };

    const extractCerts = (payload) => {
      const att = payload?.attachments || {};
      const docs = payload?.documents || {};
      const dok = payload?.dokumente || {};
      if (Array.isArray(att?.languageCertificates))
        return att.languageCertificates;
      if (Array.isArray(docs?.certificates)) return docs.certificates;
      if (Array.isArray(dok?.zertifikate)) return dok.zertifikate;
      return [];
    };

    const extractCertDetails = (payload) => {
      const att = payload?.attachments || {};
      const docs = payload?.documents || {};
      if (Array.isArray(att?.languageCertificatesDetailed))
        return att.languageCertificatesDetailed;
      if (Array.isArray(docs?.certificatesDetailed))
        return docs.certificatesDetailed;
      if (Array.isArray(payload?.languageCertificatesDetailed))
        return payload.languageCertificatesDetailed;
      return [];
    };

    const noLangCertFlag = (payload) =>
      Boolean(payload?.attachments?.noLanguageCertificate);

    const buildStatsFromDocsByCollection = (docsByCollection) => {
      const stats = {
        totals: {
          candidates: 0,
          directions: names.length,
          byMajor: {},
          byLead: {},
          byMajorLead: {},
        },
        demographics: {
          gender: { male: 0, female: 0, unknown: 0 },
          ageBuckets: {
            "18-24": 0,
            "25-34": 0,
            "35-44": 0,
            "45-54": 0,
            "55+": 0,
          },
          age: { count: 0, sum: 0, unknown: 0 },
          marital: { single: 0, married: 0, other: 0, unknown: 0 },
        },
        career: {
          experienceBuckets: {
            "0-1 Jahr": 0,
            "1-3 Jahre": 0,
            "3-5 Jahre": 0,
            "5+ Jahre": 0,
          },
        },
        attachments: {
          diplomas: { candidates: { has: 0, none: 0 } },
          languageCertificates: { candidates: { has: 0, none: 0 }, byType: {} },
        },
        skills: {
          languages: { counts: {} },
          languageLevels: {
            A1: 0,
            A2: 0,
            B1: 0,
            B2: 0,
            C1: 0,
            C2: 0,
            UNKNOWN: 0,
          },
        },
      };

      names.forEach((name) => {
        const safeName = String(name || "").trim();
        const docs = Array.isArray(docsByCollection?.[safeName])
          ? docsByCollection[safeName]
          : [];
        stats.totals.byMajor[safeName] = docs.length;
        stats.totals.candidates += docs.length;
        stats.totals.byMajorLead[safeName] =
          stats.totals.byMajorLead[safeName] || {};

        docs.forEach((d) => {
          const safeKey = (input) =>
            String(input ?? "")
              .trim()
              .replace(/[./[\]#?$\\]/g, "_")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 80);

          const leadRaw =
            d?.lead ?? d?.tracking?.lead ?? d?.meta?.lead ?? d?.source?.lead;
          const leadName = String(leadRaw || "").trim();
          if (leadName) {
            const lk = safeKey(leadName);
            if (lk) {
              stats.totals.byLead[lk] = (stats.totals.byLead[lk] || 0) + 1;
              stats.totals.byMajorLead[safeName][lk] =
                (stats.totals.byMajorLead[safeName][lk] || 0) + 1;
            }
          }

          const gender = normalizeGender(d?.persoenlicheDaten?.geschlecht);
          stats.demographics.gender[gender] += 1;

          const age = toAge(d?.persoenlicheDaten?.geburtsdatum);
          if (typeof age === "number") {
            const b = ageBucket(age);
            if (b) stats.demographics.ageBuckets[b] += 1;
            stats.demographics.age.count += 1;
            stats.demographics.age.sum += age;
          } else {
            stats.demographics.age.unknown += 1;
          }

          const m = normalizeMarital(d?.persoenlicheDaten?.familienstand);
          stats.demographics.marital[m] += 1;

          const eb = expBucket(d);
          stats.career.experienceBuckets[eb] += 1;

          const diplomas = extractDiplomas(d);
          if (diplomas.length > 0)
            stats.attachments.diplomas.candidates.has += 1;
          else stats.attachments.diplomas.candidates.none += 1;

          const certs = extractCerts(d);
          const hasCert = !noLangCertFlag(d) && certs.length > 0;
          if (hasCert)
            stats.attachments.languageCertificates.candidates.has += 1;
          else stats.attachments.languageCertificates.candidates.none += 1;

          if (hasCert) {
            const detailed = extractCertDetails(d);
            if (Array.isArray(detailed) && detailed.length > 0) {
              detailed.forEach((row) => {
                const url = String(row?.url || "").trim();
                const type = String(row?.type || "").trim();
                if (!url || !type) return;
                const k = safeKey(type);
                stats.attachments.languageCertificates.byType[k] =
                  (stats.attachments.languageCertificates.byType[k] || 0) + 1;
              });
            }
          }

          const sprachen = d?.faehigkeiten?.sprachen || {};
          if (sprachen && typeof sprachen === "object") {
            Object.entries(sprachen).forEach(([langName, level]) => {
              const ln = safeKey(langName);
              if (ln) {
                stats.skills.languages.counts[ln] =
                  (stats.skills.languages.counts[ln] || 0) + 1;
              }
              const lv = normalizeLevel(level);
              stats.skills.languageLevels[lv] += 1;
            });
          }
        });
      });

      return stats;
    };

    const docsByCollectionRef = { current: {} };
    const seen = new Set();
    let pending = names.length;

    const onAnyUpdate = () => {
      if (cancelled) return;
      const stats = buildStatsFromDocsByCollection(docsByCollectionRef.current);
      setLiveStats(stats);
      if (pending <= 0) setLoading(false);
    };

    const unsubs = names.map((name) => {
      const colName = String(name || "").trim();
      return onSnapshot(
        collection(db, colName),
        (snap) => {
          docsByCollectionRef.current[colName] = snap.docs.map(
            (d) => d.data() || {}
          );
          if (!seen.has(colName)) {
            seen.add(colName);
            pending -= 1;
          }
          onAnyUpdate();
        },
        (err) => {
          if (cancelled) return;
          setError("Fehler beim Laden der Live-Daten.");
          setLoading(false);
        }
      );
    });

    return () => {
      cancelled = true;
      unsubs.forEach((u) => {
        if (typeof u === "function") u();
      });
    };
  }, [collectionNames]);

  return (
    <div className="">
      <div className="mb-8">
        <div className="text-white flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard & Statistiken</h1>
            <p className="text-base opacity-70">
              Live (aktuell) und Gesamt (historisch) Statistiken.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-32">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : error || statsError ? (
        <div role="alert" className="alert alert-error max-w-lg mx-auto">
          <span>{error || statsError}</span>
        </div>
      ) : !liveStats && !allTimeStats ? (
        <div className="text-center py-24 opacity-70">
          <h3 className="text-xl font-medium">Keine Statistiken gefunden</h3>
          <p className="mt-2">
            Statistikdokumente wurden noch nicht erstellt. Sie werden
            automatisch erstellt, wenn neue Kandidaten hinzugefügt werden.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="collapse collapse-arrow bg-base-100 shadow border border-base-200">
            <input type="checkbox" defaultChecked={true} />
            <div className="collapse-title text-xl font-semibold">
              Aktuelle Statistik (LIVE)
              <div className="text-sm font-normal opacity-70 mt-1">
                Aktueller Datenbankstand. Wird bei Löschung reduziert.
              </div>
            </div>
            <div className="collapse-content">
              <div className="pt-2">
                {!liveStats ? (
                  <div className="text-center py-10 opacity-70">
                    <h3 className="text-xl font-medium">
                      Keine Live-Statistik verfügbar
                    </h3>
                    <p className="mt-2">
                      Keine Daten nach Berufsfeldern gefunden.
                    </p>
                  </div>
                ) : (
                  <StatsSection
                    title=""
                    subtitle=""
                    statsDoc={liveStats}
                    collectionNames={collectionNames}
                    kind="live"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="collapse collapse-arrow bg-base-100 shadow border border-base-200">
            <input type="checkbox" defaultChecked={false} />
            <div className="collapse-title text-xl font-semibold">
              Gesamtstatistik (HISTORISCH)
              <div className="text-sm font-normal opacity-70 mt-1">
                Historisch gesammelt. Wird bei Löschung nicht reduziert.
              </div>
            </div>
            <div className="collapse-content">
              <div className="pt-2">
                {!allTimeStats ? (
                  <div className="text-center py-10 opacity-70">
                    <h3 className="text-xl font-medium">
                      Keine Gesamtstatistik verfügbar (stats/global)
                    </h3>
                    <p className="mt-2">
                      Wird automatisch erstellt, wenn neue Kandidaten
                      hinzugefügt werden.
                    </p>
                  </div>
                ) : (
                  <StatsSection
                    title=""
                    subtitle=""
                    statsDoc={allTimeStats}
                    collectionNames={collectionNames}
                    kind="allTime"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
