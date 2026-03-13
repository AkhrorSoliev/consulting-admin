import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function CreateUserForm({
  email,
  setEmail,
  password,
  setPassword,
  showCreatePassword,
  setShowCreatePassword,
  loading,
  handleCreateUser,
}) {
  return (
    <form
      className="grid gap-3 md:grid-cols-3"
      onSubmit={handleCreateUser}
      autoComplete="off"
    >
      <input
        className="input input-bordered w-full md:col-span-1"
        type="email"
        placeholder="user@email.com"
        name="new-user-email"
        autoComplete="off"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />
      <div className="relative md:col-span-1">
        <input
          className="input input-bordered w-full pr-10"
          type={showCreatePassword ? "text" : "password"}
          placeholder="Passwort (min 6)"
          name="new-user-password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/70 hover:text-base-content z-10 focus:outline-none focus-visible:outline-none"
          onClick={() => setShowCreatePassword((prev) => !prev)}
          disabled={loading}
          aria-label={
            showCreatePassword ? "Passwort verbergen" : "Passwort anzeigen"
          }
        >
          {showCreatePassword ? (
            <FaEyeSlash size={18} />
          ) : (
            <FaEye size={18} />
          )}
        </button>
      </div>
      <button
        type="submit"
        className="btn btn-primary md:col-span-1"
        disabled={loading}
      >
        {loading ? "Erstellen..." : "Benutzer erstellen"}
      </button>
    </form>
  );
}
