import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
import { DensSwitch } from "@/components/ui/dens-switch";
import { useThemePreference } from "@/hooks/use-theme-preference";
import { LightBulb, LightBulbOff, SunLight, HalfMoon } from "iconoir-react";

// Import lamp images
import couchDayOn from "@/assets/lamps/couch-lamp-day-on.jpg";
import couchDayOff from "@/assets/lamps/couch-lamp-day-off.jpg";
import couchNightOn from "@/assets/lamps/couch-lamp-night-on.jpg";
import couchNightOff from "@/assets/lamps/couch-lamp-night-off.jpg";

import diningDayOn from "@/assets/lamps/dining-lamp-day-on.jpg";
import diningDayOff from "@/assets/lamps/dining-lamp-day-off.jpg";
import diningNightOn from "@/assets/lamps/dining-lamp-night-on.jpg";
import diningNightOff from "@/assets/lamps/dining-lamp-night-off.jpg";

import deskDayOn from "@/assets/lamps/desk-lamp-day-on.jpg";
import deskDayOff from "@/assets/lamps/desk-lamp-day-off.jpg";
import deskNightOn from "@/assets/lamps/desk-lamp-night-on.jpg";
import deskNightOff from "@/assets/lamps/desk-lamp-night-off.jpg";

import loungeDayOn from "@/assets/lamps/lounge-lamp-day-on.jpg";
import loungeDayOff from "@/assets/lamps/lounge-lamp-day-off.jpg";
import loungeNightOn from "@/assets/lamps/lounge-lamp-night-on.jpg";
import loungeNightOff from "@/assets/lamps/lounge-lamp-night-off.jpg";

interface LampProduct {
  id: "couch" | "dining" | "desk" | "lounge";
  price: string;
  images: {
    dayOn: string;
    dayOff: string;
    nightOn: string;
    nightOff: string;
  };
}

const lamps: LampProduct[] = [
  {
    id: "couch",
    price: "$1,200.00",
    images: {
      dayOn: couchDayOn,
      dayOff: couchDayOff,
      nightOn: couchNightOn,
      nightOff: couchNightOff,
    },
  },
  {
    id: "dining",
    price: "$3,800.00",
    images: {
      dayOn: diningDayOn,
      dayOff: diningDayOff,
      nightOn: diningNightOn,
      nightOff: diningNightOff,
    },
  },
  {
    id: "desk",
    price: "$800.00",
    images: {
      dayOn: deskDayOn,
      dayOff: deskDayOff,
      nightOn: deskNightOn,
      nightOff: deskNightOff,
    },
  },
  {
    id: "lounge",
    price: "$2,350.00",
    images: {
      dayOn: loungeDayOn,
      dayOff: loungeDayOff,
      nightOn: loungeNightOn,
      nightOff: loungeNightOff,
    },
  },
];

// Product card with image crossfade
const LampCard = ({
  lamp,
  lampOn,
  isDark,
  lampName,
  fromText,
}: {
  lamp: LampProduct;
  lampOn: boolean;
  isDark: boolean;
  lampName: string;
  fromText: string;
}) => {
  const getImage = () => {
    if (isDark) {
      return lampOn ? lamp.images.nightOn : lamp.images.nightOff;
    }
    return lampOn ? lamp.images.dayOn : lamp.images.dayOff;
  };

  // Get all possible images for preloading
  const allImages = [
    lamp.images.dayOn,
    lamp.images.dayOff,
    lamp.images.nightOn,
    lamp.images.nightOff,
  ];

  return (
    <div className="group">
      <div className="relative aspect-square overflow-hidden rounded-lg mb-3 bg-muted">
        {/* Preload all images */}
        {allImages.map((src) => (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-0"
            aria-hidden="true"
          />
        ))}

        {/* Visible image with transition */}
        <img
          src={getImage()}
          alt={lampName}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        />
      </div>
      <h3 className="font-medium text-foreground">{lampName}</h3>
      <p className="text-sm text-muted-foreground">
        {fromText} {lamp.price}
      </p>
    </div>
  );
};

const LampExperiment = () => {
  const { language, t } = useLanguage();
  const [lampOn, setLampOn] = useState(false);
  const { isDark, setTheme } = useThemePreference();

  useEffect(() => {
    document.title =
      language === "fr"
        ? "Vitrine Interactive de Lampes | Dens"
        : "Interactive Lamp Showcase | Dens";
  }, [language]);

  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col">
      <Starfield />
      <Navigation />

      <main className="flex-1 relative z-10 pt-16">
        {/* Hero Section */}
        <section className="min-h-[40vh] flex items-center justify-center pt-20 md:pt-24 pb-12 md:pb-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-6 md:space-y-8">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold leading-tight">
                {t.lampExperiment.title}
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
                {t.lampExperiment.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Controls Section */}
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            {/* Lamp toggle (left) */}
            <div className="flex items-center gap-3">
              <LightBulbOff
                className="w-5 h-5 text-muted-foreground"
                strokeWidth={2}
              />
              <DensSwitch
                checked={lampOn}
                onCheckedChange={setLampOn}
                aria-label={lampOn ? t.lampExperiment.lampOn : t.lampExperiment.lampOff}
              />
              <LightBulb
                className="w-5 h-5 text-muted-foreground"
                strokeWidth={2}
              />
            </div>

            {/* Day/Night toggle (right) */}
            <div className="flex items-center gap-3">
              <HalfMoon
                className="w-5 h-5 text-muted-foreground"
                strokeWidth={2}
              />
              <DensSwitch
                checked={isDark}
                onCheckedChange={setTheme}
                aria-label={isDark ? t.lampExperiment.nightMode : t.lampExperiment.dayMode}
              />
              <SunLight
                className="w-5 h-5 text-muted-foreground"
                strokeWidth={2}
              />
            </div>
          </div>

          {/* Separator line */}
          <div className="h-px mb-8 bg-border" />

          {/* Product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 pb-16">
            {lamps.map((lamp) => (
              <LampCard
                key={lamp.id}
                lamp={lamp}
                lampOn={lampOn}
                isDark={isDark}
                lampName={t.lampExperiment.lamps[lamp.id]}
                fromText={t.lampExperiment.from}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LampExperiment;

