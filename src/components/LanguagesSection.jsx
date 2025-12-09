function LanguagesSection({
  languageRows,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
}) {
  const fieldInput = "input input-bordered w-full";
  const selectInput = "select select-bordered w-full";

  return (
    <div className="space-y-3">
      {languageRows.map((row, idx) => (
        <div
          key={idx}
          className="grid grid-cols-12 gap-3 p-3 rounded-xl border border-base-300 bg-base-100 shadow-sm ring-1 ring-base-200/80"
        >
          <input
            className={`${fieldInput} col-span-6`}
            placeholder="Name der Sprache (z. B. Deutsch)"
            aria-label="Sprache"
            value={row.name}
            onChange={(e) => onUpdateRow(idx, "name", e.target.value)}
          />
          <select
            className={`${selectInput} col-span-5`}
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


