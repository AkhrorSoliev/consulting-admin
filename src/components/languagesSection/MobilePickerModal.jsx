function MobilePickerModal({
  activePickerIndex,
  pickerType,
  languageRows,
  levelOptions,
  getAvailableLanguages,
  onSelect,
  onClose,
}) {
  if (activePickerIndex === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200"
      onClick={onClose}
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
              {pickerType === "language"
                ? "Sprache wählen"
                : "Niveau wählen"}
            </h3>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
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
                    onSelect(activePickerIndex, "name", lang)
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
                    onSelect(activePickerIndex, "level", lvl)
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
  );
}

export default MobilePickerModal;
