import { useEffect, useState } from "react";

import { CosmosExplorer } from "@/components/cosmos/CosmosExplorer";
import { WebGLBoundary } from "@/components/cosmos/WebGLBoundary";
import { useLanguage } from "@/i18n/LanguageContext";

const copy = {
  en: {
    title: "Pale Dot",
    tagline: "Explore the observable universe",
    body1:
      "In 1990, Voyager 1 turned around six billion kilometres from home and photographed Earth: a pale blue dot, smaller than a pixel, hanging in a sunbeam.",
    body2:
      "Pale Dot starts you on that dot and lets you travel in 3D past the planets, the stars and the galaxies, all the way to the edge of the observable universe.",
    credit: "Created by",
    name: "Dens Akoka",
    cta: "Continue",
  },
  fr: {
    title: "Pale Dot",
    tagline: "Explorez l'univers observable",
    body1:
      "En 1990, Voyager 1 s'est retournée à six milliards de kilomètres de chez nous et a photographié la Terre : un point bleu pâle, plus petit qu'un pixel, suspendu dans un rayon de soleil.",
    body2:
      "Pale Dot vous place sur ce point et vous emmène en 3D au-delà des planètes, des étoiles et des galaxies, jusqu'aux confins de l'univers observable.",
    credit: "Créé par",
    name: "Dens Akoka",
    cta: "Continuer",
  },
} as const;

const PaleDot = () => {
  const { language } = useLanguage();
  const t = copy[language];
  const [started, setStarted] = useState(false);

  useEffect(() => {
    document.title =
      language === "fr"
        ? "Pale Dot : explorez l'univers observable"
        : "Pale Dot: explore the observable universe";
  }, [language]);

  if (!started) {
    return (
      <div
        className="dark fixed inset-0 z-10 flex items-center justify-center overflow-y-auto px-6 text-foreground"
        style={{ backgroundColor: "#0a0a0f", colorScheme: "dark", minHeight: "100dvh" }}
        data-cosmos-container
      >
        <div className="max-w-xl text-center space-y-6 py-12 animate-in fade-in duration-700">
          <div
            aria-hidden="true"
            className="mx-auto h-2 w-2 rounded-full"
            style={{ backgroundColor: "hsl(205 70% 75%)", boxShadow: "0 0 18px 4px hsl(205 70% 75% / 0.45)" }}
          />
          <div className="space-y-2">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold">{t.title}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">{t.tagline}</p>
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-foreground/80">{t.body1}</p>
          <p className="text-sm sm:text-base leading-relaxed text-foreground/80">{t.body2}</p>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-white/15 px-8 py-3 text-sm font-medium text-foreground backdrop-blur-md border border-white/20 transition-colors hover:bg-white/25"
          >
            {t.cta}
          </button>
          <p className="text-xs text-muted-foreground/70">
            {t.credit}{" "}
            <a
              href="https://dens.so"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/90 underline decoration-white/50 underline-offset-2 transition-colors hover:text-foreground hover:decoration-white/80"
            >
              {t.name}
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="dark fixed inset-0 w-screen overflow-hidden"
      style={{
        height: "100dvh",
        backgroundColor: "#0a0a0f",
        colorScheme: "dark",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
      data-cosmos-container
      data-cosmos-native="true"
    >
      <WebGLBoundary>
        <CosmosExplorer />
      </WebGLBoundary>
    </div>
  );
};

export default PaleDot;
