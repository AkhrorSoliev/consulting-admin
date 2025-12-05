import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { subscribeToCollections } from "../utils";
import { Bar, Pie } from "react-chartjs-2";
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

function Home() {
  const [collectionNames, setCollectionNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [perCollectionCounts, setPerCollectionCounts] = useState([]);
  const [ageBuckets, setAgeBuckets] = useState([]);
  const [levelCounts, setLevelCounts] = useState([]);
  const [topLanguages, setTopLanguages] = useState([]);
  const [avgAge, setAvgAge] = useState(null);

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
    async function loadAll() {
      setLoading(true);
      setError("");
      try {
        // Fetch all docs from each collection listed in meta
        const allDocsByCollection = await Promise.all(
          (collectionNames || []).map(async (name) => {
            try {
              const snap = await getDocs(collection(db, name));
              const docs = snap.docs.map((d) => d.data() || {});
              return { name, docs };
            } catch (e) {
              return { name, docs: [] };
            }
          })
        );

        if (cancelled) return;

        // Per-collection counts
        const counts = allDocsByCollection.map((c) => ({
          name: c.name,
          count: c.docs.length,
        }));

        // Flatten all docs to aggregate stats
        const allDocs = allDocsByCollection.flatMap((c) => c.docs);

        // Age helpers
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
            if (
              mDiff < 0 ||
              (mDiff === 0 && today.getDate() < birth.getDate())
            ) {
              age--;
            }
            if (age < 1 || age > 120) return null;
            return age;
          } catch {
            return null;
          }
        };

        // Build age list
        const ages = allDocs
          .map((d) => toAge(d?.persoenlicheDaten?.geburtsdatum))
          .filter((n) => typeof n === "number");

        const avg =
          ages.length > 0
            ? Math.round(
                (ages.reduce((sum, v) => sum + v, 0) / ages.length) * 10
              ) / 10
            : null;

        // Age buckets
        const bucketDefs = [
          { label: "18-24", from: 18, to: 24 },
          { label: "25-34", from: 25, to: 34 },
          { label: "35-44", from: 35, to: 44 },
          { label: "45-54", from: 45, to: 54 },
          { label: "55+", from: 55, to: 200 },
        ];
        const bucketMap = new Map(bucketDefs.map((b) => [b.label, 0]));
        ages.forEach((age) => {
          const def =
            bucketDefs.find((b) => age >= b.from && age <= b.to) || null;
          if (def) {
            bucketMap.set(def.label, (bucketMap.get(def.label) || 0) + 1);
          }
        });
        const bucketsData = bucketDefs.map((b) => ({
          bucket: b.label,
          count: bucketMap.get(b.label) || 0,
        }));

        // Language level counts (A1..C2)
        const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
        const levelMap = new Map(levels.map((l) => [l, 0]));

        // Language popularity counts by name
        const langMap = new Map(); // name -> count

        allDocs.forEach((d) => {
          const sprachen = d?.faehigkeiten?.sprachen || {};
          Object.entries(sprachen).forEach(([langName, level]) => {
            const ln = String(langName || "").trim();
            if (ln) {
              langMap.set(ln, (langMap.get(ln) || 0) + 1);
            }
            const lv = String(level || "")
              .toUpperCase()
              .trim();
            if (levelMap.has(lv)) {
              levelMap.set(lv, (levelMap.get(lv) || 0) + 1);
            }
          });
        });

        const levelData = levels.map((l) => ({
          level: l,
          count: levelMap.get(l) || 0,
        }));

        const languagesData = Array.from(langMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        if (cancelled) return;
        setPerCollectionCounts(counts);
        setAgeBuckets(bucketsData);
        setLevelCounts(levelData);
        setTopLanguages(languagesData);
        setAvgAge(avg);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError("Fehler beim Laden der Daten.");
        setLoading(false);
      }
    }
    loadAll();
    return () => {
      cancelled = true;
    };
  }, [collectionNames]);

  const totalCollections = collectionNames.length;
  const totalUsers = useMemo(
    () => (perCollectionCounts || []).reduce((s, c) => s + (c.count || 0), 0),
    [perCollectionCounts]
  );

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

  // Build Chart.js datasets
  const perCollectionBarData = useMemo(() => {
    const labels = (perCollectionCounts || []).map((c) => c.name);
    const data = (perCollectionCounts || []).map((c) => c.count || 0);
    return {
      labels,
      datasets: [
        {
          label: "Anzahl",
          data,
          backgroundColor: "#6366F1",
          borderRadius: 6,
        },
      ],
    };
  }, [perCollectionCounts]);

  const ageBucketsBarData = useMemo(() => {
    const labels = (ageBuckets || []).map((b) => b.bucket);
    const data = (ageBuckets || []).map((b) => b.count || 0);
    return {
      labels,
      datasets: [
        {
          label: "Anzahl",
          data,
          backgroundColor: "#22C55E",
          borderRadius: 6,
        },
      ],
    };
  }, [ageBuckets]);

  const levelCountsBarData = useMemo(() => {
    const labels = (levelCounts || []).map((l) => l.level);
    const data = (levelCounts || []).map((l) => l.count || 0);
    return {
      labels,
      datasets: [
        {
          label: "Anzahl",
          data,
          backgroundColor: "#F59E0B",
          borderRadius: 6,
        },
      ],
    };
  }, [levelCounts]);

  const topLanguagesPieData = useMemo(() => {
    const labels = (topLanguages || []).map((l) => l.name);
    const data = (topLanguages || []).map((l) => l.count || 0);
    return {
      labels,
      datasets: [
        {
          label: "Anzahl",
          data,
          backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
          borderWidth: 1,
        },
      ],
    };
  }, [topLanguages]);

  const defaultBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" }, title: { display: false } },
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Statistiken</h1>
        <p className="text-sm opacity-70">
          Statistiken basierend auf allen Sammlungen und Nutzern.
        </p>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : error ? (
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : totalUsers === 0 ? (
        <div className="grid place-items-center py-24">
          <div className="text-center opacity-80">
            <p className="text-lg font-medium">
              Derzeit keine Daten vorhanden.
            </p>
            <p className="text-sm">
              Sobald Daten hinzugefügt werden, erscheinen hier die Statistiken.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card bg-base-100 border border-base-300/60">
              <div className="card-body">
                <p className="text-sm opacity-70">Gesamtzahl der Sammlungen</p>
                <p className="text-2xl font-bold">{totalCollections}</p>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-300/60">
              <div className="card-body">
                <p className="text-sm opacity-70">Gesamtzahl der Nutzer</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-300/60">
              <div className="card-body">
                <p className="text-sm opacity-70">Durchschnittsalter</p>
                <p className="text-2xl font-bold">{avgAge ?? "-"}</p>
              </div>
            </div>
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Per-collection counts */}
            <div className="card bg-base-100 border border-base-300/60">
              <div className="card-body">
                <h2 className="card-title text-lg">Nutzer pro Sammlung</h2>
                <div className="w-full h-72">
                  <Bar
                    data={perCollectionBarData}
                    options={defaultBarOptions}
                  />
                </div>
              </div>
            </div>

            {/* Age buckets */}
            <div className="card bg-base-100 border border-base-300/60">
              <div className="card-body">
                <h2 className="card-title text-lg">Altersverteilung</h2>
                <div className="w-full h-72">
                  <Bar data={ageBucketsBarData} options={defaultBarOptions} />
                </div>
              </div>
            </div>

            {/* Language levels */}
            <div className="card bg-base-100 border border-base-300/60">
              <div className="card-body">
                <h2 className="card-title text-lg">Sprachniveaus (A1–C2)</h2>
                <div className="w-full h-72">
                  <Bar data={levelCountsBarData} options={defaultBarOptions} />
                </div>
              </div>
            </div>

            {/* Top languages */}
            <div className="card bg-base-100 border border-base-300/60">
              <div className="card-body">
                <h2 className="card-title text-lg">
                  Häufigste Sprachen (Top 10)
                </h2>
                <div className="w-full h-72">
                  <Pie data={topLanguagesPieData} options={pieOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
