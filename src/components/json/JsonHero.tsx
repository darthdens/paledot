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

interface JsonHeroProps {
  onFormat: (input: string, indentSize: number) => void;
}

export const JsonHero = ({ onFormat }: JsonHeroProps) => {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const [indentSize, setIndentSize] = useState("2");
  const [indentDrawerOpen, setIndentDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onFormat(input, parseInt(indentSize));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (error) {
      console.error("Failed to paste:", error);
    }
  };

  const indentOptions = [
    { value: "2", label: t.jsonFormatter.indent2 },
    { value: "4", label: t.jsonFormatter.indent4 },
    { value: "1", label: t.jsonFormatter.indent1 },
  ];

  const selectedIndentLabel = indentOptions.find(o => o.value === indentSize)?.label || "";

  const renderIndentSelect = () => {
    if (isMobile) {
      return (
        <Drawer open={indentDrawerOpen} onOpenChange={setIndentDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-base bg-card border-border justify-between font-normal"
            >
              {selectedIndentLabel}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t.jsonFormatter.indentation}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 pb-8 space-y-2">
              {indentOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={indentSize === option.value ? "secondary" : "ghost"}
                  className="w-full h-12 justify-start text-base"
                  onClick={() => {
                    setIndentSize(option.value);
                    setIndentDrawerOpen(false);
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
      <Select value={indentSize} onValueChange={setIndentSize}>
        <SelectTrigger className="w-full h-14 text-base bg-card border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {indentOptions.map((option) => (
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
            {t.jsonFormatter.title}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.jsonFormatter.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto text-left">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="json-input">{t.jsonFormatter.inputLabel}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePaste}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t.jsonFormatter.pasteFromClipboard}
                </Button>
              </div>
              <Textarea
                id="json-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.jsonFormatter.inputPlaceholder}
                className="min-h-[200px] bg-card border-border resize-none font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.jsonFormatter.indentation}</Label>
                {renderIndentSelect()}
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  size="lg"
                  variant="secondary"
                  disabled={!input.trim()}
                  className="h-14 px-8 w-full"
                >
                  {t.jsonFormatter.format}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};