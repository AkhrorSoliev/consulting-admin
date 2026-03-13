export default function AddChannelForm({
  newChannelForm,
  setNewChannelForm,
  handleAddChannel,
}) {
  return (
    <form
      onSubmit={handleAddChannel}
      className="flex flex-col sm:flex-row gap-2 p-3 bg-base-200 rounded-lg"
    >
      <input
        type="text"
        className="input input-sm input-bordered flex-1"
        placeholder="Kanal nomi"
        value={newChannelForm.name}
        onChange={(e) =>
          setNewChannelForm((f) => ({ ...f, name: e.target.value }))
        }
      />
      <input
        type="text"
        className="input input-sm input-bordered flex-1"
        placeholder="Chat ID (masalan: -1001234567890)"
        value={newChannelForm.chat_id}
        onChange={(e) =>
          setNewChannelForm((f) => ({ ...f, chat_id: e.target.value }))
        }
        required
      />
      <button type="submit" className="btn btn-sm btn-success">
        Qo'shish
      </button>
    </form>
  );
}
