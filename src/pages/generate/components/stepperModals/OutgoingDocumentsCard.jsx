import { Link } from "react-router-dom";
import { FaExternalLinkAlt } from "react-icons/fa";
import { DOCUMENT_TEMPLATES } from "../../../../constants/documentTemplates";
import MotivationLetterToggleCard from "../MotivationLetterToggleCard";

const ERKLAERUNG_IDS = [
  "erklaerung_beschaeftigung",
  "zusatzblatt_a",
  "zusatzblatt_b",
  "zusatzblatt_c",
  "zusatzblatt_d",
];

const ERKLAERUNG_CARDS = [
  { title: "Erklärung zum Beschäftigungsverhältnis", desc: "Hauptformular für die Bundesagentur für Arbeit", modalKey: "erklaerung", needsName: true },
  { title: "Zusatzblatt A - Anerkennungsverfahren", desc: "Beschäftigung im Rahmen des Anerkennungsverfahrens", modalKey: "zusatzblattA" },
  { title: "Zusatzblatt B - ICT / Personalaustausch", desc: "Unternehmensinterner Transfer (ICT)", modalKey: "zusatzblattB" },
  { title: "Zusatzblatt C - Berufskraftfahrer", desc: "Beschäftigung als Berufskraftfahrer/in", modalKey: "zusatzblattC" },
  { title: "Zusatzblatt D - Kurzfristige Beschäftigung", desc: "Kurzfristige Beschäftigung (max. 70 Tage)", modalKey: "zusatzblattD" },
];

export default function OutgoingDocumentsCard({
  outgoingBulkBusy,
  outgoingAnyBusy,
  outgoingEntries,
  candidateCollection,
  candidateDocId,
  handleDeleteAllOutgoingDocs,
  getOutgoingDocState,
  outgoingBusyById,
  handleToggleOutgoingDoc,
  sendingStepValue,
  formCv,
  openModal,
}) {
  const motivationState = getOutgoingDocState("motivation_letter");
  const motivationBusy = Boolean(outgoingBusyById?.motivation_letter);
  const motivationDisabled =
    motivationBusy || !candidateCollection || !candidateDocId || Boolean(sendingStepValue);

  return (
    <div className="card bg-base-100 border border-base-300 shadow-xl">
      <div className="card-body">
        <div>
          <h3 className="card-title">An Kandidaten zu sendende Dokumente</h3>
          <p className="text-sm text-base-content/70">
            Wenn der Schalter aktiviert ist, wird das PDF generiert und
            automatisch hochgeladen.
          </p>
        </div>

        <div className="flex justify-end mb-3">
          <button
            type="button"
            className="btn btn-xs btn-outline"
            onClick={handleDeleteAllOutgoingDocs}
            disabled={
              outgoingBulkBusy ||
              outgoingAnyBusy ||
              !outgoingEntries.length ||
              !candidateCollection ||
              !candidateDocId ||
              Boolean(sendingStepValue)
            }
            title="Alle gesendeten Links löschen"
          >
            {outgoingBulkBusy ? (
              <span className="loading loading-spinner loading-xs" />
            ) : null}
            <span>Alle löschen</span>
          </button>
        </div>

        <div className="space-y-2">
          <MotivationLetterToggleCard
            checked={Boolean(motivationState?.enabled)}
            busy={motivationBusy}
            disabled={motivationDisabled}
            uploadUrl={String(motivationState?.url || "").trim()}
            onToggle={(nextEnabled) =>
              handleToggleOutgoingDoc({ id: "motivation_letter" }, nextEnabled)
            }
            onRegenerate={() =>
              handleToggleOutgoingDoc({ id: "motivation_letter" }, true, {
                forceRegenerate: true,
              })
            }
          />
          {DOCUMENT_TEMPLATES.filter((tpl) => !ERKLAERUNG_IDS.includes(tpl.id) && !tpl.disabled && tpl.kind !== "fillable-pdf").map(
            (tpl) => {
              const st = getOutgoingDocState(tpl.id);
              const checked = Boolean(st?.enabled);
              const busy = Boolean(outgoingBusyById?.[tpl.id]);
              const disabled =
                busy || !candidateCollection || !candidateDocId || Boolean(sendingStepValue);
              return (
                <TemplateToggle
                  key={tpl.id}
                  tpl={tpl}
                  st={st}
                  checked={checked}
                  busy={busy}
                  disabled={disabled}
                  handleToggleOutgoingDoc={handleToggleOutgoingDoc}
                />
              );
            },
          )}
          {DOCUMENT_TEMPLATES.length === 0 ? (
            <div className="text-sm opacity-70">
              Derzeit keine Vorlagen verfügbar.
            </div>
          ) : null}
        </div>

        <div className="divider text-sm font-medium opacity-70 mt-6">
          Erklärung zum Beschäftigungsverhältnis
        </div>
        <p className="text-xs text-base-content/60 mb-3">
          Klicken Sie auf &quot;Öffnen&quot;, um das Formular mit Kandidatendaten
          zu öffnen und PDF herunterzuladen.
        </p>
        <div className="space-y-2">
          {ERKLAERUNG_CARDS.map((card) => (
            <div key={card.title} className="rounded-xl border border-base-300 bg-base-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold">{card.title}</div>
                  <p className="text-xs text-base-content/60 mt-1">{card.desc}</p>
                </div>
                <button
                  type="button"
                  className={`btn btn-sm btn-primary shrink-0${card.needsName && (!formCv.personalInfo.firstName || !formCv.personalInfo.lastName) ? " disabled:opacity-50 disabled:cursor-not-allowed" : ""}`}
                  onClick={() => openModal(card.modalKey)}
                  disabled={card.needsName && (!formCv.personalInfo.firstName || !formCv.personalInfo.lastName)}
                >
                  Öffnen
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateToggle({ tpl, st, checked, busy, disabled, handleToggleOutgoingDoc }) {
  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={tpl.to}
            className="link link-hover font-semibold truncate inline-flex items-center gap-2"
            title="Vorlage öffnen"
          >
            <span className="truncate">{tpl.title}</span>
            <FaExternalLinkAlt className="opacity-70" />
          </Link>
          {tpl.description ? (
            <div className="text-xs text-base-content/60 mt-1">{tpl.description}</div>
          ) : null}
          {String(st?.url || "").trim() ? (
            <div className="text-xs text-base-content/60 mt-1">
              Upload:{" "}
              <a className="link" href={String(st.url)} target="_blank" rel="noreferrer">
                Link
              </a>
            </div>
          ) : null}
          {["beratungsvertrag", "vermittlungsvertrag", "vollmacht"].includes(tpl.id) && checked ? (
            <div className="mt-2">
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={() => handleToggleOutgoingDoc(tpl, true, { forceRegenerate: true })}
                disabled={disabled}
                title="PDF neu generieren und erneut hochladen"
              >
                Neu generieren
              </button>
            </div>
          ) : null}
        </div>
        <label className="flex items-center gap-2 shrink-0">
          {busy ? <span className="loading loading-spinner loading-sm" /> : null}
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={checked}
            onChange={(e) => handleToggleOutgoingDoc(tpl, e.target.checked)}
            disabled={disabled}
          />
        </label>
      </div>
    </div>
  );
}
