import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../../firebase/config";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import toast from "react-hot-toast";
import { getMetaByName } from "../../../utils";
import { CV_INDEX_ITEMS, CV_INDEX_ROOT } from "../../../constants/cvIndex";
import { toDateFromMetaCreatedAt } from "../utils";
import { mapCandidate, mapIndexedCandidate } from "../mapCandidate";

export function useCollectionData() {
  const { major } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metaInfo, setMetaInfo] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [resolvingMajor, setResolvingMajor] = useState(true);
  const [resolvedMajor, setResolvedMajor] = useState({
    collectionName: "",
    title: "",
    linkId: "",
  });

  const title = useMemo(() => {
    const n = String(resolvedMajor?.title || "").trim();
    return n || "\u2014";
  }, [resolvedMajor]);

  const majorCreatedAtLabel = useMemo(() => {
    const d = toDateFromMetaCreatedAt(metaInfo?.createdAt);
    if (!d) return "\u2014";
    try {
      return new Intl.DateTimeFormat("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Tashkent",
      }).format(d);
    } catch {
      return d.toLocaleString();
    }
  }, [metaInfo]);

  const majorCreatedByLabel = useMemo(() => {
    const v = String(metaInfo?.createdBy || "").trim();
    return v || "System";
  }, [metaInfo]);

  // Resolve major from URL param
  useEffect(() => {
    const key = String(major || "").trim();
    let cancelled = false;
    setResolvingMajor(true);
    setMetaLoading(true);
    (async () => {
      try {
        if (!key) {
          setResolvedMajor({ collectionName: "", title: "", linkId: "" });
          setMetaInfo(null);
          setLoading(false);
          return;
        }
        const meta = await getMetaByName(key);
        if (cancelled) return;
        if (meta) {
          setResolvedMajor({
            collectionName: meta.collectionName || meta.slug || meta.name || key,
            title: meta.title || meta.collectionName || key,
            linkId: meta.linkId || meta.uuid || meta.id || key,
          });
          setMetaInfo(meta);
        } else {
          setResolvedMajor({ collectionName: key, title: key, linkId: key });
          setMetaInfo(null);
        }
      } catch (e) {
        if (!cancelled) {
          setResolvedMajor({ collectionName: key, title: key, linkId: key });
          setMetaInfo(null);
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
        if (!cancelled) setResolvingMajor(false);
      }
    })();
    return () => { cancelled = true; };
  }, [major]);

  // Subscribe to Firestore collection
  useEffect(() => {
    const name = String(resolvedMajor?.collectionName || "").trim();
    if (!name) {
      if (!metaLoading && !resolvingMajor) {
        toast.error("Name des Berufsfelds nicht gefunden.");
        setLoading(false);
      }
      return undefined;
    }

    // Read the lightweight cv_index projection (~400 bytes/candidate) instead of the
    // full CV documents (~10-30 KB each). Falls back to the source collection when the
    // projection is not populated yet, so client and backend can deploy in any order.
    let cancelled = false;
    let unsubIndex = null;
    let unsubSource = null;

    function subscribeToSource() {
      if (cancelled || unsubSource) return;
      unsubSource = onSnapshot(
        query(collection(db, name), orderBy("createdAt", "desc")),
        (snap) => {
          setItems(snap.docs.map((d) => mapCandidate(d)));
          setLoading(false);
        },
        () => {
          toast.error("Fehler beim Laden der Daten.");
          setLoading(false);
        },
      );
    }

    unsubIndex = onSnapshot(
      query(
        collection(db, CV_INDEX_ROOT, name, CV_INDEX_ITEMS),
        orderBy("createdAt", "desc"),
      ),
      (snap) => {
        if (snap.empty) {
          // Not backfilled (or genuinely empty) — let the source collection decide.
          unsubIndex?.();
          unsubIndex = null;
          subscribeToSource();
          return;
        }
        setItems(snap.docs.map((d) => mapIndexedCandidate(d)));
        setLoading(false);
      },
      () => {
        unsubIndex = null;
        subscribeToSource();
      },
    );

    return () => {
      cancelled = true;
      unsubIndex?.();
      unsubSource?.();
    };
  }, [resolvedMajor.collectionName, metaLoading, resolvingMajor]);

  const statistics = useMemo(() => {
    if (!items.length) return null;
    const total = items.length;
    const withEmail = items.filter((item) => (item.emailSentCount || 0) > 0).length;
    const withoutEmail = total - withEmail;
    const withComment = items.filter((item) => item.hasComment).length;
    const withoutComment = total - withComment;
    return { total, withEmail, withoutEmail, withComment, withoutComment };
  }, [items]);

  const leadStats = useMemo(() => {
    const byLead = {};
    let telegramCount = 0;
    items.forEach((item) => {
      const lead = String(item?.lead || "").trim();
      if (lead) byLead[lead] = (byLead[lead] || 0) + 1;
      if (item?.telegramId) telegramCount++;
    });
    const leadList = Object.entries(byLead)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    return { leadList, telegramCount, total: items.length };
  }, [items]);

  return {
    major,
    items,
    loading,
    metaInfo,
    metaLoading,
    resolvedMajor,
    title,
    majorCreatedAtLabel,
    majorCreatedByLabel,
    statistics,
    leadStats,
  };
}
