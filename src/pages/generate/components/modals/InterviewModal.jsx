export default function InterviewModal({
  open,
  onClose,
  interviewForm,
  setInterviewForm,
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
      <div className="relative w-full max-w-lg mx-4">
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">
                Suhbat tafsilotlarini yuborish
              </h3>
              <p className="text-sm opacity-70">
                Suhbat sanasi/vaqti, manzil va olib kelish kerak bo&apos;lgan
                narsalarni kiriting.
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
            <div className="form-control">
              <label className="label" htmlFor="interview-date-time">
                <span className="label-text font-medium">
                  Suhbat sanasi va vaqti
                </span>
              </label>
              <input
                id="interview-date-time"
                type="datetime-local"
                className="input input-bordered w-full"
                value={interviewForm.dateTime}
                onChange={(e) =>
                  setInterviewForm((prev) => ({
                    ...prev,
                    dateTime: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="interview-location">
                <span className="label-text font-medium">Manzil</span>
              </label>
              <input
                id="interview-location"
                type="text"
                className="input input-bordered w-full"
                placeholder="Masalan: Tashkent, Amir Temur 12, 3-qavat"
                value={interviewForm.location}
                onChange={(e) =>
                  setInterviewForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="interview-items">
                <span className="label-text font-medium">
                  Nimalarni olib kelish kerak
                </span>
              </label>
              <textarea
                id="interview-items"
                className="textarea textarea-bordered w-full"
                rows={3}
                placeholder="Masalan: pasport, CV nusxasi, diplomlar"
                value={interviewForm.items}
                onChange={(e) =>
                  setInterviewForm((prev) => ({
                    ...prev,
                    items: e.target.value,
                  }))
                }
              />
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


