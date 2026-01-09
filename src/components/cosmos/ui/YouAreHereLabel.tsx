import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCosmosStore } from '../store/useCosmosStore';
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react';

const translations = {
  en: {
    currentLocation: 'Current Location',
    // Scale-specific locations
    earth: {
      title: 'Earth Orbit',
      subtitle: 'Inner Solar System',
      details: ['Third planet from the Sun', '1 AU from the Sun', 'Home of humanity'],
    },
    solarSystem: {
      title: 'Solar System',
      subtitle: 'Our cosmic neighborhood',
      details: ['8 planets orbiting the Sun', 'Located in the Orion Arm', '~4.6 billion years old'],
    },
    stellar: {
      title: 'Local Stellar Neighborhood',
      subtitle: 'Nearby stars',
      details: ['Within a few light-years of the Sun', 'Proxima Centauri: 4.24 ly away', 'Part of the Orion-Cygnus Arm'],
    },
    milkyWay: {
      title: 'Milky Way Galaxy',
      subtitle: 'Our galactic home',
      details: ['~100-400 billion stars', '~100,000 light-years across', 'Sun is 26,000 ly from center'],
    },
    localGroup: {
      title: 'Local Group',
      subtitle: 'Our galaxy cluster',
      details: ['~80+ galaxies', 'Andromeda is our neighbor', '~10 million light-years across'],
    },
    universe: {
      title: 'Observable Universe',
      subtitle: 'The cosmic web',
      details: ['~2 trillion galaxies', '~93 billion light-years diameter', '~13.8 billion years old'],
    },
  },
  fr: {
    currentLocation: 'Position Actuelle',
    earth: {
      title: 'Orbite Terrestre',
      subtitle: 'Système Solaire Interne',
      details: ['Troisième planète depuis le Soleil', '1 UA du Soleil', 'Berceau de l\'humanité'],
    },
    solarSystem: {
      title: 'Système Solaire',
      subtitle: 'Notre voisinage cosmique',
      details: ['8 planètes orbitant le Soleil', 'Situé dans le Bras d\'Orion', '~4,6 milliards d\'années'],
    },
    stellar: {
      title: 'Voisinage Stellaire Local',
      subtitle: 'Étoiles proches',
      details: ['À quelques années-lumière du Soleil', 'Proxima Centauri: 4,24 al', 'Partie du Bras d\'Orion-Cygne'],
    },
    milkyWay: {
      title: 'Voie Lactée',
      subtitle: 'Notre galaxie',
      details: ['~100-400 milliards d\'étoiles', '~100 000 années-lumière de diamètre', 'Soleil à 26 000 al du centre'],
    },
    localGroup: {
      title: 'Groupe Local',
      subtitle: 'Notre amas de galaxies',
      details: ['~80+ galaxies', 'Andromède est notre voisine', '~10 millions d\'années-lumière'],
    },
    universe: {
      title: 'Univers Observable',
      subtitle: 'La toile cosmique',
      details: ['~2 000 milliards de galaxies', '~93 milliards d\'années-lumière', '~13,8 milliards d\'années'],
    },
  },
};

export const YouAreHereLabel = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const currentScale = useCosmosStore(state => state.currentScale);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Get location info based on current scale
  const getLocationInfo = () => {
    switch (currentScale) {
      case 'earth':
        return t.earth;
      case 'solarSystem':
        return t.solarSystem;
      case 'stellar':
        return t.stellar;
      case 'milkyWay':
        return t.milkyWay;
      case 'localGroup':
        return t.localGroup;
      case 'universe':
        return t.universe;
      default:
        return t.solarSystem;
    }
  };
  
  const locationInfo = getLocationInfo();
  
  return (
    <div className="absolute top-12 right-2 sm:right-auto sm:left-4 sm:top-4 z-20 animate-fade-in">
      <div className="bg-black/70 backdrop-blur-sm rounded-lg border border-emerald-500/30 overflow-hidden max-w-[220px] sm:max-w-none">
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2 text-emerald-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-semibold">{t.currentLocation}</span>
          </div>
          {isMinimized ? (
            <ChevronDown className="w-4 h-4 text-white/60" />
          ) : (
            <ChevronUp className="w-4 h-4 text-white/60" />
          )}
        </button>
        
        {!isMinimized && (
          <div className="px-3 pb-3 space-y-1 border-t border-white/10 pt-2">
            <p className="text-white font-medium">{locationInfo.title}</p>
            <p className="text-emerald-300/80 text-xs">{locationInfo.subtitle}</p>
            <div className="mt-2 space-y-0.5">
              {locationInfo.details.map((detail, index) => (
                <p key={index} className="text-white/60 text-xs">• {detail}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
