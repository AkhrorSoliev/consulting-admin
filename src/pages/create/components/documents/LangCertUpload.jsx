import toast from "react-hot-toast";
import { uniqueKey } from "../../dataHelpers";
import SizeErrorMessage from "./SizeErrorMessage";
import LangCertFileList from "./LangCertFileList";
import { MAX_PDF_BYTES } from "./constants";

export default function LangCertUpload({
  langCertFiles,
  setLangCertFiles,
  langCertSizeError,
  setLangCertSizeError,
  langCertTypeError,
  setLangCertTypeError,
  noLanguageCertificates,
  setNoLanguageCertificates,
  langCertTypes,
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <label
          className="label min-w-0 flex-1"
          htmlFor="doc-langcerts"
        >
          <span className="label-text">
            Sprachzertifikate (optional)
          </span>
        </label>
        {Array.isArray(langCertFiles) &&
        langCertFiles.length > 0 ? (
          <button
            type="button"
            className="btn btn-ghost btn-xs shrink-0 whitespace-nowrap"
            onClick={() => {
              setLangCertFiles([]);
              setLangCertSizeError(false);
            }}
          >
            Alle entfernen
          </button>
        ) : null}
      </div>
      <label className="cursor-pointer flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          className="checkbox"
          checked={noLanguageCertificates}
          onChange={(e) => {
            const checked = Boolean(e.target.checked);
            setNoLanguageCertificates(checked);
            if (checked) {
              setLangCertFiles([]);
              setLangCertSizeError(false);
              setLangCertTypeError(false);
            }
          }}
        />
        <span className="text-sm">
          Keine Sprachzertifikate vorhanden
        </span>
      </label>
      <p className="text-xs text-base-content/70 mb-2">
        Bitte als PDF hochladen.
      </p>
      <p className="text-xs text-base-content/70 mb-2">
        Max. 2 MB pro Datei.
      </p>
      <input
        id="doc-langcerts"
        type="file"
        multiple
        accept=".pdf,application/pdf"
        className={`file-input file-input-bordered w-full ${
          langCertSizeError ? "file-input-error" : ""
        }`}
        aria-invalid={
          langCertSizeError ? "true" : "false"
        }
        disabled={noLanguageCertificates}
        onChange={(e) => {
          const raw = Array.from(e.target.files || []);
          e.target.value = "";
          const pdfs = raw.filter(
            (f) =>
              String(f.type).toLowerCase() ===
                "application/pdf" ||
              /\.pdf$/i.test(String(f.name || "")),
          );
          const sized = pdfs.filter(
            (f) => (f?.size || 0) <= MAX_PDF_BYTES,
          );
          const tooBig = pdfs.length - sized.length;
          const invalid = raw.length - pdfs.length;
          if (invalid > 0) {
            toast.error(
              "Nur PDF-Dateien sind erlaubt.",
            );
          }
          if (tooBig > 0) {
            toast.error(
              "PDF-Datei darf maximal 2 MB groß sein.",
            );
            setLangCertSizeError(true);
          } else {
            setLangCertSizeError(false);
          }
          if (sized.length > 0) {
            setNoLanguageCertificates(false);
          }
          if (sized.length === 0) return;

          const nextItems = sized.map((file) => ({
            file,
            name: file.name,
            size: file.size,
            type: "",
          }));
          setLangCertFiles((prev) => {
            const prevArr = Array.isArray(prev)
              ? prev
              : [];
            const map = new Map(
              prevArr.map((it) => [
                uniqueKey(it.file || it),
                it,
              ]),
            );
            nextItems.forEach((it) => {
              const key = uniqueKey(it.file);
              if (!map.has(key)) map.set(key, it);
            });
            return Array.from(map.values());
          });
        }}
      />
      {langCertSizeError ? (
        <SizeErrorMessage />
      ) : null}
      <LangCertFileList
        langCertFiles={langCertFiles}
        setLangCertFiles={setLangCertFiles}
        langCertTypeError={langCertTypeError}
        langCertTypes={langCertTypes}
      />
    </div>
  );
}
