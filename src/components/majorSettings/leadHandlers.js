import { updateMetaByName } from "../../utils";
import toast from "react-hot-toast";
import { generateLocalId } from "../majorsHelpers";

async function persistLeadSettings(
  majorKey,
  nextLeadLinks,
  nextLeadLinksActive,
  setIsSavingLeads,
) {
  if (!majorKey) return;
  setIsSavingLeads(true);
  try {
    const now = Date.now();
    await updateMetaByName(majorKey, {
      leadLinks: Array.isArray(nextLeadLinks) ? nextLeadLinks : [],
      leadLinksActive: nextLeadLinksActive !== false,
      updatedAt: now,
    });
    toast.success("Lead-Links wurden gespeichert.");
  } catch (e) {
    toast.error("Fehler beim Speichern der Lead-Links.");
  } finally {
    setIsSavingLeads(false);
  }
}

export async function handleAddLead({
  newLeadName,
  maxLeadNameLength,
  leadLinks,
  leadLinksActive,
  majorKey,
  setLeadLinks,
  setNewLeadName,
  setIsSavingLeads,
}) {
  const name = String(newLeadName || "").trim();
  if (!name) {
    toast.error("Bitte geben Sie den Lead-Namen ein.");
    return;
  }
  if (name.length > maxLeadNameLength) {
    toast.error(
      `Lead nomi ${maxLeadNameLength} belgidan oshmasligi kerak (Telegram limiti).`,
    );
    return;
  }
  const exists = (leadLinks || []).some(
    (l) =>
      String(l?.name || "")
        .trim()
        .toLowerCase() === name.toLowerCase(),
  );
  if (exists) {
    toast.error("Ein solcher Lead existiert bereits.");
    return;
  }
  const newLead = { id: generateLocalId(), name, active: true };
  const next = [...(Array.isArray(leadLinks) ? leadLinks : []), newLead];
  setLeadLinks(next);
  setNewLeadName("");
  await persistLeadSettings(majorKey, next, leadLinksActive, setIsSavingLeads);
  toast.success("Lead qo'shildi!");
}

export async function handleToggleLeadActive({
  id,
  checked,
  leadLinks,
  leadLinksActive,
  majorKey,
  setLeadLinks,
  setIsSavingLeads,
}) {
  const next = (Array.isArray(leadLinks) ? leadLinks : []).map((l) =>
    l?.id === id ? { ...(l || {}), active: Boolean(checked) } : l,
  );
  setLeadLinks(next);
  await persistLeadSettings(majorKey, next, leadLinksActive, setIsSavingLeads);
}

export async function handleRemoveLead({
  id,
  leadLinks,
  leadLinksActive,
  majorKey,
  setLeadLinks,
  setIsSavingLeads,
}) {
  const next = (Array.isArray(leadLinks) ? leadLinks : []).filter(
    (l) => l?.id !== id,
  );
  setLeadLinks(next);
  await persistLeadSettings(majorKey, next, leadLinksActive, setIsSavingLeads);
}
