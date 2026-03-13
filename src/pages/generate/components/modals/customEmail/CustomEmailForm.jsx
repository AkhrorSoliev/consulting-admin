import React from "react";
import CollapsibleSection from "../../../../../components/CollapsibleSection";
import EmailPreview from "./EmailPreview";

export default function CustomEmailForm({
  onSubmit,
  isSending,
  onClose,
  safeForm,
  setForm,
  safePlaceholders,
  emailPreview,
}) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="form-control">
          <label className="label" htmlFor="custom-email-to">
            <span className="label-text font-medium">An</span>
          </label>
          <input
            id="custom-email-to"
            type="email"
            className="input input-bordered w-full"
            value={String(safeForm.to || "")}
            placeholder="nomzod@email.com"
            onChange={(e) =>
              setForm?.((prev) => ({
                ...(prev || {}),
                to: e.target.value,
              }))
            }
          />
        </div>

        <div className="form-control">
          <label className="label" htmlFor="custom-email-title">
            <span className="label-text font-medium">E-Mail-Titel</span>
          </label>
          <input
            id="custom-email-title"
            type="text"
            className="input input-bordered w-full"
            value={String(safeForm.emailTitle || "")}
            placeholder={String(safePlaceholders.emailTitle || "")}
            onChange={(e) =>
              setForm?.((prev) => ({
                ...(prev || {}),
                emailTitle: e.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="form-control">
        <label className="label" htmlFor="custom-email-subject">
          <span className="label-text font-medium">Betreff</span>
        </label>
        <input
          id="custom-email-subject"
          type="text"
          className="input input-bordered w-full"
          value={String(safeForm.subject || "")}
          placeholder={String(safePlaceholders.subject || "")}
          onChange={(e) =>
            setForm?.((prev) => ({
              ...(prev || {}),
              subject: e.target.value,
            }))
          }
        />
        <div className="text-xs opacity-60 mt-1">
          Optional: Wenn leer, wird der Standard-Betreff verwendet.
        </div>
      </div>

      <div className="form-control">
        <label className="label" htmlFor="custom-email-body">
          <span className="label-text font-medium">Text</span>
        </label>
        <textarea
          id="custom-email-body"
          className="textarea textarea-bordered w-full min-h-[160px]"
          value={String(safeForm.bodyText || "")}
          placeholder={String(safePlaceholders.bodyText || "")}
          onChange={(e) =>
            setForm?.((prev) => ({
              ...(prev || {}),
              bodyText: e.target.value,
            }))
          }
        />
        <div className="text-xs opacity-60 mt-1">
          Tipp: Trennen Sie „Haupttext" und „Nächster Schritt" mit{" "}
          <span className="font-mono">\n\n</span>.
        </div>
      </div>

      {emailPreview ? (
        <CollapsibleSection
          title="E-Mail-Vorschau (so wird sie aussehen)"
          defaultOpen={false}
          className="bg-base-200/60"
        >
          <EmailPreview
            to={emailPreview?.to}
            subject={emailPreview?.subject}
            htmlContent={emailPreview?.htmlContent}
            message={emailPreview?.message}
          />
        </CollapsibleSection>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn" onClick={onClose}>
          Abbrechen
        </button>
        <button type="submit" className="btn btn-primary">
          {isSending ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              Wird gesendet...
            </>
          ) : (
            "Senden"
          )}
        </button>
      </div>
    </form>
  );
}
