import { useState } from "react";
import toast from "react-hot-toast";
import {
  hasRichTextContent,
  DEFAULT_COMMENT_TEMPLATE_HTML,
} from "../../../../utils";
import { correctCommentWithAI } from "../../../../utils/openai";

/**
 * Comment editor actions: open, cancel, clear, AI correct, append.
 */
export function useCommentActions({
  commentHtml,
  setCommentHtml,
  isCommentEditorOpen,
  setIsCommentEditorOpen,
  commentBaseline,
  setCommentBaseline,
  isSuperAdmin,
  saveCommentToHistory,
}) {
  const [isCorrectingComment, setIsCorrectingComment] = useState(false);

  function openCommentEditor() {
    setCommentBaseline(String(commentHtml || ""));
    setIsCommentEditorOpen(true);
  }

  function handleCommentPrimaryAction() {
    if (!isCommentEditorOpen) {
      const current = String(commentHtml || "");
      setCommentBaseline(current);
      if (!hasRichTextContent(current)) {
        setCommentHtml(DEFAULT_COMMENT_TEMPLATE_HTML);
      }
      setIsCommentEditorOpen(true);
      return;
    }
    // Cancel comment edits
    setCommentHtml(String(commentBaseline || ""));
    setIsCommentEditorOpen(false);
  }

  function handleClearComment() {
    if (!isSuperAdmin) {
      toast.error("Sie haben keine Berechtigung, den Kommentar zu löschen.");
      return;
    }
    const ok = window.confirm(
      "Kommentar wirklich löschen?\n\nHinweis: Diese Änderung wird erst in Firestore gespeichert, wenn Sie auf „Speichern“ klicken.",
    );
    if (!ok) return;
    setCommentHtml("");
    setIsCommentEditorOpen(false);
  }

  async function handleCorrectComment() {
    if (!commentHtml || !commentHtml.trim()) {
      toast.error("Kein Kommentar zum Korrigieren vorhanden.");
      return;
    }

    saveCommentToHistory(commentHtml);

    setIsCorrectingComment(true);
    try {
      const correctedHtml = await correctCommentWithAI(commentHtml);
      setCommentHtml(correctedHtml);
      saveCommentToHistory(correctedHtml);
      toast.success("Kommentar wurde erfolgreich korrigiert!");
    } catch (error) {
      console.error("Error correcting comment:", error);
      toast.error(
        "Fehler beim Korrigieren des Kommentars: " +
          (error.message || "Unbekannter Fehler"),
      );
    } finally {
      setIsCorrectingComment(false);
    }
  }

  function appendToComment(nextHtmlBlock) {
    const block = String(nextHtmlBlock || "").trim();
    if (!block) return;
    setCommentHtml(`${String(commentHtml || "")}${block}`);
    setIsCommentEditorOpen(true);
  }

  return {
    isCorrectingComment,
    setIsCorrectingComment,
    openCommentEditor,
    handleCommentPrimaryAction,
    handleClearComment,
    handleCorrectComment,
    appendToComment,
  };
}
