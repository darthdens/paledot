import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { X, Navigation, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { useCosmosStore } from '../store/useCosmosStore';
import { useFullscreenStore } from '../store/useFullscreenStore';
import { UNITS } from '../types';
import { ORBITAL_PERIODS } from '../data/celestialObjects';
import { useState } from 'react';

// Rotation periods in hours (negative = retrograde)
const ROTATION_PERIODS_HOURS: Record<string, number> = {
  sun: 609.12,
  mercury: 1407.6,
  venus: -5832.5,
  earth: 23.934,
  moon: 655.7,
  mars: 24.623,
  phobos: 7.66,        // Tidally locked to Mars
  deimos: 30.3,        // Tidally locked to Mars
  ceres: 9.07,
  jupiter: 9.925,
  io: 42.46,
  europa: 85.23,
  ganymede: 171.71,
  callisto: 400.54,
  saturn: 10.656,
  mimas: 22.6,         // Tidally locked to Saturn
  enceladus: 32.9,     // Tidally locked to Saturn
  tethys: 45.3,        // Tidally locked to Saturn
  dione: 65.7,         // Tidally locked to Saturn
  rhea: 108.4,         // Tidally locked to Saturn
  titan: 382.68,
  iapetus: 1903.9,     // Tidally locked to Saturn
  uranus: -17.24,
  miranda: 33.9,       // Tidally locked to Uranus
  ariel: 60.5,         // Tidally locked to Uranus
  umbriel: 99.5,       // Tidally locked to Uranus
  titania: 209.0,      // Tidally locked to Uranus
  oberon: 323.1,       // Tidally locked to Uranus
  neptune: 16.11,
  triton: -141.0,      // Retrograde, tidally locked to Neptune
  pluto: -153.29,
};

const translations = {
  en: {
    distance: 'Distance from Earth',
    size: 'Diameter',
    type: 'Type',
    facts: 'Facts',
    flyTo: 'Fly to',
    close: 'Close',
    follow: 'Follow',
    unfollow: 'Unfollow',
    km: 'km',
    planet: 'Planet',
    star: 'Star',
    moon: 'Moon',
    'dwarf-planet': 'Dwarf Planet',
    nebula: 'Nebula',
    galaxy: 'Galaxy',
    cluster: 'Galaxy Cluster',
    other: 'Deep Space Object',
    orbitalPeriod: 'Orbital Period',
    rotationPeriod: 'Rotation Period',
    days: 'days',
    hours: 'hours',
    retrograde: 'retrograde',
  },
  fr: {
    distance: 'Distance de la Terre',
    size: 'Diamètre',
    type: 'Type',
    facts: 'Faits',
    flyTo: 'Aller vers',
    close: 'Fermer',
    follow: 'Suivre',
    unfollow: 'Arrêter',
    km: 'km',
    planet: 'Planète',
    star: 'Étoile',
    moon: 'Lune',
    'dwarf-planet': 'Planète Naine',
    nebula: 'Nébuleuse',
    galaxy: 'Galaxie',
    cluster: 'Amas de Galaxies',
    other: 'Objet de l\'Espace Profond',
    orbitalPeriod: 'Période Orbitale',
    rotationPeriod: 'Période de Rotation',
    days: 'jours',
    hours: 'heures',
    retrograde: 'rétrograde',
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

const formatRotationPeriod = (hours: number, language: string, t: typeof translations['en']): string => {
  const isRetrograde = hours < 0;
  const absHours = Math.abs(hours);
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  
  if (absHours >= 24) {
    const days = absHours / 24;
    const suffix = isRetrograde ? ` (${t.retrograde})` : '';
    return `${days.toLocaleString(locale, { maximumFractionDigits: 2 })} ${t.days}${suffix}`;
  }
  const suffix = isRetrograde ? ` (${t.retrograde})` : '';
  return `${absHours.toLocaleString(locale, { maximumFractionDigits: 1 })} ${t.hours}${suffix}`;
};

const formatOrbitalPeriod = (days: number, language: string, t: typeof translations['en']): string => {
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  if (days >= 365) {
    const years = days / 365.25;
    return `${years.toLocaleString(locale, { maximumFractionDigits: 2 })} ${language === 'fr' ? 'ans' : 'years'}`;
  }
  return `${days.toLocaleString(locale, { maximumFractionDigits: 1 })} ${t.days}`;
};

export const InfoCard = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const selectedObject = useCosmosStore(state => state.selectedObject);
  const setSelectedObject = useCosmosStore(state => state.setSelectedObject);
  const jumpToObject = useCosmosStore(state => state.jumpToObject);
  const isFollowing = useCosmosStore(state => state.isFollowing);
  const toggleFollowing = useCosmosStore(state => state.toggleFollowing);
  const showRealPeriods = useCosmosStore(state => state.showRealPeriods);
  const isTouring = useCosmosStore(state => state.isTouring);
  const isFullscreen = useFullscreenStore(state => state.isFullscreen);
  const [isMinimized, setIsMinimized] = useState(true);

  // Hide InfoCard when touring (TourOverlay shows the info instead)
  if (!selectedObject || isTouring) return null;

  const handleClose = () => setSelectedObject(null);
  
  const handleFlyTo = () => {
    jumpToObject(selectedObject);
  };

  const objectType = t[selectedObject.type as keyof typeof t] || selectedObject.type;
  const facts = selectedObject.facts?.[language] || [];
  
  // Get real periods for the selected object
  const orbitalPeriodDays = ORBITAL_PERIODS[selectedObject.id];
  const rotationPeriodHours = ROTATION_PERIODS_HOURS[selectedObject.id];

  const card = (
    <div 
      className={`${isFullscreen ? 'fixed' : 'absolute'} bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-auto z-[10001] w-auto sm:w-72 md:w-80 bg-white/10 backdrop-blur-sm rounded-lg animate-scale-in origin-bottom-left overflow-hidden`}
      style={isFullscreen ? { 
        bottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
        left: 'calc(0.5rem + env(safe-area-inset-left))',
        right: 'calc(0.5rem + env(safe-area-inset-right))',
        width: 'auto',
        maxWidth: '320px',
      } : undefined}
    >
      {/* Header - entire bar is clickable to toggle minimize */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <h3 className="text-white font-semibold text-sm sm:text-base truncate flex-1 mr-2">
          {selectedObject.name[language]}
        </h3>
        <div className="flex items-center gap-1">
          <div className="h-6 w-6 flex items-center justify-center text-white/70">
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content - collapsible with smooth animation */}
      <div 
        className={`grid transition-all duration-300 ease-out ${isMinimized ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="p-3 space-y-3 max-h-[40vh] sm:max-h-[45vh] overflow-y-auto border-t border-white/10">
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

            {/* Real Periods - only when toggle is on */}
            {showRealPeriods && (orbitalPeriodDays || rotationPeriodHours) && (
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                {orbitalPeriodDays && (
                  <div className="bg-white/5 rounded p-2">
                    <div className="text-white/50 text-xs">{t.orbitalPeriod}</div>
                    <div className="text-white font-medium">
                      {formatOrbitalPeriod(orbitalPeriodDays, language, t)}
                    </div>
                  </div>
                )}
                {rotationPeriodHours && (
                  <div className="bg-white/5 rounded p-2">
                    <div className="text-white/50 text-xs">{t.rotationPeriod}</div>
                    <div className="text-white font-medium">
                      {formatRotationPeriod(rotationPeriodHours, language, t)}
                    </div>
                  </div>
                )}
              </div>
            )}

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
              <Button
                size="sm"
                onClick={toggleFollowing}
                className={`flex-1 text-xs border-0 ${isFollowing ? 'bg-primary/80 hover:bg-primary text-primary-foreground' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              >
                {isFollowing ? <EyeOff className="w-3 h-3 mr-1.5" /> : <Eye className="w-3 h-3 mr-1.5" />}
                {isFollowing ? t.unfollow : t.follow}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return card;
};

