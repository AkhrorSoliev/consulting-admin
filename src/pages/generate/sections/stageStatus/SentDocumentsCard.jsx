import toast from "react-hot-toast";
import { FaExternalLinkAlt, FaPaperPlane, FaTrash } from "react-icons/fa";
import { DOCUMENT_TEMPLATES } from "../../../../constants/documentTemplates";

function copyToClipboard(text, successMsg, errorMsg) {
  (async () => {
    try {
      if (
        navigator?.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(text);
        toast.success(successMsg);
      } else {
        throw new Error("clipboard-unavailable");
      }
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast.success(successMsg);
      } catch {
        toast.error(errorMsg);
      }
    }
  })();
}

export default function SentDocumentsCard({
  candidateDocId,
  candidateCollection,
  sendingStepValue,
  onOpenSendDocLinkModal,
  outgoingDocs,
  outgoingBusyById,
  onDeleteOutgoingDoc,
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
              onClick={onOpenSendDocLinkModal}
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
                  "Fehler beim Kopieren des Links.",
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
                        onClick={() =>
                          copyToClipboard(url, "Link kopiert.", "Fehler beim Kopieren des Links.")
                        }
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline btn-error"
                        onClick={() => onDeleteOutgoingDoc(docId)}
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
