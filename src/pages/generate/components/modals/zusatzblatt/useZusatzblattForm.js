import { useState, useEffect } from "react";
import { getFillablePdfDefaults } from "../../../../../utils/fillablePdfDefaults";
import { buildPdfPayload, downloadPdf } from "./modalUtils";
import toast from "react-hot-toast";

/**
 * Shared hook for Zusatzblatt modal forms.
 *
 * @param {Object} opts
 * @param {boolean} opts.open          - Whether the modal is open
 * @param {Function} opts.getInitialForm - Returns the initial form state
 * @param {string} opts.defaultsKey    - Key for getFillablePdfDefaults (e.g. "zusatzblatt_a")
 * @param {string} opts.pdfTemplate    - PDF template filename
 * @param {Function} opts.getFilename  - (form) => download filename
 * @param {string[]} [opts.textFieldOverrides] - Keys to treat as text fields in payload
 * @param {*} deps                     - Extra dependency for the reset effect
 */
export default function useZusatzblattForm({
  open,
  getInitialForm,
  defaultsKey,
  pdfTemplate,
  getFilename,
  textFieldOverrides,
  deps,
}) {
  const [form, setForm] = useState(getInitialForm);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const baseForm = getInitialForm();
    setForm(baseForm);

    getFillablePdfDefaults(defaultsKey)
      .then((defaults) => {
        if (defaults && typeof defaults === "object") {
          setForm((prev) => {
            const merged = { ...prev };
            Object.keys(defaults).forEach((key) => {
              if (key in merged && key !== "updatedAt" && !prev[key]) {
                merged[key] = defaults[key];
              }
            });
            return merged;
          });
        }
      })
      .catch((err) => console.error("Failed to load defaults:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deps]);

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const payload = buildPdfPayload(pdfTemplate, form, textFieldOverrides);
      await downloadPdf(payload, getFilename(form));
    } catch (e) {
      console.error("PDF error:", e);
      toast.error(e.message || "Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  return { form, setForm, isDownloading, handleDownloadPdf };
}
