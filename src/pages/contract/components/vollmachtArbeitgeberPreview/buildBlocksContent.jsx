import { hasValue, P, FormRow, Bullet } from "./BlockPrimitives";
import { SafeInline } from "./utils";

export function buildContentBlocks({ form, isOmitted, employerDisplayName, employerRepDisplayName }) {
  return [
    {
      id: "intro",
      node: (
        <div>
          <P>
            Hiermit bevollmächtige ich{" "}
            {hasValue(employerDisplayName) && (
              <span className="font-semibold">
                <SafeInline>{employerDisplayName} </SafeInline>
              </span>
            )}
          </P>
          <P className="mt-2"> - im Folgenden: „der Bevollmächtigte",</P>
          <P className="text-justify">
            vertreten durch{" "}
            {hasValue(employerRepDisplayName) && (
              <span className="font-semibold">
                <SafeInline>{employerRepDisplayName}</SafeInline>
              </span>
            )}{" "}
            - Vollmacht, aus der sich deren Vertretungsbefugnis für den
            Arbeitgeber ergibt, muss als Anlage beigefügt werden, bei der
            zuständigen Ausländerbehörde das beschleunigte Fachkräfteverfahren
            nach § 81a AufenthG sowie die sonstigen ggf. damit zusammenhängenden
            und in § 81a Absatz 3 AufenthG aufgeführten Verfahren zu beantragen,
            und mich in diesen Verfahren bezüglich aller gesetzlich zulässigen
            Angelegenheiten außergerichtlich zu vertreten.
          </P>
          <P className="mt-3 text-justify">
            Ich erteile dem Bevollmächtigten die Befugnis, sämtliche Erklärungen
            und Handlungen verbindlich vorzunehmen, die nach den gesetzlichen
            Regelungen vorgenommen werden können und für die Verfahren
            erforderlich sind.
          </P>
          <P className="mt-3">
            Der Umfang der Vertretungsbefugnis beinhaltet insbesondere
          </P>
        </div>
      ),
    },
    {
      id: "list",
      node: (
        <div className="ml-3">
          <div className="mt-2">
            <Bullet>
              <span className="text-justify">
                die Vertretung in allen für die Durchführung des beschleunigten
                Fachkräfteverfahrens erforderlichen Angelegenheiten gegenüber
                der zuständigen Ausländerbehörde, der für die berufliche
                Anerkennung zuständigen Stelle sowie der ggf. sonstigen
                zuständigen Behörden,
              </span>
            </Bullet>
            <Bullet>
              <span className="text-justify">
                das Ein- und Nachreichen der für die Verfahren erforderlichen
                Unterlagen einschließlich meiner personenbezogenen Daten,
              </span>
            </Bullet>
            <Bullet>
              <span className="text-justify">
                die Vornahme von Zahlungen von für den Abschluss der Verfahren
                erforderlichen Gebühren,
              </span>
            </Bullet>
            <Bullet>
              <span className="text-justify">
                die Entgegennahme der die Verfahren betreffenden schriftlichen
                sowie elektronischen Unterlagen, die Durchführung des
                Schriftverkehrs und das Öffnen der an mich adressierten Post und
              </span>
            </Bullet>
            <Bullet>
              <span className="text-justify">
                den Antrag auf Aufnahme der Familienzusammenführung nach § 81a
                Absatz 4 AufenthG ins beschleunigte Fachkräfteverfahren.
              </span>
            </Bullet>
          </div>
        </div>
      ),
    },
    {
      id: "closing",
      node: (
        <div className="mt-3">
          <P className="text-justify">
            Der Bevollmächtigte ist berechtigt, eine Untervollmacht, die den
            Umfang dieser Vollmacht nicht überschreiten darf, zu erteilen und zu
            widerrumen [
            <span className="italic">
              auf die Möglichkeit der Verwendung des Musters für die
              Untervollmacht als Anlage zu einer Vollmacht nach § 81a Abs. 1
              AufenthG wird hingewiesen
            </span>
            ]. Die Vollmacht erlischt mit Abschluss des beschleunigten
            Fachkräfteverfahrens.
          </P>
          <P className="mt-3 text-justify">
            Da diese Vollmacht meine rechtliche Möglichkeit selbst zu handeln
            nicht ausschließt, bitte ich um direkten Kontakt zu mir, sofern dies
            zur Klärung von Sachverhalten und zur Verfahrensbeschleunigung
            erforderlich erscheint.
          </P>
        </div>
      ),
    },
    {
      id: "signature",
      node: (
        <div className="mt-5">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <FormRow
                label={form.candidateBirthPlace || "Ort"}
                value={form.candidatePlaceDate}
                omit={isOmitted("candidatePlaceDate")}
                showColon={false}
                addComma={true}
              />
              <div className="text-center">
                <div className="border-t border-slate-700 text-[10pt]"></div>
              </div>
            </div>
            <div>
              <FormRow
                label={form.employerCity || "Ort"}
                omit={isOmitted("employerPlaceDate")}
              />
              <div className="text-center">
                <div className="border-t border-slate-700 pt-1 text-[10pt]"></div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];
}
