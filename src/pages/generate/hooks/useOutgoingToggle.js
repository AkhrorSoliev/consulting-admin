import { useCallback } from "react";
import toast from "react-hot-toast";

export function useOutgoingToggle({
  remoteMode,
  formCv,
  askContinueWithoutPassport,
  outgoingBusyById,
  setOutgoingBusyById,
  getOutgoingDocState,
  persistOutgoingDocs,
  deleteOutgoingDocRemoteFirst,
  generators,
}) {
  const handleToggleOutgoingDoc = useCallback(
    async (template, nextEnabled, options = {}) => {
      const tpl = template || {};
      const templateId = String(tpl.id || "").trim();
      if (!templateId) return;
      if (remoteMode) return;
      if (outgoingBusyById?.[templateId]) return;

      const forceRegenerate = Boolean(options?.forceRegenerate);
      const prev = getOutgoingDocState(templateId);

      if (!nextEnabled) {
        try {
          setOutgoingBusyById((p) => ({ ...(p || {}), [templateId]: true }));
          const { ok } = await deleteOutgoingDocRemoteFirst(templateId, {
            current: prev,
          });
          if (!ok) toast.error("Hujjatni o'chirishda xatolik.");
        } catch (e) {
          toast.error("Hujjatni o'chirishda xatolik.");
        } finally {
          setOutgoingBusyById((p) => ({ ...(p || {}), [templateId]: false }));
        }
        return;
      }

      const existingUrl = String(prev?.url || "").trim();
      if (existingUrl && !forceRegenerate) {
        await persistOutgoingDocs((current) => {
          const next = { ...current };
          next[templateId] = {
            ...(current?.[templateId] || {}),
            enabled: true,
            updatedAt: Date.now(),
            ...(templateId === "motivation_letter"
              ? { title: "Motivationsschreiben (Deutsch)", acceptUpload: false }
              : {}),
          };
          return next;
        });
        return;
      }

      try {
        setOutgoingBusyById((p) => ({ ...(p || {}), [templateId]: true }));
        let generated = null;
        let omitPassportPage = false;

        if (templateId === "beratungsvertrag") {
          const hasPassportAttachment = Array.isArray(
            formCv?.documents?.passport,
          )
            ? formCv.documents.passport.some((u) =>
                String(u || "").trim(),
              )
            : false;
          if (!hasPassportAttachment) {
            const confirmed = await askContinueWithoutPassport();
            if (!confirmed) return;
            omitPassportPage = true;
          }
        }

        generated = await dispatchGenerator(
          templateId,
          generators,
          omitPassportPage,
        );

        await persistOutgoingDocs((current) => ({
          ...current,
          [templateId]: {
            ...(current?.[templateId] || {}),
            enabled: true,
            url: String(generated?.url || "").trim(),
            fileName:
              String(generated?.fileName || "").trim() || null,
            uploadedAt: Date.now(),
            updatedAt: Date.now(),
            ...(templateId === "motivation_letter"
              ? {
                  title: "Motivationsschreiben (Deutsch)",
                  acceptUpload: false,
                }
              : {}),
          },
        }));
        toast.success("PDF tayyor bo'ldi va upload qilindi.");
      } catch (e) {
        toast.error("Fehler beim Erstellen oder Hochladen der PDF.");
      } finally {
        setOutgoingBusyById((p) => ({ ...(p || {}), [templateId]: false }));
      }
    },
    [
      remoteMode,
      formCv,
      outgoingBusyById,
      setOutgoingBusyById,
      getOutgoingDocState,
      persistOutgoingDocs,
      deleteOutgoingDocRemoteFirst,
      askContinueWithoutPassport,
      generators,
    ],
  );

  return handleToggleOutgoingDoc;
}

async function dispatchGenerator(templateId, g, omitPassportPage) {
  const map = {
    beratungsvertrag: () => g.generateAndUploadBeratungsvertrag({ omitPassportPage }),
    vermittlungsvertrag: () => g.generateAndUploadVermittlungsvertrag(),
    vollmacht: () => g.generateAndUploadVollmacht(),
    vollmacht_arbeitgeber: () => g.generateAndUploadVollmachtArbeitgeber(),
    rozilik_xati: () => g.generateAndUploadRozilikXati(),
    nomzod_rozilik_xati: () => g.generateAndUploadNomzodRozilikXati(),
    mitarbeiterwohnung: () => g.generateAndUploadMitarbeiterwohnung(),
    sprachsbestaetigung: () => g.generateAndUploadSprachsbestaetigung(),
    einwilligungserklaerung: () => g.generateAndUploadEinwilligungserklaerung(),
    foto_video_rozilik: () => g.generateAndUploadFotoVideoRozilik(),
    personalfragebogen: () => g.generateAndUploadPersonalfragebogen(),
    motivation_letter: () => g.generateAndUploadMotivationLetter(),
  };
  const fn = map[templateId];
  if (!fn) throw new Error(`Unknown document template: ${templateId}`);
  return fn();
}
