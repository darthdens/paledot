import { useState } from "react";

export const LanguageSwitcher = () => {
  const [lang, setLang] = useState<"EN" | "FR">("EN");

  const toggleLang = () => {
    setLang(lang === "EN" ? "FR" : "EN");
  };

  return (
    <button
      onClick={toggleLang}
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Toggle language"
    >
      {lang}
    </button>
  );
};
