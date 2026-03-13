export default function InterviewTabForm({
  idPrefix,
  date,
  setDate,
  link,
  setLink,
  linkType,
  setLinkType,
  locationName,
  setLocationName,
  locationUrl,
  setLocationUrl,
  telegramGroupId,
  setTelegramGroupId,
  tgGroups,
  inviteLoading,
  onGenerateInvite,
  isSaving,
  telegramLabel,
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="form-control">
          <label className="label" htmlFor={`${idPrefix}-date`}>
            <span className="label-text">Sana</span>
          </label>
          <input
            id={`${idPrefix}-date`}
            type="datetime-local"
            className="input input-bordered w-full"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <div className="form-control">
          <div className="label flex items-center justify-between">
            <span className="label-text">Havola</span>
            <div className="join join-sm">
              <button
                type="button"
                className={`btn btn-xs join-item ${
                  linkType === "zoom" ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => setLinkType("zoom")}
                disabled={isSaving}
              >
                Zoom
              </button>
              <button
                type="button"
                className={`btn btn-xs join-item ${
                  linkType === "telegram" ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => setLinkType("telegram")}
                disabled={isSaving}
              >
                Telegram
              </button>
            </div>
          </div>
          {linkType === "telegram" ? (
            <div className="space-y-2">
              <select
                id={`${idPrefix}-telegram-group`}
                className="select select-bordered w-full"
                value={telegramGroupId}
                onChange={(e) => setTelegramGroupId(e.target.value)}
                disabled={isSaving || tgGroups.length === 0}
              >
                <option value="">
                  {telegramLabel || "Telegram group"} — (tanlanmagan)
                </option>
                {tgGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {String(g?.name || g.id)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-outline w-full"
                onClick={onGenerateInvite}
                disabled={!telegramGroupId || inviteLoading || isSaving}
              >
                {inviteLoading
                  ? "Invite yaratilmoqda..."
                  : "Invite link yaratish va copy"}
              </button>
            </div>
          ) : (
            <input
              id={`${idPrefix}-link`}
              type="url"
              className="input input-bordered w-full"
              placeholder="https://zoom.us/j/..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={isSaving}
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="form-control">
          <label className="label" htmlFor={`${idPrefix}-location-name`}>
            <span className="label-text">Lokatsiya nomi (ixtiyoriy)</span>
          </label>
          <input
            id={`${idPrefix}-location-name`}
            type="text"
            className="input input-bordered w-full"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <div className="form-control">
          <label className="label" htmlFor={`${idPrefix}-location-url`}>
            <span className="label-text">Lokatsiya havolasi (ixtiyoriy)</span>
          </label>
          <input
            id={`${idPrefix}-location-url`}
            type="url"
            className="input input-bordered w-full"
            value={locationUrl}
            onChange={(e) => setLocationUrl(e.target.value)}
            disabled={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
