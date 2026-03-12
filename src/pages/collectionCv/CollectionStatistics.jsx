import {
  FaChartLine,
  FaCommentDots,
  FaComments,
  FaEnvelope,
  FaEnvelopeOpen,
  FaTelegram,
  FaUsers,
} from "react-icons/fa";

export default function CollectionStatistics({
  title,
  statistics,
  leadStats,
  loading,
  items,
  uniqueCommentAuthors,
  commentAuthorFilter,
  setCommentAuthorFilter,
}) {
  return (
    <>
      {statistics && (
        <div className="mb-6">
          <div className="bg-base-100 rounded-xl border border-base-300/60 shadow-sm p-3">
            <h3 className="text-xs font-semibold uppercase text-base-content/60 mb-2 flex items-center gap-2">
              <FaChartLine className="text-primary/60" />
              Statistik für {title}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="text-center p-2 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary tabular-nums">
                  <FaUsers className="text-sm" />
                  {statistics.total}
                </div>
                <div className="text-xs text-base-content/60">Gesamt</div>
              </div>
              <div className="text-center p-2 bg-success/5 rounded-lg border border-success/20">
                <div className="flex items-center justify-center gap-1 text-lg font-bold text-success tabular-nums">
                  <FaEnvelope className="text-sm" />
                  {statistics.withEmail}
                </div>
                <div className="text-xs text-base-content/60">E-Mail</div>
              </div>
              <div className="text-center p-2 bg-warning/5 rounded-lg border border-warning/20">
                <div className="flex items-center justify-center gap-1 text-lg font-bold text-warning tabular-nums">
                  <FaEnvelopeOpen className="text-sm" />
                  {statistics.withoutEmail}
                </div>
                <div className="text-xs text-base-content/60">
                  Keine E-Mail
                </div>
              </div>
              <div className="text-center p-2 bg-info/5 rounded-lg border border-info/20">
                <div className="flex items-center justify-center gap-1 text-lg font-bold text-info tabular-nums">
                  <FaComments className="text-sm" />
                  {statistics.withComment}
                </div>
                <div className="text-xs text-base-content/60">Kommentar</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-base-300/30">
              <div className="flex justify-between items-center text-xs text-base-content/60">
                <span className="flex items-center gap-1">
                  <FaCommentDots className="text-xs opacity-60" />
                  Ohne:{" "}
                  <span className="font-semibold text-base-content/80">
                    {statistics.withoutComment}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <FaChartLine className="text-xs opacity-60" />
                  Rate:{" "}
                  <span className="font-semibold text-base-content/80">
                    {statistics.total > 0
                      ? Math.round(
                          (statistics.withEmail / statistics.total) * 100,
                        )
                      : 0}
                    %
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead & Telegram Statistics */}
      {!loading &&
        items.length > 0 &&
        (leadStats.telegramCount > 0 || leadStats.leadList.length > 0) && (
          <div className="mb-6 p-4 rounded-box border border-base-300 bg-base-100 shadow-sm">
            <div className="flex flex-wrap gap-4 items-start">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <span className="font-semibold text-primary">
                  {leadStats.total}
                </span>
                <span className="text-sm text-base-content/70">Gesamt</span>
              </div>
              {leadStats.telegramCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0088cc]/10 border border-[#0088cc]/20">
                  <FaTelegram className="w-5 h-5 text-[#0088cc]" />
                  <span className="font-semibold text-[#0088cc]">
                    {leadStats.telegramCount}
                  </span>
                  <span className="text-sm text-base-content/70">
                    Telegram
                  </span>
                </div>
              )}
              {leadStats.leadList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {leadStats.leadList.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20"
                    >
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {item.count}
                      </span>
                      <span className="text-sm text-purple-600 dark:text-purple-400">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      {/* Comment Author Filter */}
      {!loading && uniqueCommentAuthors.length > 0 && (
        <div className="mb-6 p-4 rounded-box border border-base-300 bg-base-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-semibold uppercase text-base-content/60 shrink-0 flex items-center gap-2">
              <FaCommentDots className="text-success" />
              Kommentar von:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`btn btn-xs ${
                  commentAuthorFilter === "all"
                    ? "btn-primary"
                    : "btn-ghost hover:bg-base-200"
                }`}
                onClick={() => setCommentAuthorFilter("all")}
              >
                Alle
              </button>
              {uniqueCommentAuthors.map((author) => (
                <button
                  key={author}
                  type="button"
                  className={`btn btn-xs ${
                    commentAuthorFilter === author
                      ? "btn-primary"
                      : "btn-ghost hover:bg-base-200"
                  }`}
                  onClick={() => setCommentAuthorFilter(author)}
                >
                  {author}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
