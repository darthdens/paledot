import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
import { useLanguage } from "@/i18n/LanguageContext";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";
import { InvoicePreview } from "@/components/invoice/InvoicePreview";
import { InvoiceData, defaultInvoiceData } from "@/components/invoice/types";
import { Button } from "@/components/ui/button";
import { Download, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const Invoice = () => {
  const { t, language } = useLanguage();
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(defaultInvoiceData);
  const [showPreview, setShowPreview] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = t.invoice.pageTitle;
  }, [t]);

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    
    toast.info(t.invoice.generatingPdf);
    
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      const filePrefix = language === 'fr' ? 'facture' : 'invoice';
      const draftLabel = language === 'fr' ? 'brouillon' : 'draft';
      const fileName = `${filePrefix}-${invoiceData.invoiceNumber || draftLabel}.pdf`;
      pdf.save(fileName);
      
      toast.success(t.invoice.pdfDownloaded);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(t.invoice.pdfError);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Starfield />
      <Navigation />
      <main className="flex-1 pt-20 md:pt-24 pb-12">
        <div className="container mx-auto px-4 md:px-6">
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
          <div className={`grid gap-6 md:gap-8 ${showPreview ? 'xl:grid-cols-2' : 'max-w-2xl mx-auto'}`}>
            {/* Form */}
            <div className="order-2 xl:order-1">
              <InvoiceForm 
                data={invoiceData} 
                onChange={setInvoiceData} 
              />
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="order-1 xl:order-2 xl:sticky xl:top-24 xl:self-start">
                <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 md:mb-4">
                    {t.invoice.previewLabel}
                  </h3>
                  <div className="overflow-auto max-h-[50vh] md:max-h-[60vh] xl:max-h-[80vh]">
                    <InvoicePreview ref={previewRef} data={invoiceData} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Invoice;
