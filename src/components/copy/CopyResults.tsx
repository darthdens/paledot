import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { Copy, Check, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { GeneratedCopy } from "@/pages/AICopywriter";

interface CopyResultsProps {
  copy: GeneratedCopy;
  onReset: () => void;
  onRegenerate: (prompt: string, copyType: string, tone: string) => void;
}

export const CopyResults = ({ copy, onReset, onRegenerate }: CopyResultsProps) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copy.content);
      setCopied(true);
      toast.success(t.copywriter.copied);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t.copywriter.copyFailed);
    }
  };

  const handleRegenerate = () => {
    onRegenerate(copy.prompt, copy.copyType, copy.tone);
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      headline: t.copywriter.types.headline,
      tagline: t.copywriter.types.tagline,
      productDescription: t.copywriter.types.productDescription,
      emailSubject: t.copywriter.types.emailSubject,
      socialPost: t.copywriter.types.socialPost,
      ctaButton: t.copywriter.types.ctaButton,
      landingPage: t.copywriter.types.landingPage,
      adCopy: t.copywriter.types.adCopy,
    };
    return types[type] || type;
  };

  const getToneLabel = (tone: string) => {
    const tones: Record<string, string> = {
      professional: t.copywriter.tones.professional,
      friendly: t.copywriter.tones.friendly,
      playful: t.copywriter.tones.playful,
      urgent: t.copywriter.tones.urgent,
      luxurious: t.copywriter.tones.luxurious,
      minimalist: t.copywriter.tones.minimalist,
    };
    return tones[tone] || tone;
  };

  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onReset} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t.copywriter.startOver}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="px-2 py-1 bg-accent/10 rounded-md">{getTypeLabel(copy.copyType)}</span>
              <span>•</span>
              <span className="px-2 py-1 bg-accent/10 rounded-md">{getToneLabel(copy.tone)}</span>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 relative group">
              <p className="whitespace-pre-wrap leading-relaxed text-lg">{copy.content}</p>
              
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{t.copywriter.originalPrompt}:</span> {copy.prompt}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={handleCopy} className="gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t.copywriter.copied : t.copywriter.copyToClipboard}
            </Button>
            <Button variant="secondary" onClick={handleRegenerate} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {t.copywriter.regenerate}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
