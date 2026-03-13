import { FaGlobe, FaChevronRight, FaTelegramPlane } from "react-icons/fa";

/**
 * Thank-you card displayed after successful submission.
 */
export default function ThankYouCard() {
  return (
    <div className="space-y-4 text-center">
      <h2 className="card-title text-3xl font-bold w-full justify-center text-center">
        Vielen Dank!
      </h2>
      <p>
        Ihre Bewerbung wurde erfolgreich abgeschlossen. Vielen Dank f{"\u00FC"}r Ihre Bewerbung
      </p>
      <div className="w-full pt-4">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 text-left shadow-sm">
          <div className="text-center">
            <div className="text-sm font-semibold leading-tight">
              Empfehlung:{" "}
              <span className="text-base-content">DaF Sprachzentrum</span>
            </div>
            <div className="mt-1 text-sm text-base-content/70">
              Unsere Deutschkurse in ganz Usbekistan.
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <a
              href="https://www.dafzentrum.uz" target="_blank" rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3 hover:bg-base-200/60"
              aria-label="DaF Sprachzentrum Website \u00F6ffnen"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FaGlobe className="text-base" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">Website</div>
                <div className="text-xs text-base-content/60 truncate">dafzentrum.uz</div>
              </div>
              <FaChevronRight className="text-sm opacity-50 group-hover:opacity-80" />
            </a>
            <a
              href="https://t.me/dafsprachzentrum" target="_blank" rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3 hover:bg-base-200/60"
              aria-label="DaF Sprachzentrum Telegram-Kanal \u00F6ffnen"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#229ED9]/10 text-[#229ED9]">
                <FaTelegramPlane className="text-base" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">Telegram</div>
                <div className="text-xs text-base-content/60 truncate">@dafsprachzentrum</div>
              </div>
              <FaChevronRight className="text-sm opacity-50 group-hover:opacity-80" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
