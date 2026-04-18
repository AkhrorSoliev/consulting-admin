import CandidateStatusStepper from "../../../components/CandidateStatusStepper";
import EmailMetaBanner from "./stageStatus/EmailMetaBanner";
import DocumentToggleList from "./stageStatus/DocumentToggleList";
import ErklaerungFormList from "./stageStatus/ErklaerungFormList";
import SentDocumentsCard from "./stageStatus/SentDocumentsCard";
import StatusUpdateFooter from "./stageStatus/StatusUpdateFooter";

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
  onToggleLeadership,
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
      <EmailMetaBanner
        emailMeta={emailMeta}
        emailMetaAvatarFromUsers={emailMetaAvatarFromUsers}
      />

      <CandidateStatusStepper
        currentValue={statusValue}
        onSendEmail={onSendStatusEmail}
        sendingValue={sendingStepValue}
        disabled={isLimitedAdmin}
        resetStages={onResetStages}
        openCustomEmailModal={onOpenCustomEmailModal}
        onResetStage={onResetStage}
        hasLeadershipInterview={Boolean(
          docCv?.stageMeta?.stage_2?.plannedLeadership ||
            docCv?.stageMeta?.stage_2?.sentWithLeadership,
        )}
        plannedLeadership={Boolean(
          docCv?.stageMeta?.stage_2?.plannedLeadership ||
            docCv?.stageMeta?.stage_2?.sentWithLeadership,
        )}
        onToggleLeadership={onToggleLeadership}
        stageMeta={docCv?.stageMeta}
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

            <DocumentToggleList
              getOutgoingDocState={getOutgoingDocState}
              outgoingBusyById={outgoingBusyById}
              candidateCollection={candidateCollection}
              candidateDocId={candidateDocId}
              sendingStepValue={sendingStepValue}
              onToggleOutgoingDoc={onToggleOutgoingDoc}
            />

            <ErklaerungFormList
              formCv={formCv}
              onOpenErklaerung={onOpenErklaerung}
              onOpenZusatzblattA={onOpenZusatzblattA}
              onOpenZusatzblattB={onOpenZusatzblattB}
              onOpenZusatzblattC={onOpenZusatzblattC}
              onOpenZusatzblattD={onOpenZusatzblattD}
            />
          </div>
        </div>

        <SentDocumentsCard
          candidateDocId={candidateDocId}
          candidateCollection={candidateCollection}
          sendingStepValue={sendingStepValue}
          onOpenSendDocLinkModal={onOpenSendDocLinkModal}
          outgoingDocs={outgoingDocs}
          outgoingBusyById={outgoingBusyById}
          onDeleteOutgoingDoc={onDeleteOutgoingDoc}
        />
      </div>

      <StatusUpdateFooter
        statusUpdatedAt={statusUpdatedAt}
        statusUpdatedBy={statusUpdatedBy}
      />
    </div>
  );
}
