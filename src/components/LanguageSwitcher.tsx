import { useLanguage } from "@/i18n/LanguageContext";

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLang = () => {
    setLanguage(language === "fr" ? "en" : "fr");
  };

  return (
    <button
      onClick={toggleLang}
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Toggle language"
    >
      {language.toUpperCase()}
    </button>
  );
};
