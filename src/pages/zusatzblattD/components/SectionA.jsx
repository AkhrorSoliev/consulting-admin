import FormInput from "../../../components/FormInput";

export default function SectionA({ form, setForm }) {
  return (
    <>
      <div className="divider divider-start font-bold text-base-content/80">
        A. Angaben zur Arbeitnehmerin/zum Arbeitnehmer
      </div>
      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput
            label="1. Vorname(n)"
            value={form.txtf_1_Vorname}
            onChange={(e) => setForm((p) => ({ ...p, txtf_1_Vorname: e.target.value }))}
          />
          <FormInput
            label="2. Nachname"
            value={form.txtf_2_Nachname}
            onChange={(e) => setForm((p) => ({ ...p, txtf_2_Nachname: e.target.value }))}
          />
        </div>
        <FormInput
          label="3. Derzeitiger Wohnsitz"
          value={form.txtf_3_Wohnsitz}
          onChange={(e) => setForm((p) => ({ ...p, txtf_3_Wohnsitz: e.target.value }))}
        />
      </div>
    </>
  );
}
