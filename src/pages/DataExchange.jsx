// this page is for data exchange between candidates and admins
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  FaDownload,
  FaTrash,
  FaUpload,
  FaExternalLinkAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { uploadFileToFirebase, deleteUploadedFile } from "../utils";

function DataExchange() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [candidateData, setCandidateData] = useState(null);
  const [outgoingDocs, setOutgoingDocs] = useState({});
  const [incomingDocs, setIncomingDocs] = useState({});
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [deletingDocs, setDeletingDocs] = useState({});
  const [allowDelete, setAllowDelete] = useState(true);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const findCandidate = async () => {
      try {
        // Step 1: Try to get collection name from candidate_metadata
        const metadataRef = doc(db, "candidate_metadata", id);
        const metadataSnap = await getDoc(metadataRef);

        let collectionName = null;

        if (metadataSnap.exists()) {
          const metadata = metadataSnap.data();
          collectionName = metadata.collectionName;
          setAllowDelete(metadata.allowIncomingDelete !== false);
        } else {
          // Fallback: Get all collections from meta and search
          try {
            const metaSnapshot = await getDocs(collection(db, "meta"));
            const collections = metaSnapshot.docs
              .map((d) => d.data()?.collectionName || d.id)
              .filter((name) => name);

            for (const col of collections) {
              try {
                const candidateRef = doc(db, col, id);
                const candidateSnap = await getDoc(candidateRef);
                if (candidateSnap.exists()) {
                  collectionName = col;
                  break;
                }
              } catch (err) {
                // Continue to next collection
              }
            }
          } catch (metaError) {
            // If meta query fails, use hardcoded fallback
            const fallbackCollections = [
              "krankenpfleger",
              "altenpfleger",
              "pflegefachkraft",
              "kinderkrankenpfleger",
              "uy-quruvchisi-fachkraft-2026",
            ];

            for (const col of fallbackCollections) {
              try {
                const candidateRef = doc(db, col, id);
                const candidateSnap = await getDoc(candidateRef);
                if (candidateSnap.exists()) {
                  collectionName = col;
                  break;
                }
              } catch (err) {
                // Continue to next collection
              }
            }
          }
        }

        if (!collectionName) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Step 2: Get candidate data from the collection
        const candidateRef = doc(db, collectionName, id);
        const candidateSnap = await getDoc(candidateRef);

        if (!candidateSnap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const data = candidateSnap.data();

        const simplifiedData = {
          name: data?.persoenlicheDaten?.name || data?.personalInfo?.name || "",
          lastName:
            data?.persoenlicheDaten?.nachname ||
            data?.personalInfo?.lastName ||
            "",
          collectionName,
        };

        setCandidateData(simplifiedData);
        setOutgoingDocs(data.outgoingDocuments || {});
        setIncomingDocs(data.incomingDocuments || {});
        setLoading(false);
      } catch (error) {
        console.error("Error fetching candidate:", error);
        setNotFound(true);
        setLoading(false);
      }
    };

    findCandidate();
  }, [id]);

  // Real-time listener for allowIncomingDelete changes
  useEffect(() => {
    if (!id) return;
    const metadataRef = doc(db, "candidate_metadata", id);
    const unsubscribe = onSnapshot(
      metadataRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const metadata = snapshot.data();
          setAllowDelete(metadata.allowIncomingDelete !== false);
        }
      },
      (error) => {
        // Silently ignore permission errors for public access
        console.log(
          "[DataExchange] onSnapshot error (ignored):",
          error.message,
        );
      },
    );
    return () => unsubscribe();
  }, [id]);

  const handleFileUpload = async (docId, file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Faqat PDF fayllariga ruxsat berilgan.");
      return;
    }

    // 2MB limit
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Fayl hajmi 2MB dan oshmasligi kerak.");
      return;
    }

    setUploadingDocs((prev) => ({ ...prev, [docId]: true }));

    try {
      const name = `${candidateData?.name || ""} ${
        candidateData?.lastName || ""
      }`.trim();
      const docTitle = outgoingDocs[docId]?.title || docId;
      const fileName = `${docTitle} - ${name}.pdf`;

      const renamedFile = new File([file], fileName, { type: file.type });
      const url = await uploadFileToFirebase(renamedFile, "incoming");

      const updatedIncoming = {
        ...incomingDocs,
        [docId]: {
          url,
          uploadedAt: Date.now(),
          fileName,
        },
      };

      await updateDoc(doc(db, candidateData.collectionName, id), {
        incomingDocuments: updatedIncoming,
      });

      setIncomingDocs(updatedIncoming);
      toast.success("Hujjat muvaffaqiyatli yuklandi.");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Hujjatni yuklashda xatolik yuz berdi.");
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [docId]: false }));
    }
  };

  const handleFileDelete = async (docId) => {
    const incomingDoc = incomingDocs[docId];
    if (!incomingDoc?.url) return;

    setDeletingDocs((prev) => ({ ...prev, [docId]: true }));

    try {
      await deleteUploadedFile(incomingDoc.url);

      const updatedIncoming = { ...incomingDocs };
      delete updatedIncoming[docId];

      await updateDoc(doc(db, candidateData.collectionName, id), {
        incomingDocuments: updatedIncoming,
      });

      setIncomingDocs(updatedIncoming);
      toast.success("Hujjat muvaffaqiyatli o'chirildi.");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Hujjatni o'chirishda xatolik yuz berdi.");
    } finally {
      setDeletingDocs((prev) => ({ ...prev, [docId]: false }));
    }
  };

  const handleDownload = async (url, fileName) => {
    try {
      toast.loading("Hujjat yuklab olinmoqda...", { id: "download" });

      // Use Firebase Cloud Function proxy to download with proper headers
      const proxyUrl = `https://us-central1-consulting-bdb74.cloudfunctions.net/downloadProxy?url=${encodeURIComponent(
        url,
      )}&filename=${encodeURIComponent(fileName || "document.pdf")}`;

      // Fetch through proxy
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Hujjat muvaffaqiyatli yuklab olindi", { id: "download" });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Yuklab olishda xatolik. Fayl yangi tabda ochiladi.", {
        id: "download",
      });

      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-base-200"
        data-theme="winter"
      >
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-lg">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-base-200"
        data-theme="winter"
      >
        <div className="card bg-base-100 shadow-xl max-w-md mx-3">
          <div className="card-body text-center">
            <h2 className="card-title justify-center text-error">
              Nomzod topilmadi
            </h2>
            <p>So'ralgan sahifa mavjud emas.</p>
            <div className="mt-4 p-3 bg-base-200 rounded text-xs text-left">
              <p className="font-semibold mb-1">Debug Ma'lumoti:</p>
              <p>Nomzod ID: {id}</p>
              <p className="mt-2 text-base-content/60">
                Qo'shimcha ma'lumot uchun brauzer konsolini tekshiring.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const candidateName = `${candidateData?.name || ""} ${
    candidateData?.lastName || ""
  }`.trim();

  const outgoingEntries = Object.entries(outgoingDocs).filter(
    ([, v]) => v && typeof v === "object" && String(v?.url || "").trim(),
  );

  return (
    <div
      className="min-h-screen bg-base-200 py-4 sm:py-8 px-3 sm:px-4"
      data-theme="winter"
    >
      <div className="max-w-4xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-primary">
              Hujjatlar almashinuvi
            </h1>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-primary rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 hidden sm:block">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">
                    Hurmatli {candidateName || "Foydalanuvchi"}!
                  </h2>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Hujjatlarni sifatli va adashib ketmagan holda yuklashingizni
                    so'raymiz. Iltimos, har bir hujjatni diqqat bilan tekshirib,
                    to'g'ri joyga yuklang.
                  </p>
                </div>
              </div>
            </div>

            {outgoingEntries.length === 0 ? (
              <div className="text-center py-12 text-base-content/60">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-base-content/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-lg">Hozircha hujjatlar mavjud emas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {outgoingEntries.map(([docId, docData]) => {
                  const docTitle = docData.title || docId;
                  const docUrl = docData.url;
                  const fileName = docData.fileName || `${docTitle}.pdf`;
                  const incomingDoc = incomingDocs[docId];
                  const isUploading = uploadingDocs[docId];
                  const isDeleting = deletingDocs[docId];

                  return (
                    <div
                      key={docId}
                      className="border border-base-300 rounded-lg p-3 sm:p-4 bg-base-50"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base sm:text-lg break-words">
                            {docTitle}
                          </h3>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm sm:btn-md btn-primary gap-2 w-full sm:w-auto"
                          onClick={() => handleDownload(docUrl, fileName)}
                        >
                          <FaDownload />
                          <span className="text-sm sm:text-base">
                            Yuklab olish
                          </span>
                        </button>
                      </div>

                      <div className="divider my-2"></div>

                      {incomingDoc ? (
                        <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-success mb-1">
                                ✓ Hujjat yuklandi
                              </p>
                              <p className="text-xs text-base-content/70 break-words">
                                {incomingDoc.fileName}
                              </p>
                              <p className="text-xs text-base-content/60 mt-1">
                                {new Date(
                                  incomingDoc.uploadedAt,
                                ).toLocaleString("uz-UZ")}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-primary gap-1 flex-1 sm:flex-none min-h-[2.5rem]"
                                onClick={() =>
                                  handleDownload(
                                    incomingDoc.url,
                                    incomingDoc.fileName,
                                  )
                                }
                                title="Yuklab olish"
                              >
                                <FaDownload />
                                <span className="sm:hidden text-xs">
                                  Yuklab olish
                                </span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-info gap-1 flex-1 sm:flex-none min-h-[2.5rem]"
                                onClick={() =>
                                  window.open(incomingDoc.url, "_blank")
                                }
                                title="Ochish"
                              >
                                <FaExternalLinkAlt />
                                <span className="sm:hidden text-xs">
                                  Ochish
                                </span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-error gap-1 flex-1 sm:flex-none min-h-[2.5rem]"
                                onClick={() => handleFileDelete(docId)}
                                disabled={isDeleting || !allowDelete}
                                title={
                                  allowDelete
                                    ? "O'chirish"
                                    : "O'chirish taqiqlangan"
                                }
                              >
                                {isDeleting ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                  <>
                                    <FaTrash />
                                    <span className="sm:hidden text-xs">
                                      O'chirish
                                    </span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium text-sm sm:text-base">
                              Hujjatingizni yuklang (faqat PDF)
                            </span>
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="file"
                              accept="application/pdf"
                              className="file-input file-input-bordered flex-1 w-full text-sm sm:text-base"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(docId, file);
                                  e.target.value = "";
                                }
                              }}
                              disabled={isUploading}
                            />
                            {isUploading && (
                              <div className="flex items-center justify-center sm:justify-start">
                                <span className="loading loading-spinner loading-md"></span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataExchange;
