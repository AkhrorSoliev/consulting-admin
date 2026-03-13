import { useState } from "react";
import GermanPage from "./fotoVideoRozilikPreview/GermanPage";
import UzbekPage from "./fotoVideoRozilikPreview/UzbekPage";

export default function FotoVideoRozilikLivePreview({ form }) {
  const [activePage, setActivePage] = useState("de");

  const fullName = String(form?.fullName || "").trim();
  const geburtsdatum = String(form?.geburtsdatum || "").trim();
  const adresse = String(form?.adresse || "").trim();
  const geburtsort = String(form?.geburtsort || "").trim();
  const datum = String(form?.datum || "").trim();
  const email = String(form?.email || "orif.ahmadaliyev@hotmail.de").trim();

  const ortDatum = [geburtsort, datum].filter(Boolean).join(", ");

  const previewClass =
    "flex-1 bg-white rounded-2xl shadow-2xl border border-base-300 p-6 lg:p-8 min-h-[700px] print:shadow-none print:border-none print:p-0 overflow-y-auto";

  const sharedProps = { fullName, geburtsdatum, adresse, email, ortDatum };

  return (
    <section className={previewClass}>
      {/* Page tabs */}
      <div className="flex gap-2 mb-4 print:hidden">
        <button
          type="button"
          className={`btn btn-sm ${activePage === "de" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActivePage("de")}
        >
          🇩🇪 Deutsch
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activePage === "uz" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActivePage("uz")}
        >
          🇺🇿 O'zbekcha
        </button>
      </div>

      <div className="max-w-[650px] mx-auto text-slate-900 leading-tight text-xs">
        {activePage === "de" ? (
          <GermanPage {...sharedProps} />
        ) : (
          <UzbekPage {...sharedProps} />
        )}
      </div>
    </section>
  );
}
