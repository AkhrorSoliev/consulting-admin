import { handleSaveMeta } from "./interviewHandlers";

export default function MetaInfoSection({
  majorKey,
  metaName,
  setMetaName,
  metaSlug,
  setMetaSlug,
  metaTitle,
  setMetaTitle,
  isSavingMeta,
  setIsSavingMeta,
  metaValidationError,
  setMetaValidationError,
  isLoading,
}) {
  return (
    <div className="rounded-xl border border-base-300 bg-base-200/30 p-4 space-y-4">
      <div className="min-w-0">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-base-content/70">Yo'nalish ma'lumotlari</h3>
      </div>

      {metaValidationError && (
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{metaValidationError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <div className="form-control">
          <label className="label" htmlFor="meta-name">
            <span className="label-text">Name (ichki nom)</span>
          </label>
          <input
            id="meta-name"
            type="text"
            className="input input-bordered w-full"
            placeholder="masalan: pflegefachkraft"
            value={metaName}
            onChange={(e) => {
              setMetaName(e.target.value);
              setMetaValidationError("");
            }}
            disabled={isSavingMeta}
          />
        </div>
        <div className="form-control">
          <label className="label" htmlFor="meta-slug">
            <span className="label-text">Slug (URL uchun)</span>
          </label>
          <input
            id="meta-slug"
            type="text"
            className="input input-bordered w-full"
            placeholder="masalan: pflegefachkraft"
            value={metaSlug}
            onChange={(e) => {
              setMetaSlug(e.target.value);
              setMetaValidationError("");
            }}
            disabled={isSavingMeta}
          />
        </div>
        <div className="form-control">
          <label className="label" htmlFor="meta-title">
            <span className="label-text">Title (ko'rinadigan nom)</span>
          </label>
          <input
            id="meta-title"
            type="text"
            className="input input-bordered w-full"
            placeholder="masalan: Pflegefachkraft"
            value={metaTitle}
            onChange={(e) => {
              setMetaTitle(e.target.value);
              setMetaValidationError("");
            }}
            disabled={isSavingMeta}
          />
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary w-full"
        onClick={() =>
          handleSaveMeta({
            majorKey,
            metaName,
            metaSlug,
            metaTitle,
            setIsSavingMeta,
            setMetaValidationError,
          })
        }
        disabled={isSavingMeta || isLoading}
      >
        {isSavingMeta ? "Saqlanmoqda..." : "Ma'lumotlarni saqlash"}
      </button>
    </div>
  );
}
