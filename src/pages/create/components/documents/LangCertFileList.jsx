import { uniqueKey } from "../../dataHelpers";

export default function LangCertFileList({
  langCertFiles,
  setLangCertFiles,
  langCertTypeError,
  langCertTypes,
}) {
  if (
    !Array.isArray(langCertFiles) ||
    langCertFiles.length === 0
  ) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="text-xs opacity-70 mb-1">
        Nur PDF
      </div>
      <ul className="space-y-2">
        {langCertFiles.map((item, i) => {
          const file = item?.file || item;
          return (
            <li
              key={uniqueKey(file)}
              className="flex flex-col gap-2 rounded-box border border-base-300 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {item?.name ||
                      file?.name ||
                      "certificate.pdf"}
                  </div>
                  <div className="text-xs opacity-70">
                    {item?.size || file?.size
                      ? `${(
                          (item?.size ||
                            file?.size) / 1024
                        ).toFixed(1)} KB`
                      : "Unknown"}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => {
                    setLangCertFiles((prev) =>
                      (Array.isArray(prev)
                        ? prev
                        : []
                      ).filter(
                        (_, idx) => idx !== i,
                      ),
                    );
                  }}
                  aria-label="Entfernen"
                >
                  ✕
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 items-center">
                <label
                  className="label py-0 sm:py-1"
                  htmlFor={`langcert-type-${i}`}
                >
                  <span className="label-text text-xs sm:text-sm">
                    Zertifikat auswählen
                  </span>
                </label>
                <select
                  id={`langcert-type-${i}`}
                  className={`select select-bordered w-full ${
                    langCertTypeError &&
                    !String(item?.type || "").trim()
                      ? "select-error"
                      : ""
                  }`}
                  aria-label="Typ des Sprachzertifikats"
                  aria-invalid={
                    langCertTypeError &&
                    !String(item?.type || "").trim()
                      ? "true"
                      : "false"
                  }
                  value={item?.type || ""}
                  onChange={(e) =>
                    setLangCertFiles((prev) =>
                      prev.map((entry, idx) =>
                        idx === i
                          ? {
                              ...entry,
                              type: e.target.value,
                            }
                          : entry,
                      ),
                    )
                  }
                >
                  <option value="">
                    Zertifikat auswählen
                  </option>
                  {langCertTypes.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              {langCertTypeError &&
              !String(item?.type || "").trim() ? (
                <p className="text-error text-sm">
                  Bitte wählen Sie, zu welchem
                  Zertifikat die Datei gehört.
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
