import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCosmosStore } from '../store/useCosmosStore';
import { UNITS } from '../types';
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react';

const translations = {
  en: {
    youAreHere: 'You Are Here',
    solarSystem: 'Solar System',
    milkyWay: 'in the Milky Way Galaxy',
    distanceFromCenter: 'from galactic center',
    orionArm: 'Orion-Cygnus Arm',
  },
  fr: {
    youAreHere: 'Vous Êtes Ici',
    solarSystem: 'Système Solaire',
    milkyWay: 'dans la Voie Lactée',
    distanceFromCenter: 'du centre galactique',
    orionArm: 'Bras d\'Orion-Cygne',
  },
};

export const YouAreHereLabel = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const currentScale = useCosmosStore(state => state.currentScale);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Show when zoomed out to stellar scale or beyond
  const isGalacticScale = currentScale === 'stellar' || currentScale === 'milkyWay' || currentScale === 'localGroup' || currentScale === 'universe';
  
  if (!isGalacticScale) return null;
  
  return (
    <div className="absolute top-[68px] right-4 sm:right-auto sm:left-4 sm:top-4 z-20 animate-fade-in">
      <div className="bg-black/70 backdrop-blur-sm rounded-lg border border-emerald-500/30 overflow-hidden max-w-[200px] sm:max-w-none">
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2 text-emerald-400">
            <MapPin className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-semibold">{t.youAreHere}</span>
          </div>
          {isMinimized ? (
            <ChevronDown className="w-4 h-4 text-white/60" />
          ) : (
            <ChevronUp className="w-4 h-4 text-white/60" />
          )}
        </button>
        
        {!isMinimized && (
          <div className="px-3 pb-3 space-y-1 text-xs border-t border-white/10 pt-2">
            <p className="text-white/90">{t.solarSystem}</p>
            <p className="text-white/60">{t.orionArm}</p>
            <p className="text-white/60">{t.milkyWay}</p>
            <p className="text-emerald-300/80 mt-2">
              ~26,000 {language === 'en' ? 'light-years' : 'années-lumière'} {t.distanceFromCenter}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
