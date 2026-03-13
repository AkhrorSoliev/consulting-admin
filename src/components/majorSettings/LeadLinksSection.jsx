import { buildCreateLink } from "../majorsHelpers";
import LeadLinkCard from "./LeadLinkCard";

function sanitizeMajorId(major) {
  const majorId =
    major?.linkId || major?.uuid || major?.id || major?.collectionName || major;
  return String(majorId)
    .replace(/\u00df/g, "ss")
    .replace(/\u00fc/g, "ue")
    .replace(/\u00f6/g, "oe")
    .replace(/\u00e4/g, "ae");
}

export default function LeadLinksSection({
  major,
  isLinkActive,
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
  const sanitizedMajorId = sanitizeMajorId(major);

  return (
    <>
      {/* Add lead */}
      <div className="rounded-lg border border-base-300 bg-base-200/20 p-4 space-y-4">
        <div className="min-w-0">
          <div className="font-medium truncate">Lead linklar (qo'shimcha)</div>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              className={`input input-bordered flex-1 ${newLeadName.length > maxLeadNameLength ? "input-error" : ""}`}
              placeholder={`Lead nomi (max ${maxLeadNameLength} belgi)`}
              value={newLeadName}
              onChange={(e) => setNewLeadName(e.target.value)}
              maxLength={maxLeadNameLength}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onAddLead();
                }
              }}
              disabled={!isLinkActive || !leadLinksActive || isSavingLeads}
            />
            <button
              type="button"
              className="btn btn-primary whitespace-nowrap"
              onClick={onAddLead}
              disabled={!isLinkActive || !leadLinksActive || isSavingLeads}
            >
              Lead qo'shish
            </button>
          </div>
        </div>
      </div>

      {/* Lead links list */}
      <div className="rounded-lg border border-base-300 bg-base-200/30 p-4 space-y-3">
        <div className="font-medium">Barcha lead linklar</div>
        <div className="space-y-3">
          {leadLinks.length === 0 ? (
            <div className="text-sm opacity-70">Lead linklar yo'q.</div>
          ) : (
            <div className="space-y-2">
              {leadLinks.map((l) => {
                const leadName = String(l?.name || "").trim();
                const leadActive = l?.active !== false;
                const leadUrl = buildCreateLink(major, leadName);
                const leadTelegramLink = `https://t.me/consultinguz_admin_bot?start=${sanitizedMajorId}__lead__${leadName}`;
                const canCopy = isLinkActive && leadLinksActive && leadActive;
                return (
                  <LeadLinkCard
                    key={l.id}
                    id={l.id}
                    leadName={leadName}
                    leadActive={leadActive}
                    leadUrl={leadUrl}
                    leadTelegramLink={leadTelegramLink}
                    canCopy={canCopy}
                    isSavingLeads={isSavingLeads}
                    leadLinksActive={leadLinksActive}
                    onToggle={onToggleLeadActive}
                    onDelete={onDeleteLead}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
