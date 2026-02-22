import { formatRatingForUi } from "../utils/ratingUtils";

const RATING_STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export default function CandidateRating({
  value,
  onChange,
  onReset,
  disabled = false,
  canRate = false,
  inputName = "candidate-rating",
}) {
  return (
    <div className="flex items-center gap-2">
      {value !== null && (
        <span className="text-xs font-medium opacity-80">
          {formatRatingForUi(value)}/5
        </span>
      )}
      <div
        className={[
          "rating rating-lg rating-half",
          disabled ? "opacity-50 pointer-events-none" : "",
        ].join(" ")}
        title={canRate ? "Bewertung" : "Faqat admin/super_admin uchun"}
      >
        <input
          type="radio"
          name={inputName}
          className="rating-hidden"
          checked={value === null}
          onChange={() => onReset?.()}
          disabled={disabled}
          aria-label="0 star"
        />
        {RATING_STEPS.map((step, index) => (
          <input
            key={`rating-step-${step}`}
            type="radio"
            name={inputName}
            className={[
              "mask mask-star-2 bg-green-500",
              index % 2 === 0 ? "mask-half-1" : "mask-half-2",
            ].join(" ")}
            checked={value === step}
            onChange={() => onChange?.(step)}
            disabled={disabled}
            aria-label={`${step} star`}
          />
        ))}
      </div>
      {value !== null && (
        <button
          type="button"
          className="btn btn-xs btn-ghost"
          onClick={onReset}
          disabled={disabled}
          title={canRate ? "Bewertung zurücksetzen" : "Faqat admin/super_admin uchun"}
        >
          ×
        </button>
      )}
    </div>
  );
}
