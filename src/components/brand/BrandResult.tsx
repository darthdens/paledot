import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { ColorPalette } from "./ColorPalette";
import { FontList } from "./FontList";
import { LogoDisplay } from "./LogoDisplay";
import type { BrandExtractionResult } from "@/lib/api/brandExtractor";

interface BrandResultProps {
  result: BrandExtractionResult;
  onReset: () => void;
}

export const BrandResult = ({ result, onReset }: BrandResultProps) => {
  const { t } = useLanguage();
  const { branding, screenshot, metadata, sourceUrl } = result;

  const siteName = metadata?.title || new URL(sourceUrl || "").hostname;

  return (
    <section className="py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-serif font-bold">{siteName}</h2>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
              >
                {sourceUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <Button variant="outline" onClick={onReset}>
              {t.brandKit.extractAnother}
            </Button>
          </div>

          {/* Screenshot Preview */}
          {screenshot && (
            <div className="space-y-4">
              <h3 className="text-xl font-serif font-semibold">{t.brandKit.preview}</h3>
              <div className="rounded-xl overflow-hidden border border-border shadow-lg">
                <img
                  src={screenshot}
                  alt={`Screenshot of ${siteName}`}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Color Scheme Badge */}
          {branding?.colorScheme && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/70 text-sm">
              <div
                className={`w-3 h-3 rounded-full ${
                  branding.colorScheme === "dark" ? "bg-gray-800" : "bg-gray-200"
                }`}
              />
              <span>
                {branding.colorScheme === "dark"
                  ? t.brandKit.darkMode
                  : t.brandKit.lightMode}
              </span>
            </div>
          )}

          {/* Colors */}
          {branding?.colors && <ColorPalette colors={branding.colors} />}

          {/* Fonts */}
          <FontList fonts={branding?.fonts} typography={branding?.typography} />

          {/* Logos */}
          <LogoDisplay
            logo={branding?.logo}
            images={branding?.images}
            siteName={siteName}
          />

          {/* Spacing & Components */}
          {(branding?.spacing || branding?.components) && (
            <div className="space-y-4">
              <h3 className="text-xl font-serif font-semibold">
                {t.brandKit.designTokens}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {branding?.spacing && (
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <h4 className="font-medium mb-3">{t.brandKit.spacing}</h4>
                    <div className="space-y-2 text-sm">
                      {branding.spacing.baseUnit && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Unit</span>
                          <span className="font-mono">{branding.spacing.baseUnit}px</span>
                        </div>
                      )}
                      {branding.spacing.borderRadius && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Border Radius</span>
                          <span className="font-mono">{branding.spacing.borderRadius}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {branding?.components?.buttonPrimary && (
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <h4 className="font-medium mb-3">{t.brandKit.buttonStyles}</h4>
                    <div className="space-y-2 text-sm">
                      {branding.components.buttonPrimary.background && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Background</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border border-border"
                              style={{
                                backgroundColor: branding.components.buttonPrimary.background,
                              }}
                            />
                            <span className="font-mono text-xs">
                              {branding.components.buttonPrimary.background}
                            </span>
                          </div>
                        </div>
                      )}
                      {branding.components.buttonPrimary.borderRadius && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Radius</span>
                          <span className="font-mono">
                            {branding.components.buttonPrimary.borderRadius}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Extract Another CTA */}
          <div className="text-center pt-8 border-t border-border">
            <Button variant="secondary" size="lg" onClick={onReset}>
              {t.brandKit.extractAnother}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
