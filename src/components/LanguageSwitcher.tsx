import { useEffect, useState } from "react";

const detectFrench = (): boolean => {
  // Check browser language
  const browserLang = navigator.language || (navigator as any).userLanguage || "";
  if (browserLang.toLowerCase().startsWith("fr")) {
    return true;
  }
  
  // Check all preferred languages
  const languages = navigator.languages || [];
  for (const lang of languages) {
    if (lang.toLowerCase().startsWith("fr")) {
      return true;
    }
  }
  
  return false;
};

export const LanguageSwitcher = () => {
  const [lang, setLang] = useState<"EN" | "FR">("EN");

  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    
    if (savedLang) {
      setLang(savedLang as "EN" | "FR");
    } else {
      // Auto-detect French
      const isFrench = detectFrench();
      setLang(isFrench ? "FR" : "EN");
    }
  }, []);

  const toggleLang = () => {
    const newLang = lang === "EN" ? "FR" : "EN";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
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
