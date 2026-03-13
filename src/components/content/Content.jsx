import IgnoreTailwind from "../IgnoreTailwind";
import HeroSection from "./HeroSection";

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
            <HeroSection
              cv={cv}
              generatedSettings={generatedSettings}
              order={order}
            />
          </div>
        </div>
      </div>
    </IgnoreTailwind>
  );
}
