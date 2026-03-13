import PersonalDataRow from "./PersonalDataRow";

export default function HeroSection({ cv, generatedSettings, order }) {
  return (
    <div
      style={{
        display: "grid",
        height: "236px",
        gridTemplateColumns: "1fr 177px",
        columnGap: "20px",
        marginTop: "30px",
        marginBottom: "60px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        {Object.entries(cv.persoenlicheDaten)
          .sort(
            ([a], [b]) =>
              order.personalData.indexOf(a) -
              order.personalData.indexOf(b)
          )
          .map(([label, value], index) => (
            <PersonalDataRow
              key={index}
              label={label}
              value={value}
              generatedSettings={generatedSettings}
            />
          ))}
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      >
        <img
          style={{
            display: "flex",
            objectPosition: "center",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            aspectRatio: "3 / 4",
          }}
          src={cv.persoenlicheDaten.foto}
        />
      </div>
    </div>
  );
}
