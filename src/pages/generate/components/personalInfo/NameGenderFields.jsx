import FormInput from "../../../../components/FormInput";

export default function NameGenderFields({
  formCv,
  updatePersonalInfo,
}) {
  return (
    <>
      <FormInput
        label="Vorname"
        placeholder="Vorname"
        value={formCv.personalInfo.name}
        onChange={(e) => updatePersonalInfo("name", e.target.value)}
      />
      <FormInput
        label="Nachname"
        placeholder="Nachname"
        value={formCv.personalInfo.lastName}
        onChange={(e) => updatePersonalInfo("lastName", e.target.value)}
      />
      <div className="md:col-span-2">
        <label className="label">
          <span className="label-text">Geschlecht</span>
        </label>
        <div className="flex gap-6">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="radio"
              value="Männlich"
              className="radio radio-primary"
              checked={formCv.personalInfo.gender === "Männlich"}
              onChange={(e) => updatePersonalInfo("gender", e.target.value)}
            />
            <span>Männlich</span>
          </label>
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="radio"
              value="Weiblich"
              className="radio radio-primary"
              checked={formCv.personalInfo.gender === "Weiblich"}
              onChange={(e) => updatePersonalInfo("gender", e.target.value)}
            />
            <span>Weiblich</span>
          </label>
        </div>
      </div>
    </>
  );
}
