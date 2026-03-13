import FormInput from "../../components/FormInput";
import { RadioGroup, CheckboxField, SectionCard, SectionDivider } from "./FormFields";
import { toInputDate, fromInputDate } from "./dateUtils";
import { SITZ_OPTIONS, UNTERNEHMENSGRUPPE_FIELDS, ENTSENDUNG_FIELDS } from "./zusatzblattBFields";

export function SectionArtAndUnternehmen({ form, setForm }) {
  const setText = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const setCheck = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));
  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <>
      <SectionCard>
        <div className="form-control">
          <label className="label">
            <span className="label-text whitespace-normal font-medium">1 Bei der Beschäftigung im Formular &bdquo;Erklärung zum Beschäftigungsverhältnis&ldquo; handelt es sich um eine Beschäftigung</span>
          </label>
          <div className="space-y-2">
            <CheckboxField label="für einen Intra Corporate Transferee (ICT) (nur Führungskräfte, Spezialisten und Trainees)" checked={form.chbx_1_ICT} onChange={setCheck("chbx_1_ICT")} />
            <CheckboxField label="im Rahmen eines internationalen Personalaustauschs" checked={form.chbx_1_Personalaustausch} onChange={setCheck("chbx_1_Personalaustausch")} />
            <CheckboxField label="sonstige vorübergehende Beschäftigung/Transfers/Entsendung" checked={form.chbx_1_Beschaeftigung} onChange={setCheck("chbx_1_Beschaeftigung")} />
          </div>
        </div>
      </SectionCard>

      <SectionDivider>A. Entsendendes und/oder abordnendes Unternehmen/entsendender und/oder abordnender Unternehmensteil im Ausland</SectionDivider>
      <SectionCard>
        <FormInput label="2 Firma" value={form.txtf_2_Firma} onChange={setText("txtf_2_Firma")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="3 Vorname Kontaktperson" value={form.txtf_3_Vorname} onChange={setText("txtf_3_Vorname")} />
          <FormInput label="4 Nachname Kontaktperson" value={form.txtf_4_Nachname} onChange={setText("txtf_4_Nachname")} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="5 Straße" value={form.txtf_5_Strasse} onChange={setText("txtf_5_Strasse")} />
          <FormInput label="6 Hausnummer" value={form.txtf_6_Hausnummer} onChange={setText("txtf_6_Hausnummer")} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormInput label="7 Postleitzahl" value={form.txtf_7_PLZ} onChange={setText("txtf_7_PLZ")} />
          <FormInput label="8 Ort" value={form.txtf_8_Ort} onChange={setText("txtf_8_Ort")} />
          <FormInput label="9 Land" value={form.txtf_9_Land} onChange={setText("txtf_9_Land")} />
        </div>
        <RadioGroup name="rbtn_10_Sitz_des_Unternehmens" label="10 Das Unternehmen oder der Unternehmensteil hat seinen Sitz:" options={SITZ_OPTIONS} value={form.rbtn_10_Sitz_des_Unternehmens} onChange={set("rbtn_10_Sitz_des_Unternehmens")} />
      </SectionCard>
    </>
  );
}

export function SectionUnternehmensgruppe({ form, setForm }) {
  const setCheck = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <>
      <SectionDivider>B. Unternehmensgruppe, international tätiges Unternehmen</SectionDivider>
      <SectionCard>
        <div className="form-control">
          <label className="label">
            <span className="label-text whitespace-normal font-medium">11 Das Unternehmen/Der Unternehmensteil in Deutschland und das Unternehmen/der Unternehmensteil im Ausland gehören:</span>
          </label>
          <div className="flex flex-wrap gap-4">
            <CheckboxField label="zum gleichen Unternehmen" checked={form.chbx_11_Unternehmen} onChange={setCheck("chbx_11_Unternehmen")} />
            <CheckboxField label="zur gleichen Unternehmensgruppe" checked={form.chbx_11_Unternehmensgruppe} onChange={setCheck("chbx_11_Unternehmensgruppe")} />
            <CheckboxField label="zum gleichen Konzern" checked={form.chbx_11_Konzern} onChange={setCheck("chbx_11_Konzern")} />
          </div>
        </div>
        {UNTERNEHMENSGRUPPE_FIELDS.map(({ field, label }) => (
          <RadioGroup
            key={field}
            name={`rbtn_${field}`}
            label={label}
            options={["ja", "nein"]}
            value={form[`rbtn_${field}`]}
            onChange={(val) => setForm((p) => ({ ...p, [`rbtn_${field}`]: val }))}
          />
        ))}
      </SectionCard>
    </>
  );
}

export function SectionArbeitnehmerUndDauer({ form, setForm }) {
  const setText = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const setCheck = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <>
      <SectionDivider>C. Angaben zur ausländischen Arbeitnehmerin/zum ausländischen Arbeitnehmer</SectionDivider>
      <SectionCard>
        <div className="form-control">
          <label className="label">
            <span className="label-text whitespace-normal font-medium">16 Die ausländische Arbeitnehmerin/Der ausländische Arbeitnehmer ist in dem unter A bezeichneten Unternehmen/Unternehmensteil beschäftigt</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="label-text">seit (TT.MM.JJJJ)</span>
            <input type="date" className="input input-bordered input-sm" value={toInputDate(form.txtf_16_seit)} onChange={(e) => setForm((p) => ({ ...p, txtf_16_seit: fromInputDate(e.target.value) }))} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="17 Vorname" value={form.txtf_17_Vorname} onChange={setText("txtf_17_Vorname")} />
          <FormInput label="18 Nachname" value={form.txtf_18_Nachname} onChange={setText("txtf_18_Nachname")} />
        </div>
        <FormInput label="19 derzeitiger Wohnort/Aufenthaltsort" value={form.txtf_19_Strasse} onChange={setText("txtf_19_Strasse")} />
        {ENTSENDUNG_FIELDS.map(({ field, label }) => (
          <RadioGroup
            key={field}
            name={`rbtn_${field}`}
            label={label}
            options={[{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }]}
            value={form[`rbtn_${field}`]}
            onChange={(val) => setForm((p) => ({ ...p, [`rbtn_${field}`]: val }))}
          />
        ))}
      </SectionCard>

      <SectionDivider>D. Angaben zur Dauer der Beschäftigung</SectionDivider>
      <SectionCard>
        <div className="form-control">
          <label className="label">
            <span className="label-text whitespace-normal font-medium">23 Dauer der Beschäftigung in Deutschland:</span>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CheckboxField label="Neueinreise" checked={form.chbx_23_Beschaeftigung} onChange={setCheck("chbx_23_Beschaeftigung")} />
          <div className="flex items-center gap-2">
            <span className="label-text whitespace-nowrap">ab (TT.MM.JJJJ)</span>
            <input type="date" className="input input-bordered input-sm" value={toInputDate(form.txtf_23_Neueinreise_ab)} onChange={(e) => setForm((p) => ({ ...p, txtf_23_Neueinreise_ab: fromInputDate(e.target.value) }))} />
          </div>
          <div className="flex items-center gap-2">
            <span className="label-text whitespace-nowrap">bis voraussichtlich (TT.MM.JJJJ)</span>
            <input type="date" className="input input-bordered input-sm" value={toInputDate(form.txtf_23_Neueinreise_bis)} onChange={(e) => setForm((p) => ({ ...p, txtf_23_Neueinreise_bis: fromInputDate(e.target.value) }))} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CheckboxField label="Verlängerung" checked={form.chbx_23_Verlaengerung} onChange={setCheck("chbx_23_Verlaengerung")} />
          <div className="flex items-center gap-2">
            <span className="label-text whitespace-nowrap">ab (TT.MM.JJJJ)</span>
            <input type="date" className="input input-bordered input-sm" value={toInputDate(form.txtf_23_Verlaengerung_ab)} onChange={(e) => setForm((p) => ({ ...p, txtf_23_Verlaengerung_ab: fromInputDate(e.target.value) }))} />
          </div>
          <div className="flex items-center gap-2">
            <span className="label-text whitespace-nowrap">bis voraussichtlich (TT.MM.JJJJ)</span>
            <input type="date" className="input input-bordered input-sm" value={toInputDate(form.txtf_23_Verlaengerung_bis)} onChange={(e) => setForm((p) => ({ ...p, txtf_23_Verlaengerung_bis: fromInputDate(e.target.value) }))} />
          </div>
        </div>
      </SectionCard>
    </>
  );
}

export function SectionPersonalaustauschUndEntgelt({ form, setForm }) {
  const setText = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <>
      <SectionDivider>E. Personalaustausch</SectionDivider>
      <SectionCard>
        <RadioGroup
          name="rbtn_24_Arbeitnehmer_de"
          label="24 Es werden auch Arbeitnehmerinnen und/oder Arbeitnehmer des deutschen Unternehmens/Unternehmensteils im ausländischen Unternehmen/in ausländischen Unternehmensteilen eingesetzt:"
          options={[{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }]}
          value={form.rbtn_24_Arbeitnehmer_de}
          onChange={(val) => setForm((p) => ({ ...p, rbtn_24_Arbeitnehmer_de: val }))}
        />
        <div className="form-control">
          <label className="label">
            <span className="label-text whitespace-normal font-medium">25 Wie viele Arbeitnehmerinnen und/oder Arbeitnehmer des deutschen Unternehmens/Unternehmensteils wurden (für mindestens 3 zusammenhängende Monate) in eines der ausländischen Unternehmen/Unternehmensteile entsendet?</span>
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="Letztes Kalenderjahr" value={form.txtf_25_letztes_Kalenderjahr} onChange={setText("txtf_25_letztes_Kalenderjahr")} />
          <FormInput label="Vorletztes Kalenderjahr" value={form.txtf_25_vorletztes_Kalenderjahr} onChange={setText("txtf_25_vorletztes_Kalenderjahr")} />
        </div>
      </SectionCard>
    </>
  );
}
