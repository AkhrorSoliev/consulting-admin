import CollapsibleSection from "../../../components/CollapsibleSection";
import LanguagesSection from "../../../components/LanguagesSection";

export default function LanguagesSectionCard({
  languagesCount,
  languageRows,
  addLanguageRow,
  updateLanguageRow,
  removeLanguageRow,
  LANGUAGE_OPTIONS,
}) {
  return (
    <CollapsibleSection title="Sprachen" count={languagesCount} defaultOpen={false}>
      <LanguagesSection
        languageRows={languageRows}
        onAddRow={addLanguageRow}
        onUpdateRow={updateLanguageRow}
        onRemoveRow={removeLanguageRow}
        languageOptions={LANGUAGE_OPTIONS}
      />
    </CollapsibleSection>
  );
}
