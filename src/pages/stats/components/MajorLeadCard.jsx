export default function MajorLeadCard({ perMajorLeadCounts }) {
  const filtered = perMajorLeadCounts.filter(
    (x) => Array.isArray(x.leads) && x.leads.length > 0
  );

  return (
    <div className="card bg-base-100 shadow border border-base-200">
      <div className="card-body">
        <h2 className="card-title text-lg mb-4">Berufsfeld + Lead</h2>
        <div className="space-y-3">
          {filtered.slice(0, 20).map((row) => (
            <div
              key={row.majorName}
              className="rounded-box border border-base-200 p-3"
            >
              <div className="font-medium mb-2">{row.majorName}</div>
              <div className="overflow-x-auto">
                <table className="table table-xs">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th className="text-right">Anzahl</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.leads.slice(0, 10).map((l) => (
                      <tr key={`${row.majorName}:${l.leadName}`}>
                        <td>{l.leadName}</td>
                        <td className="text-right">{l.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? (
            <div className="opacity-70 text-sm">
              Keine Berufsfeld+Lead Daten verfügbar.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
