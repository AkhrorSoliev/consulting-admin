function LanguagesSection({
  languageRows,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
}) {
  return (
    <div className="space-y-3">
      {languageRows.map((row, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2">
          <input
            className="input input-bordered bg-base-100 text-base-content border-base-300 focus:outline-none focus:border-primary col-span-6"
            placeholder="Name der Sprache (z. B. Deutsch)"
            aria-label="Sprache"
            value={row.name}
            onChange={(e) => onUpdateRow(idx, "name", e.target.value)}
          />
          <select
            className="select select-bordered bg-base-100 text-base-content border-base-300 focus:outline-none focus:border-primary col-span-5"
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


