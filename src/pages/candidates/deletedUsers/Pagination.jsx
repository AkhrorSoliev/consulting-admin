export default function Pagination({
  currentPage,
  totalPages,
  totalResults,
  onPageChange,
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
      <button
        type="button"
        className="btn btn-sm btn-outline"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      >
        &laquo;
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        &lsaquo;
      </button>
      <span className="text-sm text-base-content/70 px-2">
        Seite {currentPage} von {totalPages} ({totalResults} Ergebnisse)
      </span>
      <button
        type="button"
        className="btn btn-sm btn-outline"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        &rsaquo;
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        &raquo;
      </button>
    </div>
  );
}
