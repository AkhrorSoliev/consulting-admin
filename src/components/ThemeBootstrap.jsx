import { useTheme } from "../hooks/useTheme";

/**
 * Ensures `data-theme` is set on <html> even on routes that don't render MainLayout
 * (e.g., /login, /create). This keeps DaisyUI theme + WinterSnowfall consistent.
 */
export default function ThemeBootstrap() {
  useTheme();
  return null;
}


