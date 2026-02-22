export default function DataExchangeNotFound({ id }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-base-200"
      data-theme="winter"
    >
      <div className="card bg-base-100 shadow-xl max-w-md mx-3">
        <div className="card-body text-center">
          <h2 className="card-title justify-center text-error">
            Nomzod topilmadi
          </h2>
          <p>So'ralgan sahifa mavjud emas.</p>
          <div className="mt-4 p-3 bg-base-200 rounded text-xs text-left">
            <p className="font-semibold mb-1">Debug Ma'lumoti:</p>
            <p>Nomzod ID: {id}</p>
            <p className="mt-2 text-base-content/60">
              Qo'shimcha ma'lumot uchun brauzer konsolini tekshiring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
