import { useMemo, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import RozilikXatiPdfDocument from "../../contract/pdf/RozilikXatiPdfDocument";

export default function useRozilikXatiPdf(form) {
  const [isDownloading, setIsDownloading] = useState(false);

  const fullName = useMemo(() => {
    const first = String(form.nomzodIsm || "").trim();
    const last = String(form.nomzodFamilya || "").trim();
    return [first, last].filter(Boolean).join(" ");
  }, [form.nomzodIsm, form.nomzodFamilya]);

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const fileBase = fullName ? `Rozilik xati ${fullName}` : "Rozilik xati";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Rozilik xati";
      const blob = await pdf(<RozilikXatiPdfDocument form={form} />).toBlob();
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

  return { isDownloading, handleDownloadPdf };
}
