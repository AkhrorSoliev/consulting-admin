import CollapsibleSection from "../../../../components/CollapsibleSection";
import SkillsSection from "../../../../components/SkillsSection";
import DrivingLicenseField from "./DrivingLicenseField";

export default function SkillsSectionPanel({
  formCv,
  setFormCv,
  selectBase,
  isDrivingLicenseDropdownOpen,
  setIsDrivingLicenseDropdownOpen,
  drivingLicenseDropdownRef,
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
      <DrivingLicenseField
        formCv={formCv}
        setFormCv={setFormCv}
        selectBase={selectBase}
        isDrivingLicenseDropdownOpen={isDrivingLicenseDropdownOpen}
        setIsDrivingLicenseDropdownOpen={setIsDrivingLicenseDropdownOpen}
        drivingLicenseDropdownRef={drivingLicenseDropdownRef}
      />
      <SkillsSection
        softSkills={formCv.skills.softSkills}
        pcSkills={formCv.skills.pcSkills}
        onAddSoft={(val) =>
          addTag(["skills", "softSkills"], val)
        }
        onRemoveSoft={(i) =>
          removeTag(["skills", "softSkills"], i)
        }
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
