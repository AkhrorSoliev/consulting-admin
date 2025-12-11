import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "consulting-admin-theme";
const DEFAULT_THEME = "winter";
const SUPPORTED_THEMES = ["winter", "dracula"];

const resolveInitialTheme = () => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme && SUPPORTED_THEMES.includes(storedTheme)) {
    return storedTheme;
  }
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dracula" : DEFAULT_THEME;
};

export function useTheme() {
  const [theme, setTheme] = useState(resolveInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((current) => (current === "dracula" ? "winter" : "dracula"));

  return { theme, toggleTheme };
}


