import { useMemo, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import VollmachtArbeitgeberPdfDocument from "../../contract/pdf/VollmachtArbeitgeberPdfDocument";
import { getOmitKey } from "../utils/formHelpers";

export default function useFormHandlers({ form, setForm }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const fullName = useMemo(() => {
    const first = String(form.candidateFirstName || "").trim();
    const last = String(form.candidateLastName || "").trim();
    return [first, last].filter(Boolean).join(" ");
  }, [form.candidateFirstName, form.candidateLastName]);

  const handleFieldChange = (fieldKey, value) => {
    setForm((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleOmitToggle = (fieldKey, checked) => {
    const omitKey = getOmitKey(fieldKey);
    if (!omitKey) return;
    setForm((prev) => {
      const next = { ...prev, [omitKey]: checked };
      if (checked) {
        next[fieldKey] = "";
      }
      return next;
    });
  };

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const fileBase = fullName
        ? `Vollmacht Arbeitgeber ${fullName}`
        : "Vollmacht Arbeitgeber";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Vollmacht Arbeitgeber";
      const blob = await pdf(
        <VollmachtArbeitgeberPdfDocument form={form} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ConsultingUz ${safeFileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF wurde erstellt.");
    } catch (e) {
      toast.error("Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  return {
    isDownloading,
    fullName,
    handleFieldChange,
    handleOmitToggle,
    handleDownloadPdf,
  };
}
