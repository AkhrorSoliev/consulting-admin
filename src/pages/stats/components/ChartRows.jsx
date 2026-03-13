import { Bar, Pie } from "react-chartjs-2";
import { defaultBarOptions, pieOptions } from "../chartOptions";

export function Row1({ perCollectionBarData, experienceBarData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Verteilung nach Berufsfeld</h2>
          <div className="h-64 md:h-80">
            <Bar data={perCollectionBarData} options={defaultBarOptions} />
          </div>
        </div>
      </div>
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Berufserfahrung (Jahre)</h2>
          <div className="h-64 md:h-80">
            <Bar data={experienceBarData} options={defaultBarOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CertTypesRow({ certTypeCounts, certTypesBarData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Sprachzertifikat-Typen (Top)</h2>
          <div className="h-64 md:h-80">
            {certTypeCounts.length > 0 ? (
              <Bar data={certTypesBarData} options={defaultBarOptions} />
            ) : (
              <div className="h-full grid place-items-center opacity-60 text-sm">
                Zertifikat-Typen nicht verfügbar.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GenderLanguageRow({ genderPieData, topLanguagesPieData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Geschlechterverteilung</h2>
          <div className="h-64 md:h-80 flex justify-center">
            <Pie data={genderPieData} options={pieOptions} />
          </div>
        </div>
      </div>
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Top 10 Sprachen</h2>
          <div className="h-64 md:h-80 flex justify-center">
            <Pie data={topLanguagesPieData} options={pieOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgeLevelRow({ ageBucketsBarData, levelCountsBarData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Altersgruppen</h2>
          <div className="h-64 md:h-80">
            <Bar data={ageBucketsBarData} options={defaultBarOptions} />
          </div>
        </div>
      </div>
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Sprachniveaus</h2>
          <div className="h-64 md:h-80">
            <Bar data={levelCountsBarData} options={defaultBarOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
