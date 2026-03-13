import { useState } from "react";
import LanguageRow from "./languagesSection/LanguageRow";
import MobilePickerModal from "./languagesSection/MobilePickerModal";

const LEVEL_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2", "Muttersprache"];

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
  const [pickerType, setPickerType] = useState(null);

  const getAvailableLanguages = (currentIndex) => {
    const selectedLanguages = languageRows
      .map((row, idx) => (idx !== currentIndex ? row.name : null))
      .filter(Boolean);
    return languageOptions.filter((lang) => !selectedLanguages.includes(lang));
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
        <LanguageRow
          key={idx}
          row={row}
          idx={idx}
          errors={errors}
          isMobile={isMobile}
          levelOptions={LEVEL_OPTIONS}
          getAvailableLanguages={getAvailableLanguages}
          onUpdateRow={onUpdateRow}
          onRemoveRow={onRemoveRow}
          openPicker={openPicker}
        />
      ))}
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={onAddRow}
      >
        + Sprache hinzufügen
      </button>

      {isMobile && (
        <MobilePickerModal
          activePickerIndex={activePickerIndex}
          pickerType={pickerType}
          languageRows={languageRows}
          levelOptions={LEVEL_OPTIONS}
          getAvailableLanguages={getAvailableLanguages}
          onSelect={selectOption}
          onClose={closePicker}
        />
      )}
    </div>
  );
}

export default LanguagesSection;
