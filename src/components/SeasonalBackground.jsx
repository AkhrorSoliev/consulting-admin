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

    const img = new Image();
    img.onload = () => {
      setBackgroundImage(imagePath);
      setIsLoading(false);
    };
    img.onerror = () => {
      // Try fallback images
      const fallbackImages = ["/autumn.jpg", "/spring.jpg", "/summer.jpg"];
      let fallbackIndex = 0;

      const tryFallback = () => {
        if (fallbackIndex >= fallbackImages.length) {
          setIsLoading(false);
          return;
        }

        const fallbackImg = new Image();
        const fallbackPath = fallbackImages[fallbackIndex];

        fallbackImg.onload = () => {
          setBackgroundImage(fallbackPath);
          setIsLoading(false);
        };

        fallbackImg.onerror = () => {
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
