import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";
import { ArrowLeft, Copy, Check, Download, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { FontPair } from "@/pages/FontPairing";

interface FontResultsProps {
  fontPairs: FontPair[];
  onReset: () => void;
}

export const FontResults = ({ fontPairs, onReset }: FontResultsProps) => {
  const { t } = useLanguage();
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(id);
      toast.success(t.fontPairing.copied);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error(t.fontPairing.copyFailed);
    }
  };

  const getStyleLabel = (style: string) => {
    const labels: Record<string, string> = {
      modern: t.fontPairing.styles.modern,
      classic: t.fontPairing.styles.classic,
      elegant: t.fontPairing.styles.elegant,
      bold: t.fontPairing.styles.bold,
      minimal: t.fontPairing.styles.minimal,
      tech: t.fontPairing.styles.tech,
    };
    return labels[style] || style;
  };

  const generateCSS = (pair: FontPair) => {
    return `/* Font Pairing: ${pair.heading.family} + ${pair.body.family} */
@import url('${pair.heading.url}');
@import url('${pair.body.url}');

:root {
  --font-heading: '${pair.heading.family}', ${pair.heading.category};
  --font-body: '${pair.body.family}', ${pair.body.category};
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

body, p {
  font-family: var(--font-body);
}`;
  };

  const exportAllAsCSS = () => {
    const css = fontPairs.map((pair, i) => `/* Pair ${i + 1} */\n${generateCSS(pair)}`).join("\n\n");
    const blob = new Blob([css], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "font-pairings.css";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t.fontPairing.exportSuccess);
  };

  const exportAsJSON = () => {
    const json = JSON.stringify(fontPairs.map(pair => ({
      heading: {
        family: pair.heading.family,
        category: pair.heading.category,
        url: pair.heading.url,
      },
      body: {
        family: pair.body.family,
        category: pair.body.category,
        url: pair.body.url,
      },
      style: pair.style,
    })), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "font-pairings.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t.fontPairing.exportSuccess);
  };

  return (
    <section className="w-full py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold">
                {t.fontPairing.resultsTitle}
              </h1>
              <p className="text-muted-foreground mt-2">
                {getStyleLabel(fontPairs[0]?.style || "elegant")} • {fontPairs.length} {t.fontPairing.pairs}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onReset}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.fontPairing.generateAnother}
              </Button>
            </div>
          </div>

          {/* Font Pair Cards */}
          <div className="space-y-6">
            {fontPairs.map((pair, index) => (
              <FontPairCard
                key={index}
                pair={pair}
                index={index}
                onCopy={copyToClipboard}
                copiedId={copiedIndex}
                t={t}
              />
            ))}
          </div>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>{t.fontPairing.exportOptions}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={exportAllAsCSS}>
                <Download className="w-4 h-4 mr-2" />
                {t.fontPairing.exportCSS}
              </Button>
              <Button variant="outline" onClick={exportAsJSON}>
                <Download className="w-4 h-4 mr-2" />
                {t.fontPairing.exportJSON}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

interface FontPairCardProps {
  pair: FontPair;
  index: number;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  t: ReturnType<typeof useLanguage>["t"];
}

const FontPairCard = ({ pair, index, onCopy, copiedId, t }: FontPairCardProps) => {
  const headingCssId = `heading-${index}`;
  const bodyCssId = `body-${index}`;

  const sampleHeading = t.fontPairing.sampleHeading;
  const sampleBody = t.fontPairing.sampleBody;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-6">
        {/* Preview Section */}
        <div className="space-y-4 p-6 bg-muted/30 rounded-lg">
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: `'${pair.heading.family}', ${pair.heading.category}` }}
          >
            {sampleHeading}
          </h2>
          <p
            className="text-lg text-muted-foreground leading-relaxed"
            style={{ fontFamily: `'${pair.body.family}', ${pair.body.category}` }}
          >
            {sampleBody}
          </p>
        </div>

        {/* Font Details */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Heading Font */}
          <div className="p-4 bg-card border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.fontPairing.headingFont}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => onCopy(pair.heading.family, headingCssId)}
                >
                  {copiedId === headingCssId ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  asChild
                >
                  <a
                    href={`https://fonts.google.com/specimen/${pair.heading.family.replace(/ /g, "+")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
            <p
              className="text-xl font-semibold"
              style={{ fontFamily: `'${pair.heading.family}', ${pair.heading.category}` }}
            >
              {pair.heading.family}
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              {pair.heading.category}
            </p>
          </div>

          {/* Body Font */}
          <div className="p-4 bg-card border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.fontPairing.bodyFont}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => onCopy(pair.body.family, bodyCssId)}
                >
                  {copiedId === bodyCssId ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  asChild
                >
                  <a
                    href={`https://fonts.google.com/specimen/${pair.body.family.replace(/ /g, "+")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
            <p
              className="text-xl font-semibold"
              style={{ fontFamily: `'${pair.body.family}', ${pair.body.category}` }}
            >
              {pair.body.family}
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              {pair.body.category}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
