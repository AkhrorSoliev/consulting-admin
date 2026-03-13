import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getFillablePdfDefaults,
  saveFillablePdfDefaults,
  clearFillablePdfDefaults,
} from "../../../utils/fillablePdfDefaults";
import { PDF_BACKEND_URL, DEFAULTS_KEY } from "../utils/constants";
import { formatDate, createInitialForm, buildPdfPayload } from "../utils/helpers";

export default function useBeschaeftigungsForm() {
  const [form, setForm] = useState(createInitialForm);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [isClearingDefaults, setIsClearingDefaults] = useState(false);
  const [hasDefaults, setHasDefaults] = useState(false);

  const updateField = useCallback(
    (field, value) => setForm((prev) => ({ ...prev, [field]: value })),
    []
  );

  useEffect(() => {
    getFillablePdfDefaults(DEFAULTS_KEY)
      .then((defaults) => {
        if (defaults && typeof defaults === "object") {
          setHasDefaults(
            Object.keys(defaults).some((k) => k !== "updatedAt" && defaults[k])
          );
          setForm((prev) => {
            const merged = { ...prev };
            Object.keys(defaults).forEach((key) => {
              if (key in merged && key !== "updatedAt") merged[key] = defaults[key];
            });
            return merged;
          });
        }
      })
      .catch((err) => console.error("Failed to load defaults:", err));
  }, []);

  const handleSaveAsDefaults = useCallback(async () => {
    setIsSavingDefaults(true);
    try {
      await saveFillablePdfDefaults(DEFAULTS_KEY, form);
      setHasDefaults(true);
      toast.success("Standardwerte gespeichert");
    } catch (err) {
      toast.error(err.message || "Fehler beim Speichern");
    } finally {
      setIsSavingDefaults(false);
    }
  }, [form]);

  const handleClearDefaults = useCallback(async () => {
    if (
      !window.confirm(
        "Möchten Sie alle Standardwerte für dieses Template löschen?"
      )
    )
      return;
    setIsClearingDefaults(true);
    try {
      await clearFillablePdfDefaults(DEFAULTS_KEY);
      setHasDefaults(false);
      setForm((prev) => {
        const reset = {};
        Object.keys(prev).forEach((key) => {
          reset[key] = key.startsWith("chbx_")
            ? false
            : key === "txtf_58_Datum"
              ? formatDate()
              : "";
        });
        return reset;
      });
      toast.success("Standardwerte gelöscht");
    } catch (err) {
      toast.error(err.message || "Fehler beim Löschen");
    } finally {
      setIsClearingDefaults(false);
    }
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`${PDF_BACKEND_URL}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPdfPayload(form)),
      });
      if (!response.ok)
        throw new Error((await response.json()).error || "PDF generation failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Beschaeftigungsverhaeltnis_${form.txtf_4_Nachname || "Dokument"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF wurde erstellt.");
    } catch (e) {
      console.error("PDF error:", e);
      toast.error(e.message || "Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }, [form]);

  return {
    form,
    updateField,
    isDownloading,
    isSavingDefaults,
    isClearingDefaults,
    hasDefaults,
    handleSaveAsDefaults,
    handleClearDefaults,
    handleDownloadPdf,
  };
}
