import { FaCommentDots, FaEnvelope, FaEnvelopeOpen, FaTelegram, FaUsers } from "react-icons/fa";

export default function CollectionStatistics({
  statistics,
  leadStats,
  loading,
  items,
  uniqueCommentAuthors,
  commentAuthorFilter,
  setCommentAuthorFilter,
}) {
  const showLeadRow =
    !loading &&
    items.length > 0 &&
    (leadStats.telegramCount > 0 || leadStats.leadList.length > 0);

  const showCommentFilter = !loading && uniqueCommentAuthors.length > 0;

  if (!statistics && !showLeadRow && !showCommentFilter) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {/* Core stats */}
      {statistics && (
        <>
          <span className="badge badge-primary gap-1" title="Jami kandidatlar soni">
            <FaUsers className="text-xs" />
            {statistics.total}
          </span>
          <span className="badge badge-success gap-1" title="Email yuborilgan kandidatlar">
            <FaEnvelope className="text-xs" />
            {statistics.withEmail}
          </span>
          <span className="badge badge-warning gap-1" title="Email yuborilmagan kandidatlar">
            <FaEnvelopeOpen className="text-xs" />
            {statistics.withoutEmail}
          </span>
          <span className="badge badge-info gap-1" title="Izoh yozilgan kandidatlar">
            <FaCommentDots className="text-xs" />
            {statistics.withComment}
          </span>
        </>
      )}

      {/* Telegram & Leads */}
      {showLeadRow && (
        <>
          {leadStats.telegramCount > 0 && (
            <span className="badge badge-info badge-outline gap-1" title="Telegram orqali ro'yxatdan o'tganlar">
              <FaTelegram className="text-xs" />
              {leadStats.telegramCount}
            </span>
          )}
          {leadStats.leadList.map((item) => (
            <span
              key={item.name}
              className="badge badge-secondary badge-outline gap-1"
            >
              {item.name}: {item.count}
            </span>
          ))}
        </>
      )}

      {/* Separator + Comment author filter */}
      {showCommentFilter && (
        <>
          <span className="text-base-content/20">|</span>
          <span className="text-xs text-base-content/50 flex items-center gap-1">
            <FaCommentDots className="text-success text-xs" />
            Von:
          </span>
          <button
            type="button"
            className={`badge badge-xs cursor-pointer ${
              commentAuthorFilter === "all" ? "badge-primary" : "badge-ghost"
            }`}
            onClick={() => setCommentAuthorFilter("all")}
          >
            Alle
          </button>
          {uniqueCommentAuthors.map((author) => (
            <button
              key={author}
              type="button"
              className={`badge badge-xs cursor-pointer ${
                commentAuthorFilter === author ? "badge-primary" : "badge-ghost"
              }`}
              onClick={() => setCommentAuthorFilter(author)}
            >
              {author}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
