import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import ReCAPTCHA from "react-google-recaptcha";
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
  uploadFilesToConsulting,
  checkEmailRemote,
  registerEmailRemote,
} from "../utils";

function Create() {
  const initialCv = useMemo(
    () => ({
      personalInfo: {
        name: "",
        lastName: "",
        gender: "",
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
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [existingMajor, setExistingMajor] = useState("");
  const [enteredEmail, setEnteredEmail] = useState("");
  const [searchParams] = useSearchParams();
  const [diplomaFiles, setDiplomaFiles] = useState([]);
  const [langCertFiles, setLangCertFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [noDiploma, setNoDiploma] = useState(false);
  const [noLangCert, setNoLangCert] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  function uniqueKey(file) {
    return `${file?.name || ""}__${file?.size || 0}__${
      file?.lastModified || 0
    }`;
  }

  function mergeFiles(existing, incoming) {
    const map = new Map();
    (existing || []).forEach((f) => map.set(uniqueKey(f), f));
    (incoming || []).forEach((f) => {
      if (f instanceof File) map.set(uniqueKey(f), f);
    });
    return Array.from(map.values());
  }

  function removeFileAt(files, idx) {
    return (files || []).filter((_, i) => i !== idx);
  }

  useEffect(() => {
    try {
      const v = localStorage.getItem("createCvSubmitted");
      if (v === "true") setIsSubmitted(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setIsPrivacyOpen(false);
    }
    if (isPrivacyOpen) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPrivacyOpen]);

  const {
    register,
    control,
    handleSubmit: rhfHandleSubmit,
    setValue,
    setFocus,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      personalInfo: {
        name: initialCv.personalInfo.name,
        lastName: initialCv.personalInfo.lastName,
        gender: initialCv.personalInfo.gender,
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

  function onInvalid(formErrors) {
    const requiredOrder = [
      "personalInfo.name",
      "personalInfo.lastName",
      "personalInfo.gender",
      "personalInfo.birthDate",
      "personalInfo.maritalStatus",
      "personalInfo.phone",
      "personalInfo.email",
      "personalInfo.photo",
      "personalInfo.address",
    ];
    const labelMap = {
      "personalInfo.name": "Vorname",
      "personalInfo.lastName": "Nachname",
      "personalInfo.gender": "Geschlecht",
      "personalInfo.birthDate": "Geburtsdatum",
      "personalInfo.maritalStatus": "Familienstand",
      "personalInfo.phone": "Telefonnummer",
      "personalInfo.email": "E-Mail",
      "personalInfo.photo": "Foto",
      "personalInfo.address": "Adresse",
    };
    const hasErrAt = (path) => {
      const parts = path.split(".");
      let cur = formErrors;
      for (const p of parts) {
        if (!cur || typeof cur !== "object") return false;
        cur = cur[p];
      }
      return Boolean(cur);
    };
    const firstPath = requiredOrder.find((p) => hasErrAt(p));
    if (firstPath) {
      const label = labelMap[firstPath] || firstPath;
      toast.error(`Bitte füllen Sie „${label}“ aus.`);
      try {
        setFocus(firstPath);
      } catch {
        // ignore focus errors
      }
    } else {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus.");
    }
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
    // Start loading immediately to reflect click action without delay
    setIsUploading(true);
    try {
      if (!captchaToken) {
        toast.error("Bitte bestätigen Sie, dass Sie kein Roboter sind.");
        return;
      }

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
          nachname: final.personalInfo.lastName,
          geschlecht: final.personalInfo.gender,
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

      const email = (formData.personalInfo.email || "").trim();
      try {
        const { exists, data } = await checkEmailRemote(email);
        if (exists) {
          setExistingMajor(data?.major || "Unbekannt");
          setEnteredEmail(email);
          setIsEmailModalOpen(true);
          return;
        }
      } catch (error) {
        console.error(error);
        toast.error(
          "Fehler bei der Überprüfung der E-Mail-Adresse. Bitte versuchen Sie es erneut."
        );
        return;
      }

      try {
        // Upload files first and attach URLs (skip if user marked as not available)
        const [diplomaUrls, langUrls] = await Promise.all([
          noDiploma
            ? Promise.resolve([])
            : uploadFilesToConsulting(diplomaFiles),
          noLangCert
            ? Promise.resolve([])
            : uploadFilesToConsulting(langCertFiles),
        ]);

        const payload = {
          ...lebenslauf,
          attachments: {
            diplomas: diplomaUrls || [],
            languageCertificates: langUrls || [],
            noDiploma: Boolean(noDiploma),
            noLanguageCertificate: Boolean(noLangCert),
          },
          createdAt: Date.now(),
        };

        await addDocument(major, payload);
        await registerEmailRemote(email, major);
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
    } finally {
      setIsUploading(false);
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
                  onSubmit={rhfHandleSubmit(onSubmit, onInvalid)}
                  className="space-y-6"
                >
                  <div className="divider mt-0">
                    <span className="mx-auto">Persönliche Daten</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      control={control}
                      name="personalInfo.name"
                      rules={{ required: "Vorname ist erforderlich" }}
                      render={({ field, fieldState }) => (
                        <FormInput
                          label="Vorname"
                          placeholder="Vorname"
                          inputClassName={
                            errors?.personalInfo?.name ? "input-error" : ""
                          }
                          aria-invalid={
                            errors?.personalInfo?.name ? "true" : "false"
                          }
                          {...field}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="personalInfo.lastName"
                      rules={{ required: "Nachname ist erforderlich" }}
                      render={({ field, fieldState }) => (
                        <FormInput
                          label="Nachname"
                          placeholder="Nachname"
                          inputClassName={
                            errors?.personalInfo?.lastName ? "input-error" : ""
                          }
                          aria-invalid={
                            errors?.personalInfo?.lastName ? "true" : "false"
                          }
                          {...field}
                        />
                      )}
                    />
                    <div className="md:col-span-2">
                      <label className="label">
                        <span className="label-text">Geschlecht</span>
                      </label>
                      <div className="flex gap-6">
                        <label className="cursor-pointer flex items-center gap-2">
                          <input
                            type="radio"
                            value="Männlich"
                            className="radio radio-primary"
                            {...register("personalInfo.gender", {
                              required: "Bitte Geschlecht auswählen",
                            })}
                          />
                          <span>Männlich</span>
                        </label>
                        <label className="cursor-pointer flex items-center gap-2">
                          <input
                            type="radio"
                            value="Weiblich"
                            className="radio radio-primary"
                            {...register("personalInfo.gender", {
                              required: "Bitte Geschlecht auswählen",
                            })}
                          />
                          <span>Weiblich</span>
                        </label>
                      </div>
                      {errors?.personalInfo?.gender && (
                        <p className="text-error text-sm mt-1">
                          {errors.personalInfo.gender.message}
                        </p>
                      )}
                    </div>
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
                              className={`input input-bordered w-full ${
                                errors?.personalInfo?.birthDate
                                  ? "input-error"
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
                              className={`select select-bordered w-full ${
                                errors?.personalInfo?.maritalStatus
                                  ? "select-error"
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
                            errors?.personalInfo?.phone ? "input-error" : ""
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
                              errors?.personalInfo?.email ? "input-error" : ""
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
                              className={`textarea textarea-bordered w-full ${
                                errors?.personalInfo?.address
                                  ? "textarea-error"
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

                  <div className="divider">Dokumente</div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="label" htmlFor="doc-diplomas">
                          <span className="label-text">
                            Diplome (mehrere möglich)
                          </span>
                        </label>
                        {Array.isArray(diplomaFiles) &&
                        diplomaFiles.length > 0 ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => setDiplomaFiles([])}
                          >
                            Alle entfernen
                          </button>
                        ) : null}
                      </div>
                      <div className="form-control mb-2">
                        <label className="cursor-pointer flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={noDiploma}
                            onChange={(e) => {
                              const v = e.target.checked;
                              setNoDiploma(v);
                              if (v) setDiplomaFiles([]);
                            }}
                          />
                          <span className="text-sm">Kein Diplom</span>
                        </label>
                      </div>
                      <input
                        id="doc-diplomas"
                        type="file"
                        multiple
                        accept=".pdf,application/pdf"
                        className="file-input file-input-bordered w-full"
                        disabled={noDiploma}
                        onChange={(e) => {
                          const raw = Array.from(e.target.files || []);
                          const pdfs = raw.filter(
                            (f) =>
                              String(f.type).toLowerCase() ===
                                "application/pdf" ||
                              /\.pdf$/i.test(String(f.name || ""))
                          );
                          const invalid = raw.length - pdfs.length;
                          if (invalid > 0) {
                            toast.error("Nur PDF-Dateien sind erlaubt.");
                          }
                          setDiplomaFiles((prev) => mergeFiles(prev, pdfs));
                          // reset value to allow picking the same file again if needed
                          e.target.value = "";
                        }}
                      />
                      {Array.isArray(diplomaFiles) &&
                      diplomaFiles.length > 0 ? (
                        <div className="mt-2">
                          <div className="text-xs opacity-70 mb-1">Nur PDF</div>
                          <ul className="space-y-2">
                            {diplomaFiles.map((f, i) => (
                              <li
                                key={uniqueKey(f)}
                                className="flex items-center justify-between gap-2 rounded-box border border-base-300 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-medium">
                                    {f.name}
                                  </div>
                                  <div className="text-xs opacity-70">
                                    {(f.size / 1024).toFixed(1)} KB
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs"
                                  onClick={() =>
                                    setDiplomaFiles((prev) =>
                                      removeFileAt(prev, i)
                                    )
                                  }
                                  aria-label="Entfernen"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="label" htmlFor="doc-langcerts">
                          <span className="label-text">
                            Sprachzertifikate (mehrere möglich)
                          </span>
                        </label>
                        {Array.isArray(langCertFiles) &&
                        langCertFiles.length > 0 ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => setLangCertFiles([])}
                          >
                            Alle entfernen
                          </button>
                        ) : null}
                      </div>
                      <div className="form-control mb-2">
                        <label className="cursor-pointer flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={noLangCert}
                            onChange={(e) => {
                              const v = e.target.checked;
                              setNoLangCert(v);
                              if (v) setLangCertFiles([]);
                            }}
                          />
                          <span className="text-sm">Kein Sprachzertifikat</span>
                        </label>
                      </div>
                      <input
                        id="doc-langcerts"
                        type="file"
                        multiple
                        accept=".pdf,application/pdf"
                        className="file-input file-input-bordered w-full"
                        disabled={noLangCert}
                        onChange={(e) => {
                          const raw = Array.from(e.target.files || []);
                          const pdfs = raw.filter(
                            (f) =>
                              String(f.type).toLowerCase() ===
                                "application/pdf" ||
                              /\.pdf$/i.test(String(f.name || ""))
                          );
                          const invalid = raw.length - pdfs.length;
                          if (invalid > 0) {
                            toast.error("Nur PDF-Dateien sind erlaubt.");
                          }
                          setLangCertFiles((prev) => mergeFiles(prev, pdfs));
                          e.target.value = "";
                        }}
                      />
                      {Array.isArray(langCertFiles) &&
                      langCertFiles.length > 0 ? (
                        <div className="mt-2">
                          <div className="text-xs opacity-70 mb-1">Nur PDF</div>
                          <ul className="space-y-2">
                            {langCertFiles.map((f, i) => (
                              <li
                                key={uniqueKey(f)}
                                className="flex items-center justify-between gap-2 rounded-box border border-base-300 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-medium">
                                    {f.name}
                                  </div>
                                  <div className="text-xs opacity-70">
                                    {(f.size / 1024).toFixed(1)} KB
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs"
                                  onClick={() =>
                                    setLangCertFiles((prev) =>
                                      removeFileAt(prev, i)
                                    )
                                  }
                                  aria-label="Entfernen"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="divider"></div>
                  <div className="form-control">
                    <div className="rounded-box border border-base-300 bg-base-200/40 p-4 md:p-5">
                      <div className="flex items-start gap-3">
                        <input
                          id="agreePrivacy"
                          type="checkbox"
                          className={`checkbox mt-1 ${
                            errors?.agreePrivacy ? "checkbox-error" : ""
                          }`}
                          aria-invalid={errors?.agreePrivacy ? "true" : "false"}
                          aria-describedby={
                            errors?.agreePrivacy
                              ? "agreePrivacy-error"
                              : undefined
                          }
                          {...register("agreePrivacy", { required: true })}
                        />
                        <div className="min-w-0">
                          <label
                            htmlFor="agreePrivacy"
                            className="font-medium leading-6 cursor-pointer"
                          >
                            Ich habe die Datenschutzerklärung gelesen und stimme
                            zu.
                          </label>
                          <div className="mt-1 text-sm text-base-content/80 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="link link-primary"
                              onClick={() => setIsPrivacyOpen(true)}
                            >
                              Datenschutzrichtlinie
                            </button>
                          </div>
                          {errors?.agreePrivacy ? (
                            <p
                              id="agreePrivacy-error"
                              className="text-error text-sm mt-2"
                            >
                              Bitte stimmen Sie der Datenschutzerklärung zu, um
                              fortzufahren.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="divider"></div>
                  <div className="flex justify-center mb-4">
                    <ReCAPTCHA
                      sitekey={
                        import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
                        "6LdEVycsAAAAAJ11zB8ovl-uNIQPPI06t8Rhwow8"
                      }
                      onChange={setCaptchaToken}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!watch("agreePrivacy") || isUploading}
                    >
                      {isUploading ? "Hochladen..." : "Absenden"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
      {isPrivacyOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
            onClick={() => setIsPrivacyOpen(false)}
          />
          <div
            className="relative w-full max-w-3xl mx-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-title"
          >
            <div className="bg-base-100 text-base-content rounded-box shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
              <div className="sticky top-0 z-10 px-6 py-4 border-b border-base-300 bg-base-100/95 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <h3
                    id="privacy-title"
                    className="text-xl md:text-2xl font-bold truncate"
                  >
                    Datenschutzrichtlinie
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setIsPrivacyOpen(false)}
                      aria-label="Schließen"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 overflow-y-auto">
                <div className="space-y-4 text-sm leading-7">
                  <p>
                    Auf der Plattform <strong>Consultinguz</strong> gelten alle
                    eingegebenen personenbezogenen Daten (Name, Kontaktdaten,
                    Berufserfahrung, Ausbildung, Lebenslauf u. a.) als
                    vertraulich und werden gemäß den geltenden gesetzlichen
                    Bestimmungen sowie unseren internen Sicherheitsrichtlinien
                    geschützt.
                  </p>
                  <p>
                    Wir verwenden die von Nutzerinnen und Nutzern übermittelten
                    Daten ausschließlich zu einem Zweck –{" "}
                    <strong>
                      die Qualifikation und Erfahrung der Kandidatinnen und
                      Kandidaten zu prüfen und sie passenden Arbeitgebern zu
                      empfehlen
                    </strong>
                    .
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Ihre Daten werden{" "}
                      <strong>
                        niemals an Dritte verkauft oder frei weitergegeben
                      </strong>
                      .
                    </li>
                    <li>
                      Informationen über eine Kandidatin oder einen Kandidaten
                      werden{" "}
                      <strong>
                        nur in dem für den Arbeitgeber erforderlichen Umfang
                      </strong>{" "}
                      und <strong>auf Grundlage Ihrer Einwilligung</strong>{" "}
                      bereitgestellt.
                    </li>
                    <li>
                      Alle Daten werden auf sicheren Servern gespeichert und
                      sind vor unbefugtem Zugriff geschützt.
                    </li>
                  </ul>
                  <p>
                    Sie können Ihre Daten jederzeit aktualisieren, löschen oder
                    die Verarbeitung einschränken, indem Sie sich an{" "}
                    <strong>Consultinguz</strong> wenden. Wir schätzen Ihr
                    Vertrauen und verarbeiten Ihre Daten sorgfältig und
                    ausschließlich, um Ihnen bei der Jobsuche zu helfen.
                  </p>
                </div>
              </div>
              <div className="sticky bottom-0 z-10 px-6 py-3 border-t border-base-300 bg-base-100/95 backdrop-blur">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setIsPrivacyOpen(false)}
                  >
                    Schließen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isEmailModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
            onClick={() => setIsEmailModalOpen(false)}
          />
          <div
            className="relative w-full max-w-sm mx-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-base-100 text-base-content rounded-box shadow-xl p-6 text-center">
              <h3 className="text-xl font-bold text-error mb-4">Achtung!</h3>
              <p className="mb-6">
                Sie haben sich mit der E-Mail-Adresse{" "}
                <strong>{enteredEmail}</strong> bereits für den Bereich{" "}
                <strong>„{existingMajor}“</strong> beworben.
              </p>
              <button
                className="btn btn-primary w-full"
                onClick={() => setIsEmailModalOpen(false)}
              >
                Verstanden
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Create;
