import CollapsibleSection from "../../../components/CollapsibleSection";
import ExperienceSection from "../../../components/ExperienceSection";
import LanguagesSection from "../../../components/LanguagesSection";
import DocumentsSection from "./DocumentsSection";
import { LANGUAGE_OPTIONS } from "../../../constants/languageOptions";
import EducationSection from "./formSections/EducationSection";
import SkillsSectionPanel from "./formSections/SkillsSectionPanel";

export default function FormSectionsPanel({
  remoteMode,
  formCv,
  setFormCv,
  inputBase,
  selectBase,
  fileInputBase,
  // Experience
  experienceCount,
  addExperience,
  updateExperience,
  removeExperience,
  addResponsibility,
  removeResponsibility,
  handleCorrectExperience,
  correctingExperienceIndex,
  aufgabenOnlyMode,
  toggleAufgabenOnlyMode,
  undoExperience,
  redoExperience,
  canUndoExperience,
  canRedoExperience,
  // Education
  educationCount,
  addEducation,
  updateEducation,
  removeEducation,
  // Skills
  isDrivingLicenseDropdownOpen,
  setIsDrivingLicenseDropdownOpen,
  drivingLicenseDropdownRef,
  addTag,
  removeTag,
  autoAddSkills,
  isGeneratingSoft,
  isGeneratingPc,
  recentlyAdded,
  // Languages
  languagesCount,
  languageRows,
  addLanguageRow,
  updateLanguageRow,
  removeLanguageRow,
  // Documents
  documentsCount,
  showDocuments,
  setShowDocuments,
  documentsMarkedForDeletion,
  deleteDocumentRemoteFirst,
  isLimitedAdmin,
  selectedDocumentType,
  setSelectedDocumentType,
  handleDocumentFileChange,
  mapFormToDoc,
  id,
  resolvedMajor,
  updateDocument,
  LANG_CERT_TYPES,
  docCv,
  userRole,
  savingAllowDelete,
  allowIncomingDelete,
  handleToggleAllowIncomingDelete,
  handleDownloadIncomingDoc,
  handleDeleteIncomingDoc,
  deletingIncomingDoc,
}) {
  return (
    <fieldset
      disabled={remoteMode}
      className="space-y-4 disabled:opacity-70"
    >
      {/* ---- Experience (Berufserfahrung) ---- */}
      <CollapsibleSection
        title="Berufserfahrung"
        count={experienceCount}
        defaultOpen={false}
      >
        <ExperienceSection
          experience={formCv.experience}
          onAddExperience={addExperience}
          onUpdateExperience={updateExperience}
          onRemoveExperience={removeExperience}
          onAddResponsibility={addResponsibility}
          onRemoveResponsibility={removeResponsibility}
          onCorrectExperience={handleCorrectExperience}
          correctingIndex={correctingExperienceIndex}
          aufgabenOnlyMode={aufgabenOnlyMode}
          onToggleAufgabenOnly={toggleAufgabenOnlyMode}
          onUndoExperience={undoExperience}
          onRedoExperience={redoExperience}
          canUndo={canUndoExperience}
          canRedo={canRedoExperience}
        />
      </CollapsibleSection>

      {/* ---- Education (Ausbildung) ---- */}
      <EducationSection
        formCv={formCv}
        inputBase={inputBase}
        educationCount={educationCount}
        addEducation={addEducation}
        updateEducation={updateEducation}
        removeEducation={removeEducation}
      />

      {/* ---- Skills (Fähigkeiten) ---- */}
      <SkillsSectionPanel
        formCv={formCv}
        setFormCv={setFormCv}
        selectBase={selectBase}
        isDrivingLicenseDropdownOpen={isDrivingLicenseDropdownOpen}
        setIsDrivingLicenseDropdownOpen={setIsDrivingLicenseDropdownOpen}
        drivingLicenseDropdownRef={drivingLicenseDropdownRef}
        addTag={addTag}
        removeTag={removeTag}
        autoAddSkills={autoAddSkills}
        isGeneratingSoft={isGeneratingSoft}
        isGeneratingPc={isGeneratingPc}
        recentlyAdded={recentlyAdded}
      />

      {/* ---- Languages (Sprachen) ---- */}
      <CollapsibleSection
        title="Sprachen"
        count={languagesCount}
        defaultOpen={false}
      >
        <LanguagesSection
          languageRows={languageRows}
          onAddRow={addLanguageRow}
          onUpdateRow={updateLanguageRow}
          onRemoveRow={removeLanguageRow}
          languageOptions={LANGUAGE_OPTIONS}
        />
      </CollapsibleSection>

      {/* ---- Documents ---- */}
      <DocumentsSection
        formCv={formCv}
        setFormCv={setFormCv}
        documentsCount={documentsCount}
        showDocuments={showDocuments}
        setShowDocuments={setShowDocuments}
        documentsMarkedForDeletion={documentsMarkedForDeletion}
        deleteDocumentRemoteFirst={deleteDocumentRemoteFirst}
        isLimitedAdmin={isLimitedAdmin}
        selectedDocumentType={selectedDocumentType}
        setSelectedDocumentType={setSelectedDocumentType}
        handleDocumentFileChange={handleDocumentFileChange}
        selectBase={selectBase}
        fileInputBase={fileInputBase}
        mapFormToDoc={mapFormToDoc}
        id={id}
        resolvedMajor={resolvedMajor}
        updateDocument={updateDocument}
        LANG_CERT_TYPES={LANG_CERT_TYPES}
        docCv={docCv}
        userRole={userRole}
        savingAllowDelete={savingAllowDelete}
        allowIncomingDelete={allowIncomingDelete}
        handleToggleAllowIncomingDelete={handleToggleAllowIncomingDelete}
        handleDownloadIncomingDoc={handleDownloadIncomingDoc}
        handleDeleteIncomingDoc={handleDeleteIncomingDoc}
        deletingIncomingDoc={deletingIncomingDoc}
      />
    </fieldset>
  );
}
