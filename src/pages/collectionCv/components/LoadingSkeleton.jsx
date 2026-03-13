export default function LoadingSkeleton() {
  return (
    <div className="overflow-x-auto rounded-xl border border-base-300 shadow-sm">
      <table className="table table-sm w-full">
        <thead>
          <tr className="bg-neutral text-neutral-content">
            <th className="w-10">#</th>
            <th>Kandidat</th>
            <th className="w-16 text-center">Alter</th>
            <th className="w-40">Status</th>
            <th className="w-36 text-center">Erstellt</th>
            <th className="w-32">Info</th>
            <th className="w-24 text-center">Bewertung</th>
            <th className="w-12"></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 10 }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td><div className="h-4 bg-base-300/50 rounded w-5" /></td>
              <td>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-base-300/50 shrink-0" />
                  <div className="h-4 bg-base-300/50 rounded w-32" />
                </div>
              </td>
              <td><div className="h-4 bg-base-300/50 rounded w-8 mx-auto" /></td>
              <td><div className="h-5 bg-base-300/50 rounded w-20" /></td>
              <td><div className="h-4 bg-base-300/50 rounded w-20 mx-auto" /></td>
              <td><div className="h-4 bg-base-300/50 rounded w-16" /></td>
              <td><div className="h-4 bg-base-300/50 rounded w-10 mx-auto" /></td>
              <td><div className="h-4 bg-base-300/50 rounded-full w-6 mx-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
