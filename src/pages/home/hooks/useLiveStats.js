import { useEffect, useState } from "react";
import { db } from "../../../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import { buildStatsFromDocsByCollection } from "../utils/buildStats";

export function resolveNames(collectionNames) {
  return (Array.isArray(collectionNames) ? collectionNames : [])
    .map((c) =>
      typeof c === "string"
        ? c
        : c.collectionName || c.slug || c.name || c.id || c.uuid || ""
    )
    .filter(Boolean);
}

export function useLiveStats(collectionNames) {
  const [liveStats, setLiveStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const names = resolveNames(collectionNames);
    if (names.length === 0) {
      setLiveStats(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const docsByCollectionRef = { current: {} };
    const seen = new Set();
    let pending = names.length + 2;

    const onAnyUpdate = () => {
      if (cancelled) return;
      const stats = buildStatsFromDocsByCollection(
        docsByCollectionRef.current,
        names
      );
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
      () => {
        if (cancelled) return;
        if (!seen.has("__archived_users__")) {
          seen.add("__archived_users__");
          pending -= 1;
        }
        onAnyUpdate();
      }
    );

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
      () => {
        if (cancelled) return;
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

  return { liveStats, loading, error };
}
