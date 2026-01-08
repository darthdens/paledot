import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { X, Navigation, Maximize2 } from 'lucide-react';
import { useCosmosStore } from '../store/useCosmosStore';
import { UNITS } from '../types';

const translations = {
  en: {
    distance: 'Distance from Earth',
    size: 'Diameter',
    type: 'Type',
    facts: 'Facts',
    flyTo: 'Fly to',
    close: 'Close',
    km: 'km',
    planet: 'Planet',
    star: 'Star',
    moon: 'Moon',
    'dwarf-planet': 'Dwarf Planet',
    nebula: 'Nebula',
    galaxy: 'Galaxy',
    cluster: 'Galaxy Cluster',
    other: 'Deep Space Object',
  },
  fr: {
    distance: 'Distance de la Terre',
    size: 'Diamètre',
    type: 'Type',
    facts: 'Faits',
    flyTo: 'Aller vers',
    close: 'Fermer',
    km: 'km',
    planet: 'Planète',
    star: 'Étoile',
    moon: 'Lune',
    'dwarf-planet': 'Planète Naine',
    nebula: 'Nébuleuse',
    galaxy: 'Galaxie',
    cluster: 'Amas de Galaxies',
    other: 'Objet de l\'Espace Profond',
  },
};

const formatDistance = (distance: number, unit: string, language: string): string => {
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  
  if (unit === 'km') {
    if (distance >= 1e9) {
      return `${(distance / 1e9).toLocaleString(locale, { maximumFractionDigits: 2 })} B km`;
    }
    if (distance >= 1e6) {
      return `${(distance / 1e6).toLocaleString(locale, { maximumFractionDigits: 2 })} M km`;
    }
    return `${distance.toLocaleString(locale)} km`;
  }
  
  if (unit === 'AU') {
    return `${(distance / UNITS.KM_PER_AU).toLocaleString(locale, { maximumFractionDigits: 2 })} AU`;
  }
  
  if (unit === 'ly') {
    return `${distance.toLocaleString(locale, { maximumFractionDigits: 2 })} ${language === 'fr' ? 'a.l.' : 'ly'}`;
  }
  
  if (unit === 'Mly') {
    return `${distance.toLocaleString(locale, { maximumFractionDigits: 2 })} M ${language === 'fr' ? 'a.l.' : 'ly'}`;
  }
  
  if (unit === 'Bly') {
    return `${distance.toLocaleString(locale, { maximumFractionDigits: 2 })} B ${language === 'fr' ? 'a.l.' : 'ly'}`;
  }
  
  return `${distance.toLocaleString(locale)}`;
};

const formatSize = (size: number, language: string): string => {
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  
  if (size >= 1e9) {
    return `${(size / 1e9).toLocaleString(locale, { maximumFractionDigits: 2 })} B km`;
  }
  if (size >= 1e6) {
    return `${(size / 1e6).toLocaleString(locale, { maximumFractionDigits: 2 })} M km`;
  }
  if (size >= 1000) {
    return `${(size / 1000).toLocaleString(locale, { maximumFractionDigits: 1 })}K km`;
  }
  return `${size.toLocaleString(locale)} km`;
};

export const InfoCard = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const selectedObject = useCosmosStore(state => state.selectedObject);
  const setSelectedObject = useCosmosStore(state => state.setSelectedObject);
  const jumpToObject = useCosmosStore(state => state.jumpToObject);

  if (!selectedObject) return null;

  const handleClose = () => setSelectedObject(null);
  
  const handleFlyTo = () => {
    jumpToObject(selectedObject);
  };

  const objectType = t[selectedObject.type as keyof typeof t] || selectedObject.type;
  const facts = selectedObject.facts?.[language] || [];

  return (
    <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-auto z-50 w-auto sm:w-72 md:w-80 max-h-[45vh] overflow-y-auto bg-black/90 backdrop-blur-md rounded-lg border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <h3 className="text-white font-semibold text-sm sm:text-base">
          {selectedObject.name[language]}
        </h3>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleClose}
          className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Type badge */}
        <div className="flex items-center gap-2">
          <span 
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: selectedObject.color + '33',
              color: selectedObject.color,
              border: `1px solid ${selectedObject.color}66`
            }}
          >
            {objectType}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/50 text-xs">{t.distance}</div>
            <div className="text-white font-medium">
              {formatDistance(selectedObject.distanceFromEarth, selectedObject.distanceUnit, language)}
            </div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/50 text-xs">{t.size}</div>
            <div className="text-white font-medium">
              {formatSize(selectedObject.size, language)}
            </div>
          </div>
        </div>

        {/* Facts */}
        {facts.length > 0 && (
          <div className="space-y-1">
            <div className="text-white/50 text-xs">{t.facts}</div>
            <ul className="space-y-1">
              {facts.map((fact, index) => (
                <li key={index} className="text-white/80 text-xs flex items-start gap-1.5">
                  <span className="text-white/40 mt-0.5">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleFlyTo}
            className="flex-1 text-xs bg-white/10 hover:bg-white/20 text-white border-0"
          >
            <Navigation className="w-3 h-3 mr-1.5" />
            {t.flyTo}
          </Button>
        </div>
      </div>
    </div>
  );
};
