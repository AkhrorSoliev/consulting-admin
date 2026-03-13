import { useEffect, useState } from "react";
import {
  subscribeToCollections,
  subscribeToMetaByName,
} from "../../../../utils";

/**
 * Resolves major from URL params via meta-info subscription,
 * and subscribes to collections/majors list in remote mode.
 */
export function useResolveMajor({
  major,
  remoteMode,
  setNotFound,
  setLoading,
}) {
  const [resolvedMajor, setResolvedMajor] = useState({
    collectionName: "",
    title: "",
    linkId: "",
  });
  const [metaInfo, setMetaInfo] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [majors, setMajors] = useState([]);

  // Resolve major from URL params (meta info subscription)
  useEffect(() => {
    const key = String(major || "").trim();
    if (!key) {
      setResolvedMajor({ collectionName: "", title: "", linkId: "" });
      setMetaInfo(null);
      setNotFound(true);
      setLoading(false);
      setMetaLoading(false);
      return () => {};
    }

    setMetaLoading(true);
    let gotFirst = false;
    const unsub = subscribeToMetaByName(
      key,
      (data) => {
        gotFirst = true;
        if (data) {
          setResolvedMajor({
            collectionName:
              data.collectionName || data.slug || data.name || key,
            title: data.title || data.collectionName || key,
            linkId: data.linkId || data.uuid || data.id || key,
          });
          setMetaInfo(data || null);
        } else {
          setResolvedMajor({
            collectionName: key,
            title: key,
            linkId: key,
          });
          setMetaInfo(null);
        }
        setMetaLoading(false);
      },
      (e) => {
        if (!gotFirst) {
          setResolvedMajor({
            collectionName: key,
            title: key,
            linkId: key,
          });
          setMetaInfo(null);
          setMetaLoading(false);
        }
      },
    );

    return () => unsub?.();
  }, [major]);

  // Subscribe to collections/majors (remote mode only)
  useEffect(() => {
    if (!remoteMode) return undefined;
    const unsub = subscribeToCollections((list) => {
      setMajors(Array.isArray(list) ? list : []);
    });
    return () => unsub?.();
  }, [remoteMode]);

  return {
    resolvedMajor,
    setResolvedMajor,
    metaInfo,
    metaLoading,
    majors,
  };
}
