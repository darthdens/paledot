import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
import { useLanguage } from "@/i18n/LanguageContext";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";
import { InvoicePreview } from "@/components/invoice/InvoicePreview";
import { InvoiceData, defaultInvoiceData } from "@/components/invoice/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const Invoice = () => {
  const { t, language } = useLanguage();
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(defaultInvoiceData);
  // "Wide" layout = side-by-side form + sticky preview
  const [isXlUp, setIsXlUp] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1536px)").matches : true,
  );
  const [showPreview, setShowPreview] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1536px)").matches : true,
  );

  const dialogPreviewViewportRef = useRef<HTMLDivElement>(null);
  const [dialogPreviewScale, setDialogPreviewScale] = useState(1);

  const pdfPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = t.invoice.pageTitle;
  }, [t]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(min-width: 1536px)");

    const sync = (matches: boolean) => {
      setIsXlUp(matches);
      // On smaller screens, keep preview closed by default to avoid forcing
      // users to scroll between form and preview.
      setShowPreview(matches);
    };

    sync(mql.matches);

    const onChange = (e: MediaQueryListEvent) => sync(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isXlUp) return;
    if (!showPreview) return;

    const el = dialogPreviewViewportRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width ?? 0;
      if (!width) return;
      setDialogPreviewScale(Math.min(width / 600, 1));
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [isXlUp, showPreview]);

  const handleDownloadPDF = async () => {
    if (!pdfPreviewRef.current) return;

    toast.info(t.invoice.generatingPdf);

    try {
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");

      const canvas = await html2canvas(pdfPreviewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      const filePrefix = language === "fr" ? "facture" : "invoice";
      const draftLabel = language === "fr" ? "brouillon" : "draft";
      const fileName = `${filePrefix}-${invoiceData.invoiceNumber || draftLabel}.pdf`;
      pdf.save(fileName);

      toast.success(t.invoice.pdfDownloaded);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error(t.invoice.pdfError);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Starfield />
      <Navigation />
      <main className="flex-1 pt-24 md:pt-28 pb-12">
        <div className="w-full px-0 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-3 md:mb-4">
              {t.invoice.title}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              {t.invoice.subtitle}
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-6 md:mb-8">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2 w-full sm:w-auto"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? t.invoice.hidePreview : t.invoice.showPreview}
            </Button>
            <Button onClick={handleDownloadPDF} className="gap-2 w-full sm:w-auto">
              <Download className="w-4 h-4" />
              {t.invoice.downloadPdf}
            </Button>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 md:gap-8 2xl:grid-cols-2">
            {/* Form */}
            <div className={isXlUp && showPreview ? "" : "2xl:col-span-2 2xl:max-w-3xl 2xl:mx-auto"}>
              <InvoiceForm data={invoiceData} onChange={setInvoiceData} />
            </div>

            {/* Desktop Preview (2xl+) */}
            {isXlUp && showPreview && (
              <div className="2xl:sticky 2xl:top-24 2xl:self-start">
                <div className="bg-card rounded-xl border border-border p-5 md:p-6 shadow-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    {t.invoice.previewLabel}
                  </h3>
                  <div className="overflow-auto max-h-[80vh]">
                    <InvoicePreview data={invoiceData} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile/Tablet Preview (dialog) */}
          {!isXlUp && (
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogContent className="w-[calc(100vw-1.5rem)] max-w-none h-[calc(100vh-1.5rem)] overflow-hidden p-6 flex flex-col gap-6">
                <DialogHeader className="pr-10 flex-shrink-0">
                  <DialogTitle>{t.invoice.previewLabel}</DialogTitle>
                </DialogHeader>

                <div ref={dialogPreviewViewportRef} className="flex-1 min-h-0 overflow-auto">
                  <InvoicePreview data={invoiceData} />
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Offscreen preview used for PDF export (always available) */}
          <div className="fixed left-[-10000px] top-0" aria-hidden="true">
            <InvoicePreview ref={pdfPreviewRef} data={invoiceData} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Invoice;
