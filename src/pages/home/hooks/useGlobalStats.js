import { useEffect, useRef, useState } from "react";
import {
  subscribeToGlobalStats,
  ensureStatsDocAtLeast,
} from "../../../utils";

export function useGlobalStats({ canInitAllTime, liveStats }) {
  const [allTimeStats, setAllTimeStats] = useState(null);
  const [statsError, setStatsError] = useState("");
  const ensureTimerRef = useRef(null);
  const ensureInFlightRef = useRef(false);

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

  // Auto-repair ALL-TIME stats when they fall behind LIVE
  useEffect(() => {
    if (!canInitAllTime) return;
    if (!liveStats) return;

    const liveTotal = Number(liveStats?.totals?.candidates || 0);
    const allTotal = allTimeStats
      ? Number(allTimeStats?.totals?.candidates || 0)
      : null;
    const shouldFix = allTotal === null || allTotal < liveTotal;
    if (!shouldFix) return;

    if (ensureInFlightRef.current) return;
    if (ensureTimerRef.current) window.clearTimeout(ensureTimerRef.current);
    ensureTimerRef.current = window.setTimeout(async () => {
      try {
        ensureInFlightRef.current = true;
        await ensureStatsDocAtLeast("global", liveStats);
      } catch (e) {
        // silently ignore
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

  return { allTimeStats, statsError };
}
