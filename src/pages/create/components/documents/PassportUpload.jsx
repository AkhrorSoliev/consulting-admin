import toast from "react-hot-toast";
import RequiredLabel from "../../../../components/RequiredLabel";
import { uniqueKey } from "../../dataHelpers";
import RequiredField from "./RequiredField";
import SizeErrorMessage from "./SizeErrorMessage";
import { MAX_PDF_BYTES, REQUIRED_STAR_CLASS } from "./constants";

export default function PassportUpload({
  passportFiles,
  setPassportFiles,
  passportError,
  setPassportError,
  passportSizeError,
  setPassportSizeError,
}) {
  return (
    <RequiredField>
      <div className="flex items-start justify-between gap-2">
        <label
          className="label min-w-0 flex-1"
          htmlFor="doc-passport"
        >
          <RequiredLabel
            className={`label-text ${REQUIRED_STAR_CLASS}`}
          >
            Reisepass (PDF)
          </RequiredLabel>
        </label>
        {Array.isArray(passportFiles) &&
        passportFiles.length > 0 ? (
          <button
            type="button"
            className="btn btn-ghost btn-xs shrink-0 whitespace-nowrap"
            onClick={() => {
              setPassportFiles([]);
              setPassportSizeError(false);
              setPassportError(false);
            }}
          >
            Alle entfernen
          </button>
        ) : null}
      </div>
      <p className="text-xs text-base-content/70 mb-2">
        Falls kein Reisepass vorhanden ist, bitte
        Personalausweis oder nationalen Pass (ID Card)
        als PDF hochladen. Maximal 2 MB.
      </p>
      <input
        id="doc-passport"
        type="file"
        accept=".pdf,application/pdf"
        className={`file-input file-input-bordered w-full ${
          passportError || passportSizeError
            ? "file-input-error"
            : ""
        }`}
        aria-invalid={
          passportError || passportSizeError
            ? "true"
            : "false"
        }
        onChange={(e) => {
          const raw = Array.from(e.target.files || []);
          const f = raw?.[0];
          e.target.value = "";
          if (!f) return;

          const isPdf =
            String(f.type).toLowerCase() ===
              "application/pdf" ||
            /\.pdf$/i.test(String(f.name || ""));
          if (!isPdf) {
            toast.error(
              "Nur PDF-Dateien sind erlaubt.",
            );
            return;
          }
          if ((f?.size || 0) > MAX_PDF_BYTES) {
            toast.error(
              "PDF-Datei darf maximal 2 MB groß sein.",
            );
            setPassportSizeError(true);
            return;
          }

          setPassportSizeError(false);
          setPassportError(false);
          setPassportFiles([f]);
        }}
      />
      {passportError ? (
        <p className="text-error text-sm mt-1">
          Reisepass oder Ausweis (PDF) erforderlich.
        </p>
      ) : null}
      {passportSizeError ? (
        <SizeErrorMessage />
      ) : null}
      {Array.isArray(passportFiles) &&
      passportFiles.length > 0 ? (
        <div className="mt-2">
          <div className="text-xs opacity-70 mb-1">
            Nur PDF
          </div>
          <ul className="space-y-2">
            {passportFiles.map((f) => (
              <li
                key={uniqueKey(f)}
                className="flex items-center justify-between gap-2 rounded-box border border-base-300 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {f.name || "passport.pdf"}
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
                    setPassportFiles([]);
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
