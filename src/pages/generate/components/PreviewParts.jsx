export const PreviewInfoRow = ({ label, value }) => (
  <div className="flex flex-row items-start mb-[6pt] min-w-0">
    <div className="w-[110pt] font-bold text-[#334155] shrink-0">{label}</div>
    <div className="flex-1 min-w-0 text-[#0f172a] ml-[4pt] wrap-break-word">
      {value || "—"}
    </div>
  </div>
);

export const PreviewSectionTitle = ({ children }) => (
  <div className="mt-[20pt] mb-[8pt] pb-[4pt] border-b border-[#e5e7eb]">
    <h3 className="text-[13pt] font-bold uppercase tracking-[0.6px] text-[#0f172a]">
      {children}
    </h3>
  </div>
);
