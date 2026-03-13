import { useEffect, useState } from "react";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "../../firebase/config";
import { getMajorCollectionName } from "./majorUtils";

export default function useMajorCounts(majors) {
  const [serverCounts, setServerCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState({});

  useEffect(() => {
    let cancelled = false;
    const fetchCounts = async () => {
      if (!Array.isArray(majors) || majors.length === 0) return;
      const cols = majors.map((m) => getMajorCollectionName(m)).filter(Boolean);
      if (cols.length === 0) return;

      setLoadingCounts((prev) => {
        const next = { ...(prev || {}) };
        cols.forEach((col) => {
          if (serverCounts?.[col] === undefined) next[col] = true;
        });
        return next;
      });

      try {
        const entries = await Promise.all(
          cols.map(async (col) => {
            if (serverCounts?.[col] !== undefined)
              return [col, serverCounts[col]];
            try {
              const snap = await getCountFromServer(collection(db, col));
              return [col, snap.data().count || 0];
            } catch (e) {
              return [col, null];
            }
          }),
        );
        if (cancelled) return;
        const next = { ...(serverCounts || {}) };
        entries.forEach((kv) => {
          if (!kv) return;
          const [col, cnt] = kv;
          if (cnt === null) return;
          next[col] = Number(cnt) || 0;
        });
        setServerCounts(next);
        setLoadingCounts((prev) => {
          const out = { ...(prev || {}) };
          cols.forEach((c) => {
            delete out[c];
          });
          return out;
        });
      } catch (e) {}
    };
    fetchCounts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [majors]);

  return { serverCounts, loadingCounts };
}
