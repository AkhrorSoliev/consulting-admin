import { FaTelegram } from "react-icons/fa";
import LivePreview from "../components/LivePreview";
import PersonalInfoSection from "../sections/PersonalInfoSection";
import ExperienceSectionCard from "../sections/ExperienceSectionCard";
import EducationSectionCard from "../sections/EducationSectionCard";
import SkillsSectionCard from "../sections/SkillsSectionCard";
import LanguagesSectionCard from "../sections/LanguagesSectionCard";
import DocumentsSectionCard from "../sections/DocumentsSectionCard";
import IncomingDocumentsSectionCard from "../sections/IncomingDocumentsSectionCard";
import CommentSectionCard from "../sections/CommentSectionCard";
import LimitedAdminCommentAside from "../sections/LimitedAdminCommentAside";

export default function GenerateEditorContent(props) {
  const {
    loading,
    notFound,
    layoutClass,
    formSectionClass,
    docCv,
    isLimitedAdmin,
    photo,
    openPhotoModal,
    remoteMode,
    formCv,
    setFormCv,
    toInputDate,
    fromInputDate,
    isMobile,
    setShowBirthPlacePicker,
    selectBase,
    setShowMaritalStatusPicker,
    inputBase,
    noChildren,
    childrenCount,
    setPhoneTouched,
    phoneShowOk,
    phoneWarn,
    phoneDigits,
    passportNumber,
    setPassportTouched,
    passportShowOk,
    passportWarn,
    setEmailTouched,
    emailShowOk,
    emailWarn,
    fileInputBase,
    handlePhotoFileChange,
    addressFields,
    applyAddressFields,
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
    toInputMonth,
    fromInputMonth,
    updateEducation,
    setIsDrivingLicenseDropdownOpen,
    drivingLicenseDropdownRef,
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
    deleteDocumentRemoteFirst,
    id,
    resolvedMajor,
    mapFormToDoc,
    selectedDocumentType,
    setSelectedDocumentType,
    handleDocumentFileChange,
    LANG_CERT_TYPES,
    userRole,
    savingAllowDelete,
    allowIncomingDelete,
    handleToggleAllowIncomingDelete,
    handleDownloadIncomingDoc,
    handleDeleteIncomingDoc,
    deletingIncomingDoc,
    setShowComment,
    showComment,
    showCommentDate,
    setShowCommentDate,
    showCommentPreview,
    renderCommentPreview,
    isCommentEditorOpen,
    commentHtml,
    setCommentHtml,
    canUndoComment,
    canRedoComment,
    undoComment,
    redoComment,
    handleCorrectComment,
    isSaving,
    isCorrectingComment,
    hasComment,
    handleCommentPrimaryAction,
    commentActionLabel,
    isSuperAdmin,
    handleClearComment,
    commentMeta,
  } = props;

  return (
    <div className="w-full">
      {loading ? (
        <div className="grid place-items-center py-16">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : notFound ? (
        <div className="py-16 text-center bg-base-100 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Nicht gefunden</h2>
          <p className="opacity-70">Das Dokument existiert nicht oder wurde gelöscht.</p>
        </div>
      ) : (
        <>
          <div className={layoutClass}>
            <section className={formSectionClass}>
              <div className="card-body space-y-4 min-h-[calc(100vh-2rem)]pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className="card-title text-2xl font-bold">Daten bearbeiten</h2>
                    {docCv?.telegramId ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0088cc]/10 text-[#0088cc] text-sm font-medium"
                        title="Über Telegram registriert"
                      >
                        <FaTelegram className="w-3.5 h-3.5" />
                        <span className="text-xs">Telegram</span>
                      </span>
                    ) : null}
                    {docCv?.lead ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium"
                        title={`Lead: ${docCv.lead}`}
                      >
                        <span className="text-xs font-semibold">{docCv.lead}</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                {isLimitedAdmin && (
                  <div className="flex justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">Profilfoto</p>
                      {photo ? (
                        <button
                          type="button"
                          className="rounded-md border border-base-300 overflow-hidden shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          onClick={openPhotoModal}
                        >
                          <img src={photo} alt="Kandidatenfoto" className="w-[128pt] h-[160pt] object-cover" />
                        </button>
                      ) : (
                        <div className="w-[128pt] h-[160pt] border border-dashed border-base-300 rounded-md bg-base-200 flex items-center justify-center text-xs uppercase tracking-wide text-base-content/60">
                          Kein Foto vorhanden
                        </div>
                      )}
                      {photo && (
                        <button type="button" className="btn btn-xs btn-primary" onClick={openPhotoModal}>
                          Vergrößern
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <PersonalInfoSection
                  isLimitedAdmin={isLimitedAdmin}
                  remoteMode={remoteMode}
                  formCv={formCv}
                  setFormCv={setFormCv}
                  toInputDate={toInputDate}
                  fromInputDate={fromInputDate}
                  isMobile={isMobile}
                  setShowBirthPlacePicker={setShowBirthPlacePicker}
                  selectBase={selectBase}
                  setShowMaritalStatusPicker={setShowMaritalStatusPicker}
                  inputBase={inputBase}
                  noChildren={noChildren}
                  childrenCount={childrenCount}
                  setPhoneTouched={setPhoneTouched}
                  phoneShowOk={phoneShowOk}
                  phoneWarn={phoneWarn}
                  phoneDigits={phoneDigits}
                  passportNumber={passportNumber}
                  setPassportTouched={setPassportTouched}
                  passportShowOk={passportShowOk}
                  passportWarn={passportWarn}
                  setEmailTouched={setEmailTouched}
                  emailShowOk={emailShowOk}
                  emailWarn={emailWarn}
                  fileInputBase={fileInputBase}
                  handlePhotoFileChange={handlePhotoFileChange}
                  addressFields={addressFields}
                  applyAddressFields={applyAddressFields}
                />

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

                <CommentSectionCard
                  isLimitedAdmin={isLimitedAdmin}
                  showComment={showComment}
                  onToggleShowComment={setShowComment}
                  showCommentDate={showCommentDate}
                  onToggleShowCommentDate={setShowCommentDate}
                  showCommentPreview={showCommentPreview}
                  renderCommentPreview={renderCommentPreview}
                  isCommentEditorOpen={isCommentEditorOpen}
                  commentHtml={commentHtml}
                  onCommentHtmlChange={setCommentHtml}
                  canUndoComment={canUndoComment}
                  canRedoComment={canRedoComment}
                  onUndoComment={undoComment}
                  onRedoComment={redoComment}
                  onCorrectComment={handleCorrectComment}
                  isSaving={isSaving}
                  loading={loading}
                  notFound={notFound}
                  isCorrectingComment={isCorrectingComment}
                  hasComment={hasComment}
                  onPrimaryCommentAction={handleCommentPrimaryAction}
                  commentActionLabel={commentActionLabel}
                  isSuperAdmin={isSuperAdmin}
                  onClearComment={handleClearComment}
                />
              </div>
            </section>

            <LimitedAdminCommentAside
              isLimitedAdmin={isLimitedAdmin}
              showCommentPreview={showCommentPreview}
              renderCommentPreview={renderCommentPreview}
              isCommentEditorOpen={isCommentEditorOpen}
              commentHtml={commentHtml}
              onCommentHtmlChange={setCommentHtml}
              hasComment={hasComment}
              onCorrectComment={handleCorrectComment}
              isSaving={isSaving}
              loading={loading}
              notFound={notFound}
              isCorrectingComment={isCorrectingComment}
              onPrimaryCommentAction={handleCommentPrimaryAction}
              commentActionLabel={commentActionLabel}
            />

            {!isLimitedAdmin && (
              <LivePreview
                formCv={formCv}
                commentMeta={commentMeta}
                showDocuments={showDocuments}
                showComment={showComment}
                showCommentDate={showCommentDate}
                onPhotoClick={openPhotoModal}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
