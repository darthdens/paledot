import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DensSwitch } from "@/components/ui/dens-switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Search, Layers } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface BrandHeroProps {
  onExtract: (url: string, deep: boolean, maxPages?: number) => void;
  isLoading: boolean;
}

export const BrandHero = ({ onExtract, isLoading }: BrandHeroProps) => {
  const { t } = useLanguage();
  const [url, setUrl] = useState("");
  const [deepExtract, setDeepExtract] = useState(false);
  const [maxPages, setMaxPages] = useState(12);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onExtract(url.trim(), deepExtract, deepExtract ? maxPages : undefined);
    }
  };

  return (
    <section className="min-h-[60vh] flex items-center justify-center pt-24 pb-16">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight">
            {t.brandKit.title}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.brandKit.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t.brandKit.placeholder}
                  className="pl-12 h-14 text-lg bg-card border-border"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                variant="secondary"
                className="h-14 px-8"
                disabled={isLoading || !url.trim()}
              >
                {isLoading ? t.brandKit.extracting : t.brandKit.extract}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3 py-2">
                <DensSwitch
                  id="deep-extract"
                  checked={deepExtract}
                  onCheckedChange={setDeepExtract}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="deep-extract"
                  className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  {t.brandKit.deepExtract}
                </Label>
              </div>

              {deepExtract && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{t.brandKit.maxPages}</span>
                    <span className="tabular-nums">{maxPages}</span>
                  </div>
                  <Slider
                    value={[maxPages]}
                    min={3}
                    max={30}
                    step={1}
                    onValueChange={(v) => setMaxPages(v[0] ?? 12)}
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>
          </form>

          <p className="text-sm text-muted-foreground">{t.brandKit.example}</p>
        </div>
      </div>
    </section>
  );
};
