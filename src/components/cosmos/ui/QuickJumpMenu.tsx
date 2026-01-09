import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, Clock } from 'lucide-react';
import { useCosmosStore } from '../store/useCosmosStore';
import { useFullscreenStore } from '../store/useFullscreenStore';
import { getObjectById } from '../data/celestialObjects';
import { useState } from 'react';

const translations = {
  en: {
    title: 'Quick Jump',
    recentJumps: 'Recent',
    comingSoon: 'Coming Soon',
    starsGalaxies: 'Stars & Galaxies',
  },
  fr: {
    title: 'Saut Rapide',
    recentJumps: 'Récents',
    comingSoon: 'Bientôt',
    starsGalaxies: 'Étoiles et Galaxies',
  },
};

// Categories that are fully implemented
const IMPLEMENTED_CATEGORIES = ['solarSystem', 'starsGalaxies'];

// Objects that are implemented within the starsGalaxies category
const IMPLEMENTED_STARS_GALAXIES = ['sun', 'milky-way-center'];

// Custom categories for quick jump menu (combining stars and galaxies into one)
const menuCategories = [
  {
    id: 'solarSystem',
    name: { en: 'Solar System', fr: 'Système Solaire' },
    locations: [
      'sun', 'mercury', 'venus', 'earth', 'moon', 
      'mars', 'phobos', 'deimos', 
      'ceres',
      'jupiter', 'io', 'europa', 'ganymede', 'callisto', 
      'saturn', 'mimas', 'enceladus', 'tethys', 'dione', 'rhea', 'titan', 'iapetus',
      'uranus', 'miranda', 'ariel', 'umbriel', 'titania', 'oberon',
      'neptune', 'triton',
      'pluto'
    ],
  },
  {
    id: 'starsGalaxies',
    name: { en: 'Stars & Galaxies', fr: 'Étoiles et Galaxies' },
    locations: ['sun', 'milky-way-center', 'alpha-centauri', 'proxima-centauri', 'sirius', 'betelgeuse', 'polaris', 'andromeda', 'triangulum'],
  },
  {
    id: 'nebulae',
    name: { en: 'Nebulae', fr: 'Nébuleuses' },
    locations: ['orion-nebula', 'crab-nebula', 'eagle-nebula', 'ring-nebula'],
  },
  {
    id: 'deepSpace',
    name: { en: 'Deep Space', fr: 'Espace Profond' },
    locations: ['virgo-cluster', 'coma-cluster', 'hubble-deep-field', 'observable-universe-edge'],
  },
];

export const QuickJumpMenu = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [expandedCategory, setExpandedCategory] = useState<string | null>('solarSystem');
  
  const showQuickJump = useCosmosStore(state => state.showQuickJump);
  const quickJumpAnchorRect = useCosmosStore(state => state.quickJumpAnchorRect);
  const toggleQuickJump = useCosmosStore(state => state.toggleQuickJump);
  const jumpToObject = useCosmosStore(state => state.jumpToObject);
  const recentJumps = useCosmosStore(state => state.recentJumps);
  const isFullscreen = useFullscreenStore(state => state.isFullscreen);

  if (!showQuickJump) return null;

  const handleJump = (objectId: string) => {
    const object = getObjectById(objectId);
    if (object) {
      jumpToObject(object);
    }
  };

  const toggleCategory = (categoryId: string) => {
    // Only allow expanding implemented categories
    if (!IMPLEMENTED_CATEGORIES.includes(categoryId)) return;
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const isComingSoon = (categoryId: string) => !IMPLEMENTED_CATEGORIES.includes(categoryId);
  
  const isItemImplemented = (categoryId: string, locationId: string) => {
    if (categoryId === 'solarSystem') return true;
    if (categoryId === 'starsGalaxies') return IMPLEMENTED_STARS_GALAXIES.includes(locationId);
    return false;
  };

  const gap = 8;

  const menuTop = quickJumpAnchorRect
    ? `${Math.round(quickJumpAnchorRect.top + quickJumpAnchorRect.height + gap)}px`
    : isFullscreen
      ? 'calc(68px + env(safe-area-inset-top))'
      : '68px';

  const menuLeft = quickJumpAnchorRect
    ? `${Math.round(quickJumpAnchorRect.left)}px`
    : undefined;

  const menu = (
    <div 
      className={`fixed z-[10001] w-[calc(100vw-2rem)] max-w-56 sm:max-w-64 h-[320px] max-h-[calc(100vh-100px)] bg-black/90 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden flex flex-col`}
      style={{
        top: menuTop,
        left: menuLeft,
        right: menuLeft ? 'auto' : isFullscreen ? 'calc(1rem + env(safe-area-inset-right))' : '1rem',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-3 border-b border-white/10 shrink-0">
        <h3 className="text-white font-semibold text-sm">{t.title}</h3>
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleQuickJump}
          className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1 min-h-0">
        {/* Recent jumps */}
        {recentJumps.length > 0 && (
          <div className="p-2 border-b border-white/10">
            <div className="text-white/50 text-xs mb-1.5 px-1">{t.recentJumps}</div>
            <div className="flex flex-wrap gap-1">
              {recentJumps.map(id => {
                const obj = getObjectById(id);
                if (!obj) return null;
                // Only show recent jumps from implemented categories
                if (!IMPLEMENTED_CATEGORIES.includes(obj.category || '')) return null;
                return (
                  <button
                    key={id}
                    onClick={() => handleJump(id)}
                    className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-xs text-white/80 hover:text-white transition-colors"
                  >
                    {obj.name[language]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="p-1 sm:p-2">
          {menuCategories.map(category => {
            const comingSoon = isComingSoon(category.id);
            
            return (
              <div key={category.id} className="mb-1">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full flex items-center justify-between p-1.5 sm:p-2 rounded transition-colors ${
                    comingSoon 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'hover:bg-white/10'
                  }`}
                  disabled={comingSoon}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs sm:text-sm font-medium ${comingSoon ? 'text-white/50' : 'text-white/90'}`}>
                      {category.name[language]}
                    </span>
                    {comingSoon && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[10px] text-amber-400">
                        <Clock className="w-2.5 h-2.5" />
                        {t.comingSoon}
                      </span>
                    )}
                  </div>
                  {!comingSoon && (
                    <ChevronRight 
                      className={`w-3.5 h-3.5 text-white/50 transition-transform ${
                        expandedCategory === category.id ? 'rotate-90' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Category items - only for implemented categories */}
                {!comingSoon && expandedCategory === category.id && (
                  <div className="ml-2 sm:ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
                    {category.locations.map(locationId => {
                      const obj = getObjectById(locationId);
                      if (!obj) return null;
                      const implemented = isItemImplemented(category.id, locationId);
                      
                      return (
                        <button
                          key={locationId}
                          onClick={() => implemented && handleJump(locationId)}
                          disabled={!implemented}
                          className={`w-full flex items-center gap-2 p-1.5 rounded transition-colors text-left ${
                            implemented 
                              ? 'hover:bg-white/10 cursor-pointer' 
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: obj.color }}
                          />
                          <span className={`text-xs truncate ${implemented ? 'text-white/70 hover:text-white' : 'text-white/40'}`}>
                            {obj.name[language]}
                          </span>
                          {!implemented && (
                            <span className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[8px] text-amber-400 ml-auto shrink-0">
                              <Clock className="w-2 h-2" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return menu;
};

