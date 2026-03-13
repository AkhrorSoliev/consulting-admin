export default function PersonalDataRow({ label, value, generatedSettings }) {
  if (label === "foto") return null;

  if (label === "email") {
    return (
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            alignItems: "start",
            width: "100%",
          }}
        >
          <strong
            style={{
              fontFamily: generatedSettings.fontFamily,
              textTransform: "capitalize",
              fontSize: "14px",
              lineHeight: "1.2",
            }}
          >
            {label}:
          </strong>
          <a
            href={`mailto:${value}`}
            style={{
              margin: "0px",
              fontFamily: generatedSettings.fontFamily,
              fontSize: "14px",
              lineHeight: "1.2",
            }}
          >
            {value}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          alignItems: "start",
          width: "100%",
        }}
      >
        <strong
          style={{
            fontFamily: generatedSettings.fontFamily,
            textTransform: "capitalize",
            fontSize: "14px",
            lineHeight: "1.2",
          }}
        >
          {label}:
        </strong>
        <p
          style={{
            margin: "0px",
            fontFamily: generatedSettings.fontFamily,
            fontSize: "14px",
            lineHeight: "1.2",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
