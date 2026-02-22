import { FaDownload, FaTrash, FaExternalLinkAlt } from "react-icons/fa";

export default function DocumentExchangeItem({
  docId,
  docData,
  incomingDoc,
  isUploading,
  isDeleting,
  allowDelete,
  onDownload,
  onDelete,
  onUpload,
}) {
  const docTitle = docData.title || docId;
  const docUrl = docData.url;
  const fileName = docData.fileName || `${docTitle}.pdf`;
  const acceptUpload =
    typeof docData?.acceptUpload === "boolean" ? docData.acceptUpload : true;

  return (
    <div className="border border-base-300 rounded-lg p-3 sm:p-4 bg-base-50">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-base sm:text-lg break-words">
            {docTitle}
          </h3>
        </div>
        <button
          type="button"
          className="btn btn-sm sm:btn-md btn-primary gap-2 w-full sm:w-auto"
          onClick={() => onDownload(docUrl, fileName)}
        >
          <FaDownload />
          <span className="text-sm sm:text-base">Yuklab olish</span>
        </button>
      </div>

      <div className="divider my-2"></div>

      {!acceptUpload ? (
        <div className="bg-info/10 border border-info/30 rounded-lg p-3">
          <p className="text-sm text-base-content/80">
            Bu hujjat faqat admin tomonidan yuborilgan nusxa. Kandidat uchun
            yuklash yoki almashtirish yopiq.
          </p>
        </div>
      ) : incomingDoc ? (
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
                {new Date(incomingDoc.uploadedAt).toLocaleString("uz-UZ")}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                className="btn btn-sm btn-primary gap-1 flex-1 sm:flex-none min-h-[2.5rem]"
                onClick={() => onDownload(incomingDoc.url, incomingDoc.fileName)}
                title="Yuklab olish"
              >
                <FaDownload />
                <span className="sm:hidden text-xs">Yuklab olish</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-info gap-1 flex-1 sm:flex-none min-h-[2.5rem]"
                onClick={() => window.open(incomingDoc.url, "_blank")}
                title="Ochish"
              >
                <FaExternalLinkAlt />
                <span className="sm:hidden text-xs">Ochish</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-error gap-1 flex-1 sm:flex-none min-h-[2.5rem]"
                onClick={() => onDelete(docId)}
                disabled={isDeleting || !allowDelete}
                title={allowDelete ? "O'chirish" : "O'chirish taqiqlangan"}
              >
                {isDeleting ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <>
                    <FaTrash />
                    <span className="sm:hidden text-xs">O'chirish</span>
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
                if (!file) return;
                onUpload(docId, file);
                e.target.value = "";
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
}
