import { useNavigate } from "react-router-dom";

// Error Fallback UI Component
export default function ErrorFallback({ error, errorInfo, resetError }) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    resetError();
    navigate("/");
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-2xl max-w-2xl w-full">
        <div className="card-body">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-error/10 p-3 rounded-full">
              <svg
                className="w-8 h-8 text-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h2 className="card-title text-2xl text-error">
                Unexpected Application Error!
              </h2>
              <p className="text-base-content/70">
                Ilovada kutilmagan xatolik yuz berdi
              </p>
            </div>
          </div>

          <div className="divider"></div>

          {error && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg mb-2">Xatolik:</h3>
                <div className="bg-error/5 border border-error/20 rounded-lg p-4">
                  <code className="text-sm text-error font-mono break-all">
                    {error.toString()}
                  </code>
                </div>
              </div>

              {errorInfo && errorInfo.componentStack && (
                <details className="collapse collapse-arrow bg-base-200">
                  <summary className="collapse-title font-medium">
                    Texnik ma'lumotlar (Stack Trace)
                  </summary>
                  <div className="collapse-content">
                    <pre className="text-xs overflow-auto max-h-60 bg-base-300 p-3 rounded">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          )}

          <div className="divider"></div>

          <div className="space-y-2">
            <h3 className="font-semibold">Tavsiyalar:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-base-content/70">
              <li>Sahifani qayta yuklang</li>
              <li>Brauzer keshini tozalang</li>
              <li>Agar muammo davom etsa, administrator bilan bog'laning</li>
            </ul>
          </div>

          <div className="card-actions justify-end mt-6 gap-2">
            <button className="btn btn-ghost" onClick={handleGoHome}>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Bosh sahifaga
            </button>
            <button className="btn btn-primary" onClick={handleReload}>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Qayta yuklash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
