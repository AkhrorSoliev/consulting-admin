import { FaTelegramPlane } from "react-icons/fa";
import { FaLink, FaRegCopy, FaTrash } from "react-icons/fa6";
import toast from "react-hot-toast";

export default function LeadLinkCard({
  id,
  leadName,
  leadActive,
  leadUrl,
  leadTelegramLink,
  canCopy,
  isSavingLeads,
  leadLinksActive,
  onToggle,
  onDelete,
}) {
  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-3 space-y-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-base truncate">
            {leadName || "Lead"}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="checkbox"
            className="toggle toggle-secondary toggle-sm"
            checked={leadActive}
            onChange={async (e) => onToggle(id, e.target.checked)}
            disabled={isSavingLeads || !leadLinksActive}
            aria-label="Leadni aktiv qilish"
            title="Lead ON/OFF"
          />
          <button
            type="button"
            className="btn btn-outline btn-error btn-xs"
            onClick={() => onDelete({ id, name: leadName || "Lead" })}
            disabled={isSavingLeads || !leadLinksActive}
            aria-label="Leadni o'chirish"
            title="Delete"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="text-xs font-medium text-base-content/60 flex items-center gap-1">
            <FaLink className="h-3 w-3" />
            Web link
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm w-full justify-between gap-2 text-xs"
            onClick={() => {
              if (!canCopy || !leadUrl) {
                toast.error("Lead link aktiv emas yoki mavjud emas.");
                return;
              }
              navigator.clipboard
                .writeText(leadUrl)
                .then(() => toast.success("Web link nusxalandi!"))
                .catch(() => toast.error("Link nusxalanmadi."));
            }}
            disabled={!canCopy || isSavingLeads || !leadUrl}
            title={leadUrl || ""}
          >
            <span className="truncate text-left">
              {leadUrl ? "Nusxalash" : "Link yo'q"}
            </span>
            <FaRegCopy className="shrink-0" />
          </button>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-base-content/60 flex items-center gap-1">
            <FaTelegramPlane className="h-3 w-3 text-primary" />
            Telegram link
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm w-full justify-between gap-2 text-xs"
            onClick={() => {
              if (!canCopy) {
                toast.error("Lead link aktiv emas.");
                return;
              }
              navigator.clipboard
                .writeText(leadTelegramLink)
                .then(() => toast.success("Telegram link nusxalandi!"))
                .catch(() => toast.error("Link nusxalanmadi."));
            }}
            disabled={!canCopy || isSavingLeads}
            title={leadTelegramLink}
          >
            <span className="truncate text-left">Nusxalash</span>
            <FaRegCopy className="shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
