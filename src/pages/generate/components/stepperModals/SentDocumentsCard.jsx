import { FaExternalLinkAlt, FaTrash, FaPaperPlane } from "react-icons/fa";
import { DOCUMENT_TEMPLATES } from "../../../../constants/documentTemplates";

export default function SentDocumentsCard({
  outgoingDocs,
  outgoingBusyById,
  candidateCollection,
  candidateDocId,
  sendingStepValue,
  handleDeleteOutgoingDoc,
  copyToClipboard,
  openSendDocLinkModal,
}) {
  const entries = Object.entries(outgoingDocs || {}).filter(
    ([, v]) => v && typeof v === "object" && String(v?.url || "").trim(),
  );

  return (
    <div className="card bg-base-100 border border-base-300 shadow-xl">
      <div className="card-body">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="card-title">Gesendete Dokumente (Links)</h3>
            <p className="text-sm text-base-content/70">
              Hochgeladene Dateilinks werden hier angezeigt.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-success gap-2"
              onClick={openSendDocLinkModal}
              disabled={!candidateDocId}
              title="Link an Kandidat senden (E-Mail und/oder Telegram)"
            >
              <FaPaperPlane className="text-xs" />
              Link senden
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary gap-2"
              onClick={() =>
                copyToClipboard(
                  `https://admin.consultinguz.de/dataExchange/${candidateDocId}`,
                  "DataExchange-Link kopiert.",
                )
              }
              disabled={!candidateDocId}
            >
              <FaExternalLinkAlt className="text-xs" />
              Copy Link
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline gap-2"
              onClick={() => {
                const dataExchangeUrl = `${window.location.origin}/dataExchange/${candidateDocId}`;
                window.open(dataExchangeUrl, "_blank");
              }}
              disabled={!candidateDocId}
            >
              <FaExternalLinkAlt className="text-xs" />
              {"Öffnen"}
            </button>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="text-sm opacity-70">
            Derzeit keine hochgeladenen Dokumente.
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(([docId, v]) => {
              const tpl = DOCUMENT_TEMPLATES.find((t) => t.id === docId) || null;
              const title = String(v?.title || "").trim() || tpl?.title || docId;
              const url = String(v?.url || "").trim();
              const busy = Boolean(outgoingBusyById?.[docId]);
              const disabled =
                busy ||
                !candidateCollection ||
                !candidateDocId ||
                Boolean(sendingStepValue);
              return (
                <div
                  key={docId}
                  className="rounded-xl border border-base-300 bg-base-100 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{title}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        className="btn btn-sm btn-outline"
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FaExternalLinkAlt />
                      </a>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => copyToClipboard(url)}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline btn-error"
                        onClick={() => handleDeleteOutgoingDoc(docId)}
                        disabled={disabled}
                        title="Link löschen (Remote und Firestore)"
                      >
                        {busy ? (
                          <span className="loading loading-spinner loading-sm" />
                        ) : (
                          <FaTrash />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
