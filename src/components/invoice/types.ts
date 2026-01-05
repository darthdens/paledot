export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceData {
  // Business Info
  businessName: string;
  businessAddress: string;
  businessEmail: string;
  businessPhone: string;
  businessLogo: string | null;
  
  // Client Info
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  
  // Invoice Details
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  
  // Items
  items: InvoiceItem[];
  
  // Extras
  taxRate: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  currency: string;
  notes: string;
  paymentTerms: string;
  
  // Branding
  accentColor: string;
}

export const defaultInvoiceData: InvoiceData = {
  businessName: '',
  businessAddress: '',
  businessEmail: '',
  businessPhone: '',
  businessLogo: null,
  
  clientName: '',
  clientAddress: '',
  clientEmail: '',
  
  invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  
  items: [
    { id: '1', description: '', quantity: 1, unitPrice: 0 }
  ],
  
  taxRate: 0,
  discount: 0,
  discountType: 'percentage',
  currency: 'USD',
  notes: '',
  paymentTerms: '',
  
  accentColor: '#1a1a2e',
};

export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

export function getCurrencySymbol(code: string): string {
  return currencies.find(c => c.code === code)?.symbol || code;
}

export function formatCurrency(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toFixed(2)}`;
}

export function calculateSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
}

export function calculateDiscount(subtotal: number, discount: number, type: 'percentage' | 'fixed'): number {
  if (type === 'percentage') {
    return subtotal * (discount / 100);
  }
  return discount;
}

export function calculateTax(amount: number, taxRate: number): number {
  return amount * (taxRate / 100);
}

export function calculateTotal(data: InvoiceData): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = calculateSubtotal(data.items);
  const discountAmount = calculateDiscount(subtotal, data.discount, data.discountType);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = calculateTax(taxableAmount, data.taxRate);
  const total = taxableAmount + taxAmount;
  
  return { subtotal, discountAmount, taxableAmount, taxAmount, total };
}
