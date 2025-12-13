function LanguagesSection({
  languageRows,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  showRequiredWarning = false,
  errors = [],
}) {
  const fieldInput = "input input-bordered w-full";
  const selectInput = "select select-bordered w-full";

  return (
    <div className="space-y-3">
      {showRequiredWarning ? (
        <p className="text-sm text-error">
          Bitte geben Sie mindestens eine Sprache mit Niveau an.
        </p>
      ) : null}
      {languageRows.map((row, idx) => (
        <div
          key={idx}
          className={`grid grid-cols-12 gap-3 p-3 rounded-xl border bg-base-100 shadow-sm ring-1 ${
            errors?.[idx]?.name || errors?.[idx]?.level
              ? "border-error ring-error/30"
              : "border-base-300 ring-base-200/80"
          }`}
        >
          <input
            className={`${fieldInput} col-span-6 ${
              errors?.[idx]?.name ? "input-error" : ""
            }`}
            placeholder="Name der Sprache (z. B. Deutsch)"
            aria-label="Sprache"
            value={row.name}
            onChange={(e) => onUpdateRow(idx, "name", e.target.value)}
          />
          <select
            className={`${selectInput} col-span-5 ${
              errors?.[idx]?.level ? "select-error" : ""
            }`}
            aria-label="Niveau"
            value={row.level}
            onChange={(e) => onUpdateRow(idx, "level", e.target.value)}
          >
            {[
              "A1",
              "A2",
              "B1",
              "B2",
              "C1",
              "C2",
              "Muttersprache",
            ].map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-ghost btn-sm col-span-1 text-error"
            onClick={() => onRemoveRow(idx)}
          >
            ✕
          </button>
          {errors?.[idx]?.name || errors?.[idx]?.level ? (
            <p className="col-span-12 text-xs text-error">
              Sprache und Niveau sind erforderlich.
            </p>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={onAddRow}
      >
        + Sprache hinzufügen
      </button>
    </div>
  );
}

export default LanguagesSection;


