import { Bar, Pie } from "react-chartjs-2";
import { leadBarOptions, pieOptions } from "../chartOptions";

export default function LeadStatsCard({ leadCounts, leadCharts, leadBarData, leadPieData }) {
  return (
    <div className="card bg-base-100 shadow border border-base-200">
      <div className="card-body">
        <h2 className="card-title text-lg mb-4">Lead-Statistik</h2>
        {leadCounts.length === 0 ? (
          <div className="opacity-70 text-sm">Keine Lead-Daten verfügbar.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="stat bg-base-200/30 rounded-box border border-base-200">
                <div className="stat-title">Einzigartige Leads</div>
                <div className="stat-value text-primary text-2xl">{leadCharts.unique}</div>
              </div>
              <div className="stat bg-base-200/30 rounded-box border border-base-200">
                <div className="stat-title">Gesamt Leads</div>
                <div className="stat-value text-secondary text-2xl">{leadCharts.total}</div>
              </div>
              <div className="stat bg-base-200/30 rounded-box border border-base-200">
                <div className="stat-title">Top Lead</div>
                <div className="stat-value text-accent text-2xl">
                  {leadCounts?.[0]?.count ?? 0}
                </div>
                <div className="stat-desc">{leadCounts?.[0]?.name ?? "-"}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-box border border-base-200 p-4">
                <div className="font-medium mb-3">Top Leads (Balkendiagramm)</div>
                <div className="h-72">
                  <Bar data={leadBarData} options={leadBarOptions} />
                </div>
                {leadCharts.others > 0 ? (
                  <div className="text-xs opacity-70 mt-2">
                    "Andere" = Summe außerhalb der Top 12
                  </div>
                ) : null}
              </div>

              <div className="rounded-box border border-base-200 p-4">
                <div className="font-medium mb-3">Anteil (Kreisdiagramm)</div>
                <div className="h-72">
                  <Pie data={leadPieData} options={pieOptions} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
