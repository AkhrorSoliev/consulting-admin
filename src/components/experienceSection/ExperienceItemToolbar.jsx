import { Trash2 } from "lucide-react";

function ExperienceItemToolbar({
  idx,
  exp,
  renderItemActions,
  onCorrectExperience,
  correctingIndex,
  aufgabenOnlyMode,
  onToggleAufgabenOnly,
  onUndoExperience,
  onRedoExperience,
  canUndo,
  canRedo,
  onRemoveExperience,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-2 mb-3">
      {typeof renderItemActions === "function"
        ? renderItemActions(idx, exp)
        : null}

      {typeof onCorrectExperience === "function" && (
        <div className="flex items-center gap-2 relative">
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              className="checkbox checkbox-xs"
              checked={aufgabenOnlyMode[idx] || false}
              onChange={() => onToggleAufgabenOnly?.(idx)}
              disabled={correctingIndex === idx}
              title={
                aufgabenOnlyMode[idx]
                  ? "Korrigiert nur Aufgaben basierend auf Position, Unternehmen und Ort"
                  : ""
              }
            />
            <span className="text-xs opacity-70">Nur Aufgaben</span>
          </label>

          {/* Undo/Redo buttons - only visible when there are changes */}
          {(canUndo?.(idx) || canRedo?.(idx)) && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={() => onUndoExperience?.(idx)}
                disabled={!canUndo?.(idx) || correctingIndex === idx}
                title="Rückgängig"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={() => onRedoExperience?.(idx)}
                disabled={!canRedo?.(idx) || correctingIndex === idx}
                title="Wiederherstellen"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
                  />
                </svg>
              </button>
            </div>
          )}

          <button
            type="button"
            className="btn btn-sm btn-primary gap-2"
            onClick={() => onCorrectExperience(idx)}
            disabled={correctingIndex === idx}
            title="Mit KI korrigieren"
          >
            {correctingIndex === idx ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                Korrigieren...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                KI
              </>
            )}
          </button>
        </div>
      )}

      <button
        type="button"
        className="btn btn-ghost btn-xs text-error hover:bg-error/10"
        onClick={() => onRemoveExperience(idx)}
        title="Entfernen"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default ExperienceItemToolbar;
