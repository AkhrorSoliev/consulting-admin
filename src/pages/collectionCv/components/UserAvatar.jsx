/**
 * Renders a user avatar (photo or initial placeholder).
 * Returns null if there is no photo and no name.
 */
export default function UserAvatar({ photoUrl, name, colorClass = "bg-primary text-primary-content" }) {
  if (photoUrl) {
    return (
      <div className="avatar">
        <div className="w-6 h-6 rounded-full">
          <img src={photoUrl} alt={name || "User"} className="object-cover" />
        </div>
      </div>
    );
  }

  if (name) {
    return (
      <div className="avatar placeholder">
        <div className={`w-6 h-6 rounded-full ${colorClass} text-xs`}>
          <span>{name.charAt(0).toUpperCase()}</span>
        </div>
      </div>
    );
  }

  return null;
}
