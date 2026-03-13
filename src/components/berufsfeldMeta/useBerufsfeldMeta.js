import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getMetaByName, updateMetaByName } from "../../utils";
import toInputDateString from "./toInputDateString";

export default function useBerufsfeldMeta(major, open, onClose, isLimitedAdmin) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [internalDate, setInternalDate] = useState("");
  const [internalLink, setInternalLink] = useState("");
  const [employerDate, setEmployerDate] = useState("");
  const [employerLink, setEmployerLink] = useState("");

  useEffect(() => {
    if (!open || !major) return;
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const data = await getMetaByName(major);
        if (cancelled) return;
        setInternalDate(toInputDateString(data?.interviewInternal?.date));
        setInternalLink(String(data?.interviewInternal?.link || ""));
        setEmployerDate(toInputDateString(data?.interviewEmployer?.date));
        setEmployerLink(String(data?.interviewEmployer?.link || ""));
      } catch (e) {
        if (!cancelled) {
          toast.error("Meta-Daten konnten nicht geladen werden.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, major]);

  const handleClose = () => {
    onClose?.();
  };

  const handleSave = async () => {
    if (!major) return;
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, diese Daten zu bearbeiten.");
      return;
    }
    setIsSaving(true);
    try {
      const now = Date.now();
      await updateMetaByName(major, {
        interviewInternal: {
          date: internalDate || "",
          link: internalLink || "",
          updatedAt: now,
        },
        interviewEmployer: {
          date: employerDate || "",
          link: employerLink || "",
          updatedAt: now,
        },
        updatedAt: now,
      });
      toast.success("Zusätzliche Informationen gespeichert!");
      handleClose();
    } catch (e) {
      toast.error("Speichern fehlgeschlagen.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    isSaving,
    internalDate,
    setInternalDate,
    internalLink,
    setInternalLink,
    employerDate,
    setEmployerDate,
    employerLink,
    setEmployerLink,
    handleClose,
    handleSave,
  };
}
