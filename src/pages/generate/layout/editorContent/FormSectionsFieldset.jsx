import ExperienceSectionCard from "../../sections/ExperienceSectionCard";
import EducationSectionCard from "../../sections/EducationSectionCard";
import SkillsSectionCard from "../../sections/SkillsSectionCard";
import LanguagesSectionCard from "../../sections/LanguagesSectionCard";
import DocumentsSectionCard from "../../sections/DocumentsSectionCard";
import IncomingDocumentsSectionCard from "../../sections/IncomingDocumentsSectionCard";

export default function FormSectionsFieldset({
  remoteMode,
  formCv,
  setFormCv,
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
  educationCount,
  addEducation,
  removeEducation,
  inputBase,
  toInputMonth,
  fromInputMonth,
  updateEducation,
  setIsDrivingLicenseDropdownOpen,
  drivingLicenseDropdownRef,
  selectBase,
  isDrivingLicenseDropdownOpen,
  DRIVING_LICENSE_OPTIONS,
  addTag,
  removeTag,
  autoAddSkills,
  isGeneratingSoft,
  isGeneratingPc,
  recentlyAdded,
  languagesCount,
  languageRows,
  addLanguageRow,
  updateLanguageRow,
  removeLanguageRow,
  LANGUAGE_OPTIONS,
  documentsCount,
  showDocuments,
  setShowDocuments,
  documentsMarkedForDeletion,
  isLimitedAdmin,
  deleteDocumentRemoteFirst,
  id,
  resolvedMajor,
  mapFormToDoc,
  selectedDocumentType,
  setSelectedDocumentType,
  fileInputBase,
  handleDocumentFileChange,
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
    <fieldset disabled={remoteMode} className="space-y-4 disabled:opacity-70">
      <ExperienceSectionCard
        experienceCount={experienceCount}
        formCv={formCv}
        addExperience={addExperience}
        updateExperience={updateExperience}
        removeExperience={removeExperience}
        addResponsibility={addResponsibility}
        removeResponsibility={removeResponsibility}
        handleCorrectExperience={handleCorrectExperience}
        correctingExperienceIndex={correctingExperienceIndex}
        aufgabenOnlyMode={aufgabenOnlyMode}
        toggleAufgabenOnlyMode={toggleAufgabenOnlyMode}
        undoExperience={undoExperience}
        redoExperience={redoExperience}
        canUndoExperience={canUndoExperience}
        canRedoExperience={canRedoExperience}
      />

      <EducationSectionCard
        educationCount={educationCount}
        addEducation={addEducation}
        formCv={formCv}
        removeEducation={removeEducation}
        inputBase={inputBase}
        toInputMonth={toInputMonth}
        fromInputMonth={fromInputMonth}
        updateEducation={updateEducation}
      />

      <SkillsSectionCard
        formCv={formCv}
        setFormCv={setFormCv}
        setIsDrivingLicenseDropdownOpen={setIsDrivingLicenseDropdownOpen}
        drivingLicenseDropdownRef={drivingLicenseDropdownRef}
        selectBase={selectBase}
        isDrivingLicenseDropdownOpen={isDrivingLicenseDropdownOpen}
        DRIVING_LICENSE_OPTIONS={DRIVING_LICENSE_OPTIONS}
        addTag={addTag}
        removeTag={removeTag}
        autoAddSkills={autoAddSkills}
        isGeneratingSoft={isGeneratingSoft}
        isGeneratingPc={isGeneratingPc}
        recentlyAdded={recentlyAdded}
      />

      <LanguagesSectionCard
        languagesCount={languagesCount}
        languageRows={languageRows}
        addLanguageRow={addLanguageRow}
        updateLanguageRow={updateLanguageRow}
        removeLanguageRow={removeLanguageRow}
        LANGUAGE_OPTIONS={LANGUAGE_OPTIONS}
      />

      <DocumentsSectionCard
        documentsCount={documentsCount}
        showDocuments={showDocuments}
        onToggleShowDocuments={setShowDocuments}
        formCv={formCv}
        documentsMarkedForDeletion={documentsMarkedForDeletion}
        isLimitedAdmin={isLimitedAdmin}
        onDeleteDocumentRemoteFirst={deleteDocumentRemoteFirst}
        onFormCvChange={setFormCv}
        id={id}
        resolvedMajor={resolvedMajor}
        mapFormToDoc={mapFormToDoc}
        selectBase={selectBase}
        selectedDocumentType={selectedDocumentType}
        onSelectDocumentType={setSelectedDocumentType}
        fileInputBase={fileInputBase}
        onDocumentFileChange={handleDocumentFileChange}
        LANG_CERT_TYPES={LANG_CERT_TYPES}
      />

      <IncomingDocumentsSectionCard
        docCv={docCv}
        userRole={userRole}
        savingAllowDelete={savingAllowDelete}
        allowIncomingDelete={allowIncomingDelete}
        onToggleAllowIncomingDelete={handleToggleAllowIncomingDelete}
        onDownloadIncomingDoc={handleDownloadIncomingDoc}
        onDeleteIncomingDoc={handleDeleteIncomingDoc}
        deletingIncomingDoc={deletingIncomingDoc}
      />
    </fieldset>
  );
}
