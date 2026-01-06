import { useCallback, useEffect, useRef, useState } from "react";

const THEME_STORAGE_KEY = "theme";
const THEME_EVENT_NAME = "dens-theme-change";

type ThemeMode = "light" | "dark";

type ThemeChangeDetail = {
  isDark: boolean;
};

function readSavedTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (value === "light" || value === "dark") return value;
  return null;
}

function prefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyToDom(isDark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDark);
}

function emitThemeChange(isDark: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ThemeChangeDetail>(THEME_EVENT_NAME, { detail: { isDark } }),
  );
}

/**
 * Shared theme state used across the app.
 * Keeps the header toggle and in-page toggles in sync.
 */
export function useThemePreference() {
  const [isDark, setIsDark] = useState(() => {
    const saved = readSavedTheme();
    return saved ? saved === "dark" : prefersDark();
  });

  const hasUserPreferenceRef = useRef<boolean>(Boolean(readSavedTheme()));
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  // Ensure DOM reflects current state.
  useEffect(() => {
    applyToDom(isDark);
  }, [isDark]);

  // Keep multiple components in sync.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onThemeEvent = (event: Event) => {
      const next = (event as CustomEvent<ThemeChangeDetail>).detail?.isDark;
      if (typeof next !== "boolean") return;
      if (next === isDarkRef.current) return;
      setIsDark(next);
      // The emitter already persisted the preference.
      hasUserPreferenceRef.current = true;
    };

    window.addEventListener(THEME_EVENT_NAME, onThemeEvent);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = (e: MediaQueryListEvent) => {
      // Only follow system if user never set a preference.
      if (!hasUserPreferenceRef.current) {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener("change", onSystemChange);

    return () => {
      window.removeEventListener(THEME_EVENT_NAME, onThemeEvent);
      mediaQuery.removeEventListener("change", onSystemChange);
    };
  }, []);

  const setTheme = useCallback((nextIsDark: boolean) => {
    setIsDark(nextIsDark);
    hasUserPreferenceRef.current = true;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        THEME_STORAGE_KEY,
        nextIsDark ? "dark" : "light",
      );
    }
    emitThemeChange(nextIsDark);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(!isDarkRef.current);
  }, [setTheme]);

  return { isDark, setTheme, toggleTheme };
}
