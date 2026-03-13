import InfoRow from "./InfoRow";

export default function AdditionalInfoPanel({
  previewTitle,
  showAdditionalInfoEditor,
  additionalInfoForm,
  setAdditionalInfoForm,
  previewRows,
  useGeneratedLink,
  allowAutoGenerateTelegram,
  autoTelegramGroupLabel,
}) {
  return (
    <div className="bg-base-200/60 border border-base-300 rounded-lg p-4 space-y-3">
      <div className="font-semibold">
        {previewTitle || "Zur E-Mail hinzuzufügende Informationen"}
      </div>
      {showAdditionalInfoEditor ? (
        <AdditionalInfoEditor
          additionalInfoForm={additionalInfoForm}
          setAdditionalInfoForm={setAdditionalInfoForm}
          useGeneratedLink={useGeneratedLink}
          allowAutoGenerateTelegram={allowAutoGenerateTelegram}
          autoTelegramGroupLabel={autoTelegramGroupLabel}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {previewRows.map((row) => (
            <InfoRow
              key={`${row.label}-${row.value}`}
              label={row.label}
              value={row.value}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AdditionalInfoEditor({
  additionalInfoForm,
  setAdditionalInfoForm,
  useGeneratedLink,
  allowAutoGenerateTelegram,
  autoTelegramGroupLabel,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="form-control">
        <label className="label" htmlFor="stage-email-datetime">
          <span className="label-text font-medium">
            Datum / Uhrzeit
          </span>
        </label>
        <input
          id="stage-email-datetime"
          type="datetime-local"
          className="input input-bordered w-full"
          value={String(additionalInfoForm?.dateTime || "")}
          onChange={(e) =>
            setAdditionalInfoForm?.((prev) => ({
              ...(prev || {}),
              dateTime: e.target.value,
            }))
          }
        />
      </div>
      <div className="form-control">
        <div className="flex items-center gap-2">
          <label className="label" htmlFor="stage-email-link">
            <span className="label-text font-medium">Link</span>
          </label>
          <div className="flex items-center gap-2 mb-2">
            <input
              id="stage-email-link-generate"
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={useGeneratedLink}
              disabled={!allowAutoGenerateTelegram}
              onChange={(e) =>
                setAdditionalInfoForm?.((prev) => ({
                  ...(prev || {}),
                  useGeneratedLink: Boolean(e.target.checked),
                }))
              }
            />
            <label
              htmlFor="stage-email-link-generate"
              className={`text-sm ${
                allowAutoGenerateTelegram ? "" : "opacity-60"
              }`}
            >
              {allowAutoGenerateTelegram ? (
                <span className="text-xs opacity-70">
                  Telegram-Gruppenname:{" "}
                  <span className="font-semibold">
                    {String(autoTelegramGroupLabel || "—")}
                  </span>
                </span>
              ) : (
                <span className="text-xs opacity-60">
                  Gruppe: —
                </span>
              )}
            </label>
          </div>
        </div>
        <input
          id="stage-email-link"
          type="url"
          className="input input-bordered w-full"
          placeholder={
            useGeneratedLink && allowAutoGenerateTelegram
              ? "Einladungslink wird beim Senden automatisch erstellt"
              : "https://..."
          }
          value={String(additionalInfoForm?.link || "")}
          onChange={(e) =>
            setAdditionalInfoForm?.((prev) => ({
              ...(prev || {}),
              link: e.target.value,
            }))
          }
          disabled={
            useGeneratedLink && allowAutoGenerateTelegram
          }
        />
      </div>
      <div className="form-control">
        <label
          className="label"
          htmlFor="stage-email-locationName"
        >
          <span className="label-text font-medium">
            Standort (Name)
          </span>
        </label>
        <input
          id="stage-email-locationName"
          type="text"
          className="input input-bordered w-full"
          placeholder="z. B. ConsultingUZ Büro"
          value={String(additionalInfoForm?.locationName || "")}
          onChange={(e) =>
            setAdditionalInfoForm?.((prev) => ({
              ...(prev || {}),
              locationName: e.target.value,
            }))
          }
        />
      </div>
      <div className="form-control">
        <label
          className="label"
          htmlFor="stage-email-locationUrl"
        >
          <span className="label-text font-medium">
            Standort (URL)
          </span>
        </label>
        <input
          id="stage-email-locationUrl"
          type="url"
          className="input input-bordered w-full"
          placeholder="https://maps.app.goo.gl/..."
          value={String(additionalInfoForm?.locationUrl || "")}
          onChange={(e) =>
            setAdditionalInfoForm?.((prev) => ({
              ...(prev || {}),
              locationUrl: e.target.value,
            }))
          }
        />
      </div>
    </div>
  );
}
