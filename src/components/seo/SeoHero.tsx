import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import { Search } from "lucide-react";

interface SeoHeroProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export const SeoHero = ({ onAnalyze, isLoading }: SeoHeroProps) => {
  const { t } = useLanguage();
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim());
    }
  };

  return (
    <section className="min-h-[60vh] flex items-center justify-center pt-24 pb-16">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight">
            {t.seo.title}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.seo.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.seo.urlPlaceholder}
              className="flex-1 h-12 text-base"
              required
            />
            <Button type="submit" disabled={isLoading || !url.trim()} className="h-12 px-8 gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Search className="w-4 h-4" />
              {isLoading ? t.seo.analyzing : t.seo.analyzeButton}
            </Button>
          </form>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
            {[
              { icon: "🔍", label: t.seo.features.metaTags },
              { icon: "📱", label: t.seo.features.mobile },
              { icon: "⚡", label: t.seo.features.performance },
              { icon: "🔗", label: t.seo.features.links },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border border-border/50"
              >
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-sm text-muted-foreground text-center">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
