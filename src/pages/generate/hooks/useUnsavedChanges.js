import { useState, useEffect, useMemo } from "react";
import { useBlocker } from "react-router-dom";

export function useUnsavedChanges(
  normalizedCurrentForm,
  normalizedDocForm,
  documentsMarkedForDeletion,
  isSaving
) {
  const [savedBaselineJson, setSavedBaselineJson] = useState("");

  useEffect(() => {
    if (!normalizedDocForm) return;
    setSavedBaselineJson(JSON.stringify(normalizedDocForm));
  }, [normalizedDocForm]);

  const hasUnsavedChanges = useMemo(() => {
    if (!savedBaselineJson) return false;
    const currentJson = JSON.stringify(normalizedCurrentForm);
    const formChanged = currentJson !== savedBaselineJson;
    const hasMarkedDeletions = Object.values(
      documentsMarkedForDeletion || {}
    ).some((arr) => Array.isArray(arr) && arr.length > 0);
    return formChanged || hasMarkedDeletions;
  }, [normalizedCurrentForm, savedBaselineJson, documentsMarkedForDeletion]);

  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);

  const unsavedBlocker = useBlocker(
    Boolean(hasUnsavedChanges) && !Boolean(isSaving)
  );

  useEffect(() => {
    if (unsavedBlocker.state === "blocked") {
      setUnsavedModalOpen(true);
    }
  }, [unsavedBlocker.state]);

  const handleDiscardChanges = () => {
    setUnsavedModalOpen(false);
    if (unsavedBlocker.state === "blocked") {
      unsavedBlocker.proceed();
    }
  };

  const handleKeepEditing = () => {
    setUnsavedModalOpen(false);
    if (unsavedBlocker.state === "blocked") {
      unsavedBlocker.reset();
    }
  };

  return {
    hasUnsavedChanges,
    savedBaselineJson,
    setSavedBaselineJson,
    unsavedModalOpen,
    setUnsavedModalOpen,
    unsavedBlocker,
    handleDiscardChanges,
    handleKeepEditing,
  };
}
