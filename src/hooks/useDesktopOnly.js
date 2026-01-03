import { useState, useEffect } from "react";

export function useDesktopOnly() {
  const [isDesktop, setIsDesktop] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;

      const mobileRegex =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
      const isMobileUA = mobileRegex.test(userAgent);

      const screenWidth = window.innerWidth;
      const isMobileScreen = screenWidth < 1024;

      const hasTouchScreen =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0;

      const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i;
      const isTablet = tabletRegex.test(userAgent);

      const isBlocked =
        isMobileUA || (isMobileScreen && hasTouchScreen) || isTablet;

      setIsDesktop(!isBlocked);
      setIsChecking(false);
    };

    checkDevice();

    const handleResize = () => {
      checkDevice();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return { isDesktop, isChecking };
}
