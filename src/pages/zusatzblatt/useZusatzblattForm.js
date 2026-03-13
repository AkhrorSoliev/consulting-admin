import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  getFillablePdfDefaults,
  saveFillablePdfDefaults,
  clearFillablePdfDefaults,
} from "../../utils/fillablePdfDefaults";
import useUserRole from "../../hooks/useUserRole";
import { todayDdMmYyyy } from "./dateUtils";

const PDF_BACKEND_URL =
  import.meta.env.VITE_PDF_BACKEND_URL ||
  "https://unsincerely-monarchal-alva.ngrok-free.dev";

/**
 * Shared hook for Zusatzblatt forms.
 * @param {string} templateKey - e.g. "zusatzblatt_a"
 * @param {string} pdfTemplate - full PDF template filename
 * @param {object} initialForm - initial form state object
 * @param {string} dateResetKey - the form key that holds the date field to reset to today
 * @param {function} filenameFn - (form) => download filename
 * @param {function} [buildPayloadOverride] - optional custom payload builder
 */
export default function useZusatzblattForm({
  templateKey,
  pdfTemplate,
  initialForm,
  dateResetKey,
  filenameFn,
  buildPayloadOverride,
}) {
  const [form, setForm] = useState(initialForm);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [isClearingDefaults, setIsClearingDefaults] = useState(false);
  const [hasDefaults, setHasDefaults] = useState(false);
  const { role } = useUserRole();
  const canManageDefaults = role === "super_admin" || role === "admin";

  useEffect(() => {
    getFillablePdfDefaults(templateKey)
      .then((defaults) => {
        if (defaults && typeof defaults === "object") {
          setHasDefaults(
            Object.keys(defaults).some((k) => k !== "updatedAt" && defaults[k])
          );
          setForm((prev) => {
            const merged = { ...prev };
            Object.keys(defaults).forEach((key) => {
              if (key in merged && key !== "updatedAt") {
                merged[key] = defaults[key];
              }
            });
            return merged;
          });
        }
      })
      .catch((err) => console.error("Failed to load defaults:", err));
  }, [templateKey]);

  async function handleSaveAsDefaults() {
    setIsSavingDefaults(true);
    try {
      await saveFillablePdfDefaults(templateKey, form);
      setHasDefaults(true);
      toast.success("Standardwerte gespeichert");
    } catch (err) {
      toast.error(err.message || "Fehler beim Speichern");
    } finally {
      setIsSavingDefaults(false);
    }
  }

  async function handleClearDefaults() {
    if (
      !window.confirm(
        "Möchten Sie alle Standardwerte für dieses Template löschen?"
      )
    )
      return;
    setIsClearingDefaults(true);
    try {
      await clearFillablePdfDefaults(templateKey);
      setHasDefaults(false);
      setForm((prev) => {
        const reset = {};
        Object.keys(prev).forEach((key) => {
          if (key.startsWith("chbx_")) {
            reset[key] = false;
          } else if (key === dateResetKey) {
            reset[key] = todayDdMmYyyy();
          } else {
            reset[key] = "";
          }
        });
        return reset;
      });
      toast.success("Standardwerte gelöscht");
    } catch (err) {
      toast.error(err.message || "Fehler beim Löschen");
    } finally {
      setIsClearingDefaults(false);
    }
  }

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);

      let payload;
      if (buildPayloadOverride) {
        payload = buildPayloadOverride(form, pdfTemplate);
      } else {
        payload = {
          template: pdfTemplate,
          data: { textFields: {}, radioGroups: {}, checkboxes: {} },
        };
        Object.entries(form).forEach(([key, value]) => {
          if (key.startsWith("txtf_")) {
            payload.data.textFields[key] = value;
          } else if (key.startsWith("rbtn_") && value) {
            payload.data.radioGroups[key] = value;
          } else if (key.startsWith("chbx_")) {
            payload.data.checkboxes[key] = value;
          }
        });
      }

      const response = await fetch(`${PDF_BACKEND_URL}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "PDF generation failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFn(form);
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF wurde erstellt.");
    } catch (e) {
      console.error("PDF error:", e);
      toast.error(e.message || "Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  return {
    form,
    setForm,
    isDownloading,
    isSavingDefaults,
    isClearingDefaults,
    hasDefaults,
    canManageDefaults,
    handleSaveAsDefaults,
    handleClearDefaults,
    handleDownloadPdf,
  };
}
