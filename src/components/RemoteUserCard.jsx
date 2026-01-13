import PropTypes from "prop-types";
import { FiBriefcase, FiHash, FiMail } from "react-icons/fi";
import { FaTelegram } from "react-icons/fa";
import CandidateCard from "./CandidateCard";

export default function RemoteUserCard({
  name,
  photo,
  email,
  major,
  firebaseId,
  telegramId,
  lead,
  tone = "info",
  onClick,
  topRight,
  footer,
}) {
  const lines = [
    email
      ? { icon: <FiMail className="w-4 h-4" />, text: email, title: email }
      : null,
    major
      ? {
          icon: <FiBriefcase className="w-4 h-4" />,
          text: major,
          title: major,
        }
      : null,
    firebaseId
      ? {
          icon: <FiHash className="w-4 h-4" />,
          text: firebaseId,
          title: firebaseId,
          mono: true,
        }
      : null,
  ].filter(Boolean);

  const meta = (
    <>
      {telegramId ? (
        <span
          className="inline-flex items-center gap-1 text-[#0088cc]"
          title="Über Telegram registriert"
        >
          <FaTelegram className="w-3 h-3" />
        </span>
      ) : null}
      {lead ? (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium"
          title={`Lead: ${lead}`}
        >
          {lead}
        </span>
      ) : null}
    </>
  );

  return (
    <CandidateCard
      tone={tone}
      onClick={onClick}
      topRight={topRight}
      footer={footer}
      name={name}
      photo={photo}
      meta={telegramId || lead ? meta : null}
      lines={lines}
      emptyLabel="Keine Daten"
    />
  );
}

RemoteUserCard.propTypes = {
  name: PropTypes.string,
  photo: PropTypes.string,
  email: PropTypes.string,
  major: PropTypes.string,
  firebaseId: PropTypes.string,
  telegramId: PropTypes.string,
  lead: PropTypes.string,
  tone: PropTypes.oneOf(["success", "warning", "primary", "info", "error"]),
  onClick: PropTypes.func,
  topRight: PropTypes.node,
  footer: PropTypes.node,
};


