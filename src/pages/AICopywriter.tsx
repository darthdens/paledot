import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
import { CopyHero } from "@/components/copy/CopyHero";
import { CopyResults } from "@/components/copy/CopyResults";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface GeneratedCopy {
  content: string;
  copyType: string;
  tone: string;
  platform: string;
  prompt: string;
}

const AICopywriter = () => {
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null);
  const [streamingContent, setStreamingContent] = useState("");

  useEffect(() => {
    document.title = t.copywriter.pageTitle;
  }, [t]);

  const handleGenerate = async (prompt: string, copyType: string, tone: string, platform: string) => {
    setIsLoading(true);
    setStreamingContent("");
    setGeneratedCopy(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-copy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt, copyType, tone, platform, language }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate copy");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setStreamingContent(fullContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setGeneratedCopy({
        content: fullContent,
        copyType,
        tone,
        platform,
        prompt,
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : t.copywriter.generationFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setGeneratedCopy(null);
    setStreamingContent("");
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Starfield />
      <Navigation />
      <main className="flex-1 flex flex-col items-center justify-center pt-16">
        {isLoading ? (
          <div className="container mx-auto px-6 py-20">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
                <p className="text-muted-foreground">{t.copywriter.generating}</p>
              </div>
              {streamingContent && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <p className="whitespace-pre-wrap leading-relaxed">{streamingContent}</p>
                </div>
              )}
            </div>
          </div>
        ) : !generatedCopy ? (
          <CopyHero onGenerate={handleGenerate} isLoading={isLoading} />
        ) : (
          <CopyResults copy={generatedCopy} onReset={handleReset} onRegenerate={handleGenerate} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AICopywriter;
