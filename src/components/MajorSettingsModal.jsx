/**
 * MajorSettingsModal - thin shell that composes sub-components from ./majorSettings/.
 */
import { createPortal } from "react-dom";
import { buildCreateLink } from "./majorsHelpers";
import {
  Sidebar, LinkTab, InterviewTabForm, DeleteLeadDialog,
  useMajorSettingsState, handleAddLead, handleToggleLeadActive,
  handleRemoveLead, handleSaveInterviews,
} from "./majorSettings/index";
import buildInterviewProps from "./majorSettings/buildInterviewProps";

function resolveMaxLeadLen(major) {
  const id = major?.linkId || major?.uuid || major?.id || major?.collectionName || major;
  const len = String(id).replace(/ß/g, "ss").replace(/ü/g, "ue")
    .replace(/ö/g, "oe").replace(/ä/g, "ae").length;
  return Math.max(0, 64 - len - 8);
}

export default function MajorSettingsModal({
  open, major, majorKey, onClose, onCopyLink, onToggleLinkActive, isTogglingLink,
}) {
  if (!open || typeof document === "undefined") return null;

  const title = major?.title || major?.collectionName || major?.slug || major?.name || String(major || "");
  const isLinkActive = major?.linkActive !== false;
  const createLink = buildCreateLink(major);
  const maxLeadNameLength = resolveMaxLeadLen(major);
  const s = useMajorSettingsState({ open, major, majorKey });

  const onSaveInterviews = () => handleSaveInterviews({
    majorKey, setIsSaving: s.setIsSaving,
    internalDate: s.internalDate, internalLink: s.internalLink,
    internalLinkType: s.internalLinkType, internalLocationName: s.internalLocationName,
    internalLocationUrl: s.internalLocationUrl, internalTelegramGroupId: s.internalTelegramGroupId,
    leadershipDate: s.leadershipDate, leadershipLink: s.leadershipLink,
    leadershipLinkType: s.leadershipLinkType, leadershipLocationName: s.leadershipLocationName,
    leadershipLocationUrl: s.leadershipLocationUrl, leadershipTelegramGroupId: s.leadershipTelegramGroupId,
    employerDate: s.employerDate, employerLink: s.employerLink,
    employerLinkType: s.employerLinkType, employerLocationName: s.employerLocationName,
    employerLocationUrl: s.employerLocationUrl, employerTelegramGroupId: s.employerTelegramGroupId,
  });

  const interviewTabContent = (scope) => {
    const props = buildInterviewProps(s, scope);
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <InterviewTabForm {...props} />
        <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Schließen
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={s.isSaving}
            onClick={onSaveInterviews}
          >
            {s.isSaving ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Speichern"
            )}
          </button>
        </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-base-content/60 backdrop-blur-sm p-4">
      <div className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-base-300/50">
        {/* Header */}
        <div className="bg-neutral text-neutral-content px-6 py-4 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide opacity-60">Einstellungen</p>
            <h2 className="text-lg font-bold truncate">{title}</h2>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost text-neutral-content hover:bg-neutral-content/10"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Loading */}
        {s.isLoading ? (
          <div className="flex-1 grid place-items-center py-16">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            <Sidebar tab={s.tab} setTab={s.setTab} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {s.tab === "link" ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <LinkTab
                    major={major}
                    majorKey={majorKey}
                    isLinkActive={isLinkActive}
                    isTogglingLink={isTogglingLink}
                    isLoading={s.isLoading}
                    createLink={createLink}
                    onCopyLink={onCopyLink}
                    onToggleLinkActive={onToggleLinkActive}
                    candidateCount={s.candidateCount}
                    checkingCandidates={s.checkingCandidates}
                    metaName={s.metaName}
                    setMetaName={s.setMetaName}
                    metaSlug={s.metaSlug}
                    setMetaSlug={s.setMetaSlug}
                    metaTitle={s.metaTitle}
                    setMetaTitle={s.setMetaTitle}
                    isSavingMeta={s.isSavingMeta}
                    setIsSavingMeta={s.setIsSavingMeta}
                    metaValidationError={s.metaValidationError}
                    setMetaValidationError={s.setMetaValidationError}
                    leadLinksActive={s.leadLinksActive}
                    leadLinks={s.leadLinks}
                    isSavingLeads={s.isSavingLeads}
                    newLeadName={s.newLeadName}
                    setNewLeadName={s.setNewLeadName}
                    maxLeadNameLength={maxLeadNameLength}
                    onAddLead={() =>
                      handleAddLead({
                        newLeadName: s.newLeadName,
                        maxLeadNameLength,
                        leadLinks: s.leadLinks,
                        leadLinksActive: s.leadLinksActive,
                        majorKey,
                        setLeadLinks: s.setLeadLinks,
                        setNewLeadName: s.setNewLeadName,
                        setIsSavingLeads: s.setIsSavingLeads,
                      })
                    }
                    onToggleLeadActive={(id, checked) =>
                      handleToggleLeadActive({
                        id,
                        checked,
                        leadLinks: s.leadLinks,
                        leadLinksActive: s.leadLinksActive,
                        majorKey,
                        setLeadLinks: s.setLeadLinks,
                        setIsSavingLeads: s.setIsSavingLeads,
                      })
                    }
                    onDeleteLead={(lead) => s.setDeleteLead(lead)}
                  />
                </div>
              ) : (
                interviewTabContent(s.tab)
              )}
            </div>
          </div>
        )}

        {/* Delete lead dialog overlay */}
        <DeleteLeadDialog
          deleteLead={s.deleteLead}
          isSavingLeads={s.isSavingLeads}
          onClose={() => s.setDeleteLead(null)}
          onConfirm={async (id) => {
            await handleRemoveLead({
              id,
              leadLinks: s.leadLinks,
              leadLinksActive: s.leadLinksActive,
              majorKey,
              setLeadLinks: s.setLeadLinks,
              setIsSavingLeads: s.setIsSavingLeads,
            });
            s.setDeleteLead(null);
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
