import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, Clock } from 'lucide-react';
import { useCosmosStore } from '../store/useCosmosStore';
import { useFullscreenStore } from '../store/useFullscreenStore';
import { quickJumpCategories, getObjectById } from '../data/celestialObjects';
import { useSiteBrand } from '@/lib/site-brand';
import { HardwareJumpChoices } from '@/features/left-behind/ui/HardwareJumpChoices';
import { JumpCategory } from '@/features/left-behind/ui/JumpCategory';
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
  const { language, tr, tx, numberLocale } = useLanguage();
  const t = tr(translations);
  const brand=useSiteBrand();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(brand === 'paledot' ? 'hardware' : 'solarSystem');

  const [isSmUp, setIsSmUp] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(min-width: 640px)')?.matches ?? false;
  });

  const menuRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const [maxHeightNonFullscreenPx, setMaxHeightNonFullscreenPx] = useState<number>(240);
  const [anchorStyle, setAnchorStyle] = useState<{ top: number; right: number } | null>(null);
  
  const showQuickJump = useCosmosStore(state => state.showQuickJump);
  const toggleQuickJump = useCosmosStore(state => state.toggleQuickJump);
  const setQuickJumpAnchorRect = useCosmosStore(state => state.setQuickJumpAnchorRect);
  const quickJumpAnchorRect = useCosmosStore(state => state.quickJumpAnchorRect);
  const jumpToObject = useCosmosStore(state => state.jumpToObject);
  const recentJumps = useCosmosStore(state => state.recentJumps);
  const fullscreenState = useFullscreenStore(state => state.isFullscreen);
  const isFullscreen=fullscreenState && brand!=='paledot';

  useEffect(() => {
    const update = () => {
      setIsSmUp(window.matchMedia?.('(min-width: 640px)')?.matches ?? false);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Click-outside handler
  useEffect(() => {
    if (!showQuickJump) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        toggleQuickJump();
      }
    };

    // Delay to prevent immediate close from the same click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQuickJump, toggleQuickJump]);

  // Max height for both modes: bottom gap equals the gap between the button row and the menu (8px),
  // measured to the screen/safe area or to the top of any bottom card (InfoCard, machine card) under the menu.
  useLayoutEffect(() => {
    if (!showQuickJump) return;
    const scrollEl = scrollAreaRef.current;
    if (!scrollEl) return;
    const gapPx = 8;
    const measure = () => {
      const scrollRect = scrollEl.getBoundingClientRect();
      const vv = window.visualViewport;
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;bottom:0;height:env(safe-area-inset-bottom);visibility:hidden';
      document.body.appendChild(probe); const safeBottom = probe.getBoundingClientRect().height; probe.remove();
      let limit = (vv?.height ?? window.innerHeight) - safeBottom;
      document.querySelectorAll<HTMLElement>('[data-bottom-card],[data-machine-readout],[data-machine-note]').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.height === 0 || r.top <= scrollRect.top) return;
        if (r.right > scrollRect.left && r.left < scrollRect.right) limit = Math.min(limit, r.top);
      });
      const next = Math.max(120, Math.floor(limit - scrollRect.top - gapPx));
      setMaxHeightNonFullscreenPx(prev => (prev === next ? prev : next));
    };
    const raf = window.requestAnimationFrame(measure);
    const iv = window.setInterval(measure, 300);
    window.addEventListener('resize', measure);
    return () => { window.cancelAnimationFrame(raf); window.clearInterval(iv); window.removeEventListener('resize', measure); };
  }, [showQuickJump, isFullscreen, isSmUp, anchorStyle]);

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
      inert={!showQuickJump}
      aria-hidden={!showQuickJump}
      data-quick-jump
      className={`${isFullscreen ? 'fixed' : 'absolute'} z-[10001] bg-white/10 backdrop-blur-xs rounded-lg overflow-hidden transition-all duration-300 ease-out ${
        showQuickJump ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
      style={
        isFullscreen
          ? {
              top: `calc(0.5rem + env(safe-area-inset-top) + ${fullscreenDropdownOffsetPx}px)`,
              right: 'calc(0.5rem + env(safe-area-inset-right))',
            }
          : {
              top: `${anchorStyle?.top ?? (isSmUp ? 60 : 48)}px`,
              right: `${isSmUp ? 16 : 8}px`,
            }
      }
    >
      <div 
        className={`grid transition-all duration-300 ease-out ${showQuickJump ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div
          ref={scrollAreaRef}
          className="overflow-y-auto w-[calc(100vw-1rem)] max-w-56 sm:w-[calc(100vw-2rem)] sm:max-w-64"
          style={{ maxHeight: `${maxHeightNonFullscreenPx}px` }}
        >
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-3 border-b border-white/10 shrink-0">
        <h3 className="text-white font-semibold text-sm">{t.title}</h3>
        <Button
          size="icon"
          variant="ghost"
          aria-label={tx('Close', 'Fermer')}
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
                    className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded-[4px] text-xs text-white/80 hover:text-white transition-colors"
                  >
                    {tr(obj.name)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="p-2 [&>*:last-child]:mb-0">
          {brand==='paledot' && showQuickJump && <HardwareJumpChoices expanded={expandedCategory==='hardware'} onToggle={()=>setExpandedCategory(expandedCategory==='hardware'?null:'hardware')} />}
          {quickJumpCategories.map(category => {
            const expandable = isCategoryExpandable(category.id);
            
            if (brand === 'paledot' && expandable) return <JumpCategory key={category.id} title={tr(category.name)} expanded={expandedCategory===category.id} onToggle={()=>toggleCategory(category.id)}>
              {category.locations.map(locationId=>{
                const obj=getObjectById(locationId);
                if(!obj)return null;
                const implemented=isItemImplemented(category.id,locationId);
                return <Button key={locationId} variant="ghost" disabled={!implemented} onClick={()=>handleJump(locationId)}
                  className="w-full h-auto min-h-7 max-sm:min-h-11 justify-start gap-2 p-1.5 rounded-[4px] text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-accent/60">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:obj.color}} />
                  <span className="truncate">{tr(obj.name)}</span>
                  {!implemented&&<Clock className="ml-auto h-3 w-3" />}
                </Button>;
              })}
            </JumpCategory>;
            return (
              <div key={category.id} className="mb-1">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full flex items-center justify-between p-1.5 sm:p-2 rounded-[4px] transition-colors ${
                    !expandable 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'hover:bg-white/10'
                  }`}
                  disabled={!expandable}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs sm:text-sm font-medium ${!expandable ? 'text-white/50' : 'text-white/90'}`}>
                      {tr(category.name)}
                    </span>
                    {!expandable && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-[4px] text-[10px] text-amber-400">
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
                              className={`w-full flex items-center gap-2 p-1.5 rounded-[4px] transition-colors text-left ${
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
                                {tr(obj.name)}
                              </span>
                              {!implemented && (
                                <span className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-[4px] text-[8px] text-amber-400 ml-auto shrink-0">
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
