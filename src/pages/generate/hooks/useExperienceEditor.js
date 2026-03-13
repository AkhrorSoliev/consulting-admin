import { useState } from "react";
import toast from "react-hot-toast";
import { correctExperienceWithAI } from "../../../utils/openai";
import { sortTimelineItemsDesc } from "../../../utils";

/**
 * Hook that manages experience editing: AI correction, aufgaben-only mode,
 * and undo/redo history for individual experience entries.
 *
 * @param {object}   params
 * @param {object}   params.formCv
 * @param {Function} params.setFormCv
 * @param {boolean}  params.isLimitedAdmin  – reserved for future gating
 */
export function useExperienceEditor({ formCv, setFormCv, isLimitedAdmin }) {
  const [correctingExperienceIndex, setCorrectingExperienceIndex] =
    useState(null);
  const [aufgabenOnlyMode, setAufgabenOnlyMode] = useState({});
  const [experienceHistory, setExperienceHistory] = useState({});
  const [experienceHistoryIndex, setExperienceHistoryIndex] = useState({});

  // ── helpers ────────────────────────────────────────────────────────────

  function saveExperienceToHistory(idx, experienceData) {
    setExperienceHistoryIndex((prevIndex) => {
      const currentIndex = prevIndex[idx] ?? -1;

      setExperienceHistory((prevHistory) => {
        const history = prevHistory[idx] || [];

        // Remove any future history if we're not at the end
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(experienceData);

        // Keep only last 20 states to avoid memory issues
        const trimmedHistory = newHistory.slice(-20);

        return {
          ...prevHistory,
          [idx]: trimmedHistory,
        };
      });

      return {
        ...prevIndex,
        [idx]: currentIndex + 1,
      };
    });
  }

  // ── AI correction ─────────────────────────────────────────────────────

  async function handleCorrectExperience(idx) {
    const exp = formCv.experience[idx];
    if (!exp) {
      toast.error("Berufserfahrung nicht gefunden.");
      return;
    }

    const aufgabenOnly = aufgabenOnlyMode[idx] || false;

    // Save current state to history before making changes
    saveExperienceToHistory(idx, exp);

    setCorrectingExperienceIndex(idx);
    try {
      const correctedExp = await correctExperienceWithAI(exp, aufgabenOnly);

      // Update the entire experience entry
      setFormCv((prev) => {
        const next = [...prev.experience];
        next[idx] = correctedExp;
        return { ...prev, experience: sortTimelineItemsDesc(next) };
      });

      // Save the corrected state to history
      saveExperienceToHistory(idx, correctedExp);

      toast.success(
        aufgabenOnly
          ? "Aufgaben wurden erfolgreich korrigiert!"
          : "Berufserfahrung wurde erfolgreich korrigiert!",
      );
    } catch (error) {
      console.error("Error correcting experience:", error);
      toast.error(
        "Fehler beim Korrigieren: " + (error.message || "Unbekannter Fehler"),
      );
    } finally {
      setCorrectingExperienceIndex(null);
    }
  }

  // ── aufgaben-only toggle ──────────────────────────────────────────────

  function toggleAufgabenOnlyMode(idx) {
    setAufgabenOnlyMode((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }

  // ── undo / redo ───────────────────────────────────────────────────────

  function undoExperience(idx) {
    const history = experienceHistory[idx] || [];
    const currentIndex = experienceHistoryIndex[idx] ?? -1;

    if (currentIndex > 0) {
      const previousState = history[currentIndex - 1];

      setFormCv((prev) => {
        const next = [...prev.experience];
        next[idx] = previousState;
        return { ...prev, experience: sortTimelineItemsDesc(next) };
      });

      setExperienceHistoryIndex((prev) => ({
        ...prev,
        [idx]: currentIndex - 1,
      }));
    }
  }

  function redoExperience(idx) {
    const history = experienceHistory[idx] || [];
    const currentIndex = experienceHistoryIndex[idx] ?? -1;

    if (currentIndex < history.length - 1) {
      const nextState = history[currentIndex + 1];

      setFormCv((prev) => {
        const next = [...prev.experience];
        next[idx] = nextState;
        return { ...prev, experience: sortTimelineItemsDesc(next) };
      });

      setExperienceHistoryIndex((prev) => ({
        ...prev,
        [idx]: currentIndex + 1,
      }));
    }
  }

  function canUndoExperience(idx) {
    const currentIndex = experienceHistoryIndex[idx] ?? -1;
    return currentIndex > 0;
  }

  function canRedoExperience(idx) {
    const history = experienceHistory[idx] || [];
    const currentIndex = experienceHistoryIndex[idx] ?? -1;
    return currentIndex < history.length - 1;
  }

  // ── public API ────────────────────────────────────────────────────────

  return {
    // state
    correctingExperienceIndex,
    setCorrectingExperienceIndex,
    aufgabenOnlyMode,
    setAufgabenOnlyMode,
    experienceHistory,
    setExperienceHistory,
    experienceHistoryIndex,
    setExperienceHistoryIndex,

    // functions
    handleCorrectExperience,
    toggleAufgabenOnlyMode,
    saveExperienceToHistory,
    undoExperience,
    redoExperience,
    canUndoExperience,
    canRedoExperience,
  };
}
