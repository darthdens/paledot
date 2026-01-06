import { useState } from "react";
import { Button } from "@/components/ui/button";
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

interface FontHeroProps {
  onGenerate: (style: string, pairCount: number) => void;
  isLoading: boolean;
}

export const FontHero = ({ onGenerate, isLoading }: FontHeroProps) => {
  const { t } = useLanguage();
  const [style, setStyle] = useState("elegant");
  const [pairCount, setPairCount] = useState(3);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(style, pairCount);
  };

  const handleRandomStyle = () => {
    const styles = ["modern", "classic", "elegant", "bold", "minimal", "tech"];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    setStyle(randomStyle);
  };

  const styleOptions = [
    { value: "modern", label: t.fontPairing.styles.modern },
    { value: "classic", label: t.fontPairing.styles.classic },
    { value: "elegant", label: t.fontPairing.styles.elegant },
    { value: "bold", label: t.fontPairing.styles.bold },
    { value: "minimal", label: t.fontPairing.styles.minimal },
    { value: "tech", label: t.fontPairing.styles.tech },
  ];

  const selectedStyleLabel = styleOptions.find(o => o.value === style)?.label || "";

  const handleStyleSelect = (value: string) => {
    setStyle(value);
    setDrawerOpen(false);
  };

  return (
    <section className="min-h-[60vh] flex items-center justify-center pt-24 pb-16">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight">
            {t.fontPairing.title}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.fontPairing.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
            <div className="space-y-2">
              <Label htmlFor="style" className="text-left block">
                {t.fontPairing.pairingStyle}
              </Label>
              
              <div className="flex gap-2">
                {isMobile ? (
                  <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                    <DrawerTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-14 text-base bg-card border-border justify-between font-normal"
                      >
                        {selectedStyleLabel}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>{t.fontPairing.pairingStyle}</DrawerTitle>
                      </DrawerHeader>
                      <div className="p-4 pb-8 space-y-2">
                        {styleOptions.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            variant={style === option.value ? "secondary" : "ghost"}
                            className="w-full h-12 justify-start text-base"
                            onClick={() => handleStyleSelect(option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </DrawerContent>
                  </Drawer>
                ) : (
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="flex-1 h-14 text-base bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {styleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 border-border"
                  onClick={handleRandomStyle}
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t.fontPairing.pairCount}</span>
                <span className="tabular-nums">{pairCount}</span>
              </div>
              <Slider
                value={[pairCount]}
                min={1}
                max={5}
                step={1}
                onValueChange={(v) => setPairCount(v[0] ?? 3)}
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              variant="secondary"
              disabled={isLoading}
              className="h-14 px-8"
            >
              {isLoading ? t.fontPairing.generating : t.fontPairing.generate}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};
