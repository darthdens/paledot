import { useLanguage } from '@/i18n/LanguageContext';
import { useCosmosStore } from '../store/useCosmosStore';
import { UNITS } from '../types';
import { MapPin } from 'lucide-react';

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
  
  // Only show when zoomed out to galactic scale
  const isGalacticScale = currentScale === 'milkyWay' || currentScale === 'stellar';
  
  if (!isGalacticScale) return null;
  
  return (
    <div className="absolute top-20 left-4 z-20 animate-fade-in">
      <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 border border-emerald-500/30">
        <div className="flex items-center gap-2 text-emerald-400 mb-2">
          <MapPin className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-semibold">{t.youAreHere}</span>
        </div>
        
        <div className="space-y-1 text-xs">
          <p className="text-white/90">{t.solarSystem}</p>
          <p className="text-white/60">{t.orionArm}</p>
          <p className="text-white/60">{t.milkyWay}</p>
          <p className="text-emerald-300/80 mt-2">
            ~26,000 {language === 'en' ? 'light-years' : 'années-lumière'} {t.distanceFromCenter}
          </p>
        </div>
      </div>
    </div>
  );
};
