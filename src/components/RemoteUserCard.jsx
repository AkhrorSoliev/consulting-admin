import PropTypes from "prop-types";
import { FiBriefcase, FiHash, FiMail } from "react-icons/fi";
import CandidateCard from "./CandidateCard";

export default function RemoteUserCard({
  name,
  photo,
  email,
  major,
  firebaseId,
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

  return (
    <CandidateCard
      tone={tone}
      onClick={onClick}
      topRight={topRight}
      footer={footer}
      name={name}
      photo={photo}
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
  tone: PropTypes.oneOf(["success", "warning", "primary", "info", "error"]),
  onClick: PropTypes.func,
  topRight: PropTypes.node,
  footer: PropTypes.node,
};


