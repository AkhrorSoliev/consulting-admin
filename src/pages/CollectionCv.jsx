/**
 * CollectionCv - thin shell that composes sub-components from ./collectionCv/.
 */

import { useNavigate } from "react-router-dom";
import { useUserRole } from "../hooks/useUserRole";
import DeleteCandidateModal from "../components/DeleteCandidateModal";
import CollectionFilters from "./candidates/components/CollectionFilters";
import CollectionStatistics from "./collectionCv/CollectionStatistics";
import CollectionPagination from "./collectionCv/CollectionPagination";
import CollectionHeader from "./collectionCv/components/CollectionHeader";
import CandidateCardItem from "./collectionCv/components/CandidateCardItem";
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
    deletingId, deleteModalOpen, setDeleteModalOpen, deleteTarget,
    openDeleteModal, handleDelete, handleReaction,
    exporting, exportingFull,
    handleExportExcel, handleExportFullExcel,
  } = useCandidateActions({
    resolvedMajor, items, filteredItems, title, isLimitedAdmin, isSuperAdmin,
  });

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <DeleteCandidateModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        candidateName={deleteTarget?.name}
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

      <CollectionStatistics
        title={title}
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

      {loading ? (
        <LoadingSkeleton />
      ) : items.length === 0 ? (
        <NoDataState />
      ) : filteredItems.length === 0 ? (
        <NoResultsState onReset={() => setSearchQuery("")} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {paginatedItems.map((item) => (
              <CandidateCardItem
                key={item.id}
                item={item}
                deletingId={deletingId}
                isLimitedAdmin={isLimitedAdmin}
                isSuperAdmin={isSuperAdmin}
                userPhotosCache={userPhotosCache}
                onNavigate={(id) => navigate(`/generate/${resolvedMajor.collectionName}/${id}`)}
                onDelete={openDeleteModal}
                onReaction={handleReaction}
              />
            ))}
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
    </div>
  );
}

export default CollectionCv;
