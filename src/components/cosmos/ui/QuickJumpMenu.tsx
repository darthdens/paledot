import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, Clock } from 'lucide-react';
import { useCosmosStore } from '../store/useCosmosStore';
import { useFullscreenStore } from '../store/useFullscreenStore';
import { quickJumpCategories, getObjectById } from '../data/celestialObjects';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const translations = {
  en: {
    title: 'Quick Jump',
    recentJumps: 'Recent',
    comingSoon: 'Coming Soon',
  },
  fr: {
    title: 'Saut Rapide',
    recentJumps: 'Récents',
    comingSoon: 'Bientôt',
  },
};

// Categories that are expandable (have at least one implemented item)
const EXPANDABLE_CATEGORIES = ['solarSystem', 'stars', 'nebulae', 'galaxies', 'deepSpace'];

// Specific objects that are implemented per category (empty array = all implemented)
const IMPLEMENTED_OBJECTS: Record<string, string[]> = {
  solarSystem: [], // empty means all are implemented
  stars: ['sun', 'proxima-centauri'], // Sun has full visuals, Proxima is in the tour
  nebulae: ['orion-nebula'], // only Orion has proper nebula visuals
  galaxies: ['milky-way-center', 'andromeda', 'triangulum', 'whirlpool', 'sombrero'],
  deepSpace: [], // All deep space objects are implemented (they use existing visualization at large scales)
};

export const QuickJumpMenu = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [expandedCategory, setExpandedCategory] = useState<string | null>('solarSystem');

  const [isSmUp, setIsSmUp] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(min-width: 640px)')?.matches ?? false;
  });

  const menuRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const [maxHeightNonFullscreenPx, setMaxHeightNonFullscreenPx] = useState<number>(240);
  
  const showQuickJump = useCosmosStore(state => state.showQuickJump);
  const toggleQuickJump = useCosmosStore(state => state.toggleQuickJump);
  const jumpToObject = useCosmosStore(state => state.jumpToObject);
  const recentJumps = useCosmosStore(state => state.recentJumps);
  const isFullscreen = useFullscreenStore(state => state.isFullscreen);

  useEffect(() => {
    const update = () => {
      setIsSmUp(window.matchMedia?.('(min-width: 640px)')?.matches ?? false);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useLayoutEffect(() => {
    if (!showQuickJump || isFullscreen) return;

    const container = document.querySelector('[data-cosmos-container]') as HTMLElement | null;
    const scrollEl = scrollAreaRef.current;
    if (!container || !scrollEl) return;

    const bottomMarginPx = 8; // bottom-2

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const scrollRect = scrollEl.getBoundingClientRect();
      const next = Math.max(160, Math.floor(containerRect.bottom - scrollRect.top - bottomMarginPx));
      setMaxHeightNonFullscreenPx(next);
    };

    measure();

    window.addEventListener('resize', measure);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(container);

    return () => {
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
  }, [showQuickJump, isFullscreen]);

  const handleJump = (objectId: string) => {
    const object = getObjectById(objectId);
    if (object) {
      jumpToObject(object);
    }
  };

  const toggleCategory = (categoryId: string) => {
    // Only allow expanding categories that have implemented items
    if (!EXPANDABLE_CATEGORIES.includes(categoryId)) return;
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const isCategoryExpandable = (categoryId: string) => EXPANDABLE_CATEGORIES.includes(categoryId);
  
  const isItemImplemented = (categoryId: string, locationId: string) => {
    const implemented = IMPLEMENTED_OBJECTS[categoryId];
    if (!implemented) return false;
    // Empty array means all items are implemented
    if (implemented.length === 0) return true;
    return implemented.includes(locationId);
  };

  // In fullscreen, dropdowns appear directly below the button row (h-8 = 32px + gap)
  const fullscreenDropdownOffsetPx = isSmUp ? 44 : 40;

  const menu = (
    <div
      ref={menuRef}
      className={`${isFullscreen ? 'fixed' : 'absolute'} top-12 right-2 sm:top-[68px] sm:right-4 z-[10001] bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden transition-all duration-300 ease-out ${
        showQuickJump ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
      style={
        isFullscreen
          ? {
              top: `calc(0.5rem + env(safe-area-inset-top) + ${fullscreenDropdownOffsetPx}px)`,
              right: 'calc(0.5rem + env(safe-area-inset-right))',
            }
          : undefined
      }
    >
      <div 
        className={`grid transition-all duration-300 ease-out ${showQuickJump ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div
          ref={scrollAreaRef}
          className="overflow-y-auto w-[calc(100vw-1rem)] max-w-56 sm:w-[calc(100vw-2rem)] sm:max-w-64"
          style={
            isFullscreen
              ? {
                  // In fullscreen, bottom should align with right margin (0.5rem + safe-area)
                  maxHeight: `calc(100dvh - ${fullscreenDropdownOffsetPx}px - 0.5rem - env(safe-area-inset-top) - 0.5rem - env(safe-area-inset-bottom))`,
                }
              : {
                  maxHeight: `${maxHeightNonFullscreenPx}px`,
                }
          }
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

      {/* Content */}
      <div>
        {/* Recent jumps */}
        {recentJumps.length > 0 && (
          <div className="p-2 border-b border-white/10">
            <div className="text-white/50 text-xs mb-1.5 px-1">{t.recentJumps}</div>
            <div className="flex flex-wrap gap-1">
              {recentJumps.map(id => {
                const obj = getObjectById(id);
                if (!obj) return null;
                // Only show recent jumps from expandable categories
                if (!EXPANDABLE_CATEGORIES.includes(obj.category || '')) return null;
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
          {quickJumpCategories.map(category => {
            const expandable = isCategoryExpandable(category.id);
            
            return (
              <div key={category.id} className="mb-1">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full flex items-center justify-between p-1.5 sm:p-2 rounded transition-colors ${
                    !expandable 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'hover:bg-white/10'
                  }`}
                  disabled={!expandable}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs sm:text-sm font-medium ${!expandable ? 'text-white/50' : 'text-white/90'}`}>
                      {category.name[language]}
                    </span>
                    {!expandable && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[10px] text-amber-400">
                        <Clock className="w-2.5 h-2.5" />
                        {t.comingSoon}
                      </span>
                    )}
                  </div>
                  {expandable && (
                    <ChevronRight 
                      className={`w-3.5 h-3.5 text-white/50 transition-transform ${
                        expandedCategory === category.id ? 'rotate-90' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Category items - smooth expand/collapse animation */}
                {expandable && (
                  <div 
                    className={`grid transition-all duration-300 ease-out ${
                      expandedCategory === category.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
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
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>
      </div>
    </div>
  );

  return menu;
};
