import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, Clock } from 'lucide-react';
import { useCosmosStore } from '../store/useCosmosStore';
import { useFullscreenStore } from '../store/useFullscreenStore';
import { quickJumpCategories, getObjectById } from '../data/celestialObjects';
import { useState } from 'react';

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

// Categories that are fully implemented (Solar System only for now)
const IMPLEMENTED_CATEGORIES = ['solarSystem'];

export const QuickJumpMenu = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [expandedCategory, setExpandedCategory] = useState<string | null>('solarSystem');
  
  const showQuickJump = useCosmosStore(state => state.showQuickJump);
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

  const menu = (
    <div 
      className={`${isFullscreen ? 'fixed' : 'absolute'} top-[68px] right-4 z-[10001] w-[calc(100vw-2rem)] max-w-56 sm:max-w-64 max-h-[calc(100vh-100px)] bg-black/90 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden flex flex-col`}
      style={isFullscreen ? {
        top: 'calc(68px + env(safe-area-inset-top))',
        right: 'calc(1rem + env(safe-area-inset-right))',
      } : undefined}
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
          {quickJumpCategories.map(category => {
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
                      return (
                        <button
                          key={locationId}
                          onClick={() => handleJump(locationId)}
                          className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-white/10 transition-colors text-left"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: obj.color }}
                          />
                          <span className="text-white/70 hover:text-white text-xs truncate">
                            {obj.name[language]}
                          </span>
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

