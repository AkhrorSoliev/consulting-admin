import toast from "react-hot-toast";
import { imageFileToBase64 } from "../../../../utils";

export function useFileHandlers({
  setFormCv,
  isLimitedAdmin,
  selectedDocumentType,
  setSelectedDocumentType,
  setPendingDocumentFiles,
}) {
  async function handlePhotoFileChange(e) {
    if (isLimitedAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await imageFileToBase64(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.9,
        mimeType: "image/jpeg",
      });
      setFormCv((prev) => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, photo: base64 },
      }));
    } catch (err) {}
  }

  function handleDocumentFileChange(e) {
    if (isLimitedAdmin) return;
    const file = e.target.files?.[0];
    if (!file || !selectedDocumentType) return;

    // Reset the file input
    e.target.value = "";

    // Get German name for toast message
    const typeNames = {
      passport: "Reisepass",
      diplomas: "Diplome",
      certificates: "Zertifikate",
    };
    const typeName = typeNames[selectedDocumentType] || selectedDocumentType;

    // Create a temporary blob URL for preview
    const tempUrl = URL.createObjectURL(file);

    // Add file to pending uploads (will be uploaded on save)
    setPendingDocumentFiles((prev) => ({
      ...prev,
      [selectedDocumentType]: [
        ...(prev[selectedDocumentType] || []),
        { file, tempUrl },
      ],
    }));

    // Update form state with temporary URL for preview
    setFormCv((prev) => {
      const updatedDocs = { ...prev.documents };
      if (!updatedDocs[selectedDocumentType]) {
        updatedDocs[selectedDocumentType] = [];
      }

      // For certificates, also update certificatesDetailed if type is selected
      if (selectedDocumentType === "certificates") {
        // Add to regular certificates array
        updatedDocs[selectedDocumentType] = [
          ...updatedDocs[selectedDocumentType],
          tempUrl,
        ];

        // Also add to certificatesDetailed with empty type (user will set type later)
        const updatedDetailed = Array.isArray(
          prev.documents?.certificatesDetailed,
        )
          ? [...prev.documents.certificatesDetailed, { url: tempUrl, type: "" }]
          : [{ url: tempUrl, type: "" }];

        updatedDocs.certificatesDetailed = updatedDetailed;

        return {
          ...prev,
          documents: updatedDocs,
        };
      } else {
        // For passport and diplomas, just add to regular arrays
        updatedDocs[selectedDocumentType] = [
          ...updatedDocs[selectedDocumentType],
          tempUrl,
        ];

        return {
          ...prev,
          documents: updatedDocs,
        };
      }
    });

    // Reset the selected document type
    setSelectedDocumentType("");

    toast.success(
      `${typeName} hinzugefügt. Klicken Sie auf "Speichern", um hochzuladen.`,
    );
  }

  return { handlePhotoFileChange, handleDocumentFileChange };
}
