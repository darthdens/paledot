import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { translations } from "./translations";
import {
  type ContentLang,
  type DictLang,
  type Locale,
  contentLangOf,
  detectLocale,
  isLocale,
  loadDict,
  localize,
  numberLocaleOf,
} from "./locales";

type TranslationType = typeof translations.en;
type Rec<T> = { en: T; fr?: T };

interface LanguageContextType {
  /** Content language: 'en' | 'fr' | 'es' | 'pt' | 'it' | 'de'. */
  language: ContentLang;
  /** Full chosen locale, incl. en-GB vs en-US. */
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Back-compat: accepts a locale or 'en'. */
  setLanguage: (l: Locale | "en") => void;
  /** Number formatting locale, e.g. 'de-DE'. */
  numberLocale: string;
  t: TranslationType;
  /** Localise an { en, fr } record (strings, arrays or tables). */
  tr: <T>(rec: Rec<T>) => T;
  /** Inline English/French pair. */
  tx: (en: string, fr: string) => string;
}

const LANGUAGE_CONTEXT_KEY = "__language_context_singleton__";

const getLanguageContext = () => {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g[LANGUAGE_CONTEXT_KEY]) {
    g[LANGUAGE_CONTEXT_KEY] = createContext<LanguageContextType | undefined>(undefined);
  }
  return g[LANGUAGE_CONTEXT_KEY] as ReturnType<typeof createContext<LanguageContextType | undefined>>;
};

const LanguageContext = getLanguageContext();

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>("en-GB");
  const [dict, setDict] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "en") setLocaleState("en-GB");
    else if (isLocale(saved)) setLocaleState(saved);
    else setLocaleState(detectLocale());
  }, []);

  const language = contentLangOf(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    if (language === "en" || language === "fr") {
      setDict(null);
      return;
    }
    let alive = true;
    loadDict(language as DictLang).then((d) => alive && setDict(d));
    return () => {
      alive = false;
    };
  }, [locale, language]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("lang", l);
  }, []);

  const value = useMemo<LanguageContextType>(() => {
    const tr = <T,>(rec: Rec<T>) => localize(rec.en, rec.fr, locale, dict);
    return {
      language,
      locale,
      setLocale,
      setLanguage: (l) => setLocale(l === "en" ? "en-GB" : l),
      numberLocale: numberLocaleOf(locale),
      t: localize(translations.en, translations.fr as unknown as TranslationType, locale, dict),
      tr,
      tx: (en, fr) => localize(en, fr, locale, dict),
    };
  }, [language, locale, dict, setLocale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
