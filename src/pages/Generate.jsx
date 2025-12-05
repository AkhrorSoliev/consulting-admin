import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { FaDownload, FaArrowLeft } from "react-icons/fa";
import toast from "react-hot-toast";
import FormInput from "../components/FormInput";
import ExperienceSection from "../components/ExperienceSection";
import EducationSection from "../components/EducationSection";
import SkillsSection from "../components/SkillsSection";
import LanguagesSection from "../components/LanguagesSection";
import {
  imageFileToBase64,
  toInputDate,
  fromInputDate,
  generateSkills,
  updateDocument,
} from "../utils";

function Generate() {
  const { major, id } = useParams();
  const [docCv, setDocCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local editable state (Create.jsx like)
  const initialForm = useMemo(
    () => ({
      personalInfo: {
        name: "",
        address: "",
        birthDate: "",
        maritalStatus: "",
        phone: "",
        email: "",
        photo: "",
      },
      experience: [],
      education: [],
      skills: { softSkills: [], pcSkills: [], languages: {} },
    }),
    []
  );
  const [formCv, setFormCv] = useState(initialForm);
  const [isGeneratingSoft, setIsGeneratingSoft] = useState(false);
  const [isGeneratingPc, setIsGeneratingPc] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState({ soft: [], pc: [] });
  const [formInitialized, setFormInitialized] = useState(false);

  useEffect(() => {
    const col = String(major || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const ref = doc(db, col, docId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          setDocCv(null);
        } else {
          const data = snap.data() || null;
          setDocCv(data);
          setNotFound(false);
          if (!formInitialized) {
            setFormCv(mapDocToForm(data));
            setFormInitialized(true);
          }
        }
        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [major, id, formInitialized]);

  function mapDocToForm(data) {
    const p = data?.persoenlicheDaten || {};
    const berufe = Array.isArray(data?.berufserfahrung)
      ? data.berufserfahrung
      : [];
    const ausb = Array.isArray(data?.ausbildung) ? data.ausbildung : [];
    const f = data?.faehigkeiten || {};
    return {
      personalInfo: {
        name: String(p.name || ""),
        address: String(p.adresse || ""),
        birthDate: String(p.geburtsdatum || ""),
        maritalStatus: String(p.familienstand || ""),
        phone: String(p.telefon || ""),
        email: String(p.email || ""),
        photo: String(p.foto || ""),
      },
      experience: berufe.map((b) => ({
        startDate: String(b?.beginn || ""),
        endDate: String(b?.ende || ""),
        position: String(b?.position || ""),
        company: String(b?.unternehmen || ""),
        location: String(b?.ort || ""),
        responsibilities: Array.isArray(b?.aufgaben) ? b.aufgaben : [],
      })),
      education: ausb.map((a) => ({
        startDate: String(a?.beginn || ""),
        endDate: String(a?.ende || ""),
        institution: String(a?.bildungseinrichtung || ""),
        degree: String(a?.abschluss || ""),
      })),
      skills: {
        softSkills: Array.isArray(f?.sozialkompetenzen)
          ? f.sozialkompetenzen
          : [],
        pcSkills: Array.isArray(f?.pcKenntnisse) ? f.pcKenntnisse : [],
        languages:
          typeof f?.sprachen === "object" && f?.sprachen !== null
            ? f.sprachen
            : {},
      },
    };
  }

  function mapFormToDoc(f) {
    return {
      persoenlicheDaten: {
        name: f.personalInfo.name,
        adresse: f.personalInfo.address,
        geburtsdatum: f.personalInfo.birthDate,
        familienstand: f.personalInfo.maritalStatus,
        telefon: f.personalInfo.phone,
        email: f.personalInfo.email,
        foto: f.personalInfo.photo,
      },
      berufserfahrung: Array.isArray(f.experience)
        ? f.experience.map((exp) => ({
            beginn: exp.startDate,
            ende: exp.endDate,
            position: exp.position,
            unternehmen: exp.company,
            ort: exp.location,
            aufgaben: Array.isArray(exp.responsibilities)
              ? exp.responsibilities
              : [],
          }))
        : [],
      ausbildung: Array.isArray(f.education)
        ? f.education.map((edu) => ({
            beginn: edu.startDate,
            ende: edu.endDate,
            bildungseinrichtung: edu.institution,
            abschluss: edu.degree || "",
          }))
        : [],
      faehigkeiten: {
        sozialkompetenzen: f.skills?.softSkills || [],
        pcKenntnisse: f.skills?.pcSkills || [],
        sprachen: f.skills?.languages || {},
      },
    };
  }

  async function handlePhotoFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await imageFileToBase64(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.9,
        mimeType: "image/jpeg",
      });
      setFormCv((prev) => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, photo: base64 },
      }));
    } catch (err) {
      console.error(err);
    }
  }

  // Experience handlers
  function addExperience() {
    setFormCv((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          startDate: "",
          endDate: "",
          position: "",
          company: "",
          location: "",
          responsibilities: [],
        },
      ],
    }));
  }
  function updateExperience(idx, field, value) {
    setFormCv((prev) => {
      const next = [...prev.experience];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, experience: next };
    });
  }
  function removeExperience(idx) {
    setFormCv((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx),
    }));
  }
  function addResponsibility(expIdx, text) {
    if (!text?.trim()) return;
    setFormCv((prev) => {
      const next = [...prev.experience];
      const resp = [...next[expIdx].responsibilities, text.trim()];
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }
  function removeResponsibility(expIdx, respIdx) {
    setFormCv((prev) => {
      const next = [...prev.experience];
      const resp = next[expIdx].responsibilities.filter(
        (_, i) => i !== respIdx
      );
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }

  // Education handlers
  function addEducation() {
    setFormCv((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { startDate: "", endDate: "", institution: "", degree: "" },
      ],
    }));
  }
  function updateEducation(idx, field, value) {
    setFormCv((prev) => {
      const next = [...prev.education];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, education: next };
    });
  }
  function removeEducation(idx) {
    setFormCv((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx),
    }));
  }

  // Skills handlers
  function addTag(path, value) {
    if (!value?.trim()) return;
    setFormCv((prev) => {
      const draft = structuredClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
      const key = path[path.length - 1];
      target[key] = [...target[key], value.trim()];
      return draft;
    });
  }
  function removeTag(path, index) {
    setFormCv((prev) => {
      const draft = structuredClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
      const key = path[path.length - 1];
      target[key] = target[key].filter((_, i) => i !== index);
      return draft;
    });
  }
  async function autoAddSkills(kind) {
    if (kind === "soft") setIsGeneratingSoft(true);
    else setIsGeneratingPc(true);
    try {
      const generated = generateSkills(formCv, kind);
      if (generated.length) {
        if (kind === "soft") {
          setFormCv((prev) => ({
            ...prev,
            skills: {
              ...prev.skills,
              softSkills: [...prev.skills.softSkills, ...generated],
            },
          }));
          setRecentlyAdded((p) => ({ ...p, soft: generated }));
        } else {
          setFormCv((prev) => ({
            ...prev,
            skills: {
              ...prev.skills,
              pcSkills: [...prev.skills.pcSkills, ...generated],
            },
          }));
          setRecentlyAdded((p) => ({ ...p, pc: generated }));
        }
      } else {
        setRecentlyAdded((p) =>
          kind === "soft" ? { ...p, soft: [] } : { ...p, pc: [] }
        );
      }
    } finally {
      if (kind === "soft") setIsGeneratingSoft(false);
      else setIsGeneratingPc(false);
    }
  }

  // Languages handlers
  const languageRows = useMemo(
    () =>
      Object.entries(formCv.skills.languages).map(([name, level]) => ({
        name,
        level,
      })),
    [formCv.skills.languages]
  );
  function addLanguageRow() {
    setFormCv((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        languages: { ...prev.skills.languages, "": "A1" },
      },
    }));
  }
  function updateLanguageRow(rowIdx, field, value) {
    setFormCv((prev) => {
      const entries = Object.entries(prev.skills.languages);
      const [oldName, oldLevel] = entries[rowIdx] || ["", "A1"];
      let next = [...entries];
      if (field === "name") next[rowIdx] = [value, oldLevel];
      else next[rowIdx] = [oldName, value];
      const nextObj = Object.fromEntries(
        next.filter(
          ([k]) => k !== "" || (k === "" && field === "name" && value !== "")
        )
      );
      return { ...prev, skills: { ...prev.skills, languages: nextObj } };
    });
  }
  function removeLanguageRow(rowIdx) {
    setFormCv((prev) => {
      const entries = Object.entries(prev.skills.languages).filter(
        (_, i) => i !== rowIdx
      );
      return {
        ...prev,
        skills: { ...prev.skills, languages: Object.fromEntries(entries) },
      };
    });
  }

  async function handleSave() {
    const col = String(major || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;
    try {
      setIsSaving(true);
      const payload = mapFormToDoc(formCv);
      await updateDocument(col, docId, payload);
      toast.success("Änderungen wurden gespeichert.");
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Speichern.");
    } finally {
      setIsSaving(false);
    }
  }

  // Download button placeholder: intentionally non-functional

  const SectionTitle = ({ children }) => (
    <div className="mt-8 mb-3">
      <h3 className="text-xl font-semibold">{children}</h3>
      <div className="h-[2px] bg-base-300 mt-1" />
    </div>
  );

  // Preview data from form state
  const fullName = String(formCv.personalInfo.name || "").trim() || "—";
  const address = String(formCv.personalInfo.address || "").trim();
  const birthDate = String(formCv.personalInfo.birthDate || "").trim();
  const phone = String(formCv.personalInfo.phone || "").trim();
  const email = String(formCv.personalInfo.email || "").trim();
  const maritalStatus = String(formCv.personalInfo.maritalStatus || "").trim();
  const photo = String(formCv.personalInfo.photo || "").trim();

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-base-200 min-h-screen">
      <div className="w-full">
        {/* Controls (hidden on print) */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Link
                  to={`/collectionCv/${major}`}
                  className="link flex items-center gap-2"
                >
                  <FaArrowLeft /> Zurück
                </Link>
              </li>
              <li className="opacity-70">CV</li>
            </ul>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-sm btn-outline">
              <FaDownload /> Download
            </button>
            <button
              className={`btn btn-sm btn-primary ${
                isSaving ? "btn-disabled" : ""
              }`}
              onClick={handleSave}
              disabled={isSaving || loading || notFound}
            >
              {isSaving ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : notFound ? (
          <div className="py-16 text-center bg-base-100 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Nicht gefunden</h2>
            <p className="opacity-70">
              Das Dokument existiert nicht oder wurde gelöscht.
            </p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <section className="card bg-base-100 shadow w-full lg:max-w-[600px] shrink-0 h-screen overflow-y-auto">
              <div className="card-body">
                <h2 className="card-title text-2xl font-bold">
                  Daten bearbeiten
                </h2>
                <div className="divider mt-2">Persönliche Daten</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Name"
                    placeholder="Name"
                    value={formCv.personalInfo.name}
                    onChange={(e) =>
                      setFormCv((prev) => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          name: e.target.value,
                        },
                      }))
                    }
                  />
                  <div>
                    <label className="label" htmlFor="g-birthdate">
                      <span className="label-text">Geburtsdatum</span>
                    </label>
                    <input
                      id="g-birthdate"
                      type="date"
                      className="input input-bordered w-full bg-base-100 text-base-content border-base-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200"
                      value={toInputDate(formCv.personalInfo.birthDate)}
                      onChange={(e) =>
                        setFormCv((prev) => ({
                          ...prev,
                          personalInfo: {
                            ...prev.personalInfo,
                            birthDate: fromInputDate(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="g-marital">
                      <span className="label-text">Familienstand</span>
                    </label>
                    <select
                      id="g-marital"
                      className="select select-bordered w-full bg-base-100 text-base-content border-base-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200"
                      value={formCv.personalInfo.maritalStatus}
                      onChange={(e) =>
                        setFormCv((prev) => ({
                          ...prev,
                          personalInfo: {
                            ...prev.personalInfo,
                            maritalStatus: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="">Bitte auswählen</option>
                      <option value="ledig">ledig</option>
                      <option value="verheiratet">verheiratet</option>
                    </select>
                  </div>
                  <FormInput
                    label="Telefonnummer"
                    placeholder="Telefonnummer"
                    value={formCv.personalInfo.phone}
                    onChange={(e) =>
                      setFormCv((prev) => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          phone: e.target.value,
                        },
                      }))
                    }
                  />
                  <FormInput
                    label="E-Mail"
                    placeholder="E-Mail"
                    type="email"
                    value={formCv.personalInfo.email}
                    onChange={(e) =>
                      setFormCv((prev) => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          email: e.target.value,
                        },
                      }))
                    }
                  />

                  <div className="md:col-span-2">
                    <label className="label" htmlFor="g-photo-file">
                      <span className="label-text">
                        Foto hochladen (JPEG/PNG)
                      </span>
                    </label>
                    <input
                      id="g-photo-file"
                      type="file"
                      accept="image/*"
                      className="file-input file-input-bordered w-full"
                      onChange={handlePhotoFileChange}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label" htmlFor="g-address">
                      <span className="label-text">Adresse</span>
                    </label>
                    <textarea
                      id="g-address"
                      className="textarea textarea-bordered w-full bg-base-100 text-base-content border-base-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200"
                      placeholder="Adresse"
                      rows={2}
                      value={formCv.personalInfo.address}
                      onChange={(e) =>
                        setFormCv((prev) => ({
                          ...prev,
                          personalInfo: {
                            ...prev.personalInfo,
                            address: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="divider">Berufserfahrung</div>
                <ExperienceSection
                  experience={formCv.experience}
                  onAddExperience={addExperience}
                  onUpdateExperience={updateExperience}
                  onRemoveExperience={removeExperience}
                  onAddResponsibility={addResponsibility}
                  onRemoveResponsibility={removeResponsibility}
                />

                <div className="divider">Ausbildung</div>
                <EducationSection
                  education={formCv.education}
                  onAddEducation={addEducation}
                  onUpdateEducation={updateEducation}
                  onRemoveEducation={removeEducation}
                />

                <div className="divider">Fähigkeiten</div>
                <SkillsSection
                  softSkills={formCv.skills.softSkills}
                  pcSkills={formCv.skills.pcSkills}
                  onAddSoft={(val) => addTag(["skills", "softSkills"], val)}
                  onRemoveSoft={(i) => removeTag(["skills", "softSkills"], i)}
                  onAddPc={(val) => addTag(["skills", "pcSkills"], val)}
                  onRemovePc={(i) => removeTag(["skills", "pcSkills"], i)}
                  onAutoAddSoft={() => autoAddSkills("soft")}
                  onAutoAddPc={() => autoAddSkills("pc")}
                  isGeneratingSoft={isGeneratingSoft}
                  isGeneratingPc={isGeneratingPc}
                  recentlyAddedSoft={recentlyAdded.soft}
                  recentlyAddedPc={recentlyAdded.pc}
                />

                <div className="divider">Sprachen</div>
                <LanguagesSection
                  languageRows={languageRows}
                  onAddRow={addLanguageRow}
                  onUpdateRow={updateLanguageRow}
                  onRemoveRow={removeLanguageRow}
                />

                <div className="divider"></div>
                <div className="flex justify-end gap-2">
                  <button
                    className={`btn btn-primary ${
                      isSaving ? "btn-disabled" : ""
                    }`}
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "Speichern..." : "Speichern"}
                  </button>
                </div>
              </div>
            </section>

            {/* Right: Live Preview */}
            <section className="bg-base-100 print:bg-white rounded-lg shadow-md overflow-hidden print:shadow-none print:rounded-none flex-1 min-w-0">
              <div className="p-8">
                <div className="grid grid-cols-12 gap-6 items-start">
                  <div className="col-span-12 md:col-span-9">
                    <h1 className="text-3xl md:text-4xl font-bold">
                      {fullName}
                    </h1>
                    <div className="h-[3px] mt-3 bg-base-300" />

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-[15px]">
                      <div className="grid grid-cols-[120px,1fr] gap-y-2">
                        <div className="opacity-80">Name</div>
                        <div className="font-medium">{fullName}</div>

                        <div className="opacity-80">Anschrift</div>
                        <div>{address || "—"}</div>

                        <div className="opacity-80">geb.</div>
                        <div>{birthDate || "—"}</div>
                      </div>
                      <div className="grid grid-cols-[120px,1fr] gap-y-2">
                        <div className="opacity-80">Familienstand</div>
                        <div>{maritalStatus || "—"}</div>

                        <div className="opacity-80">Tel</div>
                        <div>{phone || "—"}</div>

                        <div className="opacity-80">E-Mail</div>
                        <div className="break-all">{email || "—"}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-3 md:justify-self-end">
                    <div className="w-[180px] h-[220px] border border-base-300 overflow-hidden object-cover mx-auto md:mx-0">
                      {photo ? (
                        <img
                          src={photo}
                          alt={fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-sm opacity-70">
                          Foto
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <SectionTitle>Berufliche Laufbahn</SectionTitle>
                {formCv.experience.length === 0 ? (
                  <p className="text-sm opacity-70">Nicht angegeben.</p>
                ) : (
                  <div className="space-y-4">
                    {formCv.experience.map((exp, i) => (
                      <div key={i} className="grid grid-cols-[210px,1fr] gap-4">
                        <div className="text-sm opacity-80">
                          {exp?.startDate || "—"} – {exp?.endDate || "heute"}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {exp?.position || "—"}
                            {exp?.location ? `, ${exp.location}` : ""}
                          </div>
                          <div className="italic opacity-80">
                            {exp?.company || ""}
                          </div>
                          {Array.isArray(exp?.responsibilities) &&
                          exp.responsibilities.length > 0 ? (
                            <ul className="mt-2 space-y-1 text-sm">
                              {exp.responsibilities.map((t, k) => (
                                <li key={k} className="flex items-start gap-2">
                                  <span className="mt-1">○</span>
                                  <span className="break-words">{t}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <SectionTitle>Ausbildung</SectionTitle>
                {formCv.education.length === 0 ? (
                  <p className="text-sm opacity-70">Nicht angegeben.</p>
                ) : (
                  <div className="space-y-3">
                    {formCv.education.map((edu, i) => (
                      <div key={i} className="grid grid-cols-[210px,1fr] gap-4">
                        <div className="text-sm opacity-80">
                          {edu?.startDate || "—"} – {edu?.endDate || "—"}
                        </div>
                        <div>
                          <div className="opacity-90">
                            {edu?.institution || "—"}
                          </div>
                          <div className="text-sm">
                            Abschluss:{" "}
                            <span className="italic">{edu?.degree || "—"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <SectionTitle>Kenntnisse & Fähigkeiten</SectionTitle>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="font-medium mb-2">Fähigkeiten</div>
                    {Array.isArray(formCv.skills.softSkills) &&
                    formCv.skills.softSkills.length > 0 ? (
                      <ul className="space-y-1">
                        {formCv.skills.softSkills.map((s, i) => (
                          <li key={i} className="flex gap-2">
                            <span>–</span>
                            <span className="break-words">{s}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm opacity-70">Nicht angegeben.</p>
                    )}
                  </div>
                  <div>
                    <div className="font-medium mb-2">Fremdsprachen</div>
                    {Object.entries(formCv.skills.languages || {}).length ===
                    0 ? (
                      <p className="text-sm opacity-70">Nicht angegeben.</p>
                    ) : (
                      <ul className="space-y-1">
                        {Object.entries(formCv.skills.languages).map(
                          ([lang, level]) => (
                            <li key={lang}>
                              {lang} — {String(level)}
                            </li>
                          )
                        )}
                      </ul>
                    )}
                    <div className="font-medium mt-4 mb-1">PC-Kenntnisse</div>
                    {Array.isArray(formCv.skills.pcSkills) &&
                    formCv.skills.pcSkills.length > 0 ? (
                      <div className="text-sm">
                        {formCv.skills.pcSkills.join(", ")}
                      </div>
                    ) : (
                      <p className="text-sm opacity-70">Nicht angegeben.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default Generate;
