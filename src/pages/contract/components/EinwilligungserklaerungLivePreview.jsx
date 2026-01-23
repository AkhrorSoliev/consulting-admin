export default function EinwilligungserklaerungLivePreview({ form }) {
  // Candidate info
  const anpirede = String(form?.anpirede || "Frau").trim();
  const vorname = String(form?.vorname || "").trim();
  const nachname = String(form?.nachname || "").trim();
  const geburtsort = String(form?.geburtsort || "").trim();
  const datum = String(form?.datum || "").trim();

  // Company info
  const verantwortlicher = String(form?.verantwortlicher || "Orif Akhmadaliev").trim();
  const firmaName = String(form?.firmaName || "ConsultingUZ").trim();

  // Build full name for salutation: "Frau Nachname Vorname"
  const fullNameForSalutation = [anpirede, nachname, vorname].filter(Boolean).join(" ");

  const previewClass =
    "flex-1 bg-white rounded-2xl shadow-2xl border border-base-300 p-6 lg:p-8 min-h-[700px] print:shadow-none print:border-none print:p-0 overflow-y-auto";

  return (
    <section className={previewClass}>
      <div className="max-w-[650px] mx-auto text-slate-900 leading-relaxed text-xs">
        {/* Title */}
        <h1 className="text-sm font-bold text-center mb-5 text-blue-700">
          Einwilligungserklärung gemäß DSGVO in die Verarbeitung von Daten durch<br />
          {firmaName} ({verantwortlicher})
        </h1>

        {/* Salutation */}
        <p className="mb-3">
          Sehr geehrte <span className="text-blue-600">{fullNameForSalutation || "Name"}</span>,
        </p>

        {/* Introduction */}
        <p className="text-justify mb-3">
          vielen Dank für Ihre Bewerbung. Gemäß Art. 13 und Art. 14 DS-GVO (Datenschutz-Grundverordnung) sind wir verpflichtet, Ihnen bestimmte Informationen zur Erhebung, Verarbeitung und Nutzung Ihrer personenbezogenen Daten zur Verfügung zu stellen. Für die personenbezogenen Daten, die Sie uns im Rahmen der Bewerbung bereits zur Verfügung gestellt haben, oder die Sie uns im Rahmen des weiteren Bewerbungsverfahrens zur Verfügung stellen sowie für weitere personenbezogene Daten, die wir im Rahmen des Bewerbungsverfahrens erheben, verarbeiten und nutzen, gelten die nachfolgend aufgeführten Informationen:
        </p>

        {/* Section: Zwecke */}
        <h2 className="font-bold mt-4 mb-2">
          Zwecke der Datenverarbeitung personenbezogener Daten sowie die Rechtsgrundlage:
        </h2>
        <p className="text-justify mb-3">
          Die Datenverarbeitung erfolgt ausschließlich zur Durchführung des Bewerbungsverfahrens. Erhebung, Verarbeitung und Nutzung der Daten erfolgen gemäß Artikel 88 Abs. 1 DS-GVO in Verbindung mit § 26 Abs. 1 BDSG.
        </p>

        {/* Section: Kategorien */}
        <h2 className="font-bold mt-4 mb-2">
          Kategorien personenbezogener Daten, die verarbeitet werden:
        </h2>
        <p className="text-justify mb-2">
          Im Rahmen der Durchführung des Bewerbungsverfahrens werden die folgenden Kategorien personenbezogener Daten verarbeitet:
        </p>
        <p className="pl-3 mb-1">- Kontaktdaten</p>
        <p className="pl-3 mb-1">- Bewerbungsunterlagen</p>
        <p className="pl-3 mb-1">- ggf. weitere Daten, die Sie uns im Rahmen des Bewerbungsverfahrens zur Verfügung stellen</p>
        <p className="pl-3 mb-3">- Eigene Aufzeichnungen, Kommentare, Einschätzungen und Beurteilungen, die wir im Rahmen des Bewerbungsverfahrens erstellen</p>

        {/* Section: Dauer */}
        <h2 className="font-bold mt-4 mb-2">Dauer der Speicherung:</h2>
        <p className="text-justify mb-3">
          Wir speichern Ihre Daten nur so lange, wie es erforderlich ist, zur Durchführung des Bewerbungsverfahrens sowie zur Erbringung des Nachweises, dass im Bewerbungsverfahren keine Benachteiligung von Bewerbern nach dem Allgemeinen Gleichbehandlungsgesetzes (AGG) vorgelegen hat. Ihre personenbezogenen Daten, die im Rahmen des Bewerbungsverfahrens gespeichert wurden, werden daher 6 Monate nach Abschluss des Bewerbungsverfahrens automatisch gelöscht.
        </p>

        {/* Section: Betroffenenrechte */}
        <h2 className="font-bold mt-4 mb-2">Betroffenenrechte:</h2>
        <p className="text-justify mb-3">
          Sie haben jederzeit das Recht auf Auskunft über die zu Ihnen gespeicherten personenbezogenen Daten. Gegebenenfalls haben Sie darüber hinaus gemäß Artikel 16 bis 20 DS-GVO das Recht auf Berichtigung unrichtiger Daten, das Recht auf Löschung Ihrer personenbezogenen Daten, das Recht auf Einschränkung der Verarbeitung Ihrer personenbezogenen Daten sowie das Recht auf Datenübertragbarkeit.
        </p>

        {/* Section: Widerruf */}
        <h2 className="font-bold mt-4 mb-2">Recht auf Widerruf von Einwilligungen:</h2>
        <p className="text-justify mb-3">
          Sofern wir die Verarbeitung und Nutzung Ihrer personenbezogenen Daten aufgrund einer durch Sie erteilten Einwilligung durchführen, haben Sie jederzeit das Recht, die Einwilligung zu widerrufen. Der Widerruf gilt mit sofortiger Wirkung für die Zukunft. Die Rechtmäßigkeit, der aufgrund der Einwilligung bis zum Widerruf erfolgten Verarbeitungen werden durch den Widerruf nicht berührt.
        </p>

        {/* Section: Beschwerderecht */}
        <h2 className="font-bold mt-4 mb-2">Beschwerderecht:</h2>
        <p className="text-justify mb-3">
          Sofern Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DS-GVO verstößt, haben Sie das Recht auf Beschwerde bei einer Aufsichtsbehörde.
        </p>

        {/* Section: Bereitstellung */}
        <h2 className="font-bold mt-4 mb-2">Bereitstellung Ihrer personenbezogenen Daten:</h2>
        <p className="text-justify mb-3">
          Die Bereitstellung Ihrer personenbezogenen Daten ist zur Durchführung des Bewerbungsverfahrens und zur Entscheidung über die Begründung eines Beschäftigungsverhältnisses erforderlich. Eine Nichtbereitstellung Ihrer personenbezogenen Daten hat zur Folge, dass wir das Bewerbungsverfahren nicht durchführen können und Sie bei der Entscheidung über die Begründung eines Beschäftigungsverhältnisses leider nicht berücksichtigen können.
        </p>

        {/* Section: Zustimmung */}
        <h2 className="font-bold mt-4 mb-2">Zustimmung durch den Betroffenen</h2>
        <p className="text-justify mb-6">
          Hiermit versichert der Unterzeichnende, der Erhebung und der Verarbeitung seiner Daten durch{" "}
          <span className="text-blue-600">{verantwortlicher}</span> ({firmaName}) freiwillig zuzustimmen und über die Datenverarbeitung und seine Rechte belehrt worden zu sein:
        </p>

        {/* Signature Section */}
        <div className="flex justify-between mt-10 gap-4">
          <div className="w-1/3">
            <p className="text-blue-600">{datum || "DD.MM.YYYY"}</p>
            <div className="border-t border-black mt-8 pt-1">
              <p className="text-[10px]">Datum</p>
            </div>
          </div>
          <div className="w-1/3">
            <p className="text-blue-600">{geburtsort || "___________"}</p>
            <div className="border-t border-black mt-8 pt-1">
              <p className="text-[10px]">Ort</p>
            </div>
          </div>
          <div className="w-1/3">
            <p>___________</p>
            <div className="border-t border-black mt-8 pt-1">
              <p className="text-[10px]">Unterschrift</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-blue-600 text-[10px] mt-16">Einwilligung Datenverarbeitung</p>
      </div>
    </section>
  );
}
