import { FaVideo, FaTelegramPlane } from "react-icons/fa";

/**
 * Desktop-only floating action buttons (guide + support).
 */
export default function DesktopFloatingActions({ setIsGuideOpen, TELEGRAM_SUPPORT_URL }) {
  return (
    <div className="fixed bottom-20 right-4 z-40 hidden lg:flex flex-col gap-3">
      <button
        type="button"
        className="btn btn-primary btn-circle shadow-lg"
        aria-label="Video-Guide öffnen"
        onClick={() => setIsGuideOpen(true)}
      >
        <FaVideo className="text-xl" />
        <span className="sr-only">Video-Guide</span>
      </button>
      <button
        type="button"
        className="btn btn-secondary btn-circle shadow-lg"
        aria-label="Support via Telegram"
        onClick={() => window.open(TELEGRAM_SUPPORT_URL, "_blank", "noopener,noreferrer")}
      >
        <FaTelegramPlane className="text-xl" />
        <span className="sr-only">Support Chat</span>
      </button>
    </div>
  );
}
