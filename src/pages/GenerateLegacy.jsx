import { toInputDate, fromInputDate } from "../utils";
import DeleteCandidateModal from "../components/DeleteCandidateModal";
import UnsavedChangesModal from "../components/UnsavedChangesModal";
import StepperAndModals from "./generate/components/StepperAndModals";
import ActionBar from "./generate/components/ActionBar";
import SelectMajorModal from "../components/SelectMajorModal";
import { useGeneratePage } from "./generate/hooks/useGeneratePage";
import MissingPassportModal from "./generate/components/MissingPassportModal";
import GenerateFormContent from "./generate/components/GenerateFormContent";

function Generate() {
  const g = useGeneratePage();
  return (
    <div className="p-2 min-h-screen">
      {g.remoteMode ? (
        <SelectMajorModal
          open={g.majorModalOpen} majors={g.majors}
          selectedKey={g.majorModalKey} onSelectKey={g.setMajorModalKey}
          onCancel={() => { if (g.restoreBusy) return; g.setMajorModalOpen(false); g.setMajorModalKey(""); }}
          onConfirm={g.confirmRestoreFromModal} confirming={Boolean(g.restoreBusy)}
          title="Bereich (Major) auswählen"
          subtitle="Wählen Sie einen Bereich (Major) für die Wiederherstellung."
        />
      ) : null}
      {g.isPageBusy && (
        <div className="fixed inset-0 z-100 bg-black/40 backdrop-blur-[1px] flex items-center justify-center" role="status" aria-live="polite" aria-busy="true">
          <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl px-6 py-5 flex items-center gap-3">
            <span className="loading loading-spinner loading-md text-primary" />
            <div className="text-sm font-medium">{g.busyLabel}</div>
          </div>
        </div>
      )}
      <DeleteCandidateModal open={g.deleteModalOpen} onClose={g.closeDeleteModal} onDelete={g.confirmDeleteCandidate} onArchive={g.confirmArchiveCandidate} onConfirm={g.confirmDeleteCandidate} candidateName={g.deleteTarget?.name} isDeleting={g.isDeletingCandidate} seconds={5} skipCountdown={true} />
      <MissingPassportModal open={g.missingPassportModalOpen} onConfirm={g.handleMissingPassportConfirm} onCancel={g.handleMissingPassportCancel} />
      <UnsavedChangesModal
        open={g.unsavedModalOpen && g.unsavedBlocker?.state === "blocked"}
        title="Ungespeicherte Änderungen"
        message="Sie haben ungespeicherte Änderungen. Möchten Sie fortfahren?"
        stayText="Bleiben" leaveText="Fortfahren"
        onStay={g.stayOnGeneratePage} onLeave={g.leaveGeneratePage}
      />
      <ActionBar {...g} />
      <div className="h-14 print:hidden" />
      <div className="w-full">
        {g.loading ? (
          <div className="grid place-items-center py-16"><span className="loading loading-spinner loading-lg text-primary" /></div>
        ) : g.notFound ? (
          <div className="py-16 text-center bg-base-100 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Nicht gefunden</h2>
            <p className="opacity-70">Das Dokument existiert nicht oder wurde gelöscht.</p>
          </div>
        ) : (
          <GenerateFormContent g={g} toInputDate={toInputDate} fromInputDate={fromInputDate} />
        )}
      </div>
      <StepperAndModals {...g} />
    </div>
  );
}
export default Generate;
