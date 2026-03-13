import toast from "react-hot-toast";

export default function ChannelRow({
  row,
  generatingLink,
  handleGenerateLink,
  toggleActive,
  upsertByChatId,
}) {
  const name = String(row?.name || "").trim();
  const docId = String(row?.docId || "").trim();
  const checked = row?.active === true;
  const gen = Number(row?.linksGeneratedCount);
  const sent = Number(row?.linksDispatchedCount);
  const safeGen = Number.isFinite(gen) ? gen : 0;
  const safeSent = Number.isFinite(sent) ? sent : 0;
  const showStats = row?.source === "firestore";
  const hasChat = Boolean(String(row?.chat_id || "").trim());

  return (
    <div
      key={row.key}
      className="p-3 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{name || "—"}</div>
        {hasChat && (
          <div className="text-xs font-mono opacity-50 select-all">
            chat_id: {row.chat_id}
          </div>
        )}
        {showStats && (
          <div className="text-xs opacity-70">
            Generated:{" "}
            <span className="font-mono font-semibold">
              {safeGen}
            </span>{" "}
            · Sent:{" "}
            <span className="font-mono font-semibold">
              {safeSent}
            </span>
            {!hasChat && (
              <span className="opacity-70">
                {" "}
                · Sozlanmagan
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {docId && checked && (
          <button
            type="button"
            className="btn btn-xs btn-outline btn-info"
            onClick={() => handleGenerateLink(docId)}
            disabled={generatingLink[docId]}
            title="Link yaratish"
          >
            {generatingLink[docId] ? "..." : "🔗 Link"}
          </button>
        )}
        <label className="label cursor-pointer gap-2">
          <span className="text-sm">Active</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={checked}
            onChange={async (e) => {
              const next = Boolean(e.target.checked);
              try {
                if (docId) {
                  await toggleActive(docId, next);
                  return;
                }
                if (!next) return;
                await upsertByChatId({
                  name: name || "",
                  chat_id: row.chat_id,
                  active: true,
                });
                toast.success("Tizimga qo'shildi.");
              } catch (err) {
                toast.error("O'zgartirib bo'lmadi.");
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}
