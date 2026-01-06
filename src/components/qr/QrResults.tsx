import { useRef } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { ArrowLeft, Download, Copy } from "lucide-react";
import type { QrCodeConfig } from "@/pages/QrCodeGenerator";

interface QrResultsProps {
  config: QrCodeConfig;
  onReset: () => void;
}

export const QrResults = ({ config, onReset }: QrResultsProps) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLDivElement>(null);

  const downloadQrCode = (format: "png" | "svg") => {
    if (format === "png") {
      const canvas = canvasRef.current?.querySelector("canvas");
      if (canvas) {
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = "qrcode.png";
        link.href = url;
        link.click();
        toast.success(t.qrCode.downloadSuccess);
      }
    } else {
      const svg = canvasRef.current?.querySelector("svg");
      if (svg) {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "qrcode.svg";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(t.qrCode.downloadSuccess);
      }
    }
  };

  const copyToClipboard = async () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (canvas) {
      try {
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, "image/png");
        });
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        toast.success(t.qrCode.copied);
      } catch {
        toast.error(t.qrCode.copyFailed);
      }
    }
  };

  return (
    <section className="min-h-[60vh] flex items-center justify-center pt-20 md:pt-24 pb-12 md:pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6 md:space-y-8">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold">
            {t.qrCode.resultsTitle}
          </h2>

          <div 
            ref={canvasRef}
            className="inline-block p-6 bg-card rounded-lg border border-border"
          >
            {/* Hidden canvas for PNG download */}
            <div className="hidden">
              <QRCodeCanvas
                value={config.content}
                size={config.size}
                fgColor={config.fgColor}
                bgColor={config.bgColor}
                includeMargin={config.includeMargin}
                level={config.errorCorrectionLevel}
              />
            </div>
            
            {/* Visible SVG */}
            <QRCodeSVG
              value={config.content}
              size={Math.min(config.size, 300)}
              fgColor={config.fgColor}
              bgColor={config.bgColor}
              includeMargin={config.includeMargin}
              level={config.errorCorrectionLevel}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            <p>{t.qrCode.encodedContent}: <span className="font-mono text-foreground">{config.content}</span></p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Button
              variant="secondary"
              onClick={() => downloadQrCode("png")}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {t.qrCode.downloadPng}
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadQrCode("svg")}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {t.qrCode.downloadSvg}
            </Button>
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              {t.qrCode.copy}
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.qrCode.startOver}
          </Button>
        </div>
      </div>
    </section>
  );
};
