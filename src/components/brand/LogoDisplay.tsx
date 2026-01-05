import { useState } from "react";
import { Check, Copy, Download, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import type { BrandImages } from "@/lib/api/brandExtractor";

interface LogoDisplayProps {
  logo?: string;
  images?: BrandImages;
  siteName?: string;
}

export const LogoDisplay = ({ logo, images, siteName }: LogoDisplayProps) => {
  const { t } = useLanguage();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const allImages = [
    { name: "Logo", url: logo || images?.logo },
    { name: "Favicon", url: images?.favicon },
    { name: "OG Image", url: images?.ogImage },
  ].filter((img) => img.url);

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success(t.brandKit.copied);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      toast.error(t.brandKit.copyFailed);
    }
  };

  const downloadImage = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${siteName || "brand"}-${name.toLowerCase()}.${blob.type.split("/")[1] || "png"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success(t.brandKit.downloadStarted);
    } catch {
      toast.error(t.brandKit.downloadFailed);
    }
  };

  if (allImages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-serif font-semibold">{t.brandKit.logos}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allImages.map(({ name, url }) => (
          <div
            key={name}
            className="relative flex flex-col items-center gap-4 p-6 rounded-xl bg-card border border-border"
          >
            <div className="w-full aspect-video rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
              {url ? (
                <img
                  src={url}
                  alt={name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div className="hidden flex-col items-center text-muted-foreground">
                <Image className="w-8 h-8 mb-2" />
                <span className="text-sm">{t.brandKit.imageLoadError}</span>
              </div>
            </div>
            <p className="font-medium">{name}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyUrl(url!)}
                className="gap-2"
              >
                {copiedUrl === url ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {t.brandKit.copyUrl}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadImage(url!, name)}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {t.brandKit.download}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
