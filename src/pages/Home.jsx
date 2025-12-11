import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { subscribeToCollections } from "../utils";
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

function Home() {
  const [collectionNames, setCollectionNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Stats
  const [perCollectionCounts, setPerCollectionCounts] = useState([]);
  const [ageBuckets, setAgeBuckets] = useState([]);
  const [levelCounts, setLevelCounts] = useState([]);
  const [topLanguages, setTopLanguages] = useState([]);
  const [avgAge, setAvgAge] = useState(null);
  
  // New Stats
  const [diplomaStats, setDiplomaStats] = useState({ has: 0, none: 0 });
  const [certStats, setCertStats] = useState({ has: 0, none: 0 });
  const [maritalStats, setMaritalStats] = useState({ single: 0, married: 0 });
  const [experienceBuckets, setExperienceBuckets] = useState([]);
  const [genderStats, setGenderStats] = useState({ male: 0, female: 0, unknown: 0 });

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

        // --- Age Calculation ---
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

        const ages = allDocs
          .map((d) => toAge(d?.persoenlicheDaten?.geburtsdatum))
          .filter((n) => typeof n === "number");

        const avg =
          ages.length > 0
            ? Math.round(
                (ages.reduce((sum, v) => sum + v, 0) / ages.length) * 10
              ) / 10
            : null;

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

        // --- Languages ---
        const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
        const levelMap = new Map(levels.map((l) => [l, 0]));
        const langMap = new Map();

        // --- New Metrics Containers ---
        let hasDiploma = 0;
        let noDiplomaCount = 0;
        let hasCert = 0;
        let noCertCount = 0;
        let single = 0;
        let married = 0;
        let male = 0;
        let female = 0;
        let unknownGender = 0;
        const expBuckets = { "0-1 Jahr": 0, "1-3 Jahre": 0, "3-5 Jahre": 0, "5+ Jahre": 0 };

        allDocs.forEach((d) => {
          // Languages
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

          // Attachments (Diploma/Certs)
          const att = d?.attachments || {};
          // Check diploma: explicit array or not marked as 'noDiploma'
          if (att.noDiploma) {
            noDiplomaCount++;
          } else if (Array.isArray(att.diplomas) && att.diplomas.length > 0) {
            hasDiploma++;
          } else {
            // If strictly neither, count as none for stats? Or if it was optional... 
            // Let's assume 'noDiploma' is the definitive flag, but if files exist, they have it.
            // If neither flag nor files, treat as 'Keine Info' or 'Nein' -> 'Nein' mostly.
            noDiplomaCount++;
          }

          if (att.noLanguageCertificate) {
            noCertCount++;
          } else if (Array.isArray(att.languageCertificates) && att.languageCertificates.length > 0) {
            hasCert++;
          } else {
            noCertCount++;
          }

          // Marital Status
          const mStatus = (d?.persoenlicheDaten?.familienstand || "").toLowerCase();
          if (mStatus.includes("ledig")) single++;
          else if (mStatus.includes("verheiratet")) married++;

          // Gender from stored value (prefer explicit field over heuristics)
          const genderValue = (
            d?.persoenlicheDaten?.geschlecht ||
            d?.geschlecht ||
            ""
          )
            .toString()
            .trim()
            .toLowerCase();

          if (["männlich", "maennlich", "m", "male"].includes(genderValue)) {
            male++;
          } else if (
            ["weiblich", "w", "female", "f"].includes(genderValue)
          ) {
            female++;
          } else {
            unknownGender++;
          }

          // Experience Calculation
          const expList = d?.berufserfahrung || [];
          let totalMonths = 0;
          expList.forEach(exp => {
             const start = new Date(exp.beginn);
             const end = exp.ende ? new Date(exp.ende) : new Date(); // If current job
             if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                // simple diff in months
                const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                if (months > 0) totalMonths += months;
             }
          });
          const years = totalMonths / 12;
          if (years <= 1) expBuckets["0-1 Jahr"]++;
          else if (years <= 3) expBuckets["1-3 Jahre"]++;
          else if (years <= 5) expBuckets["3-5 Jahre"]++;
          else expBuckets["5+ Jahre"]++;
        });

        // Format stats
        const levelData = levels.map((l) => ({
          level: l,
          count: levelMap.get(l) || 0,
        }));

        const languagesData = Array.from(langMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        
        const expData = Object.entries(expBuckets).map(([bucket, count]) => ({ bucket, count }));

        if (cancelled) return;
        setPerCollectionCounts(counts);
        setAgeBuckets(bucketsData);
        setLevelCounts(levelData);
        setTopLanguages(languagesData);
        setAvgAge(avg);
        
        setDiplomaStats({ has: hasDiploma, none: noDiplomaCount });
        setCertStats({ has: hasCert, none: noCertCount });
        setMaritalStats({ single, married });
        setGenderStats({ male, female, unknown: unknownGender });
        setExperienceBuckets(expData);

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
    "#6366F1", "#22C55E", "#EAB308", "#F97316", 
    "#EF4444", "#06B6D4", "#A855F7", "#84CC16",
  ];

  // --- Chart Data Memoization ---

  const perCollectionBarData = useMemo(() => ({
    labels: (perCollectionCounts || []).map((c) => c.name),
    datasets: [{
      label: "Nutzer",
      data: (perCollectionCounts || []).map((c) => c.count || 0),
      backgroundColor: "#6366F1",
      borderRadius: 6,
    }],
  }), [perCollectionCounts]);

  const ageBucketsBarData = useMemo(() => ({
    labels: (ageBuckets || []).map((b) => b.bucket),
    datasets: [{
      label: "Anzahl",
      data: (ageBuckets || []).map((b) => b.count || 0),
      backgroundColor: "#22C55E",
      borderRadius: 6,
    }],
  }), [ageBuckets]);

  const levelCountsBarData = useMemo(() => ({
    labels: (levelCounts || []).map((l) => l.level),
    datasets: [{
      label: "Anzahl",
      data: (levelCounts || []).map((l) => l.count || 0),
      backgroundColor: "#F59E0B",
      borderRadius: 6,
    }],
  }), [levelCounts]);

  const topLanguagesPieData = useMemo(() => ({
    labels: (topLanguages || []).map((l) => l.name),
    datasets: [{
      label: "Anzahl",
      data: (topLanguages || []).map((l) => l.count || 0),
      backgroundColor: (topLanguages || []).map((_, i) => COLORS[i % COLORS.length]),
      borderWidth: 1,
    }],
  }), [topLanguages, COLORS]);

  const diplomaDoughnutData = useMemo(() => ({
    labels: ["Mit Diplom", "Ohne Diplom"],
    datasets: [{
        data: [diplomaStats.has, diplomaStats.none],
        backgroundColor: ["#3B82F6", "#9CA3AF"],
        hoverOffset: 4
    }]
  }), [diplomaStats]);

  const certDoughnutData = useMemo(() => ({
    labels: ["Zertifikat vorhanden", "Kein Zertifikat"],
    datasets: [{
        data: [certStats.has, certStats.none],
        backgroundColor: ["#10B981", "#D1D5DB"],
        hoverOffset: 4
    }]
  }), [certStats]);

  const maritalPieData = useMemo(() => ({
    labels: ["Ledig", "Verheiratet"],
    datasets: [{
        data: [maritalStats.single, maritalStats.married],
        backgroundColor: ["#8B5CF6", "#EC4899"],
        hoverOffset: 4
    }]
  }), [maritalStats]);

  const genderPieData = useMemo(() => ({
    labels: ["Männlich", "Weiblich", "Unbekannt"],
    datasets: [{
        data: [genderStats.male, genderStats.female, genderStats.unknown],
        backgroundColor: ["#3B82F6", "#EC4899", "#9CA3AF"],
        hoverOffset: 4
    }]
  }), [genderStats]);

  const experienceBarData = useMemo(() => ({
    labels: experienceBuckets.map(b => b.bucket),
    datasets: [{
        label: "Nutzer",
        data: experienceBuckets.map(b => b.count),
        backgroundColor: "#0EA5E9",
        borderRadius: 6
    }]
  }), [experienceBuckets]);

  const defaultBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
  };

  return (
    <div className="p-4 md:p-6 bg-base-200/30 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard & Statistiken</h1>
        <p className="text-base opacity-70">
          Umfassende Analyse aller Bewerberdaten, Fähigkeiten und Qualifikationen.
        </p>
      </div>

      {loading ? (
        <div className="grid place-items-center py-32">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : error ? (
        <div role="alert" className="alert alert-error max-w-lg mx-auto">
          <span>{error}</span>
        </div>
      ) : totalUsers === 0 ? (
        <div className="text-center py-24 opacity-70">
            <h3 className="text-xl font-medium">Keine Daten verfügbar</h3>
            <p>Es wurden noch keine Bewerbungen eingereicht.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat bg-base-100 shadow rounded-box border border-base-200">
              <div className="stat-figure text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <div className="stat-title">Nutzer Gesamt</div>
              <div className="stat-value text-primary">{totalUsers}</div>
              <div className="stat-desc">Über alle Bereiche</div>
            </div>
            
            <div className="stat bg-base-100 shadow rounded-box border border-base-200">
              <div className="stat-figure text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              </div>
              <div className="stat-title">Sammlungen</div>
              <div className="stat-value text-secondary">{totalCollections}</div>
              <div className="stat-desc">Aktive Kategorien</div>
            </div>

            <div className="stat bg-base-100 shadow rounded-box border border-base-200">
              <div className="stat-figure text-accent">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div className="stat-title">Ø Alter</div>
              <div className="stat-value text-accent">{avgAge ?? "-"}</div>
              <div className="stat-desc">Jahre</div>
            </div>

            <div className="stat bg-base-100 shadow rounded-box border border-base-200">
               <div className="stat-figure text-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div className="stat-title">Mit Diplom</div>
              <div className="stat-value text-info">{diplomaStats.has}</div>
              <div className="stat-desc">({((diplomaStats.has / totalUsers) * 100).toFixed(0)}%)</div>
            </div>
          </div>

          {/* Row 1: Collection & Experience */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Verteilung nach Berufsfeld</h2>
                <div className="h-64 md:h-80">
                  <Bar data={perCollectionBarData} options={defaultBarOptions} />
                </div>
              </div>
            </div>
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Berufserfahrung (Jahre)</h2>
                <div className="h-64 md:h-80">
                  <Bar data={experienceBarData} options={defaultBarOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Demographics & Education */}
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

          {/* Row 3: Skills & Gender */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Geschlechterverteilung (geschätzt)</h2>
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
          
          {/* Row 4: Age & Language Levels */}
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
    </div>
  );
}

export default Home;
