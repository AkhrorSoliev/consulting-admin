import { useEffect, useMemo, useRef, useState } from "react";
import {
  subscribeToCollections,
  subscribeToGlobalStats,
  ensureStatsDocAtLeast,
} from "../utils";
import { useUserRole } from "../hooks/useUserRole";
import { db } from "../firebase/config";
import { collection, onSnapshot, getDocs, query, orderBy } from "firebase/firestore";
import { FaFileExcel, FaUsers } from "react-icons/fa";
import toast from "react-hot-toast";
import { exportFullCandidatesToExcel } from "../utils/excelExport";
import StatsSection from "./StatsSection";


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
  const [exportingAllCandidates, setExportingAllCandidates] = useState(false);

  async function handleExportAllCandidates() {
    if (exportingAllCandidates) return;
    
    const names = (Array.isArray(collectionNames) ? collectionNames : [])
      .map((c) =>
        typeof c === "string"
          ? c
          : c.collectionName || c.slug || c.name || c.id || c.uuid || ""
      )
      .filter(Boolean);
    
    if (names.length === 0) {
      toast.error("Keine Berufsfelder gefunden.");
      return;
    }

    setExportingAllCandidates(true);
    toast("Alle Kandidaten werden geladen (aktiv + arxiv + gelöscht)...", { duration: 4000 });

    try {
      const allCandidates = [];
      
      // 1. Aktiv kandidatlar (barcha yo'nalishlardan)
      for (const colName of names) {
        try {
          const q = query(collection(db, colName), orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          snap.docs.forEach((d) => {
            allCandidates.push({
              id: d.id,
              major: colName,
              candidateType: "Aktiv",
              ...d.data(),
            });
          });
        } catch (err) {
          console.error(`Error loading ${colName}:`, err);
        }
      }

      // 2. Arxivlangan kandidatlar
      try {
        const archivedQuery = query(collection(db, "archived_users"), orderBy("archivedAt", "desc"));
        const archivedSnap = await getDocs(archivedQuery);
        archivedSnap.docs.forEach((d) => {
          const data = d.data();
          allCandidates.push({
            id: d.id,
            major: data.sourceMajor || data.major || "Archiviert",
            candidateType: "Archiviert",
            ...data,
          });
        });
      } catch (err) {
        console.error("Error loading archived_users:", err);
      }

      // 3. O'chirilgan kandidatlar
      try {
        const deletedQuery = query(collection(db, "deleted_users"), orderBy("deletedAt", "desc"));
        const deletedSnap = await getDocs(deletedQuery);
        deletedSnap.docs.forEach((d) => {
          const data = d.data();
          allCandidates.push({
            id: d.id,
            major: data.sourceMajor || data.major || "Gelöscht",
            candidateType: "Gelöscht",
            ...data,
          });
        });
      } catch (err) {
        console.error("Error loading deleted_users:", err);
      }

      if (allCandidates.length === 0) {
        toast.error("Keine Kandidaten gefunden.");
        return;
      }

      exportFullCandidatesToExcel(allCandidates, "Barcha_Kandidatlar");
      toast.success(`${allCandidates.length} kandidat eksport qilindi (aktiv + arxiv + o'chirilgan).`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error(err.message || "Fehler beim Exportieren.");
    } finally {
      setExportingAllCandidates(false);
    }
  }

  useEffect(() => {
    const unsub = subscribeToCollections((names) => {
      // Filter out soft-deleted directions
      const activeNames = (names || []).filter((n) => {
        if (typeof n === "string") return true;
        return !n?.isDeleted;
      });
      setCollectionNames(activeNames);
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
        regions: {
          byRegion: {},
          byRegionCert: {},
        },
      };

      // Helper function to process a single document
      const processDoc = (d, majorName) => {
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
            if (majorName) {
              stats.totals.byMajorLead[majorName] =
                stats.totals.byMajorLead[majorName] || {};
              stats.totals.byMajorLead[majorName][lk] =
                (stats.totals.byMajorLead[majorName][lk] || 0) + 1;
            }
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

        const regionRaw = d?.persoenlicheDaten?.geburtsort || "";
        const regionName = String(regionRaw).trim();
        if (regionName) {
          const rk = safeKey(regionName);
          if (rk) {
            if (!stats.regions.byRegion[rk]) {
              stats.regions.byRegion[rk] = 0;
            }
            stats.regions.byRegion[rk] += 1;

            if (!stats.regions.byRegionCert[rk]) {
              stats.regions.byRegionCert[rk] = { hasCert: 0, noCert: 0 };
            }
            if (hasCert) {
              stats.regions.byRegionCert[rk].hasCert += 1;
            } else {
              stats.regions.byRegionCert[rk].noCert += 1;
            }
          }
        }
      };

      // Process active major collections
      names.forEach((name) => {
        const safeName = String(name || "").trim();
        const docs = Array.isArray(docsByCollection?.[safeName])
          ? docsByCollection[safeName]
          : [];
        stats.totals.byMajor[safeName] = docs.length;
        stats.totals.candidates += docs.length;
        stats.totals.byMajorLead[safeName] =
          stats.totals.byMajorLead[safeName] || {};

        docs.forEach((d) => processDoc(d, safeName));
      });

      // Process archived_users (include in region stats but not in totals.candidates)
      const archivedDocs = Array.isArray(docsByCollection?.["__archived_users__"])
        ? docsByCollection["__archived_users__"]
        : [];
      archivedDocs.forEach((d) => processDoc(d, null));

      // Process deleted_users (include in region stats but not in totals.candidates)
      const deletedDocs = Array.isArray(docsByCollection?.["__deleted_users__"])
        ? docsByCollection["__deleted_users__"]
        : [];
      deletedDocs.forEach((d) => processDoc(d, null));

      return stats;
    };

    const docsByCollectionRef = { current: {} };
    const seen = new Set();
    // +2 for archived_users and deleted_users
    let pending = names.length + 2;

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

    // Subscribe to archived_users
    const unsubArchived = onSnapshot(
      collection(db, "archived_users"),
      (snap) => {
        docsByCollectionRef.current["__archived_users__"] = snap.docs.map(
          (d) => d.data() || {}
        );
        if (!seen.has("__archived_users__")) {
          seen.add("__archived_users__");
          pending -= 1;
        }
        onAnyUpdate();
      },
      (err) => {
        if (cancelled) return;
        // Don't fail completely if archived_users fails
        if (!seen.has("__archived_users__")) {
          seen.add("__archived_users__");
          pending -= 1;
        }
        onAnyUpdate();
      }
    );

    // Subscribe to deleted_users
    const unsubDeleted = onSnapshot(
      collection(db, "deleted_users"),
      (snap) => {
        docsByCollectionRef.current["__deleted_users__"] = snap.docs.map(
          (d) => d.data() || {}
        );
        if (!seen.has("__deleted_users__")) {
          seen.add("__deleted_users__");
          pending -= 1;
        }
        onAnyUpdate();
      },
      (err) => {
        if (cancelled) return;
        // Don't fail completely if deleted_users fails
        if (!seen.has("__deleted_users__")) {
          seen.add("__deleted_users__");
          pending -= 1;
        }
        onAnyUpdate();
      }
    );

    return () => {
      cancelled = true;
      unsubs.forEach((u) => {
        if (typeof u === "function") u();
      });
      if (typeof unsubArchived === "function") unsubArchived();
      if (typeof unsubDeleted === "function") unsubDeleted();
    };
  }, [collectionNames]);

  return (
    <div className="">
      <div className="mb-8">
        <div className="text-primary flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard & Statistiken</h1>
            <p className="text-base opacity-70">
              Live (aktuell) und Gesamt (historisch) Statistiken.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-success gap-2"
              onClick={handleExportAllCandidates}
              disabled={exportingAllCandidates || loading || collectionNames.length === 0}
              title="Alle Kandidaten im Excel-Format herunterladen"
            >
              {exportingAllCandidates ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <FaFileExcel className="w-4 h-4" />
              )}
              <span>Alle Kandidaten (Excel)</span>
            </button>
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
