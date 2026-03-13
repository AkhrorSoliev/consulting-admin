export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="card bg-base-100 border border-base-300/60 shadow-sm animate-pulse"
        >
          <div className="card-body p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-full bg-base-300/50"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-base-300/50 rounded w-3/4"></div>
                <div className="h-3 bg-base-300/50 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-base-300/50 rounded w-full"></div>
              <div className="h-3 bg-base-300/50 rounded w-5/6"></div>
            </div>
            <div className="flex gap-2 pt-2">
              <div className="h-8 bg-base-300/50 rounded w-20"></div>
              <div className="h-8 bg-base-300/50 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
