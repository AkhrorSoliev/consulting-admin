import { useState } from "react";
import { createPortal } from "react-dom";
import { FaRegCopy, FaTelegram, FaLink } from "react-icons/fa";
import toast from "react-hot-toast";

export default function LinkCopyModal({
  open,
  onClose,
  regularLink,
  majorCode,
}) {
  const [copied, setCopied] = useState({ regular: false, telegram: false });

  if (!open) return null;
  if (typeof document === "undefined") return null;

  // Replace ß with ss for Telegram deep link compatibility
  const sanitizedMajorCode = majorCode
    ? String(majorCode).replace(/ß/g, "ss")
    : "";
  const telegramLink = sanitizedMajorCode
    ? `https://t.me/consultinguz_admin_bot?start=${encodeURIComponent(
        sanitizedMajorCode
      )}`
    : "";

  const handleCopy = async (link, type) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied((prev) => ({ ...prev, [type]: true }));
      toast.success(
        type === "regular" ? "Link nusxalandi!" : "Telegram link nusxalandi!"
      );
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (error) {
      toast.error("Link nusxalashda xatolik yuz berdi");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-base-content/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl bg-base-100 rounded-box shadow-xl p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold">Link nusxalash</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
            aria-label="Yopish"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-base-300 bg-base-200/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FaLink className="text-primary text-xl" />
              <h4 className="font-semibold">Oddiy link</h4>
            </div>
            <p className="text-sm opacity-70">
              Ushbu linkni to'g'ridan-to'g'ri kandidatlarga yuborish mumkin
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered flex-1 text-sm"
                value={regularLink}
                readOnly
              />
              <button
                type="button"
                className={`btn ${
                  copied.regular ? "btn-success" : "btn-primary"
                }`}
                onClick={() => handleCopy(regularLink, "regular")}
              >
                {copied.regular ? (
                  <>
                    <span>✓</span>
                    <span className="hidden sm:inline">Nusxalandi</span>
                  </>
                ) : (
                  <>
                    <FaRegCopy />
                    <span className="hidden sm:inline">Nusxalash</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-info bg-info/10 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FaTelegram className="text-info text-xl" />
              <h4 className="font-semibold">Telegram link</h4>
            </div>
            <p className="text-sm opacity-70">
              Ushbu link orqali kandidat botga kirib, o'z Telegram ID bilan
              ro'yxatdan o'tish linkini oladi
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered flex-1 text-sm"
                value={telegramLink}
                readOnly
              />
              <button
                type="button"
                className={`btn ${
                  copied.telegram ? "btn-success" : "btn-info"
                }`}
                onClick={() => handleCopy(telegramLink, "telegram")}
              >
                {copied.telegram ? (
                  <>
                    <span>✓</span>
                    <span className="hidden sm:inline">Nusxalandi</span>
                  </>
                ) : (
                  <>
                    <FaRegCopy />
                    <span className="hidden sm:inline">Nusxalash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>
            Yopish
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
