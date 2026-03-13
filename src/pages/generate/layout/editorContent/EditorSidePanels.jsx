import LivePreview from "../../components/LivePreview";
import LimitedAdminCommentAside from "../../sections/LimitedAdminCommentAside";

export default function EditorSidePanels({
  isLimitedAdmin,
  showCommentPreview,
  renderCommentPreview,
  isCommentEditorOpen,
  commentHtml,
  setCommentHtml,
  hasComment,
  handleCorrectComment,
  isSaving,
  loading,
  notFound,
  isCorrectingComment,
  handleCommentPrimaryAction,
  commentActionLabel,
  formCv,
  commentMeta,
  showDocuments,
  showComment,
  showCommentDate,
  openPhotoModal,
}) {
  return (
    <>
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
    </>
  );
}
