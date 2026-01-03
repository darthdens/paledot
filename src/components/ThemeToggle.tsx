import { useEffect, useState } from "react";
import { SunLight, HalfMoon } from "iconoir-react";

export const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Use saved theme, or fall back to system preference
    const shouldBeDark = savedTheme ? savedTheme === "dark" : prefersDark;
    
    document.documentElement.classList.toggle("dark", shouldBeDark);
    setIsDark(shouldBeDark);

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem("theme")) {
        document.documentElement.classList.toggle("dark", e.matches);
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center"
      aria-label="Toggle theme"
    >
      {isDark ? <HalfMoon className="w-4 h-4" strokeWidth={2} /> : <SunLight className="w-4 h-4" strokeWidth={2} />}
    </button>
  );
};
