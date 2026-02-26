import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaExternalLinkAlt, FaPaperPlane, FaTrash } from "react-icons/fa";
import CandidateStatusStepper from "../../../components/CandidateStatusStepper";
import MotivationLetterToggleCard from "../components/MotivationLetterToggleCard";
import { DOCUMENT_TEMPLATES } from "../../../constants/documentTemplates";

export default function StageAndStatusSection({
  remoteMode,
  isLimitedAdmin,
  loading,
  notFound,
  emailMeta,
  emailMetaAvatarFromUsers,
  statusValue,
  onSendStatusEmail,
  sendingStepValue,
  onResetStages,
  onOpenCustomEmailModal,
  onResetStage,
  docCv,
  outgoingBulkBusy,
  outgoingAnyBusy,
  outgoingEntries,
  candidateCollection,
  candidateDocId,
  onDeleteAllOutgoingDocs,
  getOutgoingDocState,
  outgoingBusyById,
  onToggleOutgoingDoc,
  formCv,
  onOpenErklaerung,
  onOpenZusatzblattA,
  onOpenZusatzblattB,
  onOpenZusatzblattC,
  onOpenZusatzblattD,
  onOpenSendDocLinkModal,
  outgoingDocs,
  onDeleteOutgoingDoc,
  statusUpdatedAt,
  statusUpdatedBy,
}) {
  if (remoteMode || isLimitedAdmin || loading || notFound) {
    return null;
  }

  return (
    <div className="mt-6">
      {emailMeta.lastSentAt && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-base-200 rounded-lg border border-base-300">
          <div className="avatar">
            <div className="w-10 h-10 rounded-full">
              {emailMeta.lastSentByPhoto || emailMetaAvatarFromUsers ? (
                <img
                  src={emailMeta.lastSentByPhoto || emailMetaAvatarFromUsers}
                  alt={emailMeta.lastSentByName || "User"}
                />
              ) : (
                <div className="w-full h-full bg-primary text-primary-content flex items-center justify-center font-semibold">
                  {(emailMeta.lastSentByName || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">
              {emailMeta.lastSentByName || "Unbekannter Benutzer"}
            </div>
            <div className="text-xs text-base-content/60">
              Letzte E-Mail gesendet: {new Date(emailMeta.lastSentAt).toLocaleString("de-DE")}
              {emailMeta.count > 0 && ` • ${emailMeta.count} E-Mails gesamt`}
            </div>
          </div>
        </div>
      )}

      <CandidateStatusStepper
        currentValue={statusValue}
        onSendEmail={onSendStatusEmail}
        sendingValue={sendingStepValue}
        disabled={isLimitedAdmin}
        resetStages={onResetStages}
        openCustomEmailModal={onOpenCustomEmailModal}
        onResetStage={onResetStage}
        hasLeadershipInterview={Boolean(docCv?.stageMeta?.stage_2?.sentWithLeadership)}
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-base-100 border border-base-300 shadow-xl">
          <div className="card-body">
            <div>
              <h3 className="card-title">An Kandidaten zu sendende Dokumente</h3>
              <p className="text-sm text-base-content/70">
                Wenn der Schalter aktiviert ist, wird das PDF generiert und automatisch hochgeladen.
              </p>
            </div>

            <div className="flex justify-end mb-3">
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={onDeleteAllOutgoingDocs}
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

            <div className="divider text-sm font-medium opacity-70 mt-6">
              Erklärung zum Beschäftigungsverhältnis
            </div>
            <p className="text-xs text-base-content/60 mb-3">
              Klicken Sie auf "Öffnen", um das Formular mit Kandidatendaten zu öffnen und PDF herunterzuladen.
            </p>
            <div className="space-y-2">
              <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">Erklärung zum Beschäftigungsverhältnis</div>
                    <p className="text-xs text-base-content/60 mt-1">
                      Hauptformular für die Bundesagentur für Arbeit
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={onOpenErklaerung}
                    disabled={!formCv.personalInfo.firstName || !formCv.personalInfo.lastName}
                  >
                    Öffnen
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">Zusatzblatt A - Anerkennungsverfahren</div>
                    <p className="text-xs text-base-content/60 mt-1">
                      Beschäftigung im Rahmen des Anerkennungsverfahrens
                    </p>
                  </div>
                  <button type="button" className="btn btn-sm btn-primary shrink-0" onClick={onOpenZusatzblattA}>
                    Öffnen
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">Zusatzblatt B - ICT / Personalaustausch</div>
                    <p className="text-xs text-base-content/60 mt-1">
                      Unternehmensinterner Transfer (ICT)
                    </p>
                  </div>
                  <button type="button" className="btn btn-sm btn-primary shrink-0" onClick={onOpenZusatzblattB}>
                    Öffnen
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">Zusatzblatt C - Berufskraftfahrer</div>
                    <p className="text-xs text-base-content/60 mt-1">
                      Beschäftigung als Berufskraftfahrer/in
                    </p>
                  </div>
                  <button type="button" className="btn btn-sm btn-primary shrink-0" onClick={onOpenZusatzblattC}>
                    Öffnen
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">Zusatzblatt D - Kurzfristige Beschäftigung</div>
                    <p className="text-xs text-base-content/60 mt-1">
                      Kurzfristige Beschäftigung (max. 70 Tage)
                    </p>
                  </div>
                  <button type="button" className="btn btn-sm btn-primary shrink-0" onClick={onOpenZusatzblattD}>
                    Öffnen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                  onClick={async () => {
                    const dataExchangeUrl = `https://admin.consultinguz.de/dataExchange/${candidateDocId}`;
                    try {
                      if (
                        navigator?.clipboard &&
                        typeof navigator.clipboard.writeText === "function"
                      ) {
                        await navigator.clipboard.writeText(dataExchangeUrl);
                        toast.success("DataExchange-Link kopiert.");
                      } else {
                        throw new Error("clipboard-unavailable");
                      }
                    } catch {
                      try {
                        const ta = document.createElement("textarea");
                        ta.value = dataExchangeUrl;
                        ta.style.position = "fixed";
                        ta.style.opacity = "0";
                        document.body.appendChild(ta);
                        ta.focus();
                        ta.select();
                        document.execCommand("copy");
                        document.body.removeChild(ta);
                        toast.success("DataExchange-Link kopiert.");
                      } catch {
                        toast.error("Fehler beim Kopieren des Links.");
                      }
                    }
                  }}
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
                  Öffnen
                </button>
              </div>
            </div>

            {(() => {
              const entries = Object.entries(outgoingDocs || {}).filter(
                ([, v]) => v && typeof v === "object" && String(v?.url || "").trim(),
              );
              if (entries.length === 0) {
                return (
                  <div className="text-sm opacity-70">
                    Derzeit keine hochgeladenen Dokumente.
                  </div>
                );
              }
              return (
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
                              onClick={async () => {
                                try {
                                  if (
                                    navigator?.clipboard &&
                                    typeof navigator.clipboard.writeText ===
                                      "function"
                                  ) {
                                    await navigator.clipboard.writeText(url);
                                    toast.success("Link kopiert.");
                                  } else {
                                    throw new Error("clipboard-unavailable");
                                  }
                                } catch {
                                  try {
                                    const ta = document.createElement("textarea");
                                    ta.value = url;
                                    ta.style.position = "fixed";
                                    ta.style.opacity = "0";
                                    document.body.appendChild(ta);
                                    ta.focus();
                                    ta.select();
                                    document.execCommand("copy");
                                    document.body.removeChild(ta);
                                    toast.success("Link kopiert.");
                                  } catch {
                                    toast.error("Fehler beim Kopieren des Links.");
                                  }
                                }
                              }}
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
              );
            })()}
          </div>
        </div>
      </div>

      <div className="mt-3 p-3 bg-base-200 rounded-lg border border-base-300">
        <div className="text-sm font-medium text-base-content opacity-80">
          Letzte Aktualisierung:{" "}
          <span className="font-normal">
            {statusUpdatedAt
              ? (() => {
                  try {
                    const d = new Date(statusUpdatedAt);
                    if (Number.isNaN(d.getTime())) return "—";
                    return new Intl.DateTimeFormat("uz-UZ", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                      timeZone: "Asia/Tashkent",
                    }).format(d);
                  } catch {
                    return "—";
                  }
                })()
              : "—"}
          </span>
          {statusUpdatedBy ? (
            <span className="font-normal">
              {" • Von: "}
              <span className="text-primary">{statusUpdatedBy}</span>
            </span>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
}
