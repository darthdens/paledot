import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
import { JsonHero } from "@/components/json/JsonHero";
import { JsonResults } from "@/components/json/JsonResults";
import { useLanguage } from "@/i18n/LanguageContext";

export interface FormattedJson {
  original: string;
  formatted: string;
  minified: string;
  isValid: boolean;
  error?: string;
}

const JsonFormatter = () => {
  const { t } = useLanguage();
  const [formattedJson, setFormattedJson] = useState<FormattedJson | null>(null);

  useEffect(() => {
    document.title = t.jsonFormatter.pageTitle;
  }, [t]);

  const handleFormat = (input: string, indentSize: number) => {
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, indentSize);
      const minified = JSON.stringify(parsed);
      
      setFormattedJson({
        original: input,
        formatted,
        minified,
        isValid: true,
      });
    } catch (error) {
      setFormattedJson({
        original: input,
        formatted: "",
        minified: "",
        isValid: false,
        error: error instanceof Error ? error.message : "Invalid JSON",
      });
    }
  };

  const handleReset = () => {
    setFormattedJson(null);
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Starfield />
      <Navigation />
      <main className="flex-1 flex flex-col items-center justify-center pt-16">
        {!formattedJson ? (
          <JsonHero onFormat={handleFormat} />
        ) : (
          <JsonResults result={formattedJson} onReset={handleReset} onReformat={handleFormat} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default JsonFormatter;