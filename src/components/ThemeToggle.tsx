import { SunLight, HalfMoon } from "iconoir-react";
import { useThemePreference } from "@/hooks/use-theme-preference";

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useThemePreference();

  return (
    <button
      onClick={toggleTheme}
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <HalfMoon className="w-4 h-4" strokeWidth={2} />
      ) : (
        <SunLight className="w-4 h-4" strokeWidth={2} />
      )}
    </button>
  );
};

