import CollapsibleSection from "../../../components/CollapsibleSection";
import SkillsSection from "../../../components/SkillsSection";

export default function SkillsSectionCard({
  formCv,
  setFormCv,
  setIsDrivingLicenseDropdownOpen,
  drivingLicenseDropdownRef,
  selectBase,
  isDrivingLicenseDropdownOpen,
  DRIVING_LICENSE_OPTIONS,
  addTag,
  removeTag,
  autoAddSkills,
  isGeneratingSoft,
  isGeneratingPc,
  recentlyAdded,
}) {
  return (
    <CollapsibleSection
      title="Fähigkeiten"
      className="!overflow-visible"
      contentClassName="!overflow-visible"
      openClassName="relative z-[80]"
      defaultOpen={false}
    >
      <div className="mb-4 rounded-box border border-base-300 bg-base-200/40 p-4">
        <div className="form-control w-full">
          <div className="label">
            <span className="label-text font-semibold">Führerschein</span>
          </div>
          <label className="cursor-pointer flex items-center gap-2">
            <input
              id="g-driving"
              type="checkbox"
              className="checkbox"
              checked={Boolean(formCv.personalInfo.hasDrivingLicense)}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormCv((prev) => ({
                  ...prev,
                  personalInfo: {
                    ...prev.personalInfo,
                    hasDrivingLicense: checked,
                    drivingLicenseType: checked
                      ? String(prev.personalInfo.drivingLicenseType || "")
                      : "",
                  },
                }));
                if (!checked) setIsDrivingLicenseDropdownOpen(false);
              }}
            />
            <span className="text-sm">Vorhanden</span>
          </label>
          {formCv.personalInfo.hasDrivingLicense ? (
            <div className="mt-3">
              <div ref={drivingLicenseDropdownRef} className="relative w-full">
                <label className="label">
                  <span className="label-text">Führerschein-Klassen (mehrere möglich)</span>
                </label>

                <button
                  type="button"
                  className={`${selectBase} flex items-center justify-between gap-3`}
                  aria-haspopup="listbox"
                  aria-expanded={isDrivingLicenseDropdownOpen}
                  onClick={() => setIsDrivingLicenseDropdownOpen((p) => !p)}
                >
                  {(() => {
                    const raw = String(formCv.personalInfo.drivingLicenseType || "")
                      .trim()
                      .toUpperCase();
                    const selected = raw
                      ? raw
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      : [];
                    const displayValue = selected.length ? selected.join(", ") : "Bitte auswählen";
                    return (
                      <>
                        <span className={selected.length ? "text-base-content" : "text-base-content/60"}>
                          {displayValue}
                        </span>
                        <span className="text-base-content/60">▾</span>
                      </>
                    );
                  })()}
                </button>

                {isDrivingLicenseDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 max-h-72 rounded-box border border-base-300 bg-base-100 shadow-lg z-[9999] overflow-hidden flex flex-col">
                    <ul className="menu p-2 overflow-auto w-full" role="listbox" aria-multiselectable="true">
                      {DRIVING_LICENSE_OPTIONS.map((opt) => {
                        const upper = String(opt || "").trim().toUpperCase();
                        const selected = String(formCv.personalInfo.drivingLicenseType || "")
                          .trim()
                          .toUpperCase()
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const isSelected = selected.includes(upper);

                        return (
                          <li key={opt}>
                            <button
                              type="button"
                              className="flex items-center gap-2"
                              onClick={() => {
                                const set = new Set(selected);
                                if (set.has(upper)) set.delete(upper);
                                else set.add(upper);
                                const next = Array.from(set).join(", ");
                                setFormCv((prev) => ({
                                  ...prev,
                                  personalInfo: {
                                    ...prev.personalInfo,
                                    drivingLicenseType: next,
                                  },
                                }));
                                setIsDrivingLicenseDropdownOpen(false);
                              }}
                            >
                              <span className="w-5 text-center">{isSelected ? "✓" : ""}</span>
                              <span className="font-medium">{opt}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <SkillsSection
        softSkills={formCv.skills.softSkills}
        pcSkills={formCv.skills.pcSkills}
        onAddSoft={(val) => addTag(["skills", "softSkills"], val)}
        onRemoveSoft={(i) => removeTag(["skills", "softSkills"], i)}
        onAddPc={(val) => addTag(["skills", "pcSkills"], val)}
        onRemovePc={(i) => removeTag(["skills", "pcSkills"], i)}
        onAutoAddSoft={() => autoAddSkills("soft")}
        onAutoAddPc={() => autoAddSkills("pc")}
        isGeneratingSoft={isGeneratingSoft}
        isGeneratingPc={isGeneratingPc}
        recentlyAddedSoft={recentlyAdded.soft}
        recentlyAddedPc={recentlyAdded.pc}
      />
    </CollapsibleSection>
  );
}
