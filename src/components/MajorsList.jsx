import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  subscribeToCollections,
  updateMetaByName,
  deleteCollectionByName,
} from "../utils";
import { Link } from "react-router-dom";
import {
  FaCog,
  FaRegCopy,
  FaTrash,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useUserRole } from "../hooks/useUserRole";
import {
  collection,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../firebase/config";
import LinkCopyModal from "./LinkCopyModal";
import MajorSettingsModal from "./MajorSettingsModal";
import { buildCreateLink } from "./majorsHelpers";

// User-specific major visibility restrictions
// Format: { [userId]: [majorId1, majorId2, ...] }
const HIDDEN_MAJORS_BY_USER = {
  HRE9Dtf8g3WXXGB3a9nctZ9dz3b2: ["92790303-f374-44ff-9382-5e6ba2a06eec"],
  R5edmWfoBoOcQGZVAb2giFDCqJk1: ["92790303-f374-44ff-9382-5e6ba2a06eec"],
};

export default function MajorsList() {
  const [majors, setMajors] = useState([]);
  const [serverCounts, setServerCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState({});
  const [togglingMajorId, setTogglingMajorId] = useState("");
  const [settingsMajor, setSettingsMajor] = useState(null); // { major, key }
  const [linkCopyModal, setLinkCopyModal] = useState({
    open: false,
    major: null,
  });
  const [deleteMajorModal, setDeleteMajorModal] = useState({
    open: false,
    major: null,
    deleting: false,
  });
  const { user } = useSelector((state) => state.auth);
  const { role } = useUserRole();
  const isLimitedAdmin = useMemo(() => role === "limited_admin", [role]);

  // Filter out hidden majors for specific users
  const hiddenMajorIds = useMemo(() => {
    const uid = user?.uid || "";
    return HIDDEN_MAJORS_BY_USER[uid] || [];
  }, [user?.uid]);

  const filteredMajors = useMemo(() => {
    if (hiddenMajorIds.length === 0) return majors;
    return majors.filter((major) => {
      const majorId = major?.id || major?.uuid || major?.linkId || "";
      return !hiddenMajorIds.includes(majorId);
    });
  }, [majors, hiddenMajorIds]);
  const isSettingsOpen = Boolean(settingsMajor);

  const getMajorCollectionName = (major) => {
    return String(
      major?.collectionName || major?.slug || major?.name || "",
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
    if (major?.linkActive === false) {
      toast.error("Create-Link ist derzeit AUS. Bitte zuerst einschalten.");
      return;
    }
    const link = buildCreateLink(major);
    if (!link) {
      toast.error(
        "Link konnte nicht erstellt werden (Berufsfeld nicht erkannt).",
      );
      return;
    }
    setLinkCopyModal({ open: true, major });
  };

  const handleDeleteMajor = async () => {
    const major = deleteMajorModal?.major;
    if (!major) return;
    const key = resolveMajorKey(major);
    if (!key) {
      toast.error("Berufsfeld konnte nicht identifiziert werden.");
      return;
    }
    setDeleteMajorModal((prev) => ({ ...prev, deleting: true }));
    try {
      await deleteCollectionByName(key, { deleteCandidates: true });
      setDeleteMajorModal({ open: false, major: null, deleting: false });
    } catch (e) {
      toast.error("Fehler beim Löschen des Berufsfelds.");
      setDeleteMajorModal((prev) => ({ ...prev, deleting: false }));
    }
  };

  const resolveMajorKey = (major) => {
    if (!major) return "";
    if (typeof major === "string") return major;
    return String(
      major.id ||
        major.uuid ||
        major.linkId ||
        major.collectionName ||
        major.slug ||
        major.name ||
        "",
    ).trim();
  };

  const handleToggleCreateLink = async (major, nextChecked) => {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, dies zu ändern.");
      return;
    }
    const key = resolveMajorKey(major);
    if (!key) {
      toast.error("Berufsfeld konnte nicht identifiziert werden.");
      return;
    }
    setTogglingMajorId(key);
    // Optimistic UI update
    setMajors((prev) =>
      (prev || []).map((m) => {
        const k = resolveMajorKey(m);
        if (k !== key) return m;
        return { ...(m || {}), linkActive: Boolean(nextChecked) };
      }),
    );
    try {
      await updateMetaByName(key, {
        linkActive: Boolean(nextChecked),
        updatedAt: Date.now(),
      });
      toast.success(nextChecked ? "Create-Link: ON" : "Create-Link: OFF");
    } catch (e) {
      // revert (snapshot will also fix, but we revert immediately)
      setMajors((prev) =>
        (prev || []).map((m) => {
          const k = resolveMajorKey(m);
          if (k !== key) return m;
          return { ...(m || {}), linkActive: !Boolean(nextChecked) };
        }),
      );
      toast.error("Fehler beim Ändern.");
    } finally {
      setTogglingMajorId("");
    }
  };
  useEffect(() => {
    const unsub = subscribeToCollections((list) => {
      setMajors(Array.isArray(list) ? list : []);
    });

    return () => unsub();
  }, []);

  const settingsMajorKey = settingsMajor?.key || "";
  const currentSettingsMajor = useMemo(() => {
    if (!settingsMajorKey) return settingsMajor?.major || null;
    const found = (majors || []).find(
      (m) => resolveMajorKey(m) === settingsMajorKey,
    );
    return found || settingsMajor?.major || null;
  }, [majors, settingsMajorKey, settingsMajor?.major]);

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

  return (
    <div>
      <LinkCopyModal
        open={linkCopyModal.open}
        onClose={() => setLinkCopyModal({ open: false, major: null })}
        regularLink={
          linkCopyModal.major ? buildCreateLink(linkCopyModal.major) : ""
        }
        majorCode={
          linkCopyModal.major
            ? linkCopyModal.major?.linkId ||
              linkCopyModal.major?.uuid ||
              linkCopyModal.major?.id ||
              linkCopyModal.major?.collectionName ||
              linkCopyModal.major
            : ""
        }
      />
      {/* Delete Major Confirmation Modal */}
      {deleteMajorModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-base-content/50"
            onClick={() => {
              if (!deleteMajorModal.deleting) {
                setDeleteMajorModal({
                  open: false,
                  major: null,
                  deleting: false,
                });
              }
            }}
          />
          <div className="relative bg-base-100 rounded-box shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-error mb-4">
              Yo'nalishni o'chirish
            </h3>
            <p className="text-sm mb-2">
              <span className="font-semibold">
                {deleteMajorModal.major?.title ||
                  deleteMajorModal.major?.collectionName ||
                  "Yo'nalish"}
              </span>{" "}
              yo'nalishini o'chirmoqchimisiz?
            </p>
            <p className="text-xs text-error mb-4">
              Diqqat: Bu yo'nalish va uning ichidagi barcha kandidatlar butunlay
              o'chiriladi! Bu amalni qaytarib bo'lmaydi.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() =>
                  setDeleteMajorModal({
                    open: false,
                    major: null,
                    deleting: false,
                  })
                }
                disabled={deleteMajorModal.deleting}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={handleDeleteMajor}
                disabled={deleteMajorModal.deleting}
              >
                {deleteMajorModal.deleting ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    O'chirilmoqda...
                  </>
                ) : (
                  "O'chirish"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {!isLimitedAdmin ? (
        <MajorSettingsModal
          open={isSettingsOpen}
          major={currentSettingsMajor}
          majorKey={settingsMajorKey}
          isTogglingLink={Boolean(
            settingsMajorKey && togglingMajorId === settingsMajorKey,
          )}
          onClose={() => setSettingsMajor(null)}
          onCopyLink={() => handleCopyLink(currentSettingsMajor)}
          onToggleLinkActive={(checked) =>
            handleToggleCreateLink(currentSettingsMajor, checked)
          }
        />
      ) : null}
      {filteredMajors.length === 0 ? (
        <div className="text-center opacity-70 py-8 text-sm">
          <p>Derzeit keine Berufsfelder vorhanden.</p>
          <p className="mt-1">
            Klicken Sie auf „Neues Berufsfeld“, um zu beginnen.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filteredMajors.map((major) => {
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
            const majorKey = resolveMajorKey(major);
            const count = resolveMajorCount(major);
            const colNameForCount = getMajorCollectionName(major);
            const isCountLoading = Boolean(
              colNameForCount && loadingCounts?.[colNameForCount],
            );
            return (
              <li
                key={linkId}
                className="flex w-full items-center gap-2 rounded-lg border border-base-200 p-2 hover:bg-base-200/50 transition-colors"
              >
                <div className="indicator grow min-w-0">
                  <span
                    className="indicator-item indicator-top indicator-end badge badge-sm badge-primary pointer-events-none select-none -translate-x-[20%]"
                    aria-label={
                      isCountLoading
                        ? "Kandidaten werden geladen..."
                        : `Kandidaten: ${count ?? 0}`
                    }
                  >
                    {isCountLoading ? "…" : (count ?? 0)}
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
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => handleCopyLink(major)}
                  aria-label="Asosiy linkni nusxalash"
                  title="Asosiy linkni copy qilish"
                >
                  <FaRegCopy />
                </button>
                {!isLimitedAdmin ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline btn-error"
                      onClick={() =>
                        setDeleteMajorModal({
                          open: true,
                          major,
                          deleting: false,
                        })
                      }
                      aria-label={`„${title}" yo'nalishini o'chirish`}
                      title="Yo'nalishni o'chirish"
                    >
                      <FaTrash />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => setSettingsMajor({ major, key: majorKey })}
                      aria-label={`Einstellungen für „${title}" öffnen`}
                      title="Einstellungen"
                    >
                      <FaCog />
                    </button>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
