import { useCallback } from "react";
import toast from "react-hot-toast";
import {
  uploadFileToConsulting,
  deleteUploadedFileRemote,
} from "../../../utils";

export function useDocumentOperations(
  formCv,
  setFormCv,
  documentsMarkedForDeletion,
  setDocumentsMarkedForDeletion,
  isLimitedAdmin
) {
  const handlePhotoUpload = useCallback(
    async (file) => {
      if (isLimitedAdmin) return;
      if (!file) return;

      try {
        const url = await uploadFileToConsulting(file);
        setFormCv((prev) => ({
          ...prev,
          personalInfo: { ...prev.personalInfo, photo: url },
        }));
        toast.success("Rasm yuklandi.");
      } catch (error) {
        toast.error("Rasmni yuklashda xatolik.");
      }
    },
    [isLimitedAdmin, setFormCv]
  );

  const handleDocumentUpload = useCallback(
    async (files, documentType) => {
      if (isLimitedAdmin) return;
      if (!files || files.length === 0) return;

      try {
        const uploadPromises = Array.from(files).map((file) =>
          uploadFileToConsulting(file)
        );
        const urls = await Promise.all(uploadPromises);

        setFormCv((prev) => {
          const currentDocs = prev.documents?.[documentType] || [];
          return {
            ...prev,
            documents: {
              ...prev.documents,
              [documentType]: [...currentDocs, ...urls],
            },
          };
        });

        toast.success(`${urls.length} ta hujjat yuklandi.`);
      } catch (error) {
        toast.error("Hujjatlarni yuklashda xatolik.");
      }
    },
    [isLimitedAdmin, setFormCv]
  );

  const handleDocumentDelete = useCallback(
    (url, documentType, index) => {
      if (isLimitedAdmin) return;

      setDocumentsMarkedForDeletion((prev) => ({
        ...prev,
        [documentType]: [...(prev[documentType] || []), { url, index }],
      }));

      setFormCv((prev) => {
        const currentDocs = prev.documents?.[documentType] || [];
        return {
          ...prev,
          documents: {
            ...prev.documents,
            [documentType]: currentDocs.filter((_, i) => i !== index),
          },
        };
      });

      toast.success("Hujjat o'chirish uchun belgilandi.");
    },
    [isLimitedAdmin, setFormCv, setDocumentsMarkedForDeletion]
  );

  const performActualDeletions = useCallback(async () => {
    const deletionPromises = [];

    for (const [docType, items] of Object.entries(documentsMarkedForDeletion)) {
      for (const { url } of items) {
        if (url) {
          deletionPromises.push(
            deleteUploadedFileRemote(url).catch((err) => {})
          );
        }
      }
    }

    if (deletionPromises.length > 0) {
      await Promise.all(deletionPromises);
      setDocumentsMarkedForDeletion({
        passport: [],
        diplomas: [],
        certificates: [],
      });
    }
  }, [documentsMarkedForDeletion, setDocumentsMarkedForDeletion]);

  const handleCertificateUpload = useCallback(
    async (files, certificateType) => {
      if (isLimitedAdmin) return;
      if (!files || files.length === 0) return;

      try {
        const uploadPromises = Array.from(files).map((file) =>
          uploadFileToConsulting(file)
        );
        const urls = await Promise.all(uploadPromises);

        setFormCv((prev) => {
          const currentCerts = prev.documents?.certificatesDetailed || [];
          const newCerts = urls.map((url) => ({
            url,
            type: certificateType,
          }));
          return {
            ...prev,
            documents: {
              ...prev.documents,
              certificatesDetailed: [...currentCerts, ...newCerts],
            },
          };
        });

        toast.success(`${urls.length} ta sertifikat yuklandi.`);
      } catch (error) {
        toast.error("Sertifikatlarni yuklashda xatolik.");
      }
    },
    [isLimitedAdmin, setFormCv]
  );

  const handleCertificateDelete = useCallback(
    (index) => {
      if (isLimitedAdmin) return;

      setFormCv((prev) => {
        const currentCerts = prev.documents?.certificatesDetailed || [];
        const cert = currentCerts[index];

        if (cert?.url) {
          setDocumentsMarkedForDeletion((prevMarked) => ({
            ...prevMarked,
            certificates: [
              ...(prevMarked.certificates || []),
              { url: cert.url, index },
            ],
          }));
        }

        return {
          ...prev,
          documents: {
            ...prev.documents,
            certificatesDetailed: currentCerts.filter((_, i) => i !== index),
          },
        };
      });

      toast.success("Sertifikat o'chirish uchun belgilandi.");
    },
    [isLimitedAdmin, setFormCv, setDocumentsMarkedForDeletion]
  );

  return {
    handlePhotoUpload,
    handleDocumentUpload,
    handleDocumentDelete,
    handleCertificateUpload,
    handleCertificateDelete,
    performActualDeletions,
  };
}
