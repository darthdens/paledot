import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import { Shuffle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ColorHeroProps {
  onGenerate: (baseColor: string, harmony: string) => void;
  isLoading: boolean;
}

export const ColorHero = ({ onGenerate, isLoading }: ColorHeroProps) => {
  const { t } = useLanguage();
  const [baseColor, setBaseColor] = useState("#6366f1");
  const [harmony, setHarmony] = useState("complementary");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(baseColor, harmony);
  };

  const generateRandomColor = () => {
    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    setBaseColor(randomColor);
  };

  const harmonyOptions = [
    { value: "monochromatic", label: t.colorPalette.harmonies.monochromatic },
    { value: "complementary", label: t.colorPalette.harmonies.complementary },
    { value: "analogous", label: t.colorPalette.harmonies.analogous },
    { value: "triadic", label: t.colorPalette.harmonies.triadic },
    { value: "split-complementary", label: t.colorPalette.harmonies.splitComplementary },
    { value: "tetradic", label: t.colorPalette.harmonies.tetradic },
  ];

  return (
    <section className="min-h-[60vh] flex items-center justify-center pt-24 pb-16">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight">
            {t.colorPalette.title}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.colorPalette.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="baseColor" className="text-left block">
                  {t.colorPalette.baseColor}
                </Label>
                <div className="flex gap-2">
                  <div className="relative">
                    <Input
                      type="color"
                      id="baseColor"
                      value={baseColor}
                      onChange={(e) => setBaseColor(e.target.value)}
                      className="h-14 w-16 p-1 cursor-pointer bg-card border-border"
                    />
                  </div>
                  <Input
                    type="text"
                    value={baseColor.toUpperCase()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                        setBaseColor(val);
                      }
                    }}
                    placeholder="#6366F1"
                    className="flex-1 h-14 text-lg font-mono uppercase bg-card border-border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 border-border"
                    onClick={generateRandomColor}
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="harmony" className="text-left block">
                {t.colorPalette.harmonyType}
              </Label>
              <Select value={harmony} onValueChange={setHarmony}>
                <SelectTrigger className="h-14 text-lg bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {harmonyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="secondary"
              disabled={isLoading || !baseColor}
              className="h-14 px-8"
            >
              {isLoading ? t.colorPalette.generating : t.colorPalette.generate}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};