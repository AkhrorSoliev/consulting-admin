export default function EmailMetaInfo({ emailMeta, emailMetaAvatarFromUsers }) {
  if (!emailMeta.lastSentAt) return null;

  return (
    <div className="mb-4 flex items-center gap-3 p-3 bg-base-200 rounded-lg border border-base-300">
      <div className="avatar">
        <div className="w-10 h-10 rounded-full">
          {emailMeta.lastSentByPhoto || emailMetaAvatarFromUsers ? (
            <img
              src={emailMeta.lastSentByPhoto || emailMetaAvatarFromUsers}
              alt={emailMeta.lastSentByName || "User"}
            />
          ) : (
            <div className="w-full h-full bg-primary text-primary-content flex items-center justify-center font-semibold">
              {(emailMeta.lastSentByName || "U").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">
          {emailMeta.lastSentByName || "Unbekannter Benutzer"}
        </div>
        <div className="text-xs text-base-content/60">
          Letzte E-Mail gesendet:{" "}
          {new Date(emailMeta.lastSentAt).toLocaleString("de-DE")}
          {emailMeta.count > 0 && ` \u2022 ${emailMeta.count} E-Mails gesamt`}
        </div>
      </div>
    </div>
  );
}
