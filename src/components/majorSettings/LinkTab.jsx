import MetaInfoSection from "./MetaInfoSection";
import MainLinksSection from "./MainLinksSection";
import LeadLinksSection from "./LeadLinksSection";

export default function LinkTab({
  major,
  majorKey,
  isLinkActive,
  isTogglingLink,
  isLoading,
  createLink,
  onCopyLink,
  onToggleLinkActive,
  candidateCount,
  checkingCandidates,
  metaName,
  setMetaName,
  metaSlug,
  setMetaSlug,
  metaTitle,
  setMetaTitle,
  isSavingMeta,
  setIsSavingMeta,
  metaValidationError,
  setMetaValidationError,
  leadLinksActive,
  leadLinks,
  isSavingLeads,
  newLeadName,
  setNewLeadName,
  maxLeadNameLength,
  onAddLead,
  onToggleLeadActive,
  onDeleteLead,
}) {
  return (
    <div className="space-y-4">
      {candidateCount === 0 && !checkingCandidates && (
        <MetaInfoSection
          majorKey={majorKey}
          metaName={metaName}
          setMetaName={setMetaName}
          metaSlug={metaSlug}
          setMetaSlug={setMetaSlug}
          metaTitle={metaTitle}
          setMetaTitle={setMetaTitle}
          isSavingMeta={isSavingMeta}
          setIsSavingMeta={setIsSavingMeta}
          metaValidationError={metaValidationError}
          setMetaValidationError={setMetaValidationError}
          isLoading={isLoading}
        />
      )}

      <LeadLinksSection
        major={major}
        isLinkActive={isLinkActive}
        leadLinksActive={leadLinksActive}
        leadLinks={leadLinks}
        isSavingLeads={isSavingLeads}
        newLeadName={newLeadName}
        setNewLeadName={setNewLeadName}
        maxLeadNameLength={maxLeadNameLength}
        onAddLead={onAddLead}
        onToggleLeadActive={onToggleLeadActive}
        onDeleteLead={onDeleteLead}
      />

      <MainLinksSection
        major={major}
        isLinkActive={isLinkActive}
        isTogglingLink={isTogglingLink}
        isLoading={isLoading}
        createLink={createLink}
        onCopyLink={onCopyLink}
        onToggleLinkActive={onToggleLinkActive}
      />
    </div>
  );
}
