export default function CollectionPagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-base-content/70">
        Seite {currentPage} von {totalPages} • Zeige {startIndex + 1}-
        {Math.min(endIndex, totalItems)} von {totalItems} Kandidaten
      </div>
      <div className="join">
        <button
          className="join-item btn btn-sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          «
        </button>
        <button
          className="join-item btn btn-sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          ‹
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => {
            return (
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPage) <= 2
            );
          })
          .map((page, idx, arr) => {
            const prevPage = arr[idx - 1];
            const showEllipsis = prevPage && page - prevPage > 1;

            return (
              <span key={page}>
                {showEllipsis && (
                  <button className="join-item btn btn-sm btn-disabled">
                    ...
                  </button>
                )}
                <button
                  className={`join-item btn btn-sm ${
                    currentPage === page ? "btn-active" : ""
                  }`}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </button>
              </span>
            );
          })}

        <button
          className="join-item btn btn-sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          ›
        </button>
        <button
          className="join-item btn btn-sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          »
        </button>
      </div>
    </div>
  );
}
