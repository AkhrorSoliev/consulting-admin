import { FaTelegramPlane } from "react-icons/fa";

/**
 * Full-page display when the major link is blocked/inactive.
 */
export default function LinkBlockedPage() {
  return (
    <div className="min-h-screen bg-base-200" data-theme="winter">
      <div className="max-w-3xl mx-auto min-h-screen grid place-items-center p-4">
        <div className="card bg-base-100 shadow w-full max-w-lg">
          <div className="card-body items-center text-center space-y-4">
            <div className="text-6xl">{"\u26A0\uFE0F"}</div>
            <h2 className="text-2xl font-bold">
              Ushbu yo{"\u2018"}nalish vaqtincha faol emas
            </h2>
            <div className="space-y-2">
              <p className="text-lg font-medium flex items-center justify-center gap-2">
                {"\uD83D\uDCE2"} Yangi yo{"\u2018"}nalishlar va e{"\u2018"}lonlar uchun:
              </p>
              <p className="text-base opacity-80">
                {"\uD83D\uDC49"} @Consulting_UZB kanaliga a{"\u2018"}zo bo{"\u2018"}ling
              </p>
            </div>
            <a
              href="https://t.me/Consulting_UZB"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg gap-2 mt-4"
            >
              <FaTelegramPlane className="text-xl" />
              Kanalga o{"\u2018"}tish
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
