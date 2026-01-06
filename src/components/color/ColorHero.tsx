import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/i18n/LanguageContext";
import { Shuffle, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface ColorHeroProps {
  onGenerate: (baseColor: string, harmony: string, colorCount: number) => void;
  isLoading: boolean;
}

export const ColorHero = ({ onGenerate, isLoading }: ColorHeroProps) => {
  const { t } = useLanguage();
  const [baseColor, setBaseColor] = useState("#6366f1");
  const [harmony, setHarmony] = useState("complementary");
  const [colorCount, setColorCount] = useState(5);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(baseColor, harmony, colorCount);
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

  const selectedHarmonyLabel = harmonyOptions.find(o => o.value === harmony)?.label || "";

  const handleHarmonySelect = (value: string) => {
    setHarmony(value);
    setDrawerOpen(false);
  };

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
                      className="h-14 w-16 p-1 cursor-pointer bg-card border-border text-base"
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
                    className="flex-1 h-14 text-base font-mono uppercase bg-card border-border"
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
              
              {isMobile ? (
                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-14 text-base bg-card border-border justify-between font-normal"
                    >
                      {selectedHarmonyLabel}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>{t.colorPalette.harmonyType}</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 pb-8 space-y-2">
                      {harmonyOptions.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={harmony === option.value ? "secondary" : "ghost"}
                          className="w-full h-12 justify-start text-base"
                          onClick={() => handleHarmonySelect(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>
              ) : (
                <Select value={harmony} onValueChange={setHarmony}>
                  <SelectTrigger className="h-14 text-base bg-card border-border">
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
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t.colorPalette.colorCount}</span>
                <span className="tabular-nums">{colorCount}</span>
              </div>
              <Slider
                value={[colorCount]}
                min={3}
                max={10}
                step={1}
                onValueChange={(v) => setColorCount(v[0] ?? 5)}
                disabled={isLoading}
              />
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