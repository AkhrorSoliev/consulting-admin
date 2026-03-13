import { FaTelegramPlane } from "react-icons/fa";
import { FaRegCopy } from "react-icons/fa6";
import toast from "react-hot-toast";

function sanitizeMajorId(major) {
  const majorId =
    major?.linkId || major?.uuid || major?.id || major?.collectionName || major;
  return String(majorId)
    .replace(/\u00df/g, "ss")
    .replace(/\u00fc/g, "ue")
    .replace(/\u00f6/g, "oe")
    .replace(/\u00e4/g, "ae");
}

export default function MainLinksSection({
  major,
  isLinkActive,
  isTogglingLink,
  isLoading,
  createLink,
  onCopyLink,
  onToggleLinkActive,
}) {
  const rawMajorId =
    major?.linkId || major?.uuid || major?.id || major?.collectionName || major;
  const sanitizedMajorId = sanitizeMajorId(major);
  const telegramLink = `https://t.me/consultinguz_admin_bot?start=${sanitizedMajorId}`;

  return (
    <div className="rounded-xl border border-base-300 bg-base-200/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-base-content/70">Asosiy linklar</h3>
          <p className="text-xs text-base-content/50 mt-0.5">
            Ariza to'ldirish uchun asosiy linklar
          </p>
        </div>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={Boolean(isLinkActive)}
          onChange={(e) => onToggleLinkActive?.(e.target.checked)}
          disabled={Boolean(isTogglingLink)}
          aria-label="Asosiy linklar"
        />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-base-content/70">Web link</div>
        <button
          type="button"
          className="btn btn-outline w-full justify-between gap-3"
          onClick={onCopyLink}
          disabled={
            !isLinkActive ||
            !createLink ||
            Boolean(isTogglingLink) ||
            Boolean(isLoading)
          }
          title={createLink || ""}
        >
          <span className="truncate min-w-0">{createLink}</span>
          <span className="shrink-0">
            <FaRegCopy />
          </span>
        </button>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-base-content/70 flex items-center gap-2">
          <FaTelegramPlane className="text-primary" />
          Telegram link
        </div>
        <button
          type="button"
          className="btn btn-outline w-full justify-between gap-3"
          onClick={() => {
            navigator.clipboard
              .writeText(telegramLink)
              .then(() => toast.success("Telegram link nusxalandi!"))
              .catch(() => toast.error("Link nusxalanmadi."));
          }}
          disabled={
            !isLinkActive ||
            Boolean(isTogglingLink) ||
            Boolean(isLoading)
          }
          title={`https://t.me/consultinguz_admin_bot?start=${rawMajorId}`}
        >
          <span className="truncate min-w-0">
            https://t.me/consultinguz_admin_bot?start={rawMajorId}
          </span>
          <span className="shrink-0">
            <FaRegCopy />
          </span>
        </button>
      </div>
    </div>
  );
}
