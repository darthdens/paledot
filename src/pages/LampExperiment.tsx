import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
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
  id: string;
  nameEn: string;
  nameFr: string;
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
    nameEn: "The Couch Lamp",
    nameFr: "La Lampe Salon",
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
    nameEn: "The Dining Lamp",
    nameFr: "La Lampe Salle à Manger",
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
    nameEn: "The Desk Lamp",
    nameFr: "La Lampe de Bureau",
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
    nameEn: "The Lounge Lamp",
    nameFr: "La Lampe de Chambre",
    price: "$2,350.00",
    images: {
      dayOn: loungeDayOn,
      dayOff: loungeDayOff,
      nightOn: loungeNightOn,
      nightOff: loungeNightOff,
    },
  },
];

// Toggle component matching the reference design
const LampToggle = ({ 
  checked, 
  onChange, 
  leftIcon, 
  rightIcon 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void;
  leftIcon: React.ReactNode;
  rightIcon: React.ReactNode;
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className={`transition-opacity duration-300 ${checked ? 'opacity-50' : 'opacity-100'}`}>
        {leftIcon}
      </span>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-14 h-7 rounded-full border-2 border-current transition-colors duration-300"
        aria-label="Toggle"
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-current transition-all duration-300 ease-in-out ${
            checked ? 'left-[calc(100%-22px)]' : 'left-0.5'
          }`}
        />
      </button>
      <span className={`transition-opacity duration-300 ${checked ? 'opacity-100' : 'opacity-50'}`}>
        {rightIcon}
      </span>
    </div>
  );
};

// Lightbulb icons
const LightbulbOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
  </svg>
);

const LightbulbOn = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    <line x1="12" y1="2" x2="12" y2="0" />
    <line x1="4.22" y1="4.22" x2="2.81" y2="2.81" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="4.22" y1="19.78" x2="2.81" y2="21.19" />
    <line x1="19.78" y1="4.22" x2="21.19" y2="2.81" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="19.78" y1="19.78" x2="21.19" y2="21.19" />
  </svg>
);

const Moon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const Sun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// Product card with image crossfade
const LampCard = ({ 
  lamp, 
  lampOn, 
  isDark,
  language
}: { 
  lamp: LampProduct; 
  lampOn: boolean;
  isDark: boolean;
  language: string;
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
      <div className="relative aspect-square overflow-hidden rounded-lg mb-3">
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
          alt={language === 'fr' ? lamp.nameFr : lamp.nameEn}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        />
      </div>
      <h3 className="font-medium text-foreground">
        {language === 'fr' ? lamp.nameFr : lamp.nameEn}
      </h3>
      <p className="text-sm text-muted-foreground">From {lamp.price}</p>
    </div>
  );
};

const LampExperiment = () => {
  const { language, t } = useLanguage();
  const [lampOn, setLampOn] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.title = language === 'fr' 
      ? "Expérience Lampes | Dens" 
      : "Lamp Experiment | Dens";
  }, [language]);

  // Apply dark class to document when isDark changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 relative">
      <Starfield />
      <Navigation />
      
      <main className="relative z-10 pt-24">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
          {/* Lamp Page Header */}
          <header className="flex items-center justify-between mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl italic">
              you love lamp©
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <a 
                href="https://x.com/densandco" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                follow
              </a>
              <a 
                href="https://dens.so" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                course
              </a>
            </div>
          </header>

          {/* Subtitle */}
          <p className="mb-8 text-muted-foreground">
            {language === 'fr' 
              ? "des lampes pour toutes occasions et pour un usage quotidien."
              : "lamps for all occasions and every day use."
            }
          </p>

          {/* Toggle controls */}
          <div className="flex items-center justify-between mb-6">
            {/* Lamp toggle (left) */}
            <LampToggle
              checked={lampOn}
              onChange={setLampOn}
              leftIcon={<LightbulbOff />}
              rightIcon={<LightbulbOn />}
            />
            
            {/* Theme toggle (right) */}
            <LampToggle
              checked={isDark}
              onChange={setIsDark}
              leftIcon={<Moon />}
              rightIcon={<Sun />}
            />
          </div>

          {/* Separator line */}
          <div className="h-px mb-8 bg-border transition-colors duration-500" />

          {/* Product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {lamps.map((lamp) => (
              <LampCard
                key={lamp.id}
                lamp={lamp}
                lampOn={lampOn}
                isDark={isDark}
                language={language}
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
