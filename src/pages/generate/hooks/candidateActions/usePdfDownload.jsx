import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import CvPdfDocument from "../../pdf/CvPdfDocument";

/**
 * Sub-hook for PDF download logic.
 */
export function usePdfDownload({
  formCv,
  isLimitedAdmin,
  remoteMode,
  showComment,
  showCommentDate,
  commentMeta,
  showDocuments,
  showBackgroundImage,
  rating,
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownloadPdf() {
    if (remoteMode) {
      toast.error(
        "Stellen Sie den Kandidaten zuerst im passenden Bereich (Major) wieder her.",
      );
      return;
    }
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung zum Herunterladen.");
      return;
    }
    try {
      setIsDownloading(true);
      const firstName = String(formCv.personalInfo.name || "").trim();
      const lastName = String(formCv.personalInfo.lastName || "").trim();
      const candidateName = [firstName, lastName].filter(Boolean).join(" ");
      const fileBase = candidateName
        ? `Lebenslauf ${candidateName}`
        : "Lebenslauf";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Lebenslauf";
      const blob = await pdf(
        <CvPdfDocument
          form={{ ...formCv, commentarMeta: commentMeta }}
          showDocuments={showDocuments}
          showComment={showComment}
          showCommentDate={showCommentDate}
          showBackgroundImage={showBackgroundImage}
          rating={rating}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ConsultingUz ${safeFileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  return {
    isDownloading,
    handleDownloadPdf,
  };
}
