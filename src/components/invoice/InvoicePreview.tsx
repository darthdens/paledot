import { forwardRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { InvoiceData, calculateTotal, formatCurrency } from "./types";

interface InvoicePreviewProps {
  data: InvoiceData;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ data }, ref) => {
    const { t, language } = useLanguage();
    const totals = calculateTotal(data);

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const locale = language === 'fr' ? 'fr-FR' : 'en-US';
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatAmount = (amount: number) => formatCurrency(amount, data.currency, language);

    return (
      <div
        ref={ref}
        className="bg-white text-gray-900 p-4 sm:p-8 w-full font-sans text-sm"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {data.businessLogo ? (
              <img 
                src={data.businessLogo} 
                alt="Logo" 
                className="h-12 w-auto object-contain mb-3"
              />
            ) : (
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: data.accentColor }}
              >
                {data.businessName || t.invoice.preview.yourBusiness}
              </div>
            )}
            {data.businessLogo && data.businessName && (
              <div className="text-lg font-semibold text-gray-900">
                {data.businessName}
              </div>
            )}
            <div className="text-gray-600 text-xs mt-2 whitespace-pre-line">
              {data.businessAddress}
            </div>
            {data.businessEmail && (
              <div className="text-gray-600 text-xs">{data.businessEmail}</div>
            )}
            {data.businessPhone && (
              <div className="text-gray-600 text-xs">{data.businessPhone}</div>
            )}
          </div>
          <div className="text-right">
            <div 
              className="text-3xl font-bold mb-2"
              style={{ color: data.accentColor }}
            >
              {t.invoice.preview.invoice}
            </div>
            <div className="text-gray-600 text-xs space-y-1">
              <div>
                <span className="font-medium">{t.invoice.preview.invoiceNo}:</span>{' '}
                {data.invoiceNumber}
              </div>
              <div>
                <span className="font-medium">{t.invoice.preview.date}:</span>{' '}
                {formatDate(data.invoiceDate)}
              </div>
              <div>
                <span className="font-medium">{t.invoice.preview.dueDate}:</span>{' '}
                {formatDate(data.dueDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div 
          className="mb-8 p-4 rounded-lg"
          style={{ backgroundColor: `${data.accentColor}10` }}
        >
          <div 
            className="text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: data.accentColor }}
          >
            {t.invoice.preview.billTo}
          </div>
          <div className="font-medium text-gray-900">
            {data.clientName || t.invoice.preview.clientName}
          </div>
          <div className="text-gray-600 text-xs whitespace-pre-line">
            {data.clientAddress}
          </div>
          {data.clientEmail && (
            <div className="text-gray-600 text-xs">{data.clientEmail}</div>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr 
                className="text-xs uppercase tracking-wide"
                style={{ 
                  borderBottom: `2px solid ${data.accentColor}`,
                  color: data.accentColor 
                }}
              >
                <th className="text-left py-2 font-semibold">{t.invoice.preview.description}</th>
                <th className="text-center py-2 font-semibold w-20">{t.invoice.preview.qty}</th>
                <th className="text-right py-2 font-semibold w-28">{t.invoice.preview.unitPrice}</th>
                <th className="text-right py-2 font-semibold w-28">{t.invoice.preview.amount}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr 
                  key={item.id}
                  className="border-b border-gray-100"
                  style={{ backgroundColor: index % 2 === 1 ? '#fafafa' : 'transparent' }}
                >
                  <td className="py-3 text-gray-900">
                    {item.description || t.invoice.preview.itemDescription}
                  </td>
                  <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">
                    {formatAmount(item.unitPrice)}
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {formatAmount(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>{t.invoice.preview.subtotal}</span>
              <span>{formatAmount(totals.subtotal)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>
                  {t.invoice.preview.discount}
                  {data.discountType === 'percentage' && ` (${data.discount}%)`}
                </span>
                <span>-{formatAmount(totals.discountAmount)}</span>
              </div>
            )}
            {data.taxRate > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{t.invoice.preview.tax} ({data.taxRate}%)</span>
                <span>{formatAmount(totals.taxAmount)}</span>
              </div>
            )}
            <div 
              className="flex justify-between font-bold text-lg pt-2"
              style={{ 
                borderTop: `2px solid ${data.accentColor}`,
                color: data.accentColor 
              }}
            >
              <span>{t.invoice.preview.total}</span>
              <span>{formatAmount(totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(data.notes || data.paymentTerms) && (
          <div className="border-t border-gray-200 pt-6 space-y-4">
            {data.notes && (
              <div>
                <div 
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: data.accentColor }}
                >
                  {t.invoice.preview.notes}
                </div>
                <div className="text-gray-600 text-xs whitespace-pre-line">
                  {data.notes}
                </div>
              </div>
            )}
            {data.paymentTerms && (
              <div>
                <div 
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: data.accentColor }}
                >
                  {t.invoice.preview.paymentTerms}
                </div>
                <div className="text-gray-600 text-xs whitespace-pre-line">
                  {data.paymentTerms}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          {t.invoice.preview.thankYou}
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";
