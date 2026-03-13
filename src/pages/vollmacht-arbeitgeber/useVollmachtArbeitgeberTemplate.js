import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { db } from "../../firebase/config";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  createInitialFormState,
  migrateLegacyCandidateFields,
} from "./vollmachtArbeitgeberUtils";

const TEMPLATE_COLLECTION = "template_documents";
const TEMPLATE_ID = "vollmacht_arbeitgeber";

export default function useVollmachtArbeitgeberTemplate({
  canWriteTemplate,
  user,
}) {
  const [form, setForm] = useState(() => createInitialFormState());
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [hasUnsavedTemplate, setHasUnsavedTemplate] = useState(false);
  const lastSavedJsonRef = useRef("");
  const didHydrateRef = useRef(false);
  const saveInFlightRef = useRef(false);

  async function loadTemplate() {
    try {
      setIsLoadingTemplate(true);
      const ref = doc(db, TEMPLATE_COLLECTION, TEMPLATE_ID);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        const json = JSON.stringify(form);
        lastSavedJsonRef.current = json;
        setHasUnsavedTemplate(false);
        didHydrateRef.current = true;
        return;
      }

      const data = snap.data() || {};
      const savedForm =
        data &&
        typeof data === "object" &&
        data.form &&
        typeof data.form === "object"
          ? data.form
          : null;

      if (savedForm) {
        const normalizedSaved = {
          ...createInitialFormState(),
          ...savedForm,
        };
        const migrated = migrateLegacyCandidateFields(normalizedSaved);
        setForm((prev) => {
          const merged = { ...prev, ...migrated };
          const json = JSON.stringify(merged);
          lastSavedJsonRef.current = json;
          setHasUnsavedTemplate(false);
          didHydrateRef.current = true;
          return merged;
        });
      } else {
        const json = JSON.stringify(form);
        lastSavedJsonRef.current = json;
        setHasUnsavedTemplate(false);
        didHydrateRef.current = true;
      }
    } catch (e) {
      toast.error("Fehler beim Laden der Vorlage.");
      didHydrateRef.current = true;
    } finally {
      setIsLoadingTemplate(false);
    }
  }

  async function saveTemplate({ silent = false } = {}) {
    if (!canWriteTemplate) {
      if (!silent) toast.error("Saqlash uchun admin huquqi kerak.");
      return false;
    }
    if (saveInFlightRef.current) return false;
    try {
      saveInFlightRef.current = true;
      setIsSavingTemplate(true);

      const payload = {
        templateId: TEMPLATE_ID,
        collection: TEMPLATE_COLLECTION,
        form: form,
        updatedAt: serverTimestamp(),
        updatedByUid: user?.uid || null,
        updatedByEmail: user?.email || null,
      };

      await setDoc(doc(db, TEMPLATE_COLLECTION, TEMPLATE_ID), payload, {
        merge: true,
      });

      lastSavedJsonRef.current = JSON.stringify(form);
      setHasUnsavedTemplate(false);
      if (!silent) toast.success("Template saqlandi.");
      return true;
    } catch (e) {
      if (!silent) toast.error("Fehler beim Speichern der Vorlage.");
      return false;
    } finally {
      saveInFlightRef.current = false;
      setIsSavingTemplate(false);
    }
  }

  useEffect(() => {
    loadTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!didHydrateRef.current) return;
    const json = JSON.stringify(form);
    const isDirty = json !== lastSavedJsonRef.current;
    setHasUnsavedTemplate(isDirty);
  }, [form, canWriteTemplate]);

  return {
    form,
    setForm,
    isLoadingTemplate,
    isSavingTemplate,
    hasUnsavedTemplate,
    saveTemplate,
  };
}
