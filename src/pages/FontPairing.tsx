import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
import { FontHero } from "@/components/font/FontHero";
import { FontResults } from "@/components/font/FontResults";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2 } from "lucide-react";

export interface FontPair {
  heading: GoogleFont;
  body: GoogleFont;
  style: string;
}

export interface GoogleFont {
  family: string;
  category: string;
  variants: string[];
  url: string;
}

// Popular Google Fonts organized by category
const GOOGLE_FONTS: GoogleFont[] = [
  // Serif fonts
  { family: "Playfair Display", category: "serif", variants: ["400", "500", "600", "700", "800", "900"], url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap" },
  { family: "Merriweather", category: "serif", variants: ["300", "400", "700", "900"], url: "https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap" },
  { family: "Lora", category: "serif", variants: ["400", "500", "600", "700"], url: "https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap" },
  { family: "Source Serif Pro", category: "serif", variants: ["200", "300", "400", "600", "700", "900"], url: "https://fonts.googleapis.com/css2?family=Source+Serif+Pro:wght@200;300;400;600;700;900&display=swap" },
  { family: "Crimson Text", category: "serif", variants: ["400", "600", "700"], url: "https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap" },
  { family: "Libre Baskerville", category: "serif", variants: ["400", "700"], url: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap" },
  { family: "Cormorant Garamond", category: "serif", variants: ["300", "400", "500", "600", "700"], url: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap" },
  { family: "EB Garamond", category: "serif", variants: ["400", "500", "600", "700", "800"], url: "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700;800&display=swap" },
  
  // Sans-serif fonts
  { family: "Inter", category: "sans-serif", variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"], url: "https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" },
  { family: "Roboto", category: "sans-serif", variants: ["100", "300", "400", "500", "700", "900"], url: "https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap" },
  { family: "Open Sans", category: "sans-serif", variants: ["300", "400", "500", "600", "700", "800"], url: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap" },
  { family: "Montserrat", category: "sans-serif", variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"], url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap" },
  { family: "Poppins", category: "sans-serif", variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"], url: "https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap" },
  { family: "Raleway", category: "sans-serif", variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"], url: "https://fonts.googleapis.com/css2?family=Raleway:wght@100;200;300;400;500;600;700;800;900&display=swap" },
  { family: "Work Sans", category: "sans-serif", variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"], url: "https://fonts.googleapis.com/css2?family=Work+Sans:wght@100;200;300;400;500;600;700;800;900&display=swap" },
  { family: "Nunito", category: "sans-serif", variants: ["200", "300", "400", "500", "600", "700", "800", "900"], url: "https://fonts.googleapis.com/css2?family=Nunito:wght@200;300;400;500;600;700;800;900&display=swap" },
  { family: "DM Sans", category: "sans-serif", variants: ["400", "500", "700"], url: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" },
  { family: "Space Grotesk", category: "sans-serif", variants: ["300", "400", "500", "600", "700"], url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" },
  { family: "Manrope", category: "sans-serif", variants: ["200", "300", "400", "500", "600", "700", "800"], url: "https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap" },
  
  // Display fonts
  { family: "Bebas Neue", category: "display", variants: ["400"], url: "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" },
  { family: "Oswald", category: "display", variants: ["200", "300", "400", "500", "600", "700"], url: "https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;600;700&display=swap" },
  { family: "Anton", category: "display", variants: ["400"], url: "https://fonts.googleapis.com/css2?family=Anton&display=swap" },
  { family: "Abril Fatface", category: "display", variants: ["400"], url: "https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap" },
  { family: "Righteous", category: "display", variants: ["400"], url: "https://fonts.googleapis.com/css2?family=Righteous&display=swap" },
  
  // Monospace fonts
  { family: "JetBrains Mono", category: "monospace", variants: ["100", "200", "300", "400", "500", "600", "700", "800"], url: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&display=swap" },
  { family: "Fira Code", category: "monospace", variants: ["300", "400", "500", "600", "700"], url: "https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap" },
  { family: "Source Code Pro", category: "monospace", variants: ["200", "300", "400", "500", "600", "700", "900"], url: "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@200;300;400;500;600;700;900&display=swap" },
];

// Curated font pairings by style
const FONT_PAIRINGS: Record<string, Array<{ heading: string; body: string }>> = {
  modern: [
    { heading: "Montserrat", body: "Open Sans" },
    { heading: "Poppins", body: "Inter" },
    { heading: "Space Grotesk", body: "DM Sans" },
    { heading: "Manrope", body: "Work Sans" },
    { heading: "Raleway", body: "Nunito" },
  ],
  classic: [
    { heading: "Playfair Display", body: "Source Serif Pro" },
    { heading: "Cormorant Garamond", body: "Lora" },
    { heading: "EB Garamond", body: "Crimson Text" },
    { heading: "Libre Baskerville", body: "Merriweather" },
    { heading: "Lora", body: "Source Serif Pro" },
  ],
  elegant: [
    { heading: "Playfair Display", body: "Raleway" },
    { heading: "Cormorant Garamond", body: "Montserrat" },
    { heading: "Abril Fatface", body: "Poppins" },
    { heading: "Lora", body: "Open Sans" },
    { heading: "EB Garamond", body: "Work Sans" },
  ],
  bold: [
    { heading: "Bebas Neue", body: "Roboto" },
    { heading: "Oswald", body: "Open Sans" },
    { heading: "Anton", body: "Inter" },
    { heading: "Righteous", body: "Nunito" },
    { heading: "Montserrat", body: "DM Sans" },
  ],
  minimal: [
    { heading: "Inter", body: "Inter" },
    { heading: "Work Sans", body: "Work Sans" },
    { heading: "DM Sans", body: "DM Sans" },
    { heading: "Manrope", body: "Manrope" },
    { heading: "Space Grotesk", body: "Space Grotesk" },
  ],
  tech: [
    { heading: "Space Grotesk", body: "JetBrains Mono" },
    { heading: "Inter", body: "Fira Code" },
    { heading: "Manrope", body: "Source Code Pro" },
    { heading: "Work Sans", body: "JetBrains Mono" },
    { heading: "DM Sans", body: "Fira Code" },
  ],
};

const FontPairing = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [fontPairs, setFontPairs] = useState<FontPair[] | null>(null);

  useEffect(() => {
    document.title = t.fontPairing.pageTitle;
  }, [t]);

  const handleGenerate = async (style: string, pairCount: number) => {
    setIsLoading(true);
    
    // Simulate loading for UX
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const stylePairings = FONT_PAIRINGS[style] || FONT_PAIRINGS.modern;
    const pairs: FontPair[] = [];
    
    // Shuffle and pick pairCount pairs
    const shuffled = [...stylePairings].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(pairCount, shuffled.length));
    
    for (const pairing of selected) {
      const headingFont = GOOGLE_FONTS.find(f => f.family === pairing.heading);
      const bodyFont = GOOGLE_FONTS.find(f => f.family === pairing.body);
      
      if (headingFont && bodyFont) {
        pairs.push({
          heading: headingFont,
          body: bodyFont,
          style,
        });
      }
    }
    
    // Load the fonts
    const fontUrls = pairs.flatMap(p => [p.heading.url, p.body.url]);
    const uniqueUrls = [...new Set(fontUrls)];
    
    // Add font links to document
    uniqueUrls.forEach(url => {
      if (!document.querySelector(`link[href="${url}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        document.head.appendChild(link);
      }
    });
    
    // Wait for fonts to load
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setFontPairs(pairs);
    setIsLoading(false);
  };

  const handleReset = () => {
    setFontPairs(null);
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Starfield />
      <Navigation />
      <main className="flex-1 flex flex-col items-center justify-center pt-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
            <p className="text-muted-foreground">{t.fontPairing.generating}</p>
          </div>
        ) : !fontPairs ? (
          <FontHero onGenerate={handleGenerate} isLoading={isLoading} />
        ) : (
          <FontResults fontPairs={fontPairs} onReset={handleReset} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default FontPairing;
