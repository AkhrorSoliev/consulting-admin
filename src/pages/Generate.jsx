import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import toast from "react-hot-toast";

import { updateDocument } from "../utils";
import { Button } from "../components/ui/button";
import {
  ArrowLeftIcon,
  BookmarkFilledIcon,
  DownloadIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import Content from "../components/Content";
import {
  NativeSelect,
  NativeSelectOption,
} from "../components/ui/native-select";

const pdfSafeFonts = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Tahoma",
];

function Generate() {
  const { major, id } = useParams();

  // JSON.parse(localStorage.getItem("content")) ||

  const contentRef = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [generatedSettings, setGeneratedSettings] = useState({
    fontFamily: "Georgia",
    theme: {
      title: "Light",
      value: {
        backgroundColor: "white",
        color: "black",
      },
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Local editable state (Create.jsx like)

  const [cv, setCv] = useState(null);
  const [isGeneratingSoft, setIsGeneratingSoft] = useState(false);
  const [isGeneratingPc, setIsGeneratingPc] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState({ soft: [], pc: [] });
  const [formInitialized, setFormInitialized] = useState(false);

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

  function download(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  function generate() {
    if (editMode) return false;

    const name = prompt("Dateiname eingeben (ohne .pdf):", "Lebenslauf");

    // https://masako-numerous-loretta.ngrok-free.dev
    // http://localhost:3000

    setIsDownloading(true);
    fetch("http://localhost:3030/save-as-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html: contentRef?.current.outerHTML,
      }),
    })
      .then((res) => {
        return res.blob();
      })
      .then((res) => {
        download(res, (name.trim() || "Lebenslauf") + ".pdf");
      })
      .catch(() => {
        setError("Etwas ist schiefgelaufen (");
      })
      .finally(() => {
        setIsDownloading(false);
      });
  }

  console.log(cv);

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

  return (
    <section className="p-2 w-full h-full bg-base-200">
      <div className="flex items-center justify-between p-3 border rounded-sm fixed  z-50 left-2 right-2 top-2 bg-white shadow-sm">
        <Button variant={"ghost"} asChild>
          <NavLink to={`/collectionCV/${major}`}>
            <ArrowLeftIcon />
            Zurück
          </NavLink>
        </Button>

        <div className="flex items-center gap-3">
          <Button disabled={isSaving}>
            {isSaving ? (
              <>
                <UpdateIcon className="animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              <>
                <BookmarkFilledIcon />
                Speichern
              </>
            )}
          </Button>
          <Button
            onClick={generate}
            variant={"outline"}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <UpdateIcon className="animate-spin" />
                Wird heruntergeladen...
              </>
            ) : (
              <>
                <DownloadIcon />
                Herunterladen
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <section className="grid grid-cols-[1fr_794px] gap-2 w-full pt-20">
        <div className="border w-full p-[25px] bg-white">
          <NativeSelect
            onChange={(evt) => {
              const fontFamily = evt.target.value;
              setGeneratedSettings((prev) => {
                return { ...prev, fontFamily };
              });
            }}
            defaultValue="Georgia"
          >
            {pdfSafeFonts.map((font) => {
              return (
                <NativeSelectOption value={font} key={font}>
                  {font}
                </NativeSelectOption>
              );
            })}
          </NativeSelect>
        </div>

        {/* PDF */}
        <div className="bg-white">
          {cv && (
            <Content
              cv={cv}
              generatedSettings={generatedSettings}
              editMode={editMode}
              contentRef={contentRef}
            />
          )}
        </div>
      </section>
    </section>
  );
}

export default Generate;
