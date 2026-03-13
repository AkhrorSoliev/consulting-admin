import { useEffect, useState } from "react";
import { db } from "../../../../firebase/config";
import {
  resolveCandidateCollectionById,
  getCandidateData,
  subscribeAllowIncomingDelete,
} from "../../services/dataExchangeService";

/**
 * Loads candidate data and subscribes to allowDelete changes.
 */
export function useCandidateLoader(id) {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [candidateData, setCandidateData] = useState(null);
  const [outgoingDocs, setOutgoingDocs] = useState({});
  const [incomingDocs, setIncomingDocs] = useState({});
  const [allowDelete, setAllowDelete] = useState(true);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const findCandidate = async () => {
      try {
        const resolved = await resolveCandidateCollectionById(db, id);
        const collectionName = resolved?.collectionName || null;
        if (typeof resolved?.allowDelete === "boolean") {
          setAllowDelete(resolved.allowDelete);
        }

        if (!collectionName) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const data = await getCandidateData(db, collectionName, id);
        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setCandidateData({
          name: data?.persoenlicheDaten?.name || data?.personalInfo?.name || "",
          lastName:
            data?.persoenlicheDaten?.nachname ||
            data?.personalInfo?.lastName ||
            "",
          collectionName,
        });
        setOutgoingDocs(data.outgoingDocuments || {});
        setIncomingDocs(data.incomingDocuments || {});
        setLoading(false);
      } catch (error) {
        console.error("Error fetching candidate:", error);
        setNotFound(true);
        setLoading(false);
      }
    };

    findCandidate();
  }, [id]);

  useEffect(() => {
    if (!id) return undefined;
    const unsubscribe = subscribeAllowIncomingDelete(
      db,
      id,
      (nextAllowDelete) => {
        setAllowDelete(nextAllowDelete);
      },
      (error) => {
        console.log(
          "[DataExchange] onSnapshot error (ignored):",
          error.message,
        );
      },
    );
    return () => unsubscribe();
  }, [id]);

  return {
    loading,
    notFound,
    candidateData,
    outgoingDocs,
    incomingDocs,
    setIncomingDocs,
    allowDelete,
  };
}
