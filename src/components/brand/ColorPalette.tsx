import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import type { BrandColors } from "@/lib/api/brandExtractor";

interface ColorPaletteProps {
  colors: BrandColors;
}

export const ColorPalette = ({ colors }: ColorPaletteProps) => {
  const { t } = useLanguage();
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const colorEntries = Object.entries(colors).filter(
    ([, value]) => value && typeof value === "string"
  );

  const copyColor = async (colorName: string, colorValue: string) => {
    try {
      await navigator.clipboard.writeText(colorValue);
      setCopiedColor(colorName);
      toast.success(t.brandKit.copied);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch {
      toast.error(t.brandKit.copyFailed);
    }
  };

  const formatColorName = (name: string) => {
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  if (colorEntries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-serif font-semibold">{t.brandKit.colors}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {colorEntries.map(([name, value]) => (
          <button
            key={name}
            onClick={() => copyColor(name, value!)}
            className="group relative flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-accent transition-colors"
          >
            <div
              className="w-full aspect-square rounded-lg shadow-sm border border-border/50"
              style={{ backgroundColor: value }}
            />
            <div className="text-center w-full">
              <p className="text-xs font-medium truncate">{formatColorName(name)}</p>
              <p className="text-xs text-muted-foreground font-mono truncate">{value}</p>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {copiedColor === name ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
