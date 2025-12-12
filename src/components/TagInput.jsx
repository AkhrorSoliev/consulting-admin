import { useState } from "react";

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  display = "chips",
  inputMode = "input",
  hideInput = false,
}) {
  const [value, setValue] = useState("");

  function commit() {
    if (!value.trim()) return;
    if (inputMode === "textarea") {
      const lines = value
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (!lines.length) return;
      lines.forEach((line) => onAdd(line));
    } else {
      onAdd(value.trim());
    }
    setValue("");
  }

  function handleKeyDown(e) {
    if (inputMode === "input" && (e.key === "Enter" || e.key === ",")) {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !value && tags.length) {
      onRemove(tags.length - 1);
    }
  }

  return (
    <div className="space-y-2">
      {display === "list" ? (
        <ul className="list-disc pl-5 space-y-1">
          {tags.map((tag, idx) => (
            <li key={idx} className="break-words">
              <span className="align-middle">{tag}</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs text-error ml-2 align-middle"
                onClick={() => onRemove(idx)}
                aria-label="Entfernen"
                title="Entfernen"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag, idx) => (
            <span key={idx} className="badge badge-neutral gap-2">
              {tag}
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => onRemove(idx)}
                aria-label="Entfernen"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      {!hideInput &&
        (inputMode === "textarea" ? (
          <div className="flex flex-col gap-2">
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              placeholder={
                placeholder ||
                "Text eingeben. Mehrere Zeilen = mehrere Einträge."
              }
              aria-label={placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={commit}
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                aria-label="Hinzufügen"
                title="Hinzufügen"
                onClick={commit}
                disabled={!value.trim()}
              >
                Hinzufügen
              </button>
            </div>
          </div>
        ) : (
          <div className="join w-full">
            <input
              className="input input-bordered join-item w-full"
              placeholder={placeholder}
              aria-label={placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={commit}
            />
            <button
              type="button"
              className="btn btn-primary join-item"
              aria-label="Hinzufügen"
              title="Hinzufügen"
              onClick={commit}
              disabled={!value.trim()}
            >
              Hinzufügen
            </button>
          </div>
        ))}
    </div>
  );
}

export default TagInput;


