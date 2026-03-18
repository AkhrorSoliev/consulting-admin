import { Link } from "react-router-dom";
import { FaExternalLinkAlt } from "react-icons/fa";
import MotivationLetterToggleCard from "../../components/MotivationLetterToggleCard";
import { DOCUMENT_TEMPLATES } from "../../../../constants/documentTemplates";

export default function DocumentToggleList({
  getOutgoingDocState,
  outgoingBusyById,
  candidateCollection,
  candidateDocId,
  sendingStepValue,
  onToggleOutgoingDoc,
}) {
  return (
    <div className="space-y-2">
      {(() => {
        const motivationState = getOutgoingDocState("motivation_letter");
        const motivationBusy = Boolean(outgoingBusyById?.motivation_letter);
        const motivationDisabled =
          motivationBusy ||
          !candidateCollection ||
          !candidateDocId ||
          Boolean(sendingStepValue);
        return (
          <MotivationLetterToggleCard
            checked={Boolean(motivationState?.enabled)}
            busy={motivationBusy}
            disabled={motivationDisabled}
            uploadUrl={String(motivationState?.url || "").trim()}
            onToggle={(nextEnabled) =>
              onToggleOutgoingDoc({ id: "motivation_letter" }, nextEnabled)
            }
            onRegenerate={() =>
              onToggleOutgoingDoc({ id: "motivation_letter" }, true, {
                forceRegenerate: true,
              })
            }
          />
        );
      })()}

      {DOCUMENT_TEMPLATES.filter(
        (tpl) =>
          ![
            "erklaerung_beschaeftigung",
            "zusatzblatt_a",
            "zusatzblatt_b",
            "zusatzblatt_c",
            "zusatzblatt_d",
          ].includes(tpl.id),
      ).map((tpl) => {
        const st = getOutgoingDocState(tpl.id);
        const checked = Boolean(st?.enabled);
        const busy = Boolean(outgoingBusyById?.[tpl.id]);
        const disabled =
          busy ||
          !candidateCollection ||
          !candidateDocId ||
          Boolean(sendingStepValue);
        return (
          <div
            key={tpl.id}
            className="rounded-xl border border-base-300 bg-base-100 p-3"
          >
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
                  <div className="text-xs text-base-content/60 mt-1">
                    {tpl.description}
                  </div>
                ) : null}
                {String(st?.url || "").trim() ? (
                  <div className="text-xs text-base-content/60 mt-1">
                    Upload:{" "}
                    <a
                      className="link"
                      href={String(st.url)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Link
                    </a>
                  </div>
                ) : null}
                {tpl.id === "beratungsvertrag" && checked ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() =>
                        onToggleOutgoingDoc(tpl, true, {
                          forceRegenerate: true,
                        })
                      }
                      disabled={disabled}
                      title="PDF neu generieren und erneut hochladen"
                    >
                      Neu generieren
                    </button>
                  </div>
                ) : null}
                {tpl.id === "vermittlungsvertrag" && checked ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() =>
                        onToggleOutgoingDoc(tpl, true, {
                          forceRegenerate: true,
                        })
                      }
                      disabled={disabled}
                      title="PDF neu generieren und erneut hochladen"
                    >
                      Neu generieren
                    </button>
                  </div>
                ) : null}
                {tpl.id === "vollmacht" && checked ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() =>
                        onToggleOutgoingDoc(tpl, true, {
                          forceRegenerate: true,
                        })
                      }
                      disabled={disabled}
                      title="PDF neu generieren und erneut hochladen"
                    >
                      Neu generieren
                    </button>
                  </div>
                ) : null}
              </div>

              <label className="flex items-center gap-2 shrink-0">
                {busy ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : null}
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={checked}
                  onChange={(e) => onToggleOutgoingDoc(tpl, e.target.checked)}
                  disabled={disabled}
                />
              </label>
            </div>
          </div>
        );
      })}
      {DOCUMENT_TEMPLATES.length === 0 ? (
        <div className="text-sm opacity-70">Derzeit keine Vorlagen verfügbar.</div>
      ) : null}
    </div>
  );
}
