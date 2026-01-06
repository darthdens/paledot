import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { Copy, RefreshCw, ArrowLeft, Check, AlertCircle, Minimize2, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import type { FormattedJson } from "@/pages/JsonFormatter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface JsonResultsProps {
  result: FormattedJson;
  onReset: () => void;
  onReformat: (input: string, indentSize: number) => void;
}

export const JsonResults = ({ result, onReset, onReformat }: JsonResultsProps) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("formatted");

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(t.jsonFormatter.copied);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error(t.jsonFormatter.copyFailed);
    }
  };

  const translateError = (error: string): string => {
    const errors = t.jsonFormatter.errors;
    
    // Replace common JSON error patterns with translated versions
    let translatedError = error
      .replace(/Unterminated string/gi, errors.unterminatedString)
      .replace(/Unexpected token/gi, errors.unexpectedToken)
      .replace(/Unexpected end of JSON input/gi, errors.unexpectedEnd)
      .replace(/Invalid character/gi, errors.invalidCharacter)
      .replace(/Expected property name or '\}'/gi, errors.expectedProperty)
      .replace(/Expected ':'/gi, errors.expectedColon)
      .replace(/Expected ',' or '\}'/gi, errors.expectedComma)
      .replace(/at position/gi, errors.atPosition)
      .replace(/\(line (\d+)/gi, `(${errors.line} $1`)
      .replace(/column (\d+)\)/gi, `${errors.column} $1)`);
    
    return translatedError;
  };

  if (!result.isValid) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center pt-20 md:pt-24 pb-12 md:pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="w-full max-w-3xl mx-auto space-y-6 md:space-y-8">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-2 min-w-0 flex-1 overflow-hidden">
                  <h2 className="text-lg sm:text-xl font-semibold text-destructive">
                    {t.jsonFormatter.invalidJson}
                  </h2>
                  <p className="text-muted-foreground font-mono text-xs sm:text-sm break-all whitespace-pre-wrap">
                    {translateError(result.error || "")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t.jsonFormatter.originalInput}</p>
              <pre className="bg-card border border-border rounded-lg p-3 sm:p-4 text-xs sm:text-sm font-mono max-h-[250px] sm:max-h-[300px] overflow-auto break-all whitespace-pre-wrap">
                {result.original}
              </pre>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <Button variant="outline" onClick={onReset} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t.jsonFormatter.tryAgain}
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[60vh] flex items-center justify-center pt-20 md:pt-24 pb-12 md:pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <h2 className="text-xl sm:text-2xl font-semibold">{t.jsonFormatter.validJson}</h2>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3 sm:mb-4 h-12 p-1 rounded-lg overflow-hidden">
              <TabsTrigger 
                value="formatted" 
                className="gap-1 sm:gap-2 text-sm sm:text-base flex items-center justify-center rounded-md h-full data-[state=active]:rounded-md"
              >
                <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
                {t.jsonFormatter.formatted}
              </TabsTrigger>
              <TabsTrigger 
                value="minified" 
                className="gap-1 sm:gap-2 text-sm sm:text-base flex items-center justify-center rounded-md h-full data-[state=active]:rounded-md"
              >
                <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" />
                {t.jsonFormatter.minified}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="formatted" className="space-y-4">
              <div className="relative">
                <pre className="bg-card border border-border rounded-lg p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm font-mono max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                  {result.formatted}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 gap-1 sm:gap-2 text-xs sm:text-sm"
                  onClick={() => handleCopy(result.formatted, "formatted")}
                >
                  {copied === "formatted" ? (
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                  <span className="hidden sm:inline">{t.jsonFormatter.copy}</span>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="minified" className="space-y-4">
              <div className="relative">
                <pre className="bg-card border border-border rounded-lg p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm font-mono max-h-[300px] sm:max-h-[400px] overflow-y-auto break-all whitespace-pre-wrap">
                  {result.minified}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 gap-1 sm:gap-2 text-xs sm:text-sm"
                  onClick={() => handleCopy(result.minified, "minified")}
                >
                  {copied === "minified" ? (
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                  <span className="hidden sm:inline">{t.jsonFormatter.copy}</span>
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Button variant="outline" onClick={onReset} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t.jsonFormatter.startOver}
            </Button>
            <Button
              variant="secondary"
              onClick={() => onReformat(result.original, 2)}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t.jsonFormatter.reformat}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};