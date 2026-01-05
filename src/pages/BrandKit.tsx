import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
import { BrandHero } from "@/components/brand/BrandHero";
import { BrandResult } from "@/components/brand/BrandResult";
import { extractBrand, type BrandExtractionResult } from "@/lib/api/brandExtractor";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2 } from "lucide-react";

const BrandKit = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BrandExtractionResult | null>(null);

  useEffect(() => {
    document.title = "Brand Kit Extractor | By Dens";
  }, []);

  const handleExtract = async (
    url: string,
    deep: boolean = false,
    maxPages?: number
  ) => {
    setIsLoading(true);
    setResult(null);

    try {
      const data = await extractBrand(url, {
        deep,
        maxPages: deep ? maxPages ?? 12 : 5,
      });

      if (!data.success) {
        toast.error(data.error || t.brandKit.extractionFailed);
        return;
      }

      if (!data.branding && !data.screenshot) {
        toast.error(t.brandKit.noBrandingData);
        return;
      }

      setResult(data);
      toast.success(t.brandKit.extractionSuccess);
    } catch (error) {
      console.error("Extraction error:", error);
      toast.error(t.brandKit.extractionFailed);
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
        {!result && <BrandHero onExtract={handleExtract} isLoading={isLoading} />}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
            <p className="text-muted-foreground">{t.brandKit.analyzing}</p>
          </div>
        )}

        {result && <BrandResult result={result} onReset={handleReset} />}
      </main>
      <Footer />
    </div>
  );
};

export default BrandKit;
