import PropTypes from "prop-types";
import { useRef, memo } from "react";
import { getAccentClass, shouldIgnoreCardClick } from "./candidateCard/cardUtils";
import CardBody from "./candidateCard/CardBody";

const CandidateCard = memo(function CandidateCard({
  tone = "info",
  onClick,
  topRight,
  footer,
  busy,
  name,
  photo,
  meta,
  lines,
  emptyLabel = "Keine Daten",
}) {
  const clickable = typeof onClick === "function";
  const cardRef = useRef(null);
  const accentClass = getAccentClass(tone);

  return (
    <div
      ref={cardRef}
      className={[
        "card bg-base-100 border border-base-300/60 border-l-4",
        accentClass,
        "shadow-sm hover:shadow-md transition-all duration-150",
        clickable ? "cursor-pointer" : "",
        "h-full flex flex-col relative overflow-hidden",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={
        clickable
          ? (e) => {
              if (busy) return;
              if (shouldIgnoreCardClick(e, cardRef)) return;
              onClick(e);
            }
          : undefined
      }
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (busy) return;
              if (e.key === "Enter" || e.key === " ") onClick(e);
            }
          : undefined
      }
    >
      {topRight ? (
        <div className="absolute top-2 right-2">{topRight}</div>
      ) : null}

      <CardBody
        name={name}
        photo={photo}
        meta={meta}
        lines={lines}
        emptyLabel={emptyLabel}
        footer={footer}
      />

      {busy ? (
        <div className="absolute inset-0 bg-base-100/80 backdrop-blur-[1px] grid place-items-center z-20">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      ) : null}
    </div>
  );
});

CandidateCard.propTypes = {
  tone: PropTypes.oneOf(["success", "warning", "primary", "info", "error"]),
  onClick: PropTypes.func,
  topRight: PropTypes.node,
  footer: PropTypes.node,
  busy: PropTypes.bool,
  name: PropTypes.string,
  photo: PropTypes.string,
  meta: PropTypes.node,
  lines: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node,
      text: PropTypes.string,
      title: PropTypes.string,
      mono: PropTypes.bool,
    })
  ),
  emptyLabel: PropTypes.string,
};

export default CandidateCard;
