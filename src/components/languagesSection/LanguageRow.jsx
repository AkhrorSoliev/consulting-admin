import { Trash2 } from "lucide-react";

const ChevronIcon = () => (
  <svg
    className="w-4 h-4 opacity-50 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

function LanguageRow({
  row,
  idx,
  errors,
  isMobile,
  levelOptions,
  getAvailableLanguages,
  onUpdateRow,
  onRemoveRow,
  openPicker,
}) {
  return (
    <div
      className={`grid grid-cols-12 gap-3 p-3 rounded-xl border bg-base-100 shadow-sm ring-1 ${
        errors?.[idx]?.name || errors?.[idx]?.level
          ? "border-error ring-error/30"
          : "border-base-300 ring-base-200/80"
      }`}
    >
      {isMobile ? (
        <>
          <button
            type="button"
            onClick={() => openPicker(idx, "language")}
            className={`
              col-span-6 h-12 px-4 rounded-lg border-2 text-left flex items-center justify-between
              transition-all active:scale-98
              ${
                row.name
                  ? "border-success bg-success/5 text-base-content"
                  : "border-base-300 bg-base-100 text-base-content/60"
              }
              ${errors?.[idx]?.name ? "border-error" : ""}
            `}
          >
            <span className="text-sm truncate">
              {row.name || "Sprache wählen"}
            </span>
            <ChevronIcon />
          </button>
          <button
            type="button"
            onClick={() => openPicker(idx, "level")}
            className={`
              col-span-5 h-12 px-4 rounded-lg border-2 text-left flex items-center justify-between
              transition-all active:scale-98
              ${
                row.level
                  ? "border-success bg-success/5 text-base-content"
                  : "border-base-300 bg-base-100 text-base-content/60"
              }
              ${errors?.[idx]?.level ? "border-error" : ""}
            `}
          >
            <span className="text-sm">{row.level || "Niveau wählen"}</span>
            <ChevronIcon />
          </button>
        </>
      ) : (
        <>
          <select
            className={`select select-bordered w-full col-span-6 ${
              errors?.[idx]?.name ? "select-error" : ""
            }`}
            aria-label="Sprache"
            value={row.name}
            onChange={(e) => onUpdateRow(idx, "name", e.target.value)}
          >
            <option value="">Bitte auswählen</option>
            {row.name && !getAvailableLanguages(idx).includes(row.name) && (
              <option key={row.name} value={row.name}>
                {row.name}
              </option>
            )}
            {getAvailableLanguages(idx).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            className={`select select-bordered w-full col-span-5 ${
              errors?.[idx]?.level ? "select-error" : ""
            }`}
            aria-label="Niveau"
            value={row.level}
            onChange={(e) => onUpdateRow(idx, "level", e.target.value)}
          >
            <option value="">Bitte auswählen</option>
            {levelOptions.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </>
      )}
      <button
        type="button"
        className="col-span-1 flex items-center justify-center text-error hover:bg-error/10 rounded-lg transition-colors"
        onClick={() => onRemoveRow(idx)}
        title="Entfernen"
      >
        <Trash2 size={20} />
      </button>
      {errors?.[idx]?.name || errors?.[idx]?.level ? (
        <p className="col-span-12 text-xs text-error">
          Sprache und Niveau sind erforderlich.
        </p>
      ) : null}
    </div>
  );
}

export default LanguageRow;
