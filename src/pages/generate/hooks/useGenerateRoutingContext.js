import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";

export function useGenerateRoutingContext() {
  const { major, id } = useParams();
  const location = useLocation();

  return useMemo(() => {
    const sp = new URLSearchParams(String(location?.search || ""));
    return {
      major,
      id,
      location,
      remoteMode: sp.get("remote") === "1",
      remoteKind: String(sp.get("kind") || "").trim().toLowerCase(),
      remoteRid: String(sp.get("rid") || "").trim(),
      deletedDocId: String(sp.get("deletedDocId") || "").trim(),
      archivedDocId: String(sp.get("archivedDocId") || "").trim(),
      debugFromQuery: sp.get("debug") === "1",
    };
  }, [major, id, location]);
}
