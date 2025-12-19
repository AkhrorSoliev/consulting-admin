export default function DecisionModal({
  open,
  onClose,
  decisionForm,
  setDecisionForm,
  onSubmit,
  isSending,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl mx-4">
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">
                Ish beruvchining qarorini yuborish
              </h3>
              <p className="text-sm opacity-70">
                Nomzodga qaror (qabul yoki rad) haqida muloyim tarzda xabar
                bering.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Modalni yopish"
            >
              ✕
            </button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label
                className={`card border transition cursor-pointer ${
                  decisionForm.decision === "accepted"
                    ? "border-success bg-success/5"
                    : "border-base-300 hover:border-success/60"
                }`}
              >
                <div className="card-body p-4 gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="employer-decision"
                      className="radio radio-success"
                      value="accepted"
                      checked={decisionForm.decision === "accepted"}
                      onChange={() =>
                        setDecisionForm((prev) => ({
                          ...prev,
                          decision: "accepted",
                        }))
                      }
                    />
                    <div className="font-semibold">Qabul qilindi</div>
                  </div>
                  <p className="text-sm opacity-70">
                    Hujjatlarni tayyorlash uchun @consultinguz_chat bilan
                    bog&apos;laning.
                  </p>
                </div>
              </label>

              <label
                className={`card border transition cursor-pointer ${
                  decisionForm.decision === "rejected"
                    ? "border-error bg-error/5"
                    : "border-base-300 hover:border-error/60"
                }`}
              >
                <div className="card-body p-4 gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="employer-decision"
                      className="radio radio-error"
                      value="rejected"
                      checked={decisionForm.decision === "rejected"}
                      onChange={() =>
                        setDecisionForm((prev) => ({
                          ...prev,
                          decision: "rejected",
                        }))
                      }
                    />
                    <div className="font-semibold">Rad etildi</div>
                  </div>
                  <p className="text-sm opacity-70">
                    Jarayon boshqa yo&apos;nalishda davom etadi. Mos
                    vakansiyalar bo&apos;lsa, xabardor qilamiz.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn"
                onClick={onClose}
              >
                Bekor qilish
              </button>
              <button type="submit" className="btn btn-primary">
                {isSending ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Yuborilmoqda...
                  </>
                ) : (
                  "Jo'natish"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


