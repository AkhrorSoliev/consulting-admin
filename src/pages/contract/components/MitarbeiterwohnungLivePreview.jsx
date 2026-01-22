export default function MitarbeiterwohnungLivePreview({ form }) {
  const firmaName = String(form?.firmaName || "").trim();
  const abteilung = String(form?.abteilung || "").trim();
  const kontaktPerson = String(form?.kontaktPerson || "").trim();
  const strasse = String(form?.strasse || "").trim();
  const plz = String(form?.plz || "").trim();
  const ort = String(form?.ort || "").trim();
  const telefon = String(form?.telefon || "").trim();
  const email = String(form?.email || "").trim();

  const kandidatName = String(form?.kandidatName || "").trim();
  const datum = String(form?.datum || "").trim();

  const praktikumsart = String(form?.praktikumsart || "").trim();
  const grussOrt = String(form?.grussOrt || "").trim();


  const addressLine = [plz, ort].filter(Boolean).join(" ");

  const previewClass =
    "flex-1 bg-white rounded-2xl shadow-2xl border border-base-300 p-8 lg:p-12 min-h-[700px] print:shadow-none print:border-none print:p-0";

  return (
    <section className={previewClass}>
      <div className="max-w-[600px] mx-auto text-slate-900 leading-relaxed text-sm">
        {/* Header - Company Info (right side, left-aligned text) */}
        <div className="ml-auto text-left mb-16 w-fit">
          <p className="font-bold">
            {firmaName || "Firmenname"}
          </p>
          <p>{abteilung || "Abteilung"}</p>
          <p>{kontaktPerson || "Kontaktperson"}</p>
          <p>{strasse || "Straße"}</p>
          <p>{addressLine || "PLZ Ort"}</p>
          {telefon && <p>Telefon: {telefon}</p>}
          {email && (
            <p>
              E-Mail:{" "}
              <a href={`mailto:${email}`} className="text-blue-600">
                {email}
              </a>
            </p>
          )}
        </div>

        {/* Candidate Name */}
        <p className="mb-6">{kandidatName || "Kandidat Name"}</p>

        {/* Date */}
        <p className="mb-8">Datum: {datum || "DD.MM.YYYY"}</p>

        {/* Title */}
        <h1 className="text-base font-bold mb-8">
          Bestätigung über die Bereitstellung einer Mitarbeiterwohnung
        </h1>

        {/* Salutation */}
        <p className="mb-4">
          Sehr geehrter Herr {kandidatName ? kandidatName.split(" ")[0] : "Name"},
        </p>

        {/* Body paragraphs */}
        <p className="text-justify mb-4">
          Gerne bestätigen wir hiermit, dass Sie eine Unterkunft durch den{" "}
          <span className="text-blue-600">{firmaName || "Firmenname"}</span>{" "}
          während ihrer{" "}
          <span className="text-blue-600">
            {praktikumsart || "Praktikums"}
          </span>{" "}
          bei uns zur Verfügung gestellt bekommen.
        </p>

        <p className="text-justify mb-8">
          Wir freuen uns sehr, dass Sie für{" "}
          <span className="text-blue-600">{firmaName || "Firmenname"}</span>{" "}
          entschieden haben und hoffen Sie bald in unseren Reihen begrüßen zu
          dürfen.
        </p>

        {/* Closing */}
        <p className="mt-8 mb-12">Mit freundlichen Grüßen aus {grussOrt || "Ort"}</p>

        {/* Signature */}
        <div className="mt-6">
          <p className="font-semibold">{kontaktPerson || "Name"}</p>
          <p className="text-blue-600">{abteilung || "Rolle"}</p>
        </div>
      </div>
    </section>
  );
}
