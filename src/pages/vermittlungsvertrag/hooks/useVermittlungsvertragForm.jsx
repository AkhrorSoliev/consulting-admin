import { useEffect, useMemo, useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import { db } from "../../../firebase/config";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import useUserRole from "../../../hooks/useUserRole";
import { useSelector } from "react-redux";
import VermittlungsvertragPdfDocument from "../../contract/pdf/VermittlungsvertragPdfDocument";
import {
  TEMPLATE_COLLECTION,
  TEMPLATE_ID,
  getInitialFormState,
} from "../utils/constants";

export default function useVermittlungsvertragForm() {
  const { role, loadingRole } = useUserRole();
  const canWriteTemplate =
    !loadingRole && (role === "super_admin" || role === "admin");
  const { user } = useSelector((state) => state.auth);

  const [form, setForm] = useState(getInitialFormState);
  const [isDownloading, setIsDownloading] = useState(false);
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
        setForm((prev) => {
          const merged = { ...prev, ...savedForm };
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

  const candidateFullName = useMemo(() => {
    return [form.candidateFirstName, form.candidateLastName]
      .map((v) => String(v || "").trim())
      .filter(Boolean)
      .join(" ");
  }, [form.candidateFirstName, form.candidateLastName]);

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const fileBase = candidateFullName
        ? `Vermittlungsvertrag ${candidateFullName}`
        : "Vermittlungsvertrag";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Vermittlungsvertrag";
      const blob = await pdf(
        <VermittlungsvertragPdfDocument form={form} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ConsultingUz ${safeFileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF wurde erstellt.");
    } catch (e) {
      toast.error("Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  return {
    form,
    setForm,
    isDownloading,
    isLoadingTemplate,
    isSavingTemplate,
    hasUnsavedTemplate,
    canWriteTemplate,
    saveTemplate,
    handleDownloadPdf,
  };
}
