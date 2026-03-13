import { Doughnut, Pie } from "react-chartjs-2";
import { pieOptions } from "../chartOptions";

export default function DoughnutRow({ diplomaDoughnutData, certDoughnutData, maritalPieData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body items-center text-center">
          <h2 className="card-title text-base mb-2">Diplom-Status</h2>
          <div className="h-48 w-full max-w-xs">
            <Doughnut data={diplomaDoughnutData} options={pieOptions} />
          </div>
        </div>
      </div>
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body items-center text-center">
          <h2 className="card-title text-base mb-2">Sprachzertifikate</h2>
          <div className="h-48 w-full max-w-xs">
            <Doughnut data={certDoughnutData} options={pieOptions} />
          </div>
        </div>
      </div>
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body items-center text-center">
          <h2 className="card-title text-base mb-2">Familienstand</h2>
          <div className="h-48 w-full max-w-xs">
            <Pie data={maritalPieData} options={pieOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
