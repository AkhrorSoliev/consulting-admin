import useTelegramChannels from "./telegramChannels/hooks/useTelegramChannels";
import AddChannelForm from "./telegramChannels/components/AddChannelForm";
import ChannelRow from "./telegramChannels/components/ChannelRow";
import ChannelStats from "./telegramChannels/components/ChannelStats";

export default function TelegramChannelsSettings() {
  const {
    loadingRole,
    canAccess,
    loading,
    stats,
    mergedRows,
    generatingLink,
    addingChannel,
    setAddingChannel,
    newChannelForm,
    setNewChannelForm,
    toggleActive,
    handleGenerateLink,
    handleAddChannel,
    upsertByChatId,
  } = useTelegramChannels();

  if (loadingRole) {
    return <div className="text-sm text-base-content/60">Yuklanmoqda...</div>;
  }

  if (!canAccess) {
    return (
      <div className="rounded-lg border border-base-300 bg-base-100 p-4">
        <h2 className="text-lg font-semibold">Ruxsat yo'q</h2>
        <p className="text-sm text-error">
          Bu bo'lim uchun <span className="font-mono">role=admin</span> yoki{" "}
          <span className="font-mono">role=super_admin</span> kerak.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Telegram Channels</h2>
        <p className="text-sm text-base-content/70">
          Yangiliklar kanallari ro'yxati. Bir martalik taklif linki yaratib, 1-bosqichda qabul qilingan nomzodlarga avtomatik yuboriladi.
        </p>
      </div>

      <div className="rounded-lg border border-base-300 bg-base-100 p-4 space-y-3">
        <div className="text-sm opacity-70">
          <strong>💡 Qanday ishlaydi:</strong> Botni kanalga admin sifatida qo'shing.
          Keyin kanal chat_id sini qo'lda qo'shing (kanallar avtomatik aniqlanmaydi).
          1-bosqichda qabul qilingan nomzodlarga yangiliklar kanaliga a'zo bo'lish uchun bir martalik link yuboriladi.
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setAddingChannel(!addingChannel)}
          >
            {addingChannel ? "Bekor qilish" : "+ Kanal qo'shish"}
          </button>
        </div>

        {addingChannel && (
          <AddChannelForm
            newChannelForm={newChannelForm}
            setNewChannelForm={setNewChannelForm}
            handleAddChannel={handleAddChannel}
          />
        )}

        {mergedRows.length === 0 ? (
          <div className="text-sm opacity-70">
            {loading
              ? "Yuklanmoqda..."
              : "Hali kanallar yo'q. Yuqoridagi tugma orqali kanal qo'shing."}
          </div>
        ) : (
          <div className="divide-y divide-base-200 rounded-lg border border-base-200">
            {mergedRows.map((row) => (
              <ChannelRow
                key={row.key}
                row={row}
                generatingLink={generatingLink}
                handleGenerateLink={handleGenerateLink}
                toggleActive={toggleActive}
                upsertByChatId={upsertByChatId}
              />
            ))}
          </div>
        )}
      </div>

      <ChannelStats stats={stats} />
    </div>
  );
}
