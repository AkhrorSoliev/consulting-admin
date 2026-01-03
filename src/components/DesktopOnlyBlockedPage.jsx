export default function DesktopOnlyBlockedPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <div className="mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-20 w-20 text-primary mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h1 className="card-title text-2xl font-bold mb-2">
            Nur für Desktop
          </h1>

          <h2 className="text-xl font-semibold mb-4">
            Diese Anwendung ist nur auf dem Desktop verfügbar
          </h2>

          <p className="text-base-content/70 mb-6">
            Für die beste Erfahrung und volle Funktionalität greifen Sie bitte
            von einem Desktop-Computer auf diese Anwendung zu.
          </p>

          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Mobile und Tablet-Geräte werden nicht unterstützt</span>
          </div>

          <div className="mt-8 pt-6 border-t border-base-300">
            <p className="text-xs font-medium text-base-content/40 tracking-wider uppercase mb-1">
              Mit freundlichen Grüßen
            </p>
            <p className="text-lg font-semibold text-primary italic">
              Orif Akhmadaliyev
            </p>
            <p className="text-xs text-base-content/30 mt-1">
              Geschäftsführer · Consultinguz
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
