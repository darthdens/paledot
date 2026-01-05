import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";
import { ArrowLeft, Copy, Check, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { GeneratedPalette, PaletteColor } from "@/pages/ColorPalette";

interface ColorResultsProps {
  palette: GeneratedPalette;
  onReset: () => void;
}

export const ColorResults = ({ palette, onReset }: ColorResultsProps) => {
  const { t } = useLanguage();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success(t.colorPalette.copied);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error(t.colorPalette.copyFailed);
    }
  };

  const exportAsCSS = () => {
    const cssVars = palette.colors
      .map((color, i) => `  --color-${i + 1}: ${color.hex};`)
      .join("\n");
    const css = `:root {\n${cssVars}\n}`;
    
    const blob = new Blob([css], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palette.css";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t.colorPalette.exportSuccess);
  };

  const exportAsJSON = () => {
    const json = JSON.stringify(palette, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palette.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t.colorPalette.exportSuccess);
  };

  const getHarmonyLabel = (harmony: string) => {
    const labels: Record<string, string> = {
      monochromatic: t.colorPalette.harmonies.monochromatic,
      complementary: t.colorPalette.harmonies.complementary,
      analogous: t.colorPalette.harmonies.analogous,
      triadic: t.colorPalette.harmonies.triadic,
      "split-complementary": t.colorPalette.harmonies.splitComplementary,
      tetradic: t.colorPalette.harmonies.tetradic,
    };
    return labels[harmony] || harmony;
  };

  return (
    <section className="w-full py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold">
                {t.colorPalette.resultsTitle}
              </h1>
              <p className="text-muted-foreground mt-2">
                {getHarmonyLabel(palette.harmony)} • {t.colorPalette.basedOn}{" "}
                <span className="font-mono">{palette.baseColor.toUpperCase()}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onReset}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.colorPalette.generateAnother}
              </Button>
            </div>
          </div>

          {/* Palette Preview */}
          <Card className="overflow-hidden">
            <div className="flex h-32 md:h-48">
              {palette.colors.map((color, index) => (
                <div
                  key={index}
                  className="flex-1 cursor-pointer transition-transform hover:scale-105 hover:z-10 relative group"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => copyToClipboard(color.hex, index)}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    {copiedIndex === index ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Copy className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Color Details */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {palette.colors.map((color, index) => (
              <ColorCard
                key={index}
                color={color}
                index={index}
                onCopy={() => copyToClipboard(color.hex, index)}
                isCopied={copiedIndex === index}
                t={t}
              />
            ))}
          </div>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>{t.colorPalette.exportOptions}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={exportAsCSS}>
                <Download className="w-4 h-4 mr-2" />
                {t.colorPalette.exportCSS}
              </Button>
              <Button variant="outline" onClick={exportAsJSON}>
                <Download className="w-4 h-4 mr-2" />
                {t.colorPalette.exportJSON}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

interface ColorCardProps {
  color: PaletteColor;
  index: number;
  onCopy: () => void;
  isCopied: boolean;
  t: ReturnType<typeof useLanguage>["t"];
}

const ColorCard = ({ color, index, onCopy, isCopied, t }: ColorCardProps) => {
  return (
    <Card className="overflow-hidden">
      <div
        className="h-20 cursor-pointer transition-opacity hover:opacity-90"
        style={{ backgroundColor: color.hex }}
        onClick={onCopy}
      />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">{color.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            className="h-8 px-2"
          >
            {isCopied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground font-mono">
          <p>
            <span className="text-foreground">{t.colorPalette.hex}:</span> {color.hex.toUpperCase()}
          </p>
          <p>
            <span className="text-foreground">{t.colorPalette.rgb}:</span> {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
          </p>
          <p>
            <span className="text-foreground">{t.colorPalette.hsl}:</span> {color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
