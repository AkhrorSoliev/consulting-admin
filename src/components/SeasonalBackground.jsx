import { useEffect, useState } from "react";
import {
  getCurrentSeason,
  getSeasonalBackgroundPath,
} from "../utils/seasonalBackground";

function SeasonalBackground({ children, className = "" }) {
  const [backgroundImage, setBackgroundImage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const season = getCurrentSeason();
    const imagePath = getSeasonalBackgroundPath();

    console.log("Current season:", season);
    console.log("Trying to load image:", imagePath);

    const img = new Image();
    img.onload = () => {
      console.log("Successfully loaded:", imagePath);
      setBackgroundImage(imagePath);
      setIsLoading(false);
    };
    img.onerror = () => {
      console.error("Failed to load:", imagePath);
      // Try fallback images
      const fallbackImages = ["/autumn.jpg", "/spring.jpg", "/summer.jpg"];
      let fallbackIndex = 0;

      const tryFallback = () => {
        if (fallbackIndex >= fallbackImages.length) {
          console.error("All images failed to load");
          setIsLoading(false);
          return;
        }

        const fallbackImg = new Image();
        const fallbackPath = fallbackImages[fallbackIndex];
        console.log("Trying fallback:", fallbackPath);

        fallbackImg.onload = () => {
          console.log("Fallback loaded:", fallbackPath);
          setBackgroundImage(fallbackPath);
          setIsLoading(false);
        };

        fallbackImg.onerror = () => {
          console.error("Fallback failed:", fallbackPath);
          fallbackIndex++;
          tryFallback();
        };

        fallbackImg.src = fallbackPath;
      };

      tryFallback();
    };

    img.src = imagePath;
  }, []);

  return (
    <div
      className={`relative ${className}`}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {/* Overlay for better content visibility */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px]" />

      {/* Content container */}
      <div className="relative z-10">{children}</div>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-base-200 flex items-center justify-center z-50">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      )}
    </div>
  );
}

export default SeasonalBackground;
