import { useState, useMemo } from "react";
import { Trash2 } from "lucide-react";

function LanguagesSection({
  languageRows,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  showRequiredWarning = false,
  errors = [],
  languageOptions = [],
  isMobile = false,
}) {
  const [activePickerIndex, setActivePickerIndex] = useState(null);
  const [pickerType, setPickerType] = useState(null); // 'language' or 'level'

  const levelOptions = ["A1", "A2", "B1", "B2", "C1", "C2", "Muttersprache"];

  // Get available languages for a specific row (excluding already selected ones)
  const getAvailableLanguages = (currentIndex) => {
    const selectedLanguages = languageRows
      .map((row, idx) => (idx !== currentIndex ? row.name : null))
      .filter(Boolean);
    
    return languageOptions.filter(lang => !selectedLanguages.includes(lang));
  };

  const openPicker = (idx, type) => {
    setActivePickerIndex(idx);
    setPickerType(type);
  };

  const closePicker = () => {
    setActivePickerIndex(null);
    setPickerType(null);
  };

  const selectOption = (idx, field, value) => {
    onUpdateRow(idx, field, value);
    closePicker();
  };

  return (
    <div className="space-y-3">
      {showRequiredWarning ? (
        <p className="text-sm text-error">
          Bitte geben Sie mindestens eine Sprache mit Niveau an.
        </p>
      ) : null}
      {languageRows.length ? (
        <div className="grid grid-cols-12 gap-3 px-1 text-xs text-base-content/60">
          <div className="col-span-6">Sprache</div>
          <div className="col-span-5">Niveau</div>
          <div className="col-span-1" aria-hidden="true" />
        </div>
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
                <span className="text-sm">
                  {row.level || "Niveau wählen"}
                </span>
                <svg
                  className="w-4 h-4 opacity-50"
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
                {/* Show current selection if exists, even if already used */}
                {row.name && !getAvailableLanguages(idx).includes(row.name) && (
                  <option key={row.name} value={row.name}>
                    {row.name}
                  </option>
                )}
                {/* Show available languages */}
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
      ))}
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={onAddRow}
      >
        + Sprache hinzufügen
      </button>

      {/* Mobile Picker Modal */}
      {isMobile && activePickerIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200"
          onClick={closePicker}
        >
          <div
            className="fixed inset-x-0 bottom-0 bg-base-100 rounded-t-3xl max-h-[70vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="shrink-0 pt-3 pb-2 flex justify-center">
              <div className="w-12 h-1 bg-base-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="shrink-0 px-4 pb-3 border-b border-base-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">
                  {pickerType === "language" ? "Sprache wählen" : "Niveau wählen"}
                </h3>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={closePicker}
                  aria-label="Schließen"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-center text-base-content/60">
                {pickerType === "language" ? "Sprache" : "Niveau"}
              </p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-3 space-y-1">
                {pickerType === "language" &&
                  getAvailableLanguages(activePickerIndex).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() =>
                        selectOption(activePickerIndex, "name", lang)
                      }
                      className={`
                        w-full text-left px-4 py-4 rounded-xl transition-all text-base font-medium
                        active:scale-98
                        ${
                          languageRows[activePickerIndex]?.name === lang
                            ? "bg-primary text-primary-content"
                            : "hover:bg-base-200 active:bg-base-300"
                        }
                      `}
                    >
                      {lang}
                      {languageRows[activePickerIndex]?.name === lang && (
                        <span className="float-right">✓</span>
                      )}
                    </button>
                  ))}
                {pickerType === "level" &&
                  levelOptions.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() =>
                        selectOption(activePickerIndex, "level", lvl)
                      }
                      className={`
                        w-full text-left px-4 py-4 rounded-xl transition-all text-base font-medium
                        active:scale-98
                        ${
                          languageRows[activePickerIndex]?.level === lvl
                            ? "bg-primary text-primary-content"
                            : "hover:bg-base-200 active:bg-base-300"
                        }
                      `}
                    >
                      {lvl}
                      {languageRows[activePickerIndex]?.level === lvl && (
                        <span className="float-right">✓</span>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LanguagesSection;


