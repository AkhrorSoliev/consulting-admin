import { useState } from "react";
import SchuleBlock from "./educationSection/SchuleBlock";
import OptionalEducationBlock from "./educationSection/OptionalEducationBlock";

function EducationSection({
  education,
  onUpdateEducation,
  showRequiredWarning = false,
  errors = {},
}) {
  const fieldInput = "input input-bordered w-full";

  const schule = education?.schule || {};
  const kollej = education?.kollej || {};
  const universitat = education?.universitat || {};

  const [noKollej, setNoKollej] = useState(false);
  const [noUniversitat, setNoUniversitat] = useState(false);
  const [openSchule, setOpenSchule] = useState(true);
  const [openKollej, setOpenKollej] = useState(false);
  const [openUniversitat, setOpenUniversitat] = useState(false);

  return (
    <div className="space-y-6">
      {/* Schule (Required) */}
      <SchuleBlock
        schule={schule}
        errors={errors}
        fieldInput={fieldInput}
        isOpen={openSchule}
        onToggle={(newOpen) => setOpenSchule(newOpen)}
        onUpdateEducation={onUpdateEducation}
      />

      {/* Kollej/Litsey (Optional) */}
      <OptionalEducationBlock
        sectionKey="kollej"
        title="Kollej/Litsey (optional)"
        subtitle="(Kollej/Litsey - nemis tilida)"
        checkboxLabel="Kein Kollej/Litsey besucht"
        institutionPlaceholder="z.B. Tashkent College"
        institutionHelper="Name des Kollegs/Litseys auf Deutsch."
        degreePlaceholder="z.B. Fachabitur"
        degreeLabel="Abschluss (auf Deutsch)"
        degreeHelper="Abschluss auf Deutsch."
        data={kollej}
        errors={errors}
        fieldInput={fieldInput}
        isSkipped={noKollej}
        onSkipChange={setNoKollej}
        isOpen={openKollej}
        onToggle={(newOpen) => setOpenKollej(newOpen)}
        onUpdateEducation={onUpdateEducation}
      />

      {/* Universität (Optional) */}
      <OptionalEducationBlock
        sectionKey="universitat"
        title="Universität (optional)"
        subtitle="(Universitet - nemis tilida)"
        checkboxLabel="Keine Universität besucht"
        institutionPlaceholder="z.B. Tashkent State University"
        institutionHelper="Name der Universität auf Deutsch."
        degreePlaceholder="z.B. Bachelor Informatik"
        degreeLabel="Abschluss / Studiengang (auf Deutsch)"
        degreeHelper="Beispiel: Bachelor, Master."
        data={universitat}
        errors={errors}
        fieldInput={fieldInput}
        isSkipped={noUniversitat}
        onSkipChange={setNoUniversitat}
        isOpen={openUniversitat}
        onToggle={(newOpen) => setOpenUniversitat(newOpen)}
        onUpdateEducation={onUpdateEducation}
      />

      {showRequiredWarning && (
        <div className="mt-2 alert alert-warning text-sm">
          Bitte füllen Sie alle Pflichtfelder der Schule aus.
        </div>
      )}
    </div>
  );
}

export default EducationSection;
