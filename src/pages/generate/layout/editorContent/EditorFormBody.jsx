import PersonalInfoSection from "../../sections/PersonalInfoSection";
import CommentSectionCard from "../../sections/CommentSectionCard";
import EditorHeader from "./EditorHeader";
import FormSectionsFieldset from "./FormSectionsFieldset";

export default function EditorFormBody(props) {
  const {
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
    loading,
    notFound,
    isCorrectingComment,
    hasComment,
    handleCommentPrimaryAction,
    commentActionLabel,
    isSuperAdmin,
    handleClearComment,
  } = props;

  return (
    <div className="card-body space-y-4 min-h-[calc(100vh-2rem)]pb-4">
      <EditorHeader
        docCv={docCv}
        isLimitedAdmin={isLimitedAdmin}
        photo={photo}
        openPhotoModal={openPhotoModal}
      />

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

      <FormSectionsFieldset {...props} />

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
  );
}
