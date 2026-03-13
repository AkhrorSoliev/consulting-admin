import { useState, useEffect, useCallback } from "react";
import { FaDownload } from "react-icons/fa";
import toast from "react-hot-toast";
import { getFillablePdfDefaults } from "../../../../utils/fillablePdfDefaults";
import { PDF_BACKEND_URL, DEFAULTS_KEY } from "./erklaerungBeschaeftigung/constants";
import { createInitialForm, buildPdfPayload } from "./erklaerungBeschaeftigung/utils";
import SectionsTop from "./erklaerungBeschaeftigung/SectionsTop";
import SectionsBottom from "./erklaerungBeschaeftigung/SectionsBottom";

export default function ErklaerungBeschaeftigungModal({ open, onClose, candidateData }) {
  const [form, setForm] = useState(() => createInitialForm(candidateData));
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  const updateField = useCallback((field, value) => setForm((prev) => ({ ...prev, [field]: value })), []);

  useEffect(() => {
    if (open) {
      const baseForm = createInitialForm(candidateData);
      setForm(baseForm);
      setLoadingDefaults(true);
      getFillablePdfDefaults(DEFAULTS_KEY)
        .then((defaults) => {
          if (defaults && typeof defaults === "object") {
            setForm((prev) => {
              const merged = { ...prev };
              Object.keys(defaults).forEach((key) => {
                if (key in merged && key !== "updatedAt" && !prev[key]) merged[key] = defaults[key];
              });
              return merged;
            });
          }
        })
        .catch((err) => console.error("Failed to load defaults:", err))
        .finally(() => setLoadingDefaults(false));
    }
  }, [open, candidateData]);

  const handleDownloadPdf = useCallback(async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`${PDF_BACKEND_URL}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPdfPayload(form)),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `PDF generation failed (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Erklaerung_Beschaeftigung_${form.txtf_4_Nachname || "Dokument"}.pdf`;
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div className="absolute inset-0 bg-base-content/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 flex flex-col max-h-[90vh]">
          <div className="p-4 border-b border-base-300 flex items-start justify-between gap-3 shrink-0">
            <div>
              <h3 className="text-lg font-bold">Erklärung zum Beschäftigungsverhältnis</h3>
              <p className="text-sm opacity-70">Kandidat ma'lumotlari bilan to'ldirilgan forma</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className="btn btn-sm btn-primary" onClick={handleDownloadPdf} disabled={isDownloading || loadingDefaults}>
                <FaDownload /> {isDownloading ? "Wird erstellt..." : "PDF"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Schließen">✕</button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            <SectionsTop form={form} updateField={updateField} />
            <SectionsBottom form={form} updateField={updateField} />
          </div>
        </div>
      </div>
    </div>
  );
}
