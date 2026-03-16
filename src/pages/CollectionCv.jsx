/**
 * CollectionCv - Candidate list as a compact table.
 */

import { useNavigate } from "react-router-dom";
import {
  FaTrash, FaStar, FaCommentDots,
  FaThumbsUp, FaThumbsDown, FaEnvelope,
} from "react-icons/fa";
import { BsSendCheck } from "react-icons/bs";
import { HiMiniDocumentCheck } from "react-icons/hi2";
import { useUserRole } from "../hooks/useUserRole";
import DeleteCandidateModal from "../components/DeleteCandidateModal";
import CollectionFilters from "./candidates/components/CollectionFilters";
import CollectionStatistics from "./collectionCv/CollectionStatistics";
import CollectionPagination from "./collectionCv/CollectionPagination";
import CollectionHeader from "./collectionCv/components/CollectionHeader";
import UserAvatar from "./collectionCv/components/UserAvatar";
import { NoDataState, NoResultsState } from "./collectionCv/components/EmptyStates";
import LoadingSkeleton from "./collectionCv/components/LoadingSkeleton";
import { useCollectionData } from "./collectionCv/hooks/useCollectionData";
import { useCollectionFilters } from "./collectionCv/hooks/useCollectionFilters";
import { useCandidateActions } from "./collectionCv/hooks/useCandidateActions";
import { useUserPhotos } from "./collectionCv/hooks/useUserPhotos";
import { formatCreatedAt, toDateFromMetaCreatedAt } from "./collectionCv/utils";
import { formatRatingForUi } from "./generate/utils/ratingUtils";

/** Format date as DD.MM.YYYY only (no time) */
function formatDateOnly(value) {
  const d = toDateFromMetaCreatedAt(value);
  if (!d) return "\u2014";
  try {
    return new Intl.DateTimeFormat("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Tashkent",
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

const STATUS_SHORT = {
  stage_1: "1-bosqich",
  stage_2: "2-bosqich",
  stage_2_result: "2-bosqich+",
  stage_3: "3-bosqich",
  stage_4: "4-bosqich",
};

function CollectionCv() {
  const navigate = useNavigate();
  const { role } = useUserRole();
  const isLimitedAdmin = role === "limited_admin";
  const isSuperAdmin = role === "super_admin";

  const {
    items, loading, metaLoading, resolvedMajor, title,
    majorCreatedAtLabel, majorCreatedByLabel, statistics, leadStats,
  } = useCollectionData();

  const {
    searchQuery, setSearchQuery,
    filteredItems, filters, setFilter,
    currentPage, setCurrentPage, totalPages,
    startIndex, endIndex, paginatedItems,
    uniqueCommentAuthors, commentAuthorFilter, setCommentAuthorFilter,
  } = useCollectionFilters(items);

  const { userPhotosCache } = useUserPhotos(items);

  const {
    deletingId, deleteModalOpen, deleteTarget,
    openDeleteModal, closeDeleteModal, confirmDelete, confirmArchive,
    handleReaction,
    exporting, exportingFull,
    handleExportExcel, handleExportFullExcel,
  } = useCandidateActions({
    resolvedMajor, items, filteredItems, title, isLimitedAdmin, isSuperAdmin,
  });

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <DeleteCandidateModal
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        onDelete={confirmDelete}
        onArchive={confirmArchive}
        candidateName={deleteTarget?.name}
        isDeleting={Boolean(deletingId)}
      />

      <CollectionHeader
        title={title}
        loading={loading}
        filteredCount={filteredItems.length}
        metaLoading={metaLoading}
        majorCreatedAtLabel={majorCreatedAtLabel}
        majorCreatedByLabel={majorCreatedByLabel}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        exporting={exporting}
        exportingFull={exportingFull}
        itemsCount={items.length}
        onExportExcel={handleExportExcel}
        onExportFullExcel={handleExportFullExcel}
      />

      {loading ? (
        <LoadingSkeleton />
      ) : items.length === 0 ? (
        <NoDataState />
      ) : (
        <>
          <CollectionStatistics
            statistics={statistics}
            leadStats={leadStats}
            loading={loading}
            items={items}
            uniqueCommentAuthors={uniqueCommentAuthors}
            commentAuthorFilter={commentAuthorFilter}
            setCommentAuthorFilter={setCommentAuthorFilter}
          />

          <CollectionFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={filters}
            setFilter={setFilter}
          />

          {filteredItems.length === 0 ? (
            <NoResultsState onReset={() => setSearchQuery("")} />
          ) : (
            <>
          <div className="overflow-x-auto rounded-xl border border-base-300 shadow-sm">
            <table className="table table-zebra table-sm w-full">
              <thead>
                <tr className="bg-neutral text-neutral-content">
                  <th className="w-10 border-r border-neutral-content/10">#</th>
                  <th>Kandidat</th>
                  <th className="w-16 text-center">Alter</th>
                  <th className="w-40">Status</th>
                  <th className="w-36 text-center">Erstellt</th>
                  <th className="w-32">Info</th>
                  <th className="w-24 text-center">Bewertung</th>
                  <th className="w-24 text-center">Reaktion</th>
                  {!isLimitedAdmin && <th className="w-12"></th>}
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, idx) => {
                  const stLabel = STATUS_SHORT[item.statusValue] || item.statusLabel;

                  const emailPhoto =
                    userPhotosCache[item.emailLastSentByUid] ||
                    userPhotosCache[item.emailLastSentBy] ||
                    item.emailLastSentByPhoto || "";

                  const emailTooltip = item.emailSentCount > 0
                    ? `E-Mails: ${item.emailSentCount}${item.emailLastSentAt ? ` \u2022 Zuletzt: ${formatCreatedAt(item.emailLastSentAt)}` : ""}${item.emailLastSentByName ? ` \u2022 Von: ${item.emailLastSentByName}` : ""}`
                    : "Keine E-Mails gesendet";

                  const commentTooltip = item.hasComment
                    ? `Kommentar${item.commentUpdatedByName ? ` von ${item.commentUpdatedByName}` : ""}${item.commentUpdatedAt ? ` \u2022 ${formatCreatedAt(item.commentUpdatedAt)}` : ""}`
                    : "";

                  return (
                    <tr
                      key={item.id}
                      className="cursor-pointer transition-colors hover:bg-primary/5"
                      onClick={() => navigate(`/generate/${resolvedMajor.collectionName}/${item.id}`)}
                    >
                      {/* # */}
                      <td className="text-base-content/40 border-r border-base-300/50">
                        {startIndex + idx + 1}
                      </td>

                      {/* Kandidat: avatar + name */}
                      <td>
                        <div className="flex items-center gap-2">
                          {item.photo ? (
                            <div className="avatar">
                              <div className="w-10 h-10 rounded-full">
                                <img src={item.photo} alt={item.name} className="object-cover" />
                              </div>
                            </div>
                          ) : (
                            <div className="avatar placeholder">
                              <div className="w-10 h-10 rounded-full bg-neutral text-neutral-content text-sm font-semibold">
                                <span>{(item.name || "?").charAt(0).toUpperCase()}</span>
                              </div>
                            </div>
                          )}
                          <span className="font-medium truncate max-w-[200px]">
                            {item.name || "Ohne Namen"}
                          </span>
                        </div>
                      </td>

                      {/* Alter */}
                      <td className="text-center">
                        {item.age ?? <span>&mdash;</span>}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`badge badge-sm badge-${item.statusTone}`}
                          title={item.statusLabel}
                        >
                          {stLabel}
                        </span>
                      </td>

                      {/* Erstellt */}
                      <td className="text-center text-xs text-base-content/60">
                        {formatDateOnly(item.createdAt)}
                      </td>

                      {/* Info: email sender, lead, doc, comment */}
                      <td>
                        <div className="flex items-center gap-1.5">
                          {/* Email sent info */}
                          {item.emailSentCount > 0 ? (
                            <div className="inline-flex items-center gap-1" title={emailTooltip}>
                              <UserAvatar
                                photoUrl={emailPhoto}
                                name={item.emailLastSentByName}
                                colorClass="bg-primary text-primary-content"
                              />
                              <FaEnvelope className="w-3 h-3 text-accent" />
                              <span className="text-xs font-semibold tabular-nums">
                                {item.emailSentCount}
                              </span>
                            </div>
                          ) : (
                            <span className="text-base-content/30" title="Hali email yuborilmagan">&mdash;</span>
                          )}

                          {item.documentReady && (
                            <HiMiniDocumentCheck
                              className="text-success w-3.5 h-3.5"
                              title="Hujjat tayyor"
                            />
                          )}
                          {item.isDocumentSend && (
                            <BsSendCheck
                              className="text-info w-3.5 h-3.5"
                              title="Hujjat yuborilgan"
                            />
                          )}
                          {item.hasComment && (
                            <FaCommentDots
                              className="text-success w-3.5 h-3.5"
                              title={commentTooltip}
                            />
                          )}
                        </div>
                      </td>

                      {/* Bewertung */}
                      <td className="text-center">
                        {item.rating !== null ? (
                          <span
                            className="inline-flex items-center gap-1"
                            title={`Bewertung: ${formatRatingForUi(item.rating)}`}
                          >
                            <FaStar className="text-warning w-3 h-3" />
                            <span className="text-xs font-semibold tabular-nums">
                              {formatRatingForUi(item.rating)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-base-content/30">&mdash;</span>
                        )}
                      </td>

                      {/* Reaktion */}
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            className={[
                              "btn btn-xs btn-circle",
                              item.reaction === "like" ? "btn-success text-white" : "btn-ghost",
                              !isSuperAdmin ? "opacity-50 cursor-not-allowed" : "",
                            ].join(" ")}
                            onClick={() => handleReaction(item.id, "like")}
                            disabled={deletingId === item.id || !isSuperAdmin}
                            title={isSuperAdmin ? "Yoqdi" : "Faqat super_admin uchun"}
                          >
                            <FaThumbsUp className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            className={[
                              "btn btn-xs btn-circle",
                              item.reaction === "dislike" ? "btn-error text-white" : "btn-ghost",
                              !isSuperAdmin ? "opacity-50 cursor-not-allowed" : "",
                            ].join(" ")}
                            onClick={() => handleReaction(item.id, "dislike")}
                            disabled={deletingId === item.id || !isSuperAdmin}
                            title={isSuperAdmin ? "Yoqmadi" : "Faqat super_admin uchun"}
                          >
                            <FaThumbsDown className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>

                      {/* Delete */}
                      {!isLimitedAdmin && (
                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs btn-circle text-error/70 hover:text-error"
                            onClick={() => openDeleteModal(item)}
                            disabled={deletingId === item.id}
                            title="O'chirish"
                          >
                            {deletingId === item.id ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <FaTrash className="w-3 h-3" />
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <CollectionPagination
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={filteredItems.length}
            onPageChange={setCurrentPage}
          />
          </>
          )}
        </>
      )}
    </div>
  );
}

export default CollectionCv;
