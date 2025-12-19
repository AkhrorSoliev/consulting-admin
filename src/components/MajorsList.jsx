import { useEffect, useMemo, useState } from "react";
import { subscribeToCollections, deleteCollectionByName } from "../utils";
import { Link, useNavigate } from "react-router-dom";
import { FaLink, FaListUl, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import { useUserRole } from "../hooks/useUserRole";
import BerufsfeldMetaModal from "./BerufsfeldMetaModal";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "../firebase/config";

export default function MajorsList() {
  const [majors, setMajors] = useState([]);
  const [serverCounts, setServerCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState({});
  const navigate = useNavigate();
  const { role } = useUserRole();
  const isLimitedAdmin = useMemo(() => role === "limited_admin", [role]);
  const isDeleteDisabled = true; // temporarily disable deleting majors
  const [metaMajor, setMetaMajor] = useState(null);
  const isMetaOpen = Boolean(metaMajor);

  const getMajorCollectionName = (major) => {
    return String(
      major?.collectionName || major?.slug || major?.name || ""
    ).trim();
  };

  const resolveMajorCount = (major) => {
    const col = getMajorCollectionName(major);
    if (!col) return null;
    const val = serverCounts?.[col];
    if (val === undefined || val === null) return null;
    return Number(val) || 0;
  };

  const handleCopyLink = (major) => {
    const linkId =
      major?.linkId ||
      major?.uuid ||
      major?.id ||
      major?.collectionName ||
      major;
    const link = `https://admin.consultinguz.de/create?major=${linkId}`;
    // const link = `http://localhost:5173/create?major=${linkId}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        toast.success("Link in die Zwischenablage kopiert!");
      })
      .catch(() => {
        toast.error("Link konnte nicht kopiert werden");
      });
  };

  const handleDeleteMajor = async (major) => {
    if (isDeleteDisabled) {
      toast.error("Löschen von Berufsfeldern ist vorübergehend deaktiviert.");
      return;
    }
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Berufsfelder zu löschen.");
      return;
    }
    const label =
      major?.title || major?.collectionName || major?.name || String(major);
    const collectionName =
      major?.collectionName || major?.slug || major?.name || String(major);
    if (window.confirm(`Möchten Sie „${label}“ wirklich löschen?`)) {
      try {
        await deleteCollectionByName(collectionName);
        navigate(`/`);
      } catch (error) {}
    }
  };
  useEffect(() => {
    const unsub = subscribeToCollections((list) => {
      setMajors(Array.isArray(list) ? list : []);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchCounts = async () => {
      if (!Array.isArray(majors) || majors.length === 0) return;
      const cols = majors.map((m) => getMajorCollectionName(m)).filter(Boolean);
      if (cols.length === 0) return;

      // Mark loading for those not yet loaded
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
            // Avoid refetching if we already have it
            if (serverCounts?.[col] !== undefined)
              return [col, serverCounts[col]];
            try {
              const snap = await getCountFromServer(collection(db, col));
              return [col, snap.data().count || 0];
            } catch (e) {
              console.error("getCountFromServer failed for", col, e);
              return [col, null];
            }
          })
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
      } catch (e) {
        console.error("fallback count error", e);
      }
    };
    fetchCounts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [majors]);

  return (
    <div>
      <BerufsfeldMetaModal
        major={metaMajor}
        open={isMetaOpen}
        onClose={() => setMetaMajor(null)}
      />
      {majors.length === 0 ? (
        <div className="text-center opacity-70 py-8 text-sm">
          <p>Derzeit keine Berufsfelder vorhanden.</p>
          <p className="mt-1">
            Klicken Sie auf „Neues Berufsfeld“, um zu beginnen.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {majors.map((major) => {
            const title =
              major?.title ||
              major?.collectionName ||
              major?.slug ||
              major?.name ||
              String(major);
            const linkId =
              major?.linkId ||
              major?.uuid ||
              major?.id ||
              major?.collectionName ||
              major;
            const collectionName =
              major?.collectionName ||
              major?.slug ||
              major?.name ||
              major?.id ||
              major;
            const count = resolveMajorCount(major);
            const colNameForCount = getMajorCollectionName(major);
            const isCountLoading = Boolean(
              colNameForCount && loadingCounts?.[colNameForCount]
            );
            return (
              <li
                key={linkId}
                className="flex w-full items-center gap-2 rounded-lg border border-base-200 p-2 hover:bg-base-200/50 transition-colors"
              >
                {!isLimitedAdmin && (
                  <button
                    onClick={() => handleDeleteMajor(major)}
                    className="btn btn-sm btn-error btn-disabled"
                    disabled
                    aria-label={`„${title}“ löschen`}
                  >
                    <FaTrash />
                  </button>
                )}
                <button
                  onClick={() => handleCopyLink(major)}
                  className="btn btn-sm btn-neutral"
                  aria-label={`Link für „${title}“ kopieren`}
                >
                  <FaLink />
                </button>
                {!isLimitedAdmin && (
                  <button
                    type="button"
                    onClick={() => setMetaMajor(major)}
                    className="btn btn-sm btn-outline"
                    aria-label={`Zusätzliche Infos für „${title}“ öffnen`}
                    title="Zusätzliche Infos"
                  >
                    <FaListUl />
                  </button>
                )}
                <div className="indicator grow min-w-0">
                  <span
                    className="indicator-item indicator-top indicator-end badge badge-sm badge-primary pointer-events-none select-none -translate-x-[20%]"
                    aria-label={
                      isCountLoading
                        ? "Kandidaten werden geladen..."
                        : `Kandidaten: ${count ?? 0}`
                    }
                  >
                    {isCountLoading ? "…" : count ?? 0}
                  </span>
                  <Link
                    //  to={`/create?major=${major}`}
                    to={`collectionCv/${linkId}`}
                    className="btn btn-sm btn-outline-info justify-start overflow-hidden min-w-0 w-full pr-12"
                    title={title}
                  >
                    <span className="font-medium truncate">{title}</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
