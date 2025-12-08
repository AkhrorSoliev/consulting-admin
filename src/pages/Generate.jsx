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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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
      attachments: { diplomas: [], languageCertificates: [] },
    }),
    []
  );
  const [cv, setCv] = useState(initialForm);
  const [isGeneratingSoft, setIsGeneratingSoft] = useState(false);
  const [isGeneratingPc, setIsGeneratingPc] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState({ soft: [], pc: [] });
  const [formInitialized, setFormInitialized] = useState(false);

  useEffect(() => {
    const col = String(major || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) {
      setError(true);
      setLoading(false);
      return;
    }
    const ref = doc(db, col, docId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setError(true);
        } else {
          const data = snap.data() || null;

          setError(false);
          if (!formInitialized) {
            setCv(data);
            setFormInitialized(true);
          }
        }
        setLoading(false);
      },
      () => {
        setError(true);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [major, id, formInitialized]);

  async function handleSave() {
    const col = String(major || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;
    try {
      setIsSaving(true);
      const payload = mapFormToDoc(cv);
      await updateDocument(col, docId, payload);
      toast.success("Änderungen wurden gespeichert.");
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Speichern.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-5 w-full">
      <div className="w-full">
        {/* Controls (hidden on print) */}

        <h2>{id}</h2>
      </div>
    </div>
  );
}

export default Generate;
