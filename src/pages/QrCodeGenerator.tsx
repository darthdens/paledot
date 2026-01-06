import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
import { QrHero } from "@/components/qr/QrHero";
import { QrResults } from "@/components/qr/QrResults";
import { useLanguage } from "@/i18n/LanguageContext";

export interface QrCodeConfig {
  content: string;
  size: number;
  fgColor: string;
  bgColor: string;
  includeMargin: boolean;
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
}

const QrCodeGenerator = () => {
  const { t } = useLanguage();
  const [qrConfig, setQrConfig] = useState<QrCodeConfig | null>(null);

  useEffect(() => {
    document.title = t.qrCode.pageTitle;
  }, [t]);

  const handleGenerate = (config: QrCodeConfig) => {
    setQrConfig(config);
  };

  const handleReset = () => {
    setQrConfig(null);
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Starfield />
      <Navigation />
      <main className="flex-1 flex flex-col items-center justify-center pt-16">
        {!qrConfig ? (
          <QrHero onGenerate={handleGenerate} />
        ) : (
          <QrResults config={qrConfig} onReset={handleReset} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default QrCodeGenerator;
