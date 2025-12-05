import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { addDocument } from "../utils";
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
} from "../utils";

function Create() {
  const initialCv = useMemo(
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
      skills: {
        softSkills: [],
        languages: {},
        pcSkills: [],
      },
    }),
    []
  );

  const [cv, setCv] = useState(initialCv);
  const [isGeneratingSoft, setIsGeneratingSoft] = useState(false);
  const [isGeneratingPc, setIsGeneratingPc] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState({ soft: [], pc: [] });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    try {
      const v = localStorage.getItem("createCvSubmitted");
      if (v === "true") setIsSubmitted(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  const {
    register,
    control,
    handleSubmit: rhfHandleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      personalInfo: {
        name: initialCv.personalInfo.name,
        address: initialCv.personalInfo.address,
        birthDate: toInputDate(initialCv.personalInfo.birthDate),
        maritalStatus: initialCv.personalInfo.maritalStatus,
        phone: initialCv.personalInfo.phone,
        email: initialCv.personalInfo.email,
        photo: initialCv.personalInfo.photo,
      },
    },
  });

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
      setValue("personalInfo.photo", base64, { shouldDirty: true });
    } catch (err) {
      console.error("Fehler beim Lesen des Fotos:", err);
    }
  }

  function addExperience() {
    setCv((prev) => ({
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
    setCv((prev) => {
      const next = [...prev.experience];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, experience: next };
    });
  }

  function removeExperience(idx) {
    setCv((prev) => {
      const next = prev.experience.filter((_, i) => i !== idx);
      return { ...prev, experience: next };
    });
  }

  function addResponsibility(expIdx, text) {
    if (!text?.trim()) return;
    setCv((prev) => {
      const next = [...prev.experience];
      const resp = [...next[expIdx].responsibilities, text.trim()];
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }

  function removeResponsibility(expIdx, respIdx) {
    setCv((prev) => {
      const next = [...prev.experience];
      const resp = next[expIdx].responsibilities.filter(
        (_, i) => i !== respIdx
      );
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }

  function addEducation() {
    setCv((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { startDate: "", endDate: "", institution: "", degree: "" },
      ],
    }));
  }

  function updateEducation(idx, field, value) {
    setCv((prev) => {
      const next = [...prev.education];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, education: next };
    });
  }

  function removeEducation(idx) {
    setCv((prev) => {
      const next = prev.education.filter((_, i) => i !== idx);
      return { ...prev, education: next };
    });
  }

  function addTag(path, value) {
    if (!value?.trim()) return;
    setCv((prev) => {
      const draft = structuredClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]];
      }
      const key = path[path.length - 1];
      target[key] = [...target[key], value.trim()];
      return draft;
    });
  }

  function addTags(path, values) {
    if (!Array.isArray(values) || !values.length) return;
    setCv((prev) => {
      const draft = structuredClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]];
      }
      const key = path[path.length - 1];
      const existing = Array.isArray(target[key]) ? target[key] : [];
      const nextSet = new Set(existing);
      values.forEach((v) => {
        const trimmed = String(v || "").trim();
        if (trimmed) nextSet.add(trimmed);
      });
      target[key] = Array.from(nextSet);
      return draft;
    });
  }

  function removeTag(path, index) {
    setCv((prev) => {
      const draft = structuredClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]];
      }
      const key = path[path.length - 1];
      target[key] = target[key].filter((_, i) => i !== index);
      return draft;
    });
  }

  async function autoAddSkills(kind) {
    if (kind === "soft") {
      setIsGeneratingSoft(true);
    } else {
      setIsGeneratingPc(true);
    }
    try {
      // Simulate async generation; keep sync but allow future async
      const generated = generateSkills(cv, kind);
      if (generated.length) {
        if (kind === "soft") {
          addTags(["skills", "softSkills"], generated);
          setRecentlyAdded((prev) => ({ ...prev, soft: generated }));
        } else {
          addTags(["skills", "pcSkills"], generated);
          setRecentlyAdded((prev) => ({ ...prev, pc: generated }));
        }
      } else {
        // No new items; show empty feedback
        if (kind === "soft") {
          setRecentlyAdded((prev) => ({ ...prev, soft: [] }));
        } else {
          setRecentlyAdded((prev) => ({ ...prev, pc: [] }));
        }
      }
    } finally {
      if (kind === "soft") {
        setIsGeneratingSoft(false);
      } else {
        setIsGeneratingPc(false);
      }
    }
  }

  const languageRows = useMemo(
    () =>
      Object.entries(cv.skills.languages).map(([name, level]) => ({
        name,
        level,
      })),
    [cv.skills.languages]
  );

  function addLanguageRow() {
    setCv((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        languages: { ...prev.skills.languages, "": "A1" },
      },
    }));
  }

  function updateLanguageRow(rowIdx, field, value) {
    setCv((prev) => {
      const entries = Object.entries(prev.skills.languages);
      const [oldName, oldLevel] = entries[rowIdx] || ["", "A1"];
      let nextEntries = [...entries];
      if (field === "name") {
        nextEntries[rowIdx] = [value, oldLevel];
      } else {
        nextEntries[rowIdx] = [oldName, value];
      }
      const nextObj = Object.fromEntries(
        nextEntries.filter(
          ([k]) => k !== "" || (k === "" && field === "name" && value !== "")
        )
      );
      return {
        ...prev,
        skills: { ...prev.skills, languages: nextObj },
      };
    });
  }

  function removeLanguageRow(rowIdx) {
    setCv((prev) => {
      const entries = Object.entries(prev.skills.languages).filter(
        (_, i) => i !== rowIdx
      );
      return {
        ...prev,
        skills: { ...prev.skills, languages: Object.fromEntries(entries) },
      };
    });
  }

  async function onSubmit(formData) {
    const final = {
      ...cv,
      personalInfo: {
        ...formData.personalInfo,
        birthDate: fromInputDate(formData.personalInfo.birthDate),
      },
    };

    const lebenslauf = {
      persoenlicheDaten: {
        name: final.personalInfo.name,
        adresse: final.personalInfo.address,
        geburtsdatum: final.personalInfo.birthDate,
        familienstand: final.personalInfo.maritalStatus,
        telefon: final.personalInfo.phone,
        email: final.personalInfo.email,
        foto: final.personalInfo.photo,
      },
      berufserfahrung: Array.isArray(final.experience)
        ? final.experience.map((exp) => ({
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
      ausbildung: Array.isArray(final.education)
        ? final.education.map((edu) => ({
            beginn: edu.startDate,
            ende: edu.endDate,
            bildungseinrichtung: edu.institution,
            abschluss: edu.degree || "",
          }))
        : [],
      faehigkeiten: {
        sozialkompetenzen: final.skills?.softSkills || [],
        pcKenntnisse: final.skills?.pcSkills || [],
        sprachen: final.skills?.languages || {},
      },
    };

    const major = (searchParams.get("major") || "").trim();

    if (!major) {
      toast.error("Der URL-Parameter ?major= fehlt oder ist leer.");
      return;
    }

    try {
      await addDocument(major, { ...lebenslauf, createdAt: Date.now() });
      toast.success("Daten erfolgreich gesendet!");
      try {
        localStorage.setItem("createCvSubmitted", "true");
      } catch {
        // ignore storage errors
      }
      setIsSubmitted(true);
    } catch (error) {
      console.error("Fehler beim Senden an Firestore:", error);
      toast.error(`Fehler beim Senden: ${error.message}`);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-base-200">
      <div
        className={
          isSubmitted
            ? "max-w-3xl mx-auto min-h-[calc(100vh-3rem)] grid place-items-center"
            : "max-w-3xl mx-auto"
        }
      >
        <section className="card bg-base-100 shadow w-full max-w-lg mx-auto">
          <div
            className={
              isSubmitted ? "card-body items-center text-center" : "card-body"
            }
          >
            {isSubmitted ? (
              <div className="space-y-4 text-center">
                <h2 className="card-title text-3xl font-bold w-full justify-center text-center">
                  Vielen Dank!
                </h2>
                <p>
                  Vielen Dank, dass Sie die Informationen auf Deutsch ausgefüllt
                  haben.
                </p>
              </div>
            ) : (
              <>
                <div className="w-full flex justify-center">
                  <h2 className="card-title text-3xl font-bold text-center">
                    Persönliche Daten
                  </h2>
                </div>

                <form
                  onSubmit={rhfHandleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="divider mt-0">
                    <span className="mx-auto">Persönliche Daten</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      control={control}
                      name="personalInfo.name"
                      rules={{ required: "Name ist erforderlich" }}
                      render={({ field, fieldState }) => (
                        <FormInput
                          label="Name"
                          placeholder="Name"
                          inputClassName={
                            errors?.personalInfo?.name
                              ? "input-error border-error focus:border-error focus:ring-error"
                              : ""
                          }
                          aria-invalid={
                            errors?.personalInfo?.name ? "true" : "false"
                          }
                          {...field}
                        />
                      )}
                    />
                    <div>
                      <Controller
                        control={control}
                        name="personalInfo.birthDate"
                        rules={{ required: "Geburtsdatum ist erforderlich" }}
                        render={({ field, fieldState }) => (
                          <>
                            <label
                              className="label"
                              htmlFor="personalInfo-birthDate"
                            >
                              <span className="label-text">Geburtsdatum</span>
                            </label>
                            <input
                              id="personalInfo-birthDate"
                              type="date"
                              className={`input input-bordered w-full bg-base-100 text-base-content border-base-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200 ${
                                errors?.personalInfo?.birthDate
                                  ? "input-error border-error focus:border-error focus:ring-error"
                                  : ""
                              }`}
                              aria-invalid={
                                errors?.personalInfo?.birthDate
                                  ? "true"
                                  : "false"
                              }
                              {...field}
                            />
                          </>
                        )}
                      />
                    </div>
                    <div>
                      <Controller
                        control={control}
                        name="personalInfo.maritalStatus"
                        rules={{ required: "Bitte Familienstand auswählen" }}
                        render={({ field, fieldState }) => (
                          <>
                            <label
                              className="label"
                              htmlFor="personalInfo-maritalStatus"
                            >
                              <span className="label-text">Familienstand</span>
                            </label>
                            <select
                              id="personalInfo-maritalStatus"
                              className={`select select-bordered w-full bg-base-100 text-base-content border-base-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200 ${
                                errors?.personalInfo?.maritalStatus
                                  ? "select-error border-error focus:border-error"
                                  : ""
                              }`}
                              aria-invalid={
                                errors?.personalInfo?.maritalStatus
                                  ? "true"
                                  : "false"
                              }
                              {...field}
                            >
                              <option value="">Bitte auswählen</option>
                              <option value="ledig">ledig</option>
                              <option value="verheiratet">verheiratet</option>
                            </select>
                          </>
                        )}
                      />
                    </div>
                    <Controller
                      control={control}
                      name="personalInfo.phone"
                      rules={{ required: "Telefonnummer ist erforderlich" }}
                      render={({ field, fieldState }) => (
                        <FormInput
                          label="Telefonnummer"
                          placeholder="Telefonnummer"
                          inputClassName={
                            errors?.personalInfo?.phone
                              ? "input-error border-error focus:border-error focus:ring-error"
                              : ""
                          }
                          aria-invalid={
                            errors?.personalInfo?.phone ? "true" : "false"
                          }
                          {...field}
                        />
                      )}
                    />
                    <div>
                      <Controller
                        control={control}
                        name="personalInfo.email"
                        rules={{
                          required: "E-Mail ist erforderlich",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Bitte gültige E-Mail eingeben",
                          },
                        }}
                        render={({ field, fieldState }) => (
                          <FormInput
                            label="E-Mail"
                            placeholder="E-Mail"
                            type="email"
                            inputClassName={
                              errors?.personalInfo?.email
                                ? "input-error border-error focus:border-error focus:ring-error"
                                : ""
                            }
                            aria-invalid={
                              errors?.personalInfo?.email ? "true" : "false"
                            }
                            {...field}
                          />
                        )}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label
                        className="label"
                        htmlFor="personalInfo-photo-file"
                      >
                        <span className="label-text">
                          Foto hochladen (JPEG/PNG)
                        </span>
                      </label>
                      <input
                        type="hidden"
                        {...register("personalInfo.photo", {
                          required: "Foto ist erforderlich",
                        })}
                      />
                      <input
                        id="personalInfo-photo-file"
                        type="file"
                        accept="image/*"
                        className={`file-input file-input-bordered w-full ${
                          errors?.personalInfo?.photo ? "file-input-error" : ""
                        }`}
                        onChange={handlePhotoFileChange}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Controller
                        control={control}
                        name="personalInfo.address"
                        rules={{ required: "Adresse ist erforderlich" }}
                        render={({ field, fieldState }) => (
                          <>
                            <label
                              className="label"
                              htmlFor="personalInfo-address"
                            >
                              <span className="label-text">Adresse</span>
                            </label>
                            <textarea
                              id="personalInfo-address"
                              className={`textarea textarea-bordered w-full bg-base-100 text-base-content border-base-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200 ${
                                errors?.personalInfo?.address
                                  ? "textarea-error border-error focus:border-error focus:ring-error"
                                  : ""
                              }`}
                              placeholder="Adresse"
                              rows={2}
                              aria-invalid={
                                errors?.personalInfo?.address ? "true" : "false"
                              }
                              {...field}
                            />
                          </>
                        )}
                      />
                    </div>
                  </div>

                  <div className="divider">Berufserfahrung</div>
                  <ExperienceSection
                    experience={cv.experience}
                    onAddExperience={addExperience}
                    onUpdateExperience={updateExperience}
                    onRemoveExperience={removeExperience}
                    onAddResponsibility={addResponsibility}
                    onRemoveResponsibility={removeResponsibility}
                  />

                  <div className="divider">Ausbildung</div>
                  <EducationSection
                    education={cv.education}
                    onAddEducation={addEducation}
                    onUpdateEducation={updateEducation}
                    onRemoveEducation={removeEducation}
                  />

                  <div className="divider">Fähigkeiten</div>
                  <SkillsSection
                    softSkills={cv.skills.softSkills}
                    pcSkills={cv.skills.pcSkills}
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
                  <div className="flex justify-end">
                    <button type="submit" className="btn btn-primary">
                      Absenden
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Create;
