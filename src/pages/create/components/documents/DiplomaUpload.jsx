import toast from "react-hot-toast";
import RequiredLabel from "../../../../components/RequiredLabel";
import { uniqueKey } from "../../dataHelpers";
import RequiredField from "./RequiredField";
import SizeErrorMessage from "./SizeErrorMessage";
import { MAX_PDF_BYTES, REQUIRED_STAR_CLASS } from "./constants";

export default function DiplomaUpload({
  diplomaFiles,
  setDiplomaFiles,
  diplomaError,
  setDiplomaError,
  diplomaSizeError,
  setDiplomaSizeError,
}) {
  return (
    <RequiredField>
      <div className="flex items-start justify-between gap-2">
        <label
          className="label min-w-0 flex-1"
          htmlFor="doc-diplomas"
        >
          <RequiredLabel
            className={`label-text ${REQUIRED_STAR_CLASS}`}
          >
            Diplome (PDF, mindestens Schulzeugnis)
          </RequiredLabel>
        </label>
        {Array.isArray(diplomaFiles) &&
        diplomaFiles.length > 0 ? (
          <button
            type="button"
            className="btn btn-ghost btn-xs shrink-0 whitespace-nowrap"
            onClick={() => {
              setDiplomaFiles([]);
              setDiplomaSizeError(false);
              setDiplomaError(false);
            }}
          >
            Alle entfernen
          </button>
        ) : null}
      </div>
      <p className="text-xs text-base-content/70 mb-2">
        Pflicht: Laden Sie mindestens Ihr Schulzeugnis
        als PDF hoch.
      </p>
      <p className="text-xs text-base-content/70 mb-2">
        Maximal 2 MB pro Datei.
      </p>
      <input
        id="doc-diplomas"
        type="file"
        multiple
        accept=".pdf,application/pdf"
        className={`file-input file-input-bordered w-full ${
          diplomaError || diplomaSizeError
            ? "file-input-error"
            : ""
        }`}
        aria-invalid={
          diplomaError || diplomaSizeError
            ? "true"
            : "false"
        }
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
            setDiplomaSizeError(true);
          } else {
            setDiplomaSizeError(false);
          }
          if (sized.length > 0) {
            setDiplomaError(false);
          }
          if (sized.length === 0) return;

          setDiplomaFiles((prev) => {
            const prevArr = Array.isArray(prev)
              ? prev
              : [];
            const map = new Map(
              prevArr.map((it) => [uniqueKey(it), it]),
            );
            sized.forEach((file) => {
              const key = uniqueKey(file);
              if (!map.has(key)) map.set(key, file);
            });
            return Array.from(map.values());
          });
        }}
      />
      {diplomaError ? (
        <p className="text-error text-sm mt-1">
          Mindestens ein Diplom bzw. Schulzeugnis (PDF)
          erforderlich.
        </p>
      ) : null}
      {diplomaSizeError ? (
        <SizeErrorMessage />
      ) : null}
      {Array.isArray(diplomaFiles) &&
      diplomaFiles.length > 0 ? (
        <div className="mt-2">
          <div className="text-xs opacity-70 mb-1">
            Nur PDF
          </div>
          <ul className="space-y-2">
            {diplomaFiles.map((f, i) => (
              <li
                key={uniqueKey(f)}
                className="flex items-center justify-between gap-2 rounded-box border border-base-300 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {f.name || "diploma.pdf"}
                  </div>
                  <div className="text-xs opacity-70">
                    {f.size
                      ? `${(f.size / 1024).toFixed(
                          1,
                        )} KB`
                      : "Unknown"}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => {
                    setDiplomaFiles((prev) =>
                      (Array.isArray(prev)
                        ? prev
                        : []
                      ).filter((_, idx) => idx !== i),
                    );
                  }}
                  aria-label="Entfernen"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </RequiredField>
  );
}
