import { useLanguage } from "@/i18n/LanguageContext";
import { InvoiceData, currencies, InvoiceItem } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { useRef } from "react";

interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
}

export function InvoiceForm({ data, onChange }: InvoiceFormProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    const newItems = data.items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    onChange({ ...data, items: newItems });
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };

  const removeItem = (id: string) => {
    if (data.items.length <= 1) return;
    onChange({ ...data, items: data.items.filter(item => item.id !== id) });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      updateField('businessLogo', event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    updateField('businessLogo', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.invoice.form.businessInfo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Upload */}
          <div>
            <Label>{t.invoice.form.logo}</Label>
            <div className="mt-2">
              {data.businessLogo ? (
                <div className="relative inline-block">
                  <img 
                    src={data.businessLogo} 
                    alt="Logo" 
                    className="h-16 w-auto object-contain rounded border border-border"
                  />
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg hover:border-accent transition-colors text-sm text-muted-foreground"
                >
                  <Upload className="w-4 h-4" />
                  {t.invoice.form.uploadLogo}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessName">{t.invoice.form.businessName}</Label>
              <Input
                id="businessName"
                value={data.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                placeholder={t.invoice.form.businessNamePlaceholder}
              />
            </div>
            <div>
              <Label htmlFor="businessEmail">{t.invoice.form.email}</Label>
              <Input
                id="businessEmail"
                type="email"
                value={data.businessEmail}
                onChange={(e) => updateField('businessEmail', e.target.value)}
                placeholder={t.invoice.form.emailPlaceholder}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessPhone">{t.invoice.form.phone}</Label>
              <Input
                id="businessPhone"
                value={data.businessPhone}
                onChange={(e) => updateField('businessPhone', e.target.value)}
                placeholder={t.invoice.form.phonePlaceholder}
              />
            </div>
            <div>
              <Label htmlFor="accentColor">{t.invoice.form.accentColor}</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={data.accentColor}
                  onChange={(e) => updateField('accentColor', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={data.accentColor}
                  onChange={(e) => updateField('accentColor', e.target.value)}
                  placeholder="#1a1a2e"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="businessAddress">{t.invoice.form.address}</Label>
            <Textarea
              id="businessAddress"
              value={data.businessAddress}
              onChange={(e) => updateField('businessAddress', e.target.value)}
              placeholder={t.invoice.form.addressPlaceholder}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.invoice.form.clientInfo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">{t.invoice.form.clientName}</Label>
              <Input
                id="clientName"
                value={data.clientName}
                onChange={(e) => updateField('clientName', e.target.value)}
                placeholder={t.invoice.form.clientNamePlaceholder}
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">{t.invoice.form.email}</Label>
              <Input
                id="clientEmail"
                type="email"
                value={data.clientEmail}
                onChange={(e) => updateField('clientEmail', e.target.value)}
                placeholder={t.invoice.form.emailPlaceholder}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="clientAddress">{t.invoice.form.address}</Label>
            <Textarea
              id="clientAddress"
              value={data.clientAddress}
              onChange={(e) => updateField('clientAddress', e.target.value)}
              placeholder={t.invoice.form.addressPlaceholder}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.invoice.form.invoiceDetails}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">{t.invoice.form.invoiceNumber}</Label>
              <Input
                id="invoiceNumber"
                value={data.invoiceNumber}
                onChange={(e) => updateField('invoiceNumber', e.target.value)}
                placeholder="INV-001"
              />
            </div>
            <div>
              <Label htmlFor="invoiceDate">{t.invoice.form.invoiceDate}</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={data.invoiceDate}
                onChange={(e) => updateField('invoiceDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dueDate">{t.invoice.form.dueDate}</Label>
              <Input
                id="dueDate"
                type="date"
                value={data.dueDate}
                onChange={(e) => updateField('dueDate', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="currency">{t.invoice.form.currency}</Label>
            <Select value={data.currency} onValueChange={(v) => updateField('currency', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t.invoice.form.items}</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem} className="gap-1">
            <Plus className="w-4 h-4" />
            {t.invoice.form.addItem}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.items.map((item, index) => (
            <div key={item.id} className="flex gap-3 items-start">
              <div className="flex-1 grid sm:grid-cols-[1fr_80px_100px] gap-3">
                <div>
                  {index === 0 && <Label className="text-xs text-muted-foreground mb-1 block">{t.invoice.form.description}</Label>}
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    placeholder={t.invoice.form.descriptionPlaceholder}
                  />
                </div>
                <div>
                  {index === 0 && <Label className="text-xs text-muted-foreground mb-1 block">{t.invoice.form.qty}</Label>}
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  {index === 0 && <Label className="text-xs text-muted-foreground mb-1 block">{t.invoice.form.price}</Label>}
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                disabled={data.items.length <= 1}
                className={`mt-${index === 0 ? '6' : '0'}`}
              >
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tax & Discount */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.invoice.form.taxDiscount}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxRate">{t.invoice.form.taxRate}</Label>
              <div className="relative">
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={data.taxRate}
                  onChange={(e) => updateField('taxRate', parseFloat(e.target.value) || 0)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>
            <div>
              <Label htmlFor="discount">{t.invoice.form.discount}</Label>
              <div className="flex gap-2">
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.discount}
                  onChange={(e) => updateField('discount', parseFloat(e.target.value) || 0)}
                />
                <Select 
                  value={data.discountType} 
                  onValueChange={(v: 'percentage' | 'fixed') => updateField('discountType', v)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">{data.currency}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.invoice.form.notesTerms}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notes">{t.invoice.form.notes}</Label>
            <Textarea
              id="notes"
              value={data.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder={t.invoice.form.notesPlaceholder}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="paymentTerms">{t.invoice.form.paymentTerms}</Label>
            <Textarea
              id="paymentTerms"
              value={data.paymentTerms}
              onChange={(e) => updateField('paymentTerms', e.target.value)}
              placeholder={t.invoice.form.paymentTermsPlaceholder}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
