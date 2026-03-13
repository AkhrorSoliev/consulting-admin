export default function TemplateForm({
  form,
  setForm,
  saving,
  activeTemplate,
  onResetToDefault,
}) {
  return (
    <div className="space-y-3 min-w-0">
      <div className="rounded-box border border-base-300 bg-base-200/30 p-3 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <label className="form-control w-full">
            <div className="label py-0">
              <span className="label-text text-sm font-medium">
                E-Mail-Titel (HTML-Überschrift)
              </span>
            </div>
            <input
              className="input input-bordered w-full"
              value={form.emailTitle}
              onChange={(e) =>
                setForm((p) => ({ ...p, emailTitle: e.target.value }))
              }
              disabled={saving}
            />
          </label>

          <label className="form-control w-full">
            <div className="label py-0">
              <span className="label-text text-sm font-medium">Betreff</span>
            </div>
            <input
              className="input input-bordered w-full"
              value={form.subject}
              onChange={(e) =>
                setForm((p) => ({ ...p, subject: e.target.value }))
              }
              disabled={saving}
            />
          </label>

          <label className="form-control w-full">
            <div className="label py-0">
              <span className="label-text text-sm font-medium">
                Status (optional)
              </span>
            </div>
            <input
              className="input input-bordered w-full"
              placeholder="z. B.: Stufe 1 (internes Interview)"
              value={form.statusLabel}
              onChange={(e) =>
                setForm((p) => ({ ...p, statusLabel: e.target.value }))
              }
              disabled={saving}
            />
            <div className="label">
              <span className="label-text-alt text-xs text-base-content/60">
                Wenn leer, wird die Standard-Statusbezeichnung verwendet.
              </span>
            </div>
          </label>

          <label className="form-control w-full">
            <div className="label py-0">
              <span className="label-text text-sm font-medium">
                Haupttext
              </span>
            </div>
            <textarea
              className="textarea textarea-bordered w-full min-h-[110px]"
              value={form.mainText}
              onChange={(e) =>
                setForm((p) => ({ ...p, mainText: e.target.value }))
              }
              disabled={saving}
            />
          </label>

          <label className="form-control w-full">
            <div className="label py-0">
              <span className="label-text text-sm font-medium">
                Hinweis zum nächsten Schritt
              </span>
            </div>
            <textarea
              className="textarea textarea-bordered w-full min-h-[110px]"
              value={form.nextStepNote}
              onChange={(e) =>
                setForm((p) => ({ ...p, nextStepNote: e.target.value }))
              }
              disabled={saving}
            />
          </label>

          <label className="form-control w-full">
            <div className="label py-0">
              <span className="label-text text-sm font-medium">
                Text für Kontaktkanäle
              </span>
            </div>
            <textarea
              className="textarea textarea-bordered w-full min-h-[90px]"
              value={form.channelsText}
              onChange={(e) =>
                setForm((p) => ({ ...p, channelsText: e.target.value }))
              }
              disabled={saving}
            />
          </label>

          <label className="flex items-center gap-3 pt-1 select-none">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={Boolean(form.emphasizeMainText)}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  emphasizeMainText: e.target.checked,
                }))
              }
              disabled={saving}
            />
            <span className="text-sm">
              Haupttext <span className="font-semibold">fett</span>{" "}
              darstellen
            </span>
          </label>

          <div className="flex justify-stretch sm:justify-end">
            <button
              type="button"
              className="btn btn-error btn-outline w-full sm:w-auto whitespace-normal h-auto leading-snug"
              onClick={onResetToDefault}
              disabled={saving || !activeTemplate}
              title={
                activeTemplate
                  ? "Löscht die Überschreibung (Standardtexte werden wiederhergestellt)."
                  : "Keine Überschreibung vorhanden."
              }
            >
              Auf Standard zurücksetzen (Überschreibung löschen)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
