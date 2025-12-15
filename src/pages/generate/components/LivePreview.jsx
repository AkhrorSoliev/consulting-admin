import { PreviewInfoRow, PreviewSectionTitle } from "./PreviewParts";

export default function LivePreview({ formCv, showDocuments, onPhotoClick }) {
  const firstName = String(formCv?.personalInfo?.name || "").trim();
  const lastName = String(formCv?.personalInfo?.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—";
  const address = String(formCv?.personalInfo?.address || "").trim();
  const birthDate = String(formCv?.personalInfo?.birthDate || "").trim();
  const phone = String(formCv?.personalInfo?.phone || "").trim();
  const email = String(formCv?.personalInfo?.email || "").trim();
  const maritalStatus = String(formCv?.personalInfo?.maritalStatus || "").trim();
  const noChildren = Boolean(formCv?.personalInfo?.noChildren);
  const childrenCount = String(formCv?.personalInfo?.childrenCount || "").trim();
  const childrenText = noChildren
    ? "Keine Kinder"
    : childrenCount
    ? childrenCount
    : "";
  const drivingType = String(formCv?.personalInfo?.drivingLicenseType || "")
    .trim()
    .toUpperCase();
  const drivingText = Boolean(formCv?.personalInfo?.hasDrivingLicense)
    ? drivingType
      ? `Ja (${drivingType})`
      : "Ja"
    : "Nein";
  const photo = String(formCv?.personalInfo?.photo || "").trim();

  return (
    <section className="hidden lg:block flex-1 min-w-0 h-[calc(100vh-2rem)] sticky top-4">
      <div className="bg-slate-200/50 rounded-xl border border-slate-300 shadow-inner h-full flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider z-10">
          <span>Vorschau (A4)</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live-Aktualisierung
          </span>
        </div>

        <div className="flex-1 overflow-y-auto w-full flex justify-center items-start bg-slate-100">
          <div
            className="bg-white shadow-2xl w-full max-w-full min-h-[297mm] p-[44pt] text-[#0f172a] text-[11pt] leading-[1.38] origin-top shrink-0"
            style={{
              fontFamily: "Inter, Helvetica, Arial, sans-serif",
            }}
          >
            <div className="flex flex-col gap-[18pt]">
              {/* Header */}
              <div className="mb-[18pt]">
                <h1 className="text-[24pt] font-bold text-[#0f172a] leading-tight">
                  {fullName}
                </h1>
                <div className="h-[2pt] bg-[#1f2937] mt-[17pt] mb-[12pt] w-full" />

                <div className="flex flex-row gap-[22pt]">
                  <div className="flex-1">
                    <div className="flex flex-col gap-[6pt] mt-1">
                      <PreviewInfoRow label="Name" value={fullName} />
                      <PreviewInfoRow label="Anschrift" value={address} />
                      <PreviewInfoRow label="geb." value={birthDate} />
                      <PreviewInfoRow
                        label="Familienstand"
                        value={maritalStatus}
                      />
                      <PreviewInfoRow label="Kinder" value={childrenText} />
                      <PreviewInfoRow label="Führerschein" value={drivingText} />
                      <PreviewInfoRow label="Tel" value={phone} />
                      <PreviewInfoRow label="E-Mail" value={email} />
                    </div>
                  </div>

                  <div className="shrink-0">
                    {photo ? (
                      <img
                        src={photo}
                        alt="Foto"
                        role="button"
                        tabIndex={0}
                        onClick={onPhotoClick}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onPhotoClick();
                          }
                        }}
                        className="w-[128pt] h-[160pt] object-cover border border-[#d9dee3] rounded-[8pt] cursor-zoom-in transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
                      />
                    ) : (
                      <div className="w-[128pt] h-[160pt] border border-[#d9dee3] rounded-[8pt] flex items-center justify-center bg-gray-50 text-gray-400 text-xs">
                        Foto
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 pr-[6pt]">
                {/* Berufliche Laufbahn */}
                {formCv.experience.length > 0 && (
                  <>
                    <PreviewSectionTitle>Berufliche Laufbahn</PreviewSectionTitle>
                    <div className="flex flex-col gap-[10pt]">
                      {formCv.experience.map((exp, i) => (
                        <div key={i} className="flex flex-row gap-[10pt]">
                          <div className="w-[140pt] shrink-0 font-bold text-[#475569]">
                            {(exp.startDate || "—") +
                              " – " +
                              (exp.endDate || "heute")}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-[#0f172a]">
                              {exp.position || "—"}
                              {exp.location ? `, ${exp.location}` : ""}
                            </div>
                            {exp.company && (
                              <div className="italic text-[#475569]">
                                {exp.company}
                              </div>
                            )}
                            {Array.isArray(exp.responsibilities) &&
                              exp.responsibilities.length > 0 && (
                                <div className="mt-[4pt]">
                                  {exp.responsibilities.map((r, ri) => (
                                    <div key={ri} className="flex flex-row gap-[6pt]">
                                      <span>•</span>
                                      <span>{r}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Ausbildung */}
                {formCv.education.length > 0 && (
                  <>
                    <PreviewSectionTitle>Ausbildung</PreviewSectionTitle>
                    <div className="flex flex-col gap-[10pt]">
                      {formCv.education.map((edu, i) => (
                        <div key={i} className="flex flex-row gap-[10pt]">
                          <div className="w-[140pt] shrink-0 font-bold text-[#475569]">
                            {(edu.startDate || "—") +
                              " – " +
                              (edu.endDate || "—")}
                          </div>
                          <div className="flex-1">
                            <div>{edu.institution || "—"}</div>
                            <div className="italic text-[#475569]">
                              Abschluss: {edu.degree || "—"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Kenntnisse & Fähigkeiten */}
                {(formCv.skills.softSkills?.length > 0 ||
                  Object.entries(formCv.skills.languages || {}).length > 0 ||
                  formCv.skills.pcSkills?.length > 0) && (
                  <>
                    <PreviewSectionTitle>
                      Kenntnisse & Fähigkeiten
                    </PreviewSectionTitle>
                    <div className="flex flex-col gap-[12pt]">
                      {formCv.skills.softSkills?.length > 0 && (
                        <div className="flex flex-col gap-[4pt]">
                          <div className="font-bold">Fähigkeiten</div>
                          <div className="flex flex-col gap-[3pt]">
                            {formCv.skills.softSkills.map((s, i) => (
                              <div key={i} className="flex flex-row gap-[6pt]">
                                <span>•</span>
                                <span>{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {Object.entries(formCv.skills.languages || {}).length > 0 && (
                        <div className="flex flex-col gap-[4pt]">
                          <div className="font-bold">Fremdsprachen</div>
                          <div className="flex flex-col gap-[3pt]">
                            {Object.entries(formCv.skills.languages).map(
                              ([lang, level]) => (
                                <div
                                  key={lang}
                                  className="flex flex-row gap-[6pt]"
                                >
                                  <span>•</span>
                                  <span>
                                    {lang} — {level}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {formCv.skills.pcSkills?.length > 0 && (
                        <div className="flex flex-col gap-[4pt]">
                          <div className="font-bold">PC-Kenntnisse</div>
                          <div className="flex flex-col gap-[3pt]">
                            {formCv.skills.pcSkills.map((s, i) => (
                              <div key={i} className="flex flex-row gap-[6pt]">
                                <span>•</span>
                                <span>{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Dokumente */}
                {showDocuments &&
                  (formCv.documents?.diplomas?.length > 0 ||
                    formCv.documents?.certificates?.length > 0) && (
                    <>
                      <PreviewSectionTitle>Dokumente</PreviewSectionTitle>
                      <div className="flex flex-col gap-[12pt]">
                        {formCv.documents.diplomas?.length > 0 && (
                          <div className="flex flex-col gap-[4pt]">
                            <div className="font-bold">Diplome</div>
                            <div className="flex flex-col gap-[3pt]">
                              {formCv.documents.diplomas.map((url, i) => (
                                <div key={i} className="flex flex-row gap-[6pt]">
                                  <span>•</span>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                  >
                                    {url}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {formCv.documents.certificates?.length > 0 && (
                          <div className="flex flex-col gap-[4pt]">
                            <div className="font-bold">Zertifikate</div>
                            <div className="flex flex-col gap-[3pt]">
                              {formCv.documents.certificates.map((url, i) => (
                                <div key={i} className="flex flex-row gap-[6pt]">
                                  <span>•</span>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                  >
                                    {url}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


