import { FaInfoCircle } from "react-icons/fa";
import FormInput from "../../components/FormInput";
import { RadioGroup, CheckboxField, SectionCard, SectionDivider } from "./FormFields";
import { toInputDate, fromInputDate } from "./dateUtils";
import { FAHRERLAUBNIS_QUESTIONS, GRUNDQUALIFIKATION_QUESTIONS } from "./zusatzblattCFields";

export function SectionPersonUndFahrerlaubnis({ form, setForm }) {
  const setText = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <>
      <SectionDivider>A. Angaben zur Arbeitnehmerin/zum Arbeitnehmer</SectionDivider>
      <SectionCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="1 Vorname" value={form.txtf_1_vorname} onChange={setText("txtf_1_vorname")} />
          <FormInput label="2 Nachname" value={form.txtf_2_name} onChange={setText("txtf_2_name")} />
        </div>
        <FormInput label="3 derzeitiger Wohnsitz oder gewöhnlicher Aufenthaltsort" value={form.txtf_3_wohnsitz} onChange={setText("txtf_3_wohnsitz")} />
      </SectionCard>

      <SectionDivider>B. Angaben zur Fahrerlaubnis</SectionDivider>
      <SectionCard>
        <RadioGroup name={FAHRERLAUBNIS_QUESTIONS[0].name} label={FAHRERLAUBNIS_QUESTIONS[0].label} options={FAHRERLAUBNIS_QUESTIONS[0].options} value={form.rbtn_4_fahrerlaubnis} onChange={set("rbtn_4_fahrerlaubnis")} />
        <FormInput label="5 Wenn ja, bitte Staat angeben, in dem die EU- oder EWR-Fahrerlaubnis ausgestellt wurde." value={form.rbtn_5_fahrerlaubnis_ausgestellt} onChange={setText("rbtn_5_fahrerlaubnis_ausgestellt")} />
        <RadioGroup name={FAHRERLAUBNIS_QUESTIONS[1].name} label={FAHRERLAUBNIS_QUESTIONS[1].label} options={FAHRERLAUBNIS_QUESTIONS[1].options} value={form.rbtn_6_fahrerlaubnis_schluesselzahl} onChange={set("rbtn_6_fahrerlaubnis_schluesselzahl")} />
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-sm break-words whitespace-normal">
              7 Wenn ja, ist der Drittstaat, in dem die Fahrerlaubnis erstmalig erworben wurde, in Anlage 11 der Fahrerlaubnisverordnung – <a href="https://www.gesetze-im-internet.de/fev_2010/anlage_11.html" target="_blank" rel="noopener noreferrer" className="link link-primary break-all">Anlage 11 FeV</a> – aufgeführt <strong>und</strong> kann in der relevanten Fahrerlaubnisklasse prüfungsfrei umgeschrieben werden?
            </span>
          </label>
          <div className="flex gap-6 mt-2">
            {[{ value: "ja", label: "Ja (weiter mit Abschnitt C)" }, { value: "nein", label: "Nein (weiter mit Abschnitt C)" }].map((opt) => (
              <label key={opt.value} className="label cursor-pointer gap-2">
                <input type="radio" name="rbtn_7_fahrerlaubnis_erworben" className="radio radio-primary" checked={form.rbtn_7_fahrerlaubnis_erworben === opt.value} onChange={() => set("rbtn_7_fahrerlaubnis_erworben")(opt.value)} />
                <span className="label-text">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
        <RadioGroup name={FAHRERLAUBNIS_QUESTIONS[2].name} label={FAHRERLAUBNIS_QUESTIONS[2].label} options={FAHRERLAUBNIS_QUESTIONS[2].options} value={form.rbtn_8_fahrerlaubnis_drittstaat} onChange={set("rbtn_8_fahrerlaubnis_drittstaat")} />
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-sm break-words whitespace-normal">
              9 Wenn ja, wurde die Fahrerlaubnis von einem in Anlage 11 der Fahrerlaubnisverordnung – <a href="https://www.gesetze-im-internet.de/fev_2010/anlage_11.html" target="_blank" rel="noopener noreferrer" className="link link-primary break-all">Anlage 11 FeV</a> – aufgeführten Staaten erteilt <strong>und</strong> kann in der relevanten Fahrerlaubnisklasse prüfungsfrei umgeschrieben werden?
            </span>
          </label>
          <div className="flex gap-6 mt-2">
            {["ja", "nein"].map((opt) => (
              <label key={opt} className="label cursor-pointer gap-2">
                <input type="radio" name="rbtn_9_fahrerlaubnis_erteilt" className="radio radio-primary" checked={form.rbtn_9_fahrerlaubnis_erteilt === opt} onChange={() => set("rbtn_9_fahrerlaubnis_erteilt")(opt)} />
                <span className="label-text">{opt === "ja" ? "Ja" : "Nein"}</span>
              </label>
            ))}
          </div>
        </div>
      </SectionCard>
    </>
  );
}

export function SectionGrundqualifikation({ form, setForm }) {
  const setText = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <>
      <SectionDivider>C. Angaben zur Grundqualifikation oder beschleunigten Grundqualifikation</SectionDivider>
      <SectionCard>
        {GRUNDQUALIFIKATION_QUESTIONS.slice(0, 3).map((q, i) => (
          <div key={q.name}>
            <RadioGroup name={q.name} label={q.label} options={[{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }]} value={form[q.name]} onChange={set(q.name)} />
            {i === 1 && <p className="text-sm opacity-70">oder</p>}
          </div>
        ))}
        <FormInput label='13 Nur zu beantworten, wenn Ziffer 10, 11 oder 12 mit "Ja" beantwortet wurde: Bitte Staat angeben, in dem die Grundqualifikation oder beschleunigte Grundqualifikation erworben wurde.' value={form.txtf_13_grundqualifikationsstaat} onChange={setText("txtf_13_grundqualifikationsstaat")} />
        <RadioGroup name={GRUNDQUALIFIKATION_QUESTIONS[3].name} label={GRUNDQUALIFIKATION_QUESTIONS[3].label} options={[{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }]} value={form[GRUNDQUALIFIKATION_QUESTIONS[3].name]} onChange={set(GRUNDQUALIFIKATION_QUESTIONS[3].name)} />
        <div className="alert alert-info">
          <FaInfoCircle className="text-lg" />
          <div className="text-sm">
            <strong>Hinweis</strong> Für die Besitzstandsregelung ist eine Weiterbildung von 35 Stunden erforderlich, wenn sie nicht bereits in den letzten fünf Jahren während einer früheren Beschäftigung in einem EU-/EWR-Staat oder der Schweiz absolviert wurde (§ 4 Satz 2 in Verbindung mit § 5 BKrFQG – <a href="https://www.gesetze-im-internet.de/bkrfqg_2020/__4.html" target="_blank" rel="noopener noreferrer" className="link link-primary">§ 4 BKrFQG</a> und <a href="https://www.gesetze-im-internet.de/bkrfqg_2020/__5.html" target="_blank" rel="noopener noreferrer" className="link link-primary">§ 5 BKrFQG</a>). Eine Arbeitsgenehmigung für den Staat, in dem die Weiterbildung absolviert wurde, ist alternativ zur Beschäftigung zulässig.
          </div>
        </div>
      </SectionCard>
    </>
  );
}

export function SectionErwerbUndUnterschrift({ form, setForm }) {
  const setText = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const setCheck = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));
  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <>
      <SectionDivider>D. Erwerb von deutscher Fahrerlaubnis und/oder Grundqualifikation oder beschleunigter Grundqualifikation</SectionDivider>
      <SectionCard>
        <CheckboxField label={<>Die Teilnahme an dem/den Kurs(en) beziehungsweise Prüfungen zum Erwerb der deutschen Fahrerlaubnis und/oder der Grundqualifikation oder beschleunigten Grundqualifikation und/oder bei Besitzstand nach § 4 BKrFQG – <a href="https://www.gesetze-im-internet.de/bkrfqg_2020/__4.html" target="_blank" rel="noopener noreferrer" className="link link-primary break-all">Link</a> – der Weiterbildung ist erforderlich und geplant.</>} checked={form.chbx_erwerb_fahrerlaubnis_1} onChange={setCheck("chbx_erwerb_fahrerlaubnis_1")} />
        <div className="form-control">
          <label className="label"><span className="label-text font-medium text-sm whitespace-normal">15 Die Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der deutschen Fahrerlaubnis ist für folgenden Zeitraum ab Beschäftigungsaufnahme geplant:</span></label>
          <div className="flex items-center gap-3 mt-2">
            <FormInput label="Wochen" value={form.txtf_15_erwerb_kurs_wochen} onChange={setText("txtf_15_erwerb_kurs_wochen")} className="w-24" />
            <span className="text-sm">oder Monate</span>
            <FormInput label="Monate" value={form.txtf_15_erwerb_kurs_monat} onChange={setText("txtf_15_erwerb_kurs_monat")} className="w-24" />
          </div>
        </div>
        <FormInput label="16 Wie viele Wochenstunden wird die Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der deutschen Fahrerlaubnis in Anspruch nehmen?" value={form.txtf_16_erwerb_kurs_wochenstunden} onChange={setText("txtf_16_erwerb_kurs_wochenstunden")} />
        <FormInput label="17 Wie viele Wochenstunden wird die Arbeitnehmerin/der Arbeitnehmer zur Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der deutschen Fahrerlaubnis freigestellt?" value={form.txtf_17_erwerb_kurs_freigestellt} onChange={setText("txtf_17_erwerb_kurs_freigestellt")} />
        <div className="form-control">
          <label className="label"><span className="label-text font-medium text-sm whitespace-normal">18 Die Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der Grundqualifikation oder beschleunigten Grundqualifikation oder bei Besitzstand nach § 4 BKrFQG – <a href="https://www.gesetze-im-internet.de/bkrfqg_2020/__4.html" target="_blank" rel="noopener noreferrer" className="link link-primary">§ 4 BKrFQG</a> – der Weiterbildung ist für folgenden Zeitraum ab Beschäftigungsaufnahme geplant:</span></label>
          <div className="flex items-center gap-3 mt-2">
            <FormInput label="Wochen" value={form.txtf_18_beschaeftigungsaufnahme_kurs_wochen} onChange={setText("txtf_18_beschaeftigungsaufnahme_kurs_wochen")} className="w-24" />
            <span className="text-sm">oder Monate</span>
            <FormInput label="Monate" value={form.txtf_18_beschaeftigungsaufnahme_kurs_monat} onChange={setText("txtf_18_beschaeftigungsaufnahme_kurs_monat")} className="w-24" />
          </div>
        </div>
        <FormInput label="19 Wie viele Wochenstunden wird die Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der Grundqualifikation oder beschleunigten Grundqualifikation oder bei Besitzstand nach § 4 BKrFQG – der Weiterbildung in Anspruch nehmen?" value={form.txtf_19_weiterbildung_kurs_wochenstunden} onChange={setText("txtf_19_weiterbildung_kurs_wochenstunden")} />
        <FormInput label="20 Wie viele Wochenstunden wird die Arbeitnehmerin/der Arbeitnehmer zur Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der Grundqualifikation oder beschleunigten Grundqualifikation oder bei Besitzstand nach § 4 BKrFQG – der Weiterbildung freigestellt?" value={form.txtf_20_weiterbildung_kurs_freigestellt} onChange={setText("txtf_20_weiterbildung_kurs_freigestellt")} />

        <CheckboxField label="Für die oben aufgeführte Kurs- beziehungsweise Prüfungsteilnahme ist der Besuch eines Sprachkurses in Deutschland erforderlich und geplant." checked={form.chbx_erwerb_fahrerlaubnis_2} onChange={setCheck("chbx_erwerb_fahrerlaubnis_2")} />
        <div className="alert alert-info">
          <FaInfoCircle className="text-lg" />
          <div className="text-sm"><strong>Hinweis</strong> Die Prüfungsfragen zum Erwerb der beschleunigten Grundqualifikation in Deutsch sind an das Sprachniveau B1 angelehnt.</div>
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium text-sm whitespace-normal">21 Die Teilnahme am Sprachkurs ist für folgenden Zeitraum ab Beschäftigungsaufnahme geplant:</span></label>
          <div className="flex items-center gap-3 mt-2">
            <FormInput label="Wochen" value={form.txtf_21_erwerb_sprachkurs_wochen} onChange={setText("txtf_21_erwerb_sprachkurs_wochen")} className="w-24" />
            <span className="text-sm">oder Monate</span>
            <FormInput label="Monate" value={form.txtf_21_erwerb_sprachkurs_monat} onChange={setText("txtf_21_erwerb_sprachkurs_monat")} className="w-24" />
          </div>
        </div>
        <FormInput label="22 Wie viele Wochenstunden wird die Teilnahme am Sprachkurs in Anspruch nehmen?" value={form.txtf_22_erwerb_sprachkurs_wochenstunden} onChange={setText("txtf_22_erwerb_sprachkurs_wochenstunden")} />
        <FormInput label="23 Wie viele Wochenstunden wird die Arbeitnehmerin/der Arbeitnehmer zur Teilnahme am Sprachkurs freigestellt?" value={form.txtf_23_erwerb_sprachkurs_freigestellt} onChange={setText("txtf_23_erwerb_sprachkurs_freigestellt")} />

        <RadioGroup
          name="rbtn_24_zeitlicher_ablauf"
          label="24 Erfolgt der Beginn der angegebenen Kurs- beziehungsweise Prüfungsteilnahmen zum Erwerb der deutschen Fahrerlaubnis und/oder der Grundqualifikation oder beschleunigten Grundqualifikation oder bei Besitzstand nach § 4 BKrFQG – der Weiterbildung und/oder des angestrebten Sprachniveaus parallel oder aufeinanderfolgend?"
          options={[
            { value: "parallel", label: "parallel" },
            { value: "aufeinanderfolgend (nach Abschluss eines Kurses beginnt der nächste)", label: "aufeinanderfolgend (nach Abschluss eines Kurses beginnt der nächste)" },
          ]}
          value={form.rbtn_24_zeitlicher_ablauf}
          onChange={set("rbtn_24_zeitlicher_ablauf")}
        />
        <CheckboxField label="Keine der genannten Konstellationen trifft zu." checked={form.chbx_erwerb_fahrerlaubnis_3} onChange={setCheck("chbx_erwerb_fahrerlaubnis_3")} />
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">25 Begründung</span></label>
          <textarea className="textarea textarea-bordered w-full h-32" value={form.txtf_25_erwerb_begruendung} onChange={setText("txtf_25_erwerb_begruendung")} />
        </div>
      </SectionCard>

      <SectionDivider>E. Erklärung und Unterschrift</SectionDivider>
      <SectionCard>
        <p className="text-sm opacity-70">Die Richtigkeit der Angaben wird durch Datum und Unterschrift bestätigt. Der Arbeitsvertrag verpflichtet zur Teilnahme an Maßnahmen zur Erlangung der oben genannten Weiterbildungen und Qualifikationen.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="26 Ort" value={form.txtf_26_erklarung_ort} onChange={setText("txtf_26_erklarung_ort")} />
          <FormInput label="27 Datum" type="date" value={toInputDate(form.txtf_27_erklarung_datum)} onChange={(e) => setForm((p) => ({ ...p, txtf_27_erklarung_datum: fromInputDate(e.target.value) }))} />
        </div>
      </SectionCard>
    </>
  );
}
