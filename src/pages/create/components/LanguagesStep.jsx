import { FaLanguage } from "react-icons/fa";
import LanguagesSection from "../../../components/LanguagesSection";
import { LANGUAGE_OPTIONS } from "../../../constants/languageOptions";

/**
 * Step 3 – Languages (Sprachen).
 *
 * Props:
 *   languageRows, addLanguageRow, updateLanguageRow, removeLanguageRow,
 *   showLanguageWarning, languageErrors, isMobile
 */
export default function LanguagesStep({
  languageRows,
  addLanguageRow,
  updateLanguageRow,
  removeLanguageRow,
  showLanguageWarning,
  languageErrors,
  isMobile,
}) {
  return (
    <>
      <div className="divider mt-0">
        <span className="mx-auto inline-flex items-center gap-2">
          <FaLanguage className="opacity-70" aria-hidden="true" />
          <span>Sprachen</span>
        </span>
      </div>
      <LanguagesSection
        languageRows={languageRows}
        onAddRow={addLanguageRow}
        onUpdateRow={updateLanguageRow}
        onRemoveRow={removeLanguageRow}
        showRequiredWarning={showLanguageWarning}
        errors={languageErrors}
        languageOptions={LANGUAGE_OPTIONS}
        isMobile={isMobile}
      />
    </>
  );
}
