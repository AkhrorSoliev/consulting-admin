import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  getFillablePdfDefaults,
  saveFillablePdfDefaults,
  clearFillablePdfDefaults,
} from "../../../utils/fillablePdfDefaults";
import { todayDdMmYyyy, PDF_BACKEND_URL } from "../utils/dateHelpers";

const TEMPLATE_KEY = "zusatzblatt_d";

function createInitialForm() {
  return {
    // Section A - Angaben zur Person
    txtf_1_Vorname: "",
    txtf_2_Nachname: "",
    txtf_3_Wohnsitz: "",

    // Section B - Kurzfristige Beschaeftigung
    rbtn_4_Arbeit_90_Tage: "",
    rbtn_5_Arbeit_8_Monate: "",
    rbtn_6_Erntehelfer: "",
    rbtn_7_Arbeit_visumfrei: "",
    rbtn_8_Unternehmen_beschaeftigt: "",
    rbtn_9_Reisekosten: "",

    // Section C - Unterschrift
    txtf_10_Ort: "",
    txtf_11_Datum: todayDdMmYyyy(),
  };
}

export default function useZusatzblattDForm() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [isClearingDefaults, setIsClearingDefaults] = useState(false);
  const [hasDefaults, setHasDefaults] = useState(false);
  const [form, setForm] = useState(createInitialForm);

  useEffect(() => {
    getFillablePdfDefaults(TEMPLATE_KEY)
      .then((defaults) => {
        if (defaults && typeof defaults === "object") {
          setHasDefaults(Object.keys(defaults).some((k) => k !== "updatedAt" && defaults[k]));
          setForm((prev) => {
            const merged = { ...prev };
            Object.keys(defaults).forEach((key) => {
              if (key in merged && key !== "updatedAt") {
                merged[key] = defaults[key];
              }
            });
            return merged;
          });
        }
      })
      .catch((err) => console.error("Failed to load defaults:", err));
  }, []);

  async function handleSaveAsDefaults() {
    setIsSavingDefaults(true);
    try {
      await saveFillablePdfDefaults(TEMPLATE_KEY, form);
      setHasDefaults(true);
      toast.success("Standardwerte gespeichert");
    } catch (err) {
      toast.error(err.message || "Fehler beim Speichern");
    } finally {
      setIsSavingDefaults(false);
    }
  }

  async function handleClearDefaults() {
    if (!window.confirm("Möchten Sie alle Standardwerte für dieses Template löschen?")) return;
    setIsClearingDefaults(true);
    try {
      await clearFillablePdfDefaults(TEMPLATE_KEY);
      setHasDefaults(false);
      setForm((prev) => {
        const reset = {};
        Object.keys(prev).forEach((key) => {
          if (key.startsWith("chbx_")) {
            reset[key] = false;
          } else if (key === "txtf_11_Datum") {
            reset[key] = todayDdMmYyyy();
          } else {
            reset[key] = "";
          }
        });
        return reset;
      });
      toast.success("Standardwerte gelöscht");
    } catch (err) {
      toast.error(err.message || "Fehler beim Löschen");
    } finally {
      setIsClearingDefaults(false);
    }
  }

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);

      const payload = {
        template: "zusatzblatt_d_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf",
        data: {
          textFields: {},
          radioGroups: {},
          checkboxes: {},
        },
      };

      Object.entries(form).forEach(([key, value]) => {
        if (key.startsWith("txtf_")) {
          payload.data.textFields[key] = value;
        } else if (key.startsWith("rbtn_") && value) {
          payload.data.radioGroups[key] = value;
        } else if (key.startsWith("chbx_")) {
          payload.data.checkboxes[key] = value;
        }
      });

      const response = await fetch(`${PDF_BACKEND_URL}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "PDF generation failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Zusatzblatt_D_${form.txtf_2_Nachname || "Dokument"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF wurde erstellt.");
    } catch (e) {
      console.error("PDF error:", e);
      toast.error(e.message || "Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  return {
    form,
    setForm,
    isDownloading,
    isSavingDefaults,
    isClearingDefaults,
    hasDefaults,
    handleSaveAsDefaults,
    handleClearDefaults,
    handleDownloadPdf,
  };
}
