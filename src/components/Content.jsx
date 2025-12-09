import IgnoreTailwind from "./IgnoreTailwind";

export default function Content({ cv, contentRef, generatedSettings, order }) {
  return (
    <IgnoreTailwind>
      <div ref={contentRef}>
        <div
          style={{
            display: "flex",
            backgroundColor: "white",
            flexDirection: "column",
            gap: "50px",
          }}
        >
          {/* Page 1  */}
          <div
            style={{
              padding: "25px",
              pageBreakAfter: "always",
              breakAfter: "page",
              boxShadow:
                "rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px",
            }}
          >
            <h1
              style={{
                fontFamily: generatedSettings.fontFamily,
                lineHeight: "1.2",
                fontSize: "28px",
                margin: "0px",
                marginBottom: "15px",
              }}
            >
              {cv.persoenlicheDaten.name}
            </h1>
            <div
              style={{
                height: "1px",
                backgroundColor: "rgba(0,0,0,0.3)",
              }}
            ></div>
            {/* HERO  */}
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
                  .map(([label, value], index) => {
                    if (label === "foto") return null;

                    if (label === "email") {
                      return (
                        <div
                          key={index}
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
                        key={index}
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
                  })}
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

            {/* MAIN CONTENT */}
            {/* <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {contentData.main.map(({ title, deletable, id }) => {
                return (
                  <div key={id}>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <h2
                        style={{
                          fontFamily: generatedSettings.fontFamily,
                          lineHeight: "1.2",
                          fontWeight: "500",
                          fontSize: "21px",
                          margin: "0px",
                          marginBottom: "7.5px",
                        }}
                      >
                        {title}
                      </h2>
                    </div>
                    <div
                      style={{
                        height: "0.5px",
                        backgroundColor: "rgba(0,0,0,0.2)",
                      }}
                    ></div>
                  </div>
                );
              })}
            </div> */}
          </div>
        </div>
      </div>
    </IgnoreTailwind>
  );
}
