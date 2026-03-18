import { useMemo, useState } from "react";
import { hasRichTextContent } from "../../../../utils";
import { useCommentHistory } from "./useCommentHistory";
import { useCommentActions } from "./useCommentActions";
import { buildRenderCommentPreview } from "./renderCommentPreview";

/**
 * Custom hook that encapsulates comment-editor logic:
 * undo/redo, AI correction, comment management, and the preview renderer.
 */
export function useCommentEditor({
  formCv,
  setFormCv,
  docCv,
  isLimitedAdmin,
  isSuperAdmin,
  isSaving = false,
  loading,
  notFound,
}) {
  // ---- state ----
  const [isCommentEditorOpen, setIsCommentEditorOpen] = useState(false);
  const [commentBaseline, setCommentBaseline] = useState("");
  const [commentMeta, setCommentMeta] = useState({
    updatedAt: null,
    updatedByName: "",
    updatedByPhoto: "",
    updatedByUid: "",
  });

  // ---- helpers ----
  function getCommentHtml(obj) {
    return String(obj?.commentar || "");
  }

  function setCommentHtml(nextHtml) {
    const v = String(nextHtml || "");
    setFormCv((prev) => ({ ...prev, commentar: v }));
  }

  // ---- memos ----
  const commentHtml = useMemo(() => getCommentHtml(formCv), [formCv]);
  const hasComment = useMemo(
    () => hasRichTextContent(commentHtml),
    [commentHtml],
  );
  const commentChanged = useMemo(
    () => String(commentHtml || "") !== String(commentBaseline || ""),
    [commentHtml, commentBaseline],
  );
  const canSaveComment = commentChanged && !isSaving && !loading && !notFound;
  const showCommentPreview = !isCommentEditorOpen;
  const commentActionLabel = !isCommentEditorOpen
    ? "Hinzufügen"
    : "Abbrechen";
  const showLimitedCommentSaveButton =
    isLimitedAdmin &&
    isCommentEditorOpen &&
    commentChanged &&
    !loading &&
    !notFound;

  // ---- sub-hooks ----
  const history = useCommentHistory(setCommentHtml);

  const actions = useCommentActions({
    commentHtml,
    setCommentHtml,
    isCommentEditorOpen,
    setIsCommentEditorOpen,
    commentBaseline,
    setCommentBaseline,
    isSuperAdmin,
    saveCommentToHistory: history.saveCommentToHistory,
  });

  const renderCommentPreview = buildRenderCommentPreview({
    hasComment,
    commentHtml,
    commentMeta,
  });

  // ---- public API ----
  return {
    // state
    isCommentEditorOpen,
    setIsCommentEditorOpen,
    commentBaseline,
    setCommentBaseline,
    commentMeta,
    setCommentMeta,
    isCorrectingComment: actions.isCorrectingComment,
    setIsCorrectingComment: actions.setIsCorrectingComment,
    commentHistory: history.commentHistory,
    commentHistoryIndex: history.commentHistoryIndex,

    // helpers
    getCommentHtml,
    setCommentHtml,

    // memos
    commentHtml,
    hasComment,
    commentChanged,
    canSaveComment,
    showCommentPreview,
    commentActionLabel,
    showLimitedCommentSaveButton,

    // JSX renderer
    renderCommentPreview,

    // actions
    openCommentEditor: actions.openCommentEditor,
    handleCommentPrimaryAction: actions.handleCommentPrimaryAction,
    handleClearComment: actions.handleClearComment,
    saveCommentToHistory: history.saveCommentToHistory,
    undoComment: history.undoComment,
    redoComment: history.redoComment,
    canUndoComment: history.canUndoComment,
    canRedoComment: history.canRedoComment,
    handleCorrectComment: actions.handleCorrectComment,
    appendToComment: actions.appendToComment,
  };
}
