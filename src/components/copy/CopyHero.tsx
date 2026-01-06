import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import { ChevronDown } from "lucide-react";
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

interface CopyHeroProps {
  onGenerate: (prompt: string, copyType: string, tone: string, platform: string) => void;
  isLoading: boolean;
}

export const CopyHero = ({ onGenerate, isLoading }: CopyHeroProps) => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState("");
  const [copyType, setCopyType] = useState("headline");
  const [tone, setTone] = useState("professional");
  const [platform, setPlatform] = useState("general");
  const [typeDrawerOpen, setTypeDrawerOpen] = useState(false);
  const [toneDrawerOpen, setToneDrawerOpen] = useState(false);
  const [platformDrawerOpen, setPlatformDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onGenerate(prompt, copyType, tone, platform);
  };

  const copyTypes = [
    { value: "headline", label: t.copywriter.types.headline },
    { value: "tagline", label: t.copywriter.types.tagline },
    { value: "productDescription", label: t.copywriter.types.productDescription },
    { value: "emailSubject", label: t.copywriter.types.emailSubject },
    { value: "socialPost", label: t.copywriter.types.socialPost },
    { value: "ctaButton", label: t.copywriter.types.ctaButton },
    { value: "landingPage", label: t.copywriter.types.landingPage },
    { value: "adCopy", label: t.copywriter.types.adCopy },
  ];

  const tones = [
    { value: "professional", label: t.copywriter.tones.professional },
    { value: "friendly", label: t.copywriter.tones.friendly },
    { value: "playful", label: t.copywriter.tones.playful },
    { value: "urgent", label: t.copywriter.tones.urgent },
    { value: "luxurious", label: t.copywriter.tones.luxurious },
    { value: "minimalist", label: t.copywriter.tones.minimalist },
  ];

  const platforms = [
    { value: "general", label: t.copywriter.platforms.general },
    { value: "linkedin", label: t.copywriter.platforms.linkedin },
    { value: "twitter", label: t.copywriter.platforms.twitter },
    { value: "instagram", label: t.copywriter.platforms.instagram },
    { value: "facebook", label: t.copywriter.platforms.facebook },
    { value: "email", label: t.copywriter.platforms.email },
    { value: "website", label: t.copywriter.platforms.website },
    { value: "blog", label: t.copywriter.platforms.blog },
  ];

  const selectedTypeLabel = copyTypes.find(o => o.value === copyType)?.label || "";
  const selectedToneLabel = tones.find(o => o.value === tone)?.label || "";
  const selectedPlatformLabel = platforms.find(o => o.value === platform)?.label || "";

  const renderSelect = (
    value: string,
    options: { value: string; label: string }[],
    onChange: (value: string) => void,
    label: string,
    drawerOpen: boolean,
    setDrawerOpen: (open: boolean) => void,
    selectedLabel: string
  ) => {
    if (isMobile) {
      return (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-base bg-card border-border justify-between font-normal"
            >
              {selectedLabel}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{label}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 pb-8 space-y-2">
              {options.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={value === option.value ? "secondary" : "ghost"}
                  className="w-full h-12 justify-start text-base"
                  onClick={() => {
                    onChange(option.value);
                    setDrawerOpen(false);
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
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full h-14 text-base bg-card border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <section className="min-h-[60vh] flex items-center justify-center pt-24 pb-16">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight">
            {t.copywriter.title}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.copywriter.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto text-left">
            <div className="space-y-2">
              <Label htmlFor="prompt">{t.copywriter.promptLabel}</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.copywriter.promptPlaceholder}
                className="min-h-[120px] bg-card border-border resize-none"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t.copywriter.copyType}</Label>
                {renderSelect(
                  copyType,
                  copyTypes,
                  setCopyType,
                  t.copywriter.copyType,
                  typeDrawerOpen,
                  setTypeDrawerOpen,
                  selectedTypeLabel
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.copywriter.platform}</Label>
                {renderSelect(
                  platform,
                  platforms,
                  setPlatform,
                  t.copywriter.platform,
                  platformDrawerOpen,
                  setPlatformDrawerOpen,
                  selectedPlatformLabel
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.copywriter.tone}</Label>
                {renderSelect(
                  tone,
                  tones,
                  setTone,
                  t.copywriter.tone,
                  toneDrawerOpen,
                  setToneDrawerOpen,
                  selectedToneLabel
                )}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="secondary"
              disabled={isLoading || !prompt.trim()}
              className="h-14 px-8 w-full sm:w-auto"
            >
              {isLoading ? t.copywriter.generating : t.copywriter.generate}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};
