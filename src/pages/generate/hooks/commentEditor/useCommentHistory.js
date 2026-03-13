import { useState } from "react";

/**
 * Manages undo/redo history for the comment editor.
 */
export function useCommentHistory(setCommentHtml) {
  const [commentHistory, setCommentHistory] = useState([]);
  const [commentHistoryIndex, setCommentHistoryIndex] = useState(-1);

  function saveCommentToHistory(html) {
    const currentHtml = String(html || "");
    setCommentHistory((prev) => {
      const currentIndex = commentHistoryIndex;
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(currentHtml);
      return newHistory;
    });
    setCommentHistoryIndex((prev) => prev + 1);
  }

  function undoComment() {
    if (commentHistoryIndex > 0) {
      const newIndex = commentHistoryIndex - 1;
      setCommentHistoryIndex(newIndex);
      setCommentHtml(commentHistory[newIndex]);
    }
  }

  function redoComment() {
    if (commentHistoryIndex < commentHistory.length - 1) {
      const newIndex = commentHistoryIndex + 1;
      setCommentHistoryIndex(newIndex);
      setCommentHtml(commentHistory[newIndex]);
    }
  }

  function canUndoComment() {
    return commentHistoryIndex > 0;
  }

  function canRedoComment() {
    return commentHistoryIndex < commentHistory.length - 1;
  }

  return {
    commentHistory,
    commentHistoryIndex,
    saveCommentToHistory,
    undoComment,
    redoComment,
    canUndoComment,
    canRedoComment,
  };
}
