import {
  useDeleteArchive,
  useReactionAndRating,
  useDocumentFlags,
  usePdfDownload,
  useSendDocLink,
} from "./candidateActions";

/**
 * Hook that encapsulates candidate delete/archive, reaction, rating,
 * document-ready / document-send flags, PDF download and send-doc-link logic.
 */
export function useCandidateActions({
  id,
  major,
  resolvedMajor,
  formCv,
  docCv,
  setDocCv,
  user,
  userRole,
  isLimitedAdmin,
  remoteMode,
  navigate,
  addressFields,
  showComment,
  showCommentDate,
  commentMeta,
  showDocuments,
  reaction,
  setReaction,
  rating,
  setRating,
  showBackgroundImage,
}) {
  const deleteArchive = useDeleteArchive({
    resolvedMajor,
    major,
    user,
    isLimitedAdmin,
    navigate,
  });

  const reactionAndRating = useReactionAndRating({
    id,
    resolvedMajor,
    user,
    userRole,
    reaction,
    setReaction,
    rating,
    setRating,
  });

  const documentFlags = useDocumentFlags({
    id,
    resolvedMajor,
    docCv,
    setDocCv,
    user,
    remoteMode,
  });

  const pdfDownload = usePdfDownload({
    formCv,
    isLimitedAdmin,
    remoteMode,
    showComment,
    showCommentDate,
    commentMeta,
    showDocuments,
    showBackgroundImage,
    rating,
  });

  const sendDocLink = useSendDocLink({ id, formCv, docCv });

  return {
    // Delete / Archive
    deleteModalOpen: deleteArchive.deleteModalOpen,
    setDeleteModalOpen: deleteArchive.setDeleteModalOpen,
    deleteTarget: deleteArchive.deleteTarget,
    setDeleteTarget: deleteArchive.setDeleteTarget,
    isDeletingCandidate: deleteArchive.isDeletingCandidate,
    setIsDeletingCandidate: deleteArchive.setIsDeletingCandidate,
    closeDeleteModal: deleteArchive.closeDeleteModal,
    confirmDeleteCandidate: deleteArchive.confirmDeleteCandidate,
    confirmArchiveCandidate: deleteArchive.confirmArchiveCandidate,

    // Reaction
    handleReaction: reactionAndRating.handleReaction,

    // Rating
    handleRatingChange: reactionAndRating.handleRatingChange,
    handleRatingReset: reactionAndRating.handleRatingReset,

    // Document ready / send
    handleDocumentReady: documentFlags.handleDocumentReady,
    handleDocumentSend: documentFlags.handleDocumentSend,

    // PDF download
    isDownloading: pdfDownload.isDownloading,
    handleDownloadPdf: pdfDownload.handleDownloadPdf,

    // Send doc link modal
    isSendDocLinkModalOpen: sendDocLink.isSendDocLinkModalOpen,
    isSendingDocLink: sendDocLink.isSendingDocLink,
    openSendDocLinkModal: sendDocLink.openSendDocLinkModal,
    closeSendDocLinkModal: sendDocLink.closeSendDocLinkModal,
    handleSendDocLinkSubmit: sendDocLink.handleSendDocLinkSubmit,
  };
}
