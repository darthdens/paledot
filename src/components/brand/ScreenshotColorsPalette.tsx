import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

interface ScreenshotColorsPaletteProps {
  colors: string[];
}

export const ScreenshotColorsPalette = ({ colors }: ScreenshotColorsPaletteProps) => {
  const { t } = useLanguage();
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  if (!colors || colors.length === 0) {
    return null;
  }

  const copyColor = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(color);
      toast.success(t.brandKit.copied);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch {
      toast.error(t.brandKit.copyFailed);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-serif font-semibold">{t.brandKit.screenshotColors}</h3>
      <div className="flex flex-wrap gap-3">
        {colors.map((color, idx) => (
          <button
            key={idx}
            onClick={() => copyColor(color)}
            className="group relative flex flex-col items-center gap-1 p-2 rounded-lg bg-card border border-border hover:border-accent transition-colors"
          >
            <div
              className="w-12 h-12 rounded-md shadow-sm border border-border/50"
              style={{ backgroundColor: color }}
            />
            <p className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              {color}
              {copiedColor === color ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
