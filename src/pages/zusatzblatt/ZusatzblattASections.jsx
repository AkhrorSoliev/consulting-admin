import FormInput from "../../components/FormInput";
import { RadioGroup, CheckboxField, SectionCard, SectionDivider } from "./FormFields";
import { toInputDate, fromInputDate } from "./dateUtils";
import {
  ART_BESCHAEFTIGUNG_OPTIONS,
  ANTRAG_OPTIONS,
  BETRIEBSDAUER_OPTIONS,
  ANERKENNUNGSBESCHEID_OPTIONS,
  NACHQUALIFIZIERUNG_OPTIONS,
} from "./zusatzblattAFields";

export function SectionAB({ form, setForm }) {
  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));
  const setText = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <>
      <SectionDivider>A. Angaben zur Arbeitnehmerin/zum Arbeitnehmer</SectionDivider>
      <SectionCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="1 Vorname" value={form.txtf_1_Vorname} onChange={setText("txtf_1_Vorname")} />
          <FormInput label="2 Nachname" value={form.txtf_2_Nachname} onChange={setText("txtf_2_Nachname")} />
        </div>
        <FormInput label="3 derzeitiger Wohnsitz oder gewöhnlicher Aufenthaltsort" value={form.txtf_3_Wohnsitz} onChange={setText("txtf_3_Wohnsitz")} />
      </SectionCard>

      <SectionCard>
        <RadioGroup
          name="rbtn_B_ArtBeschaeftigung"
          label='B. Um welche Art der Beschäftigung beziehungsweise Qualifizierung handelt es sich im Formular „Erklärung zum Beschäftigungsverhältnis"?'
          options={ART_BESCHAEFTIGUNG_OPTIONS}
          value={form.rbtn_B_ArtBeschaeftigung}
          onChange={set("rbtn_B_ArtBeschaeftigung")}
        />
      </SectionCard>
    </>
  );
}

export function SectionCD({ form, setForm }) {
  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));
  const setText = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <>
      <SectionDivider>C. Angaben zum Anerkennungsverfahren</SectionDivider>
      <SectionCard>
        <FormInput label="4 Name der zuständigen Anerkennungsbehörde" value={form.txtf_4_Anerkennungsbehoerde} onChange={setText("txtf_4_Anerkennungsbehoerde")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="5 Straße" value={form.txtf_5_Strasse} onChange={setText("txtf_5_Strasse")} />
          <FormInput label="6 Hausnummer" value={form.txtf_6_Hausnummer} onChange={setText("txtf_6_Hausnummer")} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="7 Postleitzahl" value={form.txtf_7_PLZ} onChange={setText("txtf_7_PLZ")} />
          <FormInput label="8 Ort" value={form.txtf_8_Ort} onChange={setText("txtf_8_Ort")} />
        </div>
        <RadioGroup name="rbtn_9_AntragAnerkennungsbehoerde" label="9 Welcher Antrag wurde bei der zuständigen Anerkennungsbehörde gestellt?" options={ANTRAG_OPTIONS} value={form.rbtn_9_AntragAnerkennungsbehoerde} onChange={set("rbtn_9_AntragAnerkennungsbehoerde")} />
        <RadioGroup name="rbtn_10_UnterschiedeBerufsqualifikation" label="10 Hat die zuständige Behörde festgestellt, dass wesentliche Unterschiede im Vergleich zu einer inländischen Berufsqualifikation bestehen?" options={["ja", "nein"]} value={form.rbtn_10_UnterschiedeBerufsqualifikation} onChange={set("rbtn_10_UnterschiedeBerufsqualifikation")} />
        <RadioGroup name="rbtn_11_Sprachkenntnisse" label="11 Hat die zuständige Anerkennungsstelle festgestellt, dass Ausgleichsmaßnahmen oder weitere Qualifikationen (zum Beispiel Sprachkenntnisse) erforderlich sind? Bitte fügen Sie den Bescheid der zuständigen Anerkennungsbehörde bei." options={["ja", "nein"]} value={form.rbtn_11_Sprachkenntnisse} onChange={set("rbtn_11_Sprachkenntnisse")} />
        <RadioGroup name="rbtn_12_vollstaendigeAnerkennung" label="12 Falls bekannt: Kann nach Einschätzung der Anerkennungsbehörde die vollständige Anerkennung nach erfolgreichem Abschluss der vorgesehenen Qualifizierungsmaßnahme/n erlangt werden? Bitte fügen Sie eine entsprechende Erklärung der zuständigen Stelle bei, falls diese vorliegt." options={["ja", "nein"]} value={form.rbtn_12_vollstaendigeAnerkennung} onChange={set("rbtn_12_vollstaendigeAnerkennung")} />
      </SectionCard>

      <SectionDivider>D. Betriebliche Qualifizierungsmaßnahme</SectionDivider>
      <SectionCard>
        <RadioGroup name="rbtn_13_betrieblicheQualifizierung" label="13 Handelt es sich um eine überwiegend betriebliche Qualifizierung im Rahmen des Anerkennungsverfahrens (mehr als die Hälfte der Qualifizierungsmaßnahme erfolgt im Rahmen einer Beschäftigung in einem Betrieb)? Bitte fügen Sie einen Weiterbildungsplan für die Qualifizierungsmaßnahme bei. Aus dem Weiterbildungsplan muss hervorgehen, in welcher Form, auf welche Art und Weise und/oder mit welchen Methoden die im Bescheid der zuständigen Stelle aufgelisteten Unterschiede ausgeglichen werden sollen." options={["ja", "nein"]} value={form.rbtn_13_betrieblicheQualifizierung} onChange={set("rbtn_13_betrieblicheQualifizierung")} />
      </SectionCard>
    </>
  );
}

export function SectionEF({ form, setForm }) {
  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));
  const setText = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const setCheck = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <>
      <SectionDivider>E. Beschäftigung, die zusätzlich zu einer Qualifizierungsmaßnahme ausgeübt wird</SectionDivider>
      <SectionCard>
        <RadioGroup name="rbtn_14_Betriebsdauer" label="14 Bitte machen Sie Angaben zur Beschäftigungsdauer." options={BETRIEBSDAUER_OPTIONS} value={form.rbtn_14_Betriebsdauer} onChange={set("rbtn_14_Betriebsdauer")} />
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium whitespace-normal">Bitte geben Sie die Gründe des berufsfachlichen Zusammenhangs an:</span>
          </label>
          <textarea className="textarea textarea-bordered w-full h-24" value={form.txtf_14_Gruende_beruflicherZusammenhang} onChange={setText("txtf_14_Gruende_beruflicherZusammenhang")} />
        </div>
      </SectionCard>

      <SectionDivider>F. Beschäftigung während der Anerkennungspartnerschaft</SectionDivider>
      <SectionCard>
        <div className="space-y-2">
          <CheckboxField label="Während der Anerkennungspartnerschaft soll eine qualifizierte Beschäftigung ausgeübt werden (weiter mit Abschnitt G)." checked={form.chbx_15g_Zielberuf} onChange={setCheck("chbx_15g_Zielberuf")} />
          <CheckboxField label="Während der Anerkennungspartnerschaft kann nur eine nicht qualifizierte Beschäftigung ausgeübt werden, da zur Ausübung der qualifizierten Beschäftigung eine Berufsausübungserlaubnis erforderlich wäre." checked={form.chbx_15h_Zielberuf} onChange={setCheck("chbx_15h_Zielberuf")} />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium whitespace-normal">15 Bitte wählen Sie Zutreffendes aus und machen Sie Angaben zum Zielberuf:</span>
          </label>
          <div className="space-y-2">
            <CheckboxField label="Die Arbeitnehmerin/Der Arbeitnehmer hat sich in einer Vereinbarung mit mir als Arbeitgeber verpflichtet, spätestens unverzüglich nach der Einreise die Anerkennung ihrer/seiner im Ausland erworbenen Berufsqualifikation bei der zuständigen Anerkennungsstelle zu beantragen (bitte Nachweis beifügen)." checked={form.chbx_15a_Zielberuf} onChange={setCheck("chbx_15a_Zielberuf")} />
            <CheckboxField label="Ich als Arbeitgeber habe mich in einer Vereinbarung mit der Arbeitnehmerin/dem Arbeitnehmer verpflichtet, der Arbeitnehmerin/dem Arbeitnehmer die von der zuständigen Anerkennungsstelle gegebenenfalls geforderten Qualifizierungsmaßnahmen im Rahmen des Arbeitsverhältnisses zu ermöglichen (bitte Nachweis beifügen)." checked={form.chbx_15b_Zielberuf} onChange={setCheck("chbx_15b_Zielberuf")} />
            <CheckboxField label="Mir ist bekannt, dass die Arbeitnehmerin/der Arbeitnehmer das Anerkennungsverfahren so verfolgen sollte, dass der (Teil-)Anerkennungsbescheid der zuständigen Anerkennungsbehörde spätestens 12 Monate nach Einreise vorliegt." checked={form.chbx_15c_Zielberuf} onChange={setCheck("chbx_15c_Zielberuf")} />
          </div>
        </div>
        <FormInput label="Der geplante Zielberuf nach erfolgreicher Anerkennung der Berufsqualifikation der Arbeitnehmerin/des Arbeitnehmers lautet:" value={form.txtf_15_geplanterZielberuf} onChange={setText("txtf_15_geplanterZielberuf")} />
        <div className="space-y-2">
          <CheckboxField label="Ich als Arbeitgeber bin für eine Ausbildung oder Nachqualifizierung im geplanten Zielberuf geeignet (bitte Nachweise wie zum Beispiel Ausbildungsberechtigung, Meisterbetrieb, letzte in der Lehrlingsrolle eingetragene Ausbildungen des Betriebs oder bereits erfolgreiche Nachqualifizierungen im Rahmen eines Anerkennungsverfahrens beifügen)." checked={form.chbx_15d_Zielberuf} onChange={setCheck("chbx_15d_Zielberuf")} />
          <CheckboxField label="Ich als Arbeitgeber bin eine Pflegeeinrichtung im Sinne des § 72 Sozialgesetzbuch XI (bitte Nachweis beifügen) (weiter mit Abschnitt G)." checked={form.chbx_15e_Zielberuf} onChange={setCheck("chbx_15e_Zielberuf")} />
          <CheckboxField label="Ich als Arbeitgeber und die angebotenen Beschäftigungsbedingungen unterliegen kirchlichem Recht (bitte Nachweis beifügen)." checked={form.chbx_15f_Zielberuf} onChange={setCheck("chbx_15f_Zielberuf")} />
        </div>
        <RadioGroup name="rbtn_16_Anerkennungsbescheid" label="16 Liegt bereits ein (Teil-)Anerkennungsbescheid vor?" options={ANERKENNUNGSBESCHEID_OPTIONS} value={form.rbtn_16_Anerkennungsbescheid} onChange={set("rbtn_16_Anerkennungsbescheid")} />
        <RadioGroup name="rbtn_17_Nachqualifizierung" label="17 Bitte wählen Sie Zutreffendes zur Nachqualifizierung aus:" options={NACHQUALIFIZIERUNG_OPTIONS} value={form.rbtn_17_Nachqualifizierung} onChange={set("rbtn_17_Nachqualifizierung")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="von (TT.MM.JJJJ)" type="date" value={toInputDate(form.txtf_17_von)} onChange={(e) => setForm((p) => ({ ...p, txtf_17_von: fromInputDate(e.target.value) }))} />
          <FormInput label="bis (TT.MM.JJJJ)" type="date" value={toInputDate(form.txtf_17_bis)} onChange={(e) => setForm((p) => ({ ...p, txtf_17_bis: fromInputDate(e.target.value) }))} />
        </div>
      </SectionCard>
    </>
  );
}

export function SectionGH({ form, setForm }) {
  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));
  const setText = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const setCheck = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <>
      <SectionDivider>G. Sprachkenntnisse</SectionDivider>
      <SectionCard>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium whitespace-normal">18 Bitte machen Sie Angaben zu den Sprachkenntnissen der Arbeitnehmerin/des Arbeitnehmers.</span>
          </label>
          <div className="space-y-2">
            <CheckboxField label="Die Arbeitnehmerin/Der Arbeitnehmer verfügt über zertifizierte deutsche Sprachkenntnisse des Gemeinsamen Europäischen Referenzrahmens." checked={form.chbx_18_a} onChange={setCheck("chbx_18_a")} />
            <CheckboxField label="Das Niveau ist nicht bekannt beziehungsweise es liegt kein Sprachzertifikat zu Deutschkenntnissen vor (weiter mit Abschnitt H)." checked={form.chbx_18_b} onChange={setCheck("chbx_18_b")} />
            <CheckboxField label="Die Arbeitnehmerin/Der Arbeitnehmer wird begleitend zu der Beschäftigung weitere deutsche Sprachkenntnisse erwerben." checked={form.chbx_18_c} onChange={setCheck("chbx_18_c")} />
            <CheckboxField label="Die Qualifizierungsmaßnahme oder Tätigkeit kann mit den nachweislich vorhandenen deutschen Sprachkenntnissen ausgeübt werden." checked={form.chbx_18_d} onChange={setCheck("chbx_18_d")} />
          </div>
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium whitespace-normal">Bitte erläutern Sie die Gründe (gegebenenfalls werden weitere Nachweise zur Glaubhaftmachung verlangt):</span>
          </label>
          <textarea className="textarea textarea-bordered w-full h-20" value={form.txtf_18_Sprachkenntnisse} onChange={setText("txtf_18_Sprachkenntnisse")} />
        </div>
        <RadioGroup name="rbtn_19_Sprachniveau" label="19 Bitte geben Sie das deutsche Sprachniveau an und fügen Sie einen entsprechenden Nachweis bei, falls vorhanden." options={["A1", "A2", "B1", "B2", "C1", "C2"]} value={form.rbtn_19_Sprachniveau} onChange={set("rbtn_19_Sprachniveau")} />
      </SectionCard>

      <SectionDivider>H. Erklärung und Unterschrift</SectionDivider>
      <SectionCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="20 Ort" value={form.txtf_20_Ort} onChange={setText("txtf_20_Ort")} />
          <FormInput label="21 Datum" type="date" value={toInputDate(form.txtf_21_Datum)} onChange={(e) => setForm((p) => ({ ...p, txtf_21_Datum: fromInputDate(e.target.value) }))} />
        </div>
      </SectionCard>
    </>
  );
}
