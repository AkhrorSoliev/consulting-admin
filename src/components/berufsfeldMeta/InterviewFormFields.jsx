import CollapsibleSection from "../CollapsibleSection";

export default function InterviewFormFields({
  isLimitedAdmin,
  internalDate,
  setInternalDate,
  internalLink,
  setInternalLink,
  employerDate,
  setEmployerDate,
  employerLink,
  setEmployerLink,
}) {
  return (
    <div className="mt-4 space-y-3">
      <CollapsibleSection title="Ichki suxbat ma'lumotlari" defaultOpen>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="form-control">
            <label className="label" htmlFor="internal-date">
              <span className="label-text">Sana</span>
            </label>
            <input
              id="internal-date"
              type="datetime-local"
              className="input input-bordered w-full"
              value={internalDate}
              onChange={(e) => setInternalDate(e.target.value)}
              disabled={isLimitedAdmin}
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="internal-link">
              <span className="label-text">Link</span>
            </label>
            <input
              id="internal-link"
              type="url"
              className="input input-bordered w-full"
              placeholder="https://..."
              value={internalLink}
              onChange={(e) => setInternalLink(e.target.value)}
              disabled={isLimitedAdmin}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Ish beruvchi bilan suxbat ma'lumotlari">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="form-control">
            <label className="label" htmlFor="employer-date">
              <span className="label-text">Sana</span>
            </label>
            <input
              id="employer-date"
              type="datetime-local"
              className="input input-bordered w-full"
              value={employerDate}
              onChange={(e) => setEmployerDate(e.target.value)}
              disabled={isLimitedAdmin}
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="employer-link">
              <span className="label-text">Link</span>
            </label>
            <input
              id="employer-link"
              type="url"
              className="input input-bordered w-full"
              placeholder="https://..."
              value={employerLink}
              onChange={(e) => setEmployerLink(e.target.value)}
              disabled={isLimitedAdmin}
            />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
