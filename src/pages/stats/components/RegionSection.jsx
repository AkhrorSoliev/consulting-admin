import { Bar } from "react-chartjs-2";
import { horizontalBarOptions, horizontalStackedBarOptions } from "../chartOptions";

export default function RegionSection({
  regionCounts,
  regionCertCounts,
  regionBarData,
  regionCertStackedData,
}) {
  return (
    <div className="card bg-base-100 shadow border border-base-200">
      <div className="card-body">
        <h2 className="card-title text-xl mb-4">
          Viloyatlar bo'yicha statistika
        </h2>
        {regionCounts.length === 0 ? (
          <div className="text-center py-10 opacity-70">
            <p>Viloyat ma'lumotlari mavjud emas.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <RegionKpiCards regionCounts={regionCounts} regionCertCounts={regionCertCounts} />
            <RegionCharts
              regionCounts={regionCounts}
              regionCertCounts={regionCertCounts}
              regionBarData={regionBarData}
              regionCertStackedData={regionCertStackedData}
            />
            <RegionTable regionCertCounts={regionCertCounts} />
          </div>
        )}
      </div>
    </div>
  );
}

function RegionKpiCards({ regionCounts, regionCertCounts }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="stat bg-base-200/30 rounded-box border border-base-200">
        <div className="stat-title">Jami viloyatlar</div>
        <div className="stat-value text-primary text-2xl">{regionCounts.length}</div>
      </div>
      <div className="stat bg-base-200/30 rounded-box border border-base-200">
        <div className="stat-title">Eng ko'p kandidat</div>
        <div className="stat-value text-secondary text-2xl">{regionCounts[0]?.count || 0}</div>
        <div className="stat-desc">{regionCounts[0]?.region || "-"}</div>
      </div>
      <div className="stat bg-base-200/30 rounded-box border border-base-200">
        <div className="stat-title">Sertifikatli kandidatlar</div>
        <div className="stat-value text-success text-2xl">
          {regionCertCounts.reduce((sum, r) => sum + r.hasCert, 0)}
        </div>
        <div className="stat-desc">Barcha viloyatlardan</div>
      </div>
    </div>
  );
}

function RegionCharts({ regionCounts, regionCertCounts, regionBarData, regionCertStackedData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-box border border-base-200 p-4">
        <div className="font-medium mb-3">Viloyatlar bo'yicha kandidatlar soni</div>
        <div style={{ height: Math.max(300, regionCounts.length * 28) }}>
          <Bar data={regionBarData} options={horizontalBarOptions} />
        </div>
      </div>
      <div className="rounded-box border border-base-200 p-4">
        <div className="font-medium mb-3">Viloyatlar bo'yicha sertifikat holati</div>
        <div style={{ height: Math.max(300, regionCertCounts.length * 28) }}>
          <Bar data={regionCertStackedData} options={horizontalStackedBarOptions} />
        </div>
      </div>
    </div>
  );
}

function RegionTable({ regionCertCounts }) {
  const totalAll = regionCertCounts.reduce((sum, r) => sum + r.total, 0);
  const totalHas = regionCertCounts.reduce((sum, r) => sum + r.hasCert, 0);
  const totalNo = regionCertCounts.reduce((sum, r) => sum + r.noCert, 0);

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Viloyat</th>
            <th className="text-right">Jami</th>
            <th className="text-right">Sertifikat bor</th>
            <th className="text-right">Sertifikat yo'q</th>
            <th className="text-right">Sertifikat %</th>
          </tr>
        </thead>
        <tbody>
          {regionCertCounts.map((r) => (
            <tr key={r.region}>
              <td className="font-medium">{r.region}</td>
              <td className="text-right">{r.total}</td>
              <td className="text-right text-success">{r.hasCert}</td>
              <td className="text-right text-error">{r.noCert}</td>
              <td className="text-right">
                {r.total > 0 ? ((r.hasCert / r.total) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <td>Jami</td>
            <td className="text-right">{totalAll}</td>
            <td className="text-right text-success">{totalHas}</td>
            <td className="text-right text-error">{totalNo}</td>
            <td className="text-right">
              {totalAll > 0 ? ((totalHas / totalAll) * 100).toFixed(1) : 0}%
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
