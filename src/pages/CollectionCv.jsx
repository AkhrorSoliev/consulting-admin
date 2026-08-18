/**
 * CollectionCv - Candidate list as a compact table.
 */

import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "../hooks/useUserRole";
import DeleteCandidateModal from "../components/DeleteCandidateModal";
import CollectionFilters from "./candidates/components/CollectionFilters";
import CollectionStatistics from "./collectionCv/CollectionStatistics";
import CollectionPagination from "./collectionCv/CollectionPagination";
import CollectionHeader from "./collectionCv/components/CollectionHeader";
import CandidateRow from "./collectionCv/components/CandidateRow";
import { NoDataState, NoResultsState } from "./collectionCv/components/EmptyStates";
import LoadingSkeleton from "./collectionCv/components/LoadingSkeleton";
import { useCollectionData } from "./collectionCv/hooks/useCollectionData";
import { useCollectionFilters } from "./collectionCv/hooks/useCollectionFilters";
import { useCandidateActions } from "./collectionCv/hooks/useCandidateActions";
import { useUserPhotos } from "./collectionCv/hooks/useUserPhotos";

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

  // Stable row callbacks so memoized rows are not invalidated every render.
  const latest = useRef(null);
  latest.current = { navigate, handleReaction, openDeleteModal, collectionName: resolvedMajor.collectionName };

  const onOpen = useCallback((id) => {
    latest.current.navigate(`/generate/${latest.current.collectionName}/${id}`);
  }, []);
  const onReaction = useCallback((id, type) => latest.current.handleReaction(id, type), []);
  const onDelete = useCallback((item) => latest.current.openDeleteModal(item), []);

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
                    {paginatedItems.map((item, idx) => (
                      <CandidateRow
                        key={item.id}
                        item={item}
                        rowNumber={startIndex + idx + 1}
                        emailPhoto={
                          userPhotosCache[item.emailLastSentByUid] ||
                          userPhotosCache[item.emailLastSentBy] ||
                          item.emailLastSentByPhoto || ""
                        }
                        isLimitedAdmin={isLimitedAdmin}
                        isSuperAdmin={isSuperAdmin}
                        isDeleting={deletingId === item.id}
                        onOpen={onOpen}
                        onReaction={onReaction}
                        onDelete={onDelete}
                      />
                    ))}
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
