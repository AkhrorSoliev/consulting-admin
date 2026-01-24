import { useState } from "react";
import { FaDownload } from "react-icons/fa";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import FormInput from "../components/FormInput";

const PDF_BACKEND_URL = import.meta.env.VITE_PDF_BACKEND_URL || "http://localhost:3001";

function todayDdMmYyyy() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

function toInputDate(ddMmYyyy) {
  if (!ddMmYyyy) return "";
  const parts = String(ddMmYyyy).split(".");
  if (parts.length !== 3) return "";
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm}-${dd}`;
}

function fromInputDate(yyyyMmDd) {
  if (!yyyyMmDd) return "";
  const parts = String(yyyyMmDd).split("-");
  if (parts.length !== 3) return "";
  const [yyyy, mm, dd] = parts;
  return `${dd}.${mm}.${yyyy}`;
}

export default function ZusatzblattA() {
  const [isDownloading, setIsDownloading] = useState(false);

  const [form, setForm] = useState({
    // Section A - Angaben zur Person
    txtf_1_Vorname: "",
    txtf_2_Nachname: "",
    txtf_3_Wohnsitz: "",

    // Section B - Art der Beschäftigung
    rbtn_B_ArtBeschaeftigung: "",

    // Section C - Anerkennungsbehörde
    txtf_4_Anerkennungsbehoerde: "",
    txtf_5_Strasse: "",
    txtf_6_Hausnummer: "",
    txtf_7_PLZ: "",
    txtf_8_Ort: "",

    // Section D - Antrag
    rbtn_9_AntragAnerkennungsbehoerde: "",
    rbtn_10_UnterschiedeBerufsqualifikation: "",
    rbtn_11_Sprachkenntnisse: "",
    rbtn_12_vollstaendigeAnerkennung: "",
    rbtn_13_betrieblicheQualifizierung: "",

    // Section E - Beschäftigung während Anerkennung
    rbtn_14_Betriebsdauer: "",
    txtf_14_Gruende_beruflicherZusammenhang: "",
    txtf_15_geplanterZielberuf: "",
    chbx_15a_Zielberuf: false,
    chbx_15b_Zielberuf: false,
    chbx_15c_Zielberuf: false,
    chbx_15d_Zielberuf: false,
    chbx_15e_Zielberuf: false,
    chbx_15f_Zielberuf: false,
    chbx_15g_Zielberuf: false,
    chbx_15h_Zielberuf: false,

    // Section F - Anerkennungspartnerschaft
    rbtn_16_Anerkennungsbescheid: "",
    rbtn_17_Nachqualifizierung: "",
    txtf_17_von: "",
    txtf_17_bis: "",

    // Section G - Sprachkenntnisse
    txtf_18_Sprachkenntnisse: "",
    chbx_18_a: false,
    chbx_18_b: false,
    chbx_18_c: false,
    chbx_18_d: false,
    rbtn_19_Sprachniveau: "",

    // Section H - Unterschrift
    txtf_20_Ort: "",
    txtf_21_Datum: todayDdMmYyyy(),
  });

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);

      const payload = {
        template: "zusatzblatt_a_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf",
        data: {
          textFields: {},
          radioGroups: {},
          checkboxes: {},
        },
      };

      Object.entries(form).forEach(([key, value]) => {
        if (key.startsWith("txtf_")) {
          payload.data.textFields[key] = value;
        } else if (key.startsWith("rbtn_") && value) {
          payload.data.radioGroups[key] = value;
        } else if (key.startsWith("chbx_")) {
          payload.data.checkboxes[key] = value;
        }
      });

      const response = await fetch(`${PDF_BACKEND_URL}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "PDF generation failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Zusatzblatt_A_${form.txtf_2_Nachname || "Dokument"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF wurde erstellt.");
    } catch (e) {
      console.error("PDF error:", e);
      toast.error(e.message || "Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  const formCard = "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full max-w-4xl mx-auto";

  return (
    <div className="p-2 min-h-screen">
      <div className="fixed inset-x-0 top-16 z-30 border-b border-base-300 bg-base-200/90 backdrop-blur print:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2 lg:px-6">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Link to="/settings/documents" className="link flex items-center gap-2">
                  <FaArrowLeft /> Zurück
                </Link>
              </li>
              <li className="opacity-70">Zusatzblatt A</li>
            </ul>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            <FaDownload />
            {isDownloading ? "Wird erstellt..." : "PDF Herunterladen"}
          </button>
        </div>
      </div>

      <div className="pt-16">
        <section className={formCard}>
          <div className="card-body space-y-6">
            <div>
              <h2 className="card-title text-2xl font-bold">
                Zusatzblatt A - Anerkennungsverfahren
              </h2>
              <p className="text-sm opacity-70 mt-1">
                Zusatzblatt für Beschäftigung im Rahmen des Anerkennungsverfahrens
              </p>
            </div>

            {/* Section A - Angaben zur Person */}
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

            {/* Section B - Art der Beschäftigung */}
            <div className="divider divider-start font-bold text-base-content/80">
              B. Art der Beschäftigung
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Art der Beschäftigung</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: "Betriebliche Qualifizierung, die im Rahmen des Anerkennungsverfahrens erforderlich ist \n(bitte die Abschnitte C, D, G und H ausfuellen)", label: "Betriebliche Qualifizierung im Rahmen des Anerkennungsverfahrens" },
                    { value: "Beschaeftigung, die neben einer Qualifizierung im Rahmen des Anerkennungsverfahrens ausgeuebt wird \n(bitte die Abschnitte C, E, G und H ausfuellen)", label: "Beschäftigung neben einer Qualifizierung" },
                    { value: "Beschaeftigung waehrend der Anerkennungspartnerschaft (bitte die Abschnitte F, G und H ausfuellen)", label: "Beschäftigung während der Anerkennungspartnerschaft" },
                  ].map((opt) => (
                    <label key={opt.value} className="label cursor-pointer justify-start gap-3">
                      <input
                        type="radio"
                        name="rbtn_B_ArtBeschaeftigung"
                        className="radio radio-primary"
                        checked={form.rbtn_B_ArtBeschaeftigung === opt.value}
                        onChange={() => setForm((p) => ({ ...p, rbtn_B_ArtBeschaeftigung: opt.value }))}
                      />
                      <span className="label-text">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section C - Anerkennungsbehörde */}
            <div className="divider divider-start font-bold text-base-content/80">
              C. Angaben zur Anerkennungsbehörde
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="4. Name der Anerkennungsbehörde"
                value={form.txtf_4_Anerkennungsbehoerde}
                onChange={(e) => setForm((p) => ({ ...p, txtf_4_Anerkennungsbehoerde: e.target.value }))}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="5. Straße"
                  value={form.txtf_5_Strasse}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_5_Strasse: e.target.value }))}
                />
                <FormInput
                  label="6. Hausnummer"
                  value={form.txtf_6_Hausnummer}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_6_Hausnummer: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="7. PLZ"
                  value={form.txtf_7_PLZ}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_7_PLZ: e.target.value }))}
                />
                <FormInput
                  label="8. Ort"
                  value={form.txtf_8_Ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_8_Ort: e.target.value }))}
                />
              </div>
            </div>

            {/* Section D - Antrag */}
            <div className="divider divider-start font-bold text-base-content/80">
              D. Angaben zum Antrag
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">9. Art des Antrags</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: "Antrag auf Feststellung der Gleichwertigkeit der auslaendischen Berufsqualifikation mit einer inlaendischen Berufsqualifikation (weiter mit 10)", label: "Antrag auf Feststellung der Gleichwertigkeit" },
                    { value: "Antrag auf Erteilung einer Berufsausuebungserlaubnis – bei reglementierten Berufen (weiter mit 11)", label: "Antrag auf Berufsausübungserlaubnis" },
                  ].map((opt) => (
                    <label key={opt.value} className="label cursor-pointer justify-start gap-3">
                      <input
                        type="radio"
                        name="rbtn_9_AntragAnerkennungsbehoerde"
                        className="radio radio-primary"
                        checked={form.rbtn_9_AntragAnerkennungsbehoerde === opt.value}
                        onChange={() => setForm((p) => ({ ...p, rbtn_9_AntragAnerkennungsbehoerde: opt.value }))}
                      />
                      <span className="label-text">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">10. Wurden Unterschiede in der Berufsqualifikation festgestellt?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_10_UnterschiedeBerufsqualifikation"
                        className="radio radio-primary"
                        checked={form.rbtn_10_UnterschiedeBerufsqualifikation === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_10_UnterschiedeBerufsqualifikation: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">11. Sind Sprachkenntnisse erforderlich?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_11_Sprachkenntnisse"
                        className="radio radio-primary"
                        checked={form.rbtn_11_Sprachkenntnisse === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_11_Sprachkenntnisse: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">12. Ist eine vollständige Anerkennung möglich?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_12_vollstaendigeAnerkennung"
                        className="radio radio-primary"
                        checked={form.rbtn_12_vollstaendigeAnerkennung === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_12_vollstaendigeAnerkennung: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">13. Ist eine betriebliche Qualifizierung erforderlich?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_13_betrieblicheQualifizierung"
                        className="radio radio-primary"
                        checked={form.rbtn_13_betrieblicheQualifizierung === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_13_betrieblicheQualifizierung: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section E - Beschäftigung während Anerkennung */}
            <div className="divider divider-start font-bold text-base-content/80">
              E. Beschäftigung während des Anerkennungsverfahrens
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">14. Dauer der Beschäftigung</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: "Die Beschaeftigung dauert bis zu 20 Stunden pro Woche (weiter mit Abschnitt G)", label: "Bis zu 20 Stunden pro Woche" },
                    { value: "Die Beschaeftigung dauert mehr als 20 Stunden pro Woche und zwischen der Beschaeftigung waehrend des Anerkennungsverfahrens und der spaeteren Beschaeftigung nach Erlangung der vollstaendigen Anerkennung besteht ein berufsfachlicher Zusammenhang", label: "Mehr als 20 Stunden pro Woche mit berufsfachlichem Zusammenhang" },
                  ].map((opt) => (
                    <label key={opt.value} className="label cursor-pointer justify-start gap-3">
                      <input
                        type="radio"
                        name="rbtn_14_Betriebsdauer"
                        className="radio radio-primary"
                        checked={form.rbtn_14_Betriebsdauer === opt.value}
                        onChange={() => setForm((p) => ({ ...p, rbtn_14_Betriebsdauer: opt.value }))}
                      />
                      <span className="label-text">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Gründe für berufsfachlichen Zusammenhang</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-24"
                  value={form.txtf_14_Gruende_beruflicherZusammenhang}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_14_Gruende_beruflicherZusammenhang: e.target.value }))}
                />
              </div>

              <FormInput
                label="15. Geplanter Zielberuf"
                value={form.txtf_15_geplanterZielberuf}
                onChange={(e) => setForm((p) => ({ ...p, txtf_15_geplanterZielberuf: e.target.value }))}
              />

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Zielberuf Kategorien</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {["a", "b", "c", "d", "e", "f", "g", "h"].map((letter) => (
                    <label key={letter} className="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={form[`chbx_15${letter}_Zielberuf`]}
                        onChange={(e) => setForm((p) => ({ ...p, [`chbx_15${letter}_Zielberuf`]: e.target.checked }))}
                      />
                      <span className="label-text">{letter.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section F - Anerkennungspartnerschaft */}
            <div className="divider divider-start font-bold text-base-content/80">
              F. Anerkennungspartnerschaft
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">16. Liegt ein Anerkennungsbescheid vor?</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: "ja - (bitte Nachweis beifuegen und auch Abschnitt C. ausfuellen)", label: "Ja (Nachweis beifügen)" },
                    { value: "nein (weiter mit Abschnitt G.)", label: "Nein" },
                  ].map((opt) => (
                    <label key={opt.value} className="label cursor-pointer justify-start gap-3">
                      <input
                        type="radio"
                        name="rbtn_16_Anerkennungsbescheid"
                        className="radio radio-primary"
                        checked={form.rbtn_16_Anerkennungsbescheid === opt.value}
                        onChange={() => setForm((p) => ({ ...p, rbtn_16_Anerkennungsbescheid: opt.value }))}
                      />
                      <span className="label-text">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">17. Art der Nachqualifizierung</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: "Die durch die zustaendige Anerkennungsstelle als erforderlich festgestellten Nachqualifizierungen koennen nicht weitgehend betriebsintern angeboten werden (bitte Weiterbildungsplan beifuegen)", label: "Nachqualifizierung nicht betriebsintern möglich" },
                    { value: "es ist neben der betrieblichen Nachqualifizierung auch eine theoretische Nachqualifizierung notwendig (bitte Weiterbildungsplan beifuegen)", label: "Theoretische Nachqualifizierung notwendig" },
                    { value: "die durch die zustaendige Anerkennungsstelle als erforderlich festgestellten Nachqualifizierungen koennen weitgehend \nbetriebsintern angeboten werden und die Nachqualifizierung wird voraussichtlich folgenden Zeitraum in Anspruch nehmen", label: "Betriebsinterne Nachqualifizierung möglich" },
                  ].map((opt) => (
                    <label key={opt.value} className="label cursor-pointer justify-start gap-3">
                      <input
                        type="radio"
                        name="rbtn_17_Nachqualifizierung"
                        className="radio radio-primary"
                        checked={form.rbtn_17_Nachqualifizierung === opt.value}
                        onChange={() => setForm((p) => ({ ...p, rbtn_17_Nachqualifizierung: opt.value }))}
                      />
                      <span className="label-text text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="Zeitraum von"
                  type="date"
                  value={toInputDate(form.txtf_17_von)}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_17_von: fromInputDate(e.target.value) }))}
                />
                <FormInput
                  label="Zeitraum bis"
                  type="date"
                  value={toInputDate(form.txtf_17_bis)}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_17_bis: fromInputDate(e.target.value) }))}
                />
              </div>
            </div>

            {/* Section G - Sprachkenntnisse */}
            <div className="divider divider-start font-bold text-base-content/80">
              G. Sprachkenntnisse
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">18. Sprachkenntnisse</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-20"
                  value={form.txtf_18_Sprachkenntnisse}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_18_Sprachkenntnisse: e.target.value }))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Nachweis</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {["a", "b", "c", "d"].map((letter) => (
                    <label key={letter} className="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={form[`chbx_18_${letter}`]}
                        onChange={(e) => setForm((p) => ({ ...p, [`chbx_18_${letter}`]: e.target.checked }))}
                      />
                      <span className="label-text">{letter.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">19. Sprachniveau</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                    <label key={level} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_19_Sprachniveau"
                        className="radio radio-primary radio-sm"
                        checked={form.rbtn_19_Sprachniveau === level}
                        onChange={() => setForm((p) => ({ ...p, rbtn_19_Sprachniveau: level }))}
                      />
                      <span className="label-text">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section H - Unterschrift */}
            <div className="divider divider-start font-bold text-base-content/80">
              H. Ort und Datum
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="20. Ort"
                  value={form.txtf_20_Ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_20_Ort: e.target.value }))}
                />
                <FormInput
                  label="21. Datum"
                  type="date"
                  value={toInputDate(form.txtf_21_Datum)}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_21_Datum: fromInputDate(e.target.value) }))}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
