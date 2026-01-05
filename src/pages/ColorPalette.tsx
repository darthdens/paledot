import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
import { ColorHero } from "@/components/color/ColorHero";
import { ColorResults } from "@/components/color/ColorResults";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2 } from "lucide-react";

export interface GeneratedPalette {
  baseColor: string;
  colors: PaletteColor[];
  harmony: string;
}

export interface PaletteColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  name: string;
}

const ColorPalette = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [palette, setPalette] = useState<GeneratedPalette | null>(null);

  useEffect(() => {
    document.title = t.colorPalette.pageTitle;
  }, [t]);

  const handleGenerate = async (baseColor: string, harmony: string) => {
    setIsLoading(true);
    
    // Simulate a brief loading state for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const generatedColors = generatePalette(baseColor, harmony);
    setPalette({
      baseColor,
      colors: generatedColors,
      harmony,
    });
    
    setIsLoading(false);
  };

  const handleReset = () => {
    setPalette(null);
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Starfield />
      <Navigation />
      <main className="flex-1 flex flex-col items-center justify-center pt-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
            <p className="text-muted-foreground">{t.colorPalette.generating}</p>
          </div>
        ) : !palette ? (
          <ColorHero onGenerate={handleGenerate} isLoading={isLoading} />
        ) : (
          <ColorResults palette={palette} onReset={handleReset} />
        )}
      </main>
      <Footer />
    </div>
  );
};

// Color utility functions
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function getColorName(hsl: { h: number; s: number; l: number }): string {
  const { h, s, l } = hsl;
  
  if (s < 10) {
    if (l < 20) return "Black";
    if (l < 40) return "Dark Gray";
    if (l < 60) return "Gray";
    if (l < 80) return "Light Gray";
    return "White";
  }
  
  let hue = "";
  if (h < 15 || h >= 345) hue = "Red";
  else if (h < 45) hue = "Orange";
  else if (h < 75) hue = "Yellow";
  else if (h < 150) hue = "Green";
  else if (h < 210) hue = "Cyan";
  else if (h < 270) hue = "Blue";
  else if (h < 315) hue = "Purple";
  else hue = "Pink";
  
  let prefix = "";
  if (l < 30) prefix = "Dark ";
  else if (l > 70) prefix = "Light ";
  
  return prefix + hue;
}

function generatePalette(baseColor: string, harmony: string): PaletteColor[] {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  const colors: PaletteColor[] = [];
  let hues: number[] = [];
  
  switch (harmony) {
    case "complementary":
      hues = [hsl.h, (hsl.h + 180) % 360];
      break;
    case "analogous":
      hues = [(hsl.h - 30 + 360) % 360, hsl.h, (hsl.h + 30) % 360];
      break;
    case "triadic":
      hues = [hsl.h, (hsl.h + 120) % 360, (hsl.h + 240) % 360];
      break;
    case "split-complementary":
      hues = [hsl.h, (hsl.h + 150) % 360, (hsl.h + 210) % 360];
      break;
    case "tetradic":
      hues = [hsl.h, (hsl.h + 90) % 360, (hsl.h + 180) % 360, (hsl.h + 270) % 360];
      break;
    case "monochromatic":
    default:
      hues = [hsl.h];
      break;
  }
  
  // For monochromatic, generate different lightness values
  if (harmony === "monochromatic") {
    const lightnesses = [20, 35, 50, 65, 80];
    for (const l of lightnesses) {
      const hex = hslToHex(hsl.h, hsl.s, l);
      const newRgb = hexToRgb(hex);
      const newHsl = { h: hsl.h, s: hsl.s, l };
      colors.push({
        hex,
        rgb: newRgb,
        hsl: newHsl,
        name: getColorName(newHsl),
      });
    }
  } else {
    // For other harmonies, generate colors with the base saturation and lightness
    for (const h of hues) {
      const hex = hslToHex(h, hsl.s, hsl.l);
      const newRgb = hexToRgb(hex);
      const newHsl = { h, s: hsl.s, l: hsl.l };
      colors.push({
        hex,
        rgb: newRgb,
        hsl: newHsl,
        name: getColorName(newHsl),
      });
    }
  }
  
  return colors;
}

export default ColorPalette;
