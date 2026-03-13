import toast from "react-hot-toast";
import useUserRole from "../../hooks/useUserRole";
import { generateTelegramInviteLink } from "../../utils/telegramInvites";
import useTelegramGroups from "./telegramGroups/hooks/useTelegramGroups";
import GroupRow from "./telegramGroups/components/GroupRow";
import StatsBar from "./telegramGroups/components/StatsBar";

export default function TelegramGroupsSettings() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });
  const isSuperAdmin = !loadingRole && role === "super_admin";
  const isAdmin = !loadingRole && role === "admin";
  const canAccess = isSuperAdmin || isAdmin;
  const canEdit = canAccess;

  const {
    loading,
    generatingLink,
    setGeneratingLink,
    stats,
    mergedRows,
    toggleActive,
    upsertByChatId,
  } = useTelegramGroups({ canEdit });

  const handleGenerateLink = async (groupId) => {
    if (!canEdit) {
      toast.error("Keine Berechtigung.");
      return;
    }
    setGeneratingLink((prev) => ({ ...prev, [groupId]: true }));
    try {
      const result = await generateTelegramInviteLink({ groupId });
      if (result?.invite_link) {
        await navigator.clipboard.writeText(result.invite_link);
        toast.success("Link erstellt und in die Zwischenablage kopiert!");
      } else {
        toast.error("Link konnte nicht erstellt werden.");
      }
    } catch (e) {
      toast.error(
        "Fehler beim Erstellen des Links: " +
          (e?.message || "Unbekannter Fehler")
      );
    } finally {
      setGeneratingLink((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  if (loadingRole) {
    return <div className="text-sm text-base-content/60">Wird geladen...</div>;
  }

  if (!canAccess) {
    return (
      <div className="rounded-lg border border-base-300 bg-base-100 p-4">
        <h2 className="text-lg font-semibold">Kein Zugriff</h2>
        <p className="text-sm text-error">
          Für diesen Bereich ist <span className="font-mono">role=admin</span>{" "}
          oder <span className="font-mono">role=super_admin</span> erforderlich.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Telegram Groups</h2>
        <p className="text-sm text-base-content/70">
          Active = ON bedeutet sichtbar im System, OFF bedeutet nicht sichtbar.
          Refresh aktualisiert die Liste vom Bot und prüft auf neue Gruppen
        </p>
      </div>

      <div className="rounded-lg border border-base-300 bg-base-100 p-4 space-y-3">
        <div className="text-sm opacity-70">
          <strong>💡 So funktioniert es:</strong> Fügen Sie den Bot als Admin
          zur Gruppe hinzu und schreiben Sie eine Nachricht in die Gruppe. Die
          Gruppe erscheint automatisch hier.
        </div>

        {mergedRows.length === 0 ? (
          <div className="text-sm opacity-70">
            {loading
              ? "Wird geladen..."
              : "Noch keine Gruppen. Fügen Sie den Bot zur Gruppe hinzu und schreiben Sie eine Nachricht."}
          </div>
        ) : (
          <div className="divide-y divide-base-200 rounded-lg border border-base-200">
            {mergedRows.map((row) => (
              <GroupRow
                key={row.key}
                row={row}
                generatingLink={generatingLink}
                onGenerateLink={handleGenerateLink}
                onToggleActive={toggleActive}
                onUpsertByChatId={upsertByChatId}
              />
            ))}
          </div>
        )}
      </div>

      <StatsBar stats={stats} />
    </div>
  );
}
