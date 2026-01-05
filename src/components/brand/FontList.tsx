import { useState } from "react";
import { Check, Copy, Type } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import type { BrandTypography } from "@/lib/api/brandExtractor";

interface FontListProps {
  fonts?: Array<{ family: string }>;
  typography?: BrandTypography;
}

export const FontList = ({ fonts, typography }: FontListProps) => {
  const { t } = useLanguage();
  const [copiedFont, setCopiedFont] = useState<string | null>(null);

  const copyFont = async (fontName: string) => {
    try {
      await navigator.clipboard.writeText(fontName);
      setCopiedFont(fontName);
      toast.success(t.brandKit.copied);
      setTimeout(() => setCopiedFont(null), 2000);
    } catch {
      toast.error(t.brandKit.copyFailed);
    }
  };

  // Collect unique font families
  const fontFamilies = new Set<string>();
  
  if (fonts) {
    fonts.forEach((font) => {
      if (font.family) fontFamilies.add(font.family);
    });
  }
  
  if (typography?.fontFamilies) {
    Object.values(typography.fontFamilies).forEach((family) => {
      if (family) fontFamilies.add(family);
    });
  }

  const fontList = Array.from(fontFamilies);

  if (fontList.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-serif font-semibold">{t.brandKit.fonts}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fontList.map((fontFamily) => (
          <button
            key={fontFamily}
            onClick={() => copyFont(fontFamily)}
            className="group relative flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-accent transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center">
              <Type className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{fontFamily}</p>
              <p
                className="text-2xl truncate mt-1"
                style={{ fontFamily: `"${fontFamily}", sans-serif` }}
              >
                Aa Bb Cc
              </p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              {copiedFont === fontFamily ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </button>
        ))}
      </div>
      
      {typography?.fontSizes && (
        <div className="mt-6 p-4 rounded-xl bg-card border border-border">
          <h4 className="font-medium mb-3">{t.brandKit.typographyScale}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {Object.entries(typography.fontSizes).map(([size, value]) => (
              <div key={size} className="flex justify-between">
                <span className="text-muted-foreground uppercase">{size}</span>
                <span className="font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
