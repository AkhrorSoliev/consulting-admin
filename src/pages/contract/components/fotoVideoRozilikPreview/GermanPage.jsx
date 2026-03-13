export default function GermanPage({ fullName, geburtsdatum, adresse, email, ortDatum }) {
  return (
    <>
      <h1 className="text-sm font-bold text-center mb-5 underline">
        Einwilligungserklärung zur Nutzung von Foto- und Videoaufnahmen
      </h1>

      {/* Header fields */}
      <div className="flex mb-1">
        <span className="font-semibold w-36">Name der Person:</span>
        <span className="flex-1 border-b border-black min-h-[14px]">{fullName}</span>
      </div>
      <div className="flex mb-1">
        <span className="font-semibold w-36">Geburtsdatum:</span>
        <span className="flex-1 border-b border-black min-h-[14px]">{geburtsdatum}</span>
      </div>
      <div className="flex mb-1">
        <span className="font-semibold w-36">Adresse:</span>
        <span className="flex-1 border-b border-black min-h-[14px]">{adresse}</span>
      </div>

      {/* Section 1 */}
      <h2 className="font-bold mt-4 mb-2">1. Zweck der Einwilligung</h2>
      <p className="text-justify mb-2">
        Ich willige ein, dass Orif Akhmadaliev (ConsultingUz) nachfolgend „Unternehmen" genannt) Foto- und Videoaufnahmen von mir erstellt und diese zu folgenden Zwecken verwendet:
      </p>
      <p className="pl-4 mb-1">• Veröffentlichung auf Social-Media-Plattformen (z. B. Instagram, Facebook, LinkedIn, Telegram, YouTube)</p>
      <p className="pl-4 mb-1">• Nutzung auf der Website des Unternehmens</p>
      <p className="pl-4 mb-1">• Verwendung für Werbe-, Informations- und Marketingzwecke</p>
      <p className="pl-4 mb-2">• Darstellung von Erfolgsgeschichten, Erfahrungsberichten sowie Präsentationen des Unternehmens</p>

      {/* Section 2 */}
      <h2 className="font-bold mt-4 mb-2">2. Art der verwendeten Medien</h2>
      <p className="text-justify mb-2">
        Ich willige ein, dass folgende Arten von Medien genutzt werden dürfen:
      </p>
      <p className="pl-4 mb-1">• Fotos und Videos (Gruppen- und Einzelaufnahmen)</p>
      <p className="pl-4 mb-2">• Kurze Interviews oder Video-Statements</p>

      {/* Section 3 */}
      <h2 className="font-bold mt-4 mb-2">3. Umfang der Nutzung</h2>
      <p className="text-justify mb-2">
        Die Aufnahmen dürfen weltweit, zeitlich unbegrenzt und ohne Einschränkung genutzt, vervielfältigt, verbreitet und öffentlich zugänglich gemacht werden.
      </p>
      <p className="text-justify mb-2">
        Die Einwilligung umfasst insbesondere die Veröffentlichung auf:
      </p>
      <p className="pl-4 mb-1">• Instagram, Facebook, LinkedIn, Telegram</p>
      <p className="pl-4 mb-1">• Website: consultinguz.de / consultinguz.uz</p>
      <p className="pl-4 mb-2">• Sonstige digitale Kommunikationskanäle des Unternehmens</p>

      {/* Section 4 */}
      <h2 className="font-bold mt-4 mb-2">4. Freiwilligkeit und Widerruf</h2>
      <p className="text-justify mb-2">
        Die Einwilligung erfolgt freiwillig. Ich kann sie jederzeit mit Wirkung für die Zukunft widerrufen. Ein Widerruf hat keinen Einfluss auf bereits erfolgte Veröffentlichungen, aber zukünftige Nutzungen werden eingestellt.
      </p>
      <p className="mb-2">Widerrufserklärung bitte senden an:</p>
      <p className="mb-2">
        <span className="font-bold">E-Mail: </span>
        <a href={`mailto:${email}`} className="text-blue-600 underline">{email}</a>
      </p>

      {/* Section 5 */}
      <h2 className="font-bold mt-4 mb-2">5. Rechte an den Aufnahmen</h2>
      <p className="text-justify mb-2">
        Ich bestätige, dass mit der Nutzung der Aufnahmen keine Vergütungsansprüche entstehen.
      </p>
      <p className="text-justify mb-2">
        Das Unternehmen darf die Aufnahmen bearbeiten, zuschneiden oder in Collagen verwenden, solange meine Persönlichkeitsrechte gewahrt bleiben.
      </p>

      {/* Section 6 */}
      <h2 className="font-bold mt-4 mb-2">6. Datenschutz</h2>
      <p className="text-justify mb-2">
        Die Verarbeitung der Daten erfolgt gemäß der geltenden Datenschutzbestimmungen (DSGVO). Es werden ausschließlich die für die Veröffentlichung notwendigen Daten verarbeitet.
      </p>

      {/* Signature Section */}
      <div className="mt-8 space-y-4">
        <div className="flex">
          <span className="font-semibold w-56">Ort, Datum:</span>
          <span className="flex-1 border-b border-black min-h-[14px]">{ortDatum}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-56">Unterschrift der Person:</span>
          <span className="flex-1 border-b border-black min-h-[14px]"></span>
        </div>
        <div className="flex">
          <span className="font-semibold w-56">Unterschrift des Unternehmens (optional):</span>
          <span className="flex-1 border-b border-black min-h-[14px]"></span>
        </div>
      </div>
    </>
  );
}
