import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
import { SeoHero } from "@/components/seo/SeoHero";
import { SeoResults } from "@/components/seo/SeoResults";
import { analyzeSeo, type SeoAnalysisResult } from "@/lib/api/seoAnalyzer";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2 } from "lucide-react";

const SeoChecker = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SeoAnalysisResult | null>(null);

  useEffect(() => {
    document.title = t.seo.pageTitle;
  }, [t]);

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const data = await analyzeSeo(url);

      if (!data.success) {
        toast.error(data.error || t.seo.analysisFailed);
        return;
      }

      setResult(data);
      toast.success(t.seo.analysisSuccess);
    } catch (error) {
      console.error("SEO Analysis error:", error);
      toast.error(t.seo.analysisFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Starfield />
      <Navigation />
      <main className="flex-1 flex flex-col items-center justify-center pt-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
            <p className="text-muted-foreground">{t.seo.analyzing}</p>
          </div>
        ) : !result ? (
          <SeoHero onAnalyze={handleAnalyze} isLoading={isLoading} />
        ) : (
          <SeoResults result={result} onReset={handleReset} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SeoChecker;
