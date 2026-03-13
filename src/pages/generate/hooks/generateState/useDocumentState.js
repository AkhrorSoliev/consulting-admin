import { useState } from "react";

export function useDocumentState() {
  const [docCv, setDocCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  return {
    docCv,
    setDocCv,
    loading,
    setLoading,
    notFound,
    setNotFound,
    isSaving,
    setIsSaving,
    isDownloading,
    setIsDownloading,
  };
}
