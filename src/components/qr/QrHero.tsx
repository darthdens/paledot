import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Switch } from "@/components/ui/switch";
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
import type { QrCodeConfig } from "@/pages/QrCodeGenerator";

interface QrHeroProps {
  onGenerate: (config: QrCodeConfig) => void;
}

export const QrHero = ({ onGenerate }: QrHeroProps) => {
  const { t } = useLanguage();
  const [content, setContent] = useState("");
  const [size, setSize] = useState("256");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [includeMargin, setIncludeMargin] = useState(true);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [sizeDrawerOpen, setSizeDrawerOpen] = useState(false);
  const [errorDrawerOpen, setErrorDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onGenerate({
      content: content.trim(),
      size: parseInt(size),
      fgColor,
      bgColor,
      includeMargin,
      errorCorrectionLevel,
    });
  };

  const sizeOptions = [
    { value: "128", label: "128px" },
    { value: "256", label: "256px" },
    { value: "512", label: "512px" },
    { value: "1024", label: "1024px" },
  ];

  const errorOptions = [
    { value: "L", label: t.qrCode.errorLevels.L },
    { value: "M", label: t.qrCode.errorLevels.M },
    { value: "Q", label: t.qrCode.errorLevels.Q },
    { value: "H", label: t.qrCode.errorLevels.H },
  ];

  const selectedSizeLabel = sizeOptions.find(o => o.value === size)?.label || "";
  const selectedErrorLabel = errorOptions.find(o => o.value === errorCorrectionLevel)?.label || "";

  const renderSizeSelect = () => {
    if (isMobile) {
      return (
        <Drawer open={sizeDrawerOpen} onOpenChange={setSizeDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-base bg-card border-border justify-between font-normal"
            >
              {selectedSizeLabel}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t.qrCode.size}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 pb-8 space-y-2">
              {sizeOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={size === option.value ? "secondary" : "ghost"}
                  className="w-full h-12 justify-start text-base"
                  onClick={() => {
                    setSize(option.value);
                    setSizeDrawerOpen(false);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Select value={size} onValueChange={setSize}>
        <SelectTrigger className="w-full h-14 text-base bg-card border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sizeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const renderErrorSelect = () => {
    if (isMobile) {
      return (
        <Drawer open={errorDrawerOpen} onOpenChange={setErrorDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-base bg-card border-border justify-between font-normal"
            >
              {selectedErrorLabel}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t.qrCode.errorCorrection}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 pb-8 space-y-2">
              {errorOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={errorCorrectionLevel === option.value ? "secondary" : "ghost"}
                  className="w-full h-12 justify-start text-base"
                  onClick={() => {
                    setErrorCorrectionLevel(option.value as "L" | "M" | "Q" | "H");
                    setErrorDrawerOpen(false);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Select value={errorCorrectionLevel} onValueChange={(v) => setErrorCorrectionLevel(v as "L" | "M" | "Q" | "H")}>
        <SelectTrigger className="w-full h-14 text-base bg-card border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {errorOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <section className="min-h-[60vh] flex items-center justify-center pt-20 md:pt-24 pb-12 md:pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6 md:space-y-8">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold leading-tight">
            {t.qrCode.title}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
            {t.qrCode.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 max-w-xl mx-auto text-left">
            <div className="space-y-2">
              <Label htmlFor="qr-content">{t.qrCode.contentLabel}</Label>
              <Input
                id="qr-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t.qrCode.contentPlaceholder}
                className="h-14 text-[16px] sm:text-sm bg-card border-border"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label>{t.qrCode.size}</Label>
                {renderSizeSelect()}
              </div>
              <div className="space-y-2">
                <Label>{t.qrCode.errorCorrection}</Label>
                {renderErrorSelect()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="fg-color">{t.qrCode.foregroundColor}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    id="fg-color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-14 w-14 p-1 bg-card border-border cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-14 flex-1 text-[16px] sm:text-sm bg-card border-border font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bg-color">{t.qrCode.backgroundColor}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    id="bg-color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-14 w-14 p-1 bg-card border-border cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-14 flex-1 text-[16px] sm:text-sm bg-card border-border font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="include-margin" className="cursor-pointer">
                {t.qrCode.includeMargin}
              </Label>
              <Switch
                id="include-margin"
                checked={includeMargin}
                onCheckedChange={setIncludeMargin}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              variant="secondary"
              disabled={!content.trim()}
              className="h-12 sm:h-14 px-6 sm:px-8 w-full"
            >
              {t.qrCode.generate}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};
