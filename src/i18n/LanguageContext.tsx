import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { translations, Language } from "./translations";

type TranslationType = typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationType;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const detectFrench = (): boolean => {
  const browserLang = navigator.language || (navigator as any).userLanguage || "";
  if (browserLang.toLowerCase().startsWith("fr")) {
    return true;
  }

  const languages = navigator.languages || [];
  for (const lang of languages) {
    if (lang.toLowerCase().startsWith("fr")) {
      return true;
    }
  }

  return false;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as Language | null;

    if (savedLang && (savedLang === "en" || savedLang === "fr")) {
      setLanguageState(savedLang);
    } else {
      const isFrench = detectFrench();
      setLanguageState(isFrench ? "fr" : "en");
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("lang", lang);
  };

  const t = translations[language] as TranslationType;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
