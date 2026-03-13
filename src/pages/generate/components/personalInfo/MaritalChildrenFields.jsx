export default function MaritalChildrenFields({
  formCv,
  setFormCv,
  updatePersonalInfo,
  isMobile,
  selectBase,
  inputBase,
  showMaritalStatusPicker,
  setShowMaritalStatusPicker,
  noChildren,
  childrenCount,
}) {
  return (
    <>
      <div className="form-control w-full">
        <label className="label" htmlFor="g-marital">
          <span className="label-text">Familienstand</span>
        </label>
        {isMobile ? (
          <button
            type="button"
            onClick={() => setShowMaritalStatusPicker(true)}
            className={`
              w-full h-12 px-4 rounded-lg border-2 text-left flex items-center justify-between
              transition-all active:scale-98
              ${
                formCv.personalInfo.maritalStatus
                  ? "border-success bg-success/5 text-base-content"
                  : "border-base-300 bg-base-100 text-base-content/60"
              }
            `}
          >
            <span className="text-base">
              {formCv.personalInfo.maritalStatus || "Bitte auswählen"}
            </span>
            <svg
              className="w-5 h-5 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        ) : (
          <select
            id="g-marital"
            className={selectBase}
            value={formCv.personalInfo.maritalStatus}
            onChange={(e) =>
              updatePersonalInfo("maritalStatus", e.target.value)
            }
          >
            <option value="">Bitte auswählen</option>
            <option value="ledig">ledig</option>
            <option value="verheiratet">verheiratet</option>
            <option value="geschieden">geschieden</option>
            <option value="verwitwet">verwitwet</option>
          </select>
        )}
      </div>
      <div className="md:col-span-2 form-control w-full">
        <label className="label" htmlFor="g-childrenCount">
          <span className="label-text">Kinder *</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            id="g-childrenCount"
            type="number"
            min={0}
            inputMode="numeric"
            className={inputBase}
            placeholder="0"
            disabled={noChildren}
            value={childrenCount}
            onChange={(e) => {
              const raw = String(e.target.value || "");
              const cleaned = raw.replace(/[^\d]/g, "");
              updatePersonalInfo("childrenCount", cleaned);
            }}
          />
          <label className="cursor-pointer flex items-center gap-2 mt-2 md:mt-0">
            <input
              type="checkbox"
              className="checkbox"
              checked={noChildren}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormCv((prev) => ({
                  ...prev,
                  personalInfo: {
                    ...prev.personalInfo,
                    noChildren: checked,
                    childrenCount: checked
                      ? ""
                      : String(prev.personalInfo.childrenCount || ""),
                  },
                }));
              }}
            />
            <span className="text-sm">Keine Kinder</span>
          </label>
        </div>
      </div>
      <div className="md:col-span-2 form-control w-full">
        {/* Führerschein moved to Fähigkeiten section */}
      </div>
    </>
  );
}
