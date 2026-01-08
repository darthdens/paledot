import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { HelpCircle, Compass, Maximize, Minimize } from 'lucide-react';
import { useCosmosStore } from '../store/useCosmosStore';
import { useState, useCallback } from 'react';

const translations = {
  en: {
    startTour: 'Start Guided Tour',
    quickJump: 'Quick Jump',
    controls: 'Controls',
    scrollZoom: 'Scroll to zoom',
    dragRotate: 'Drag to rotate',
    rightDragPan: 'Right-drag to pan',
    distanceFromEarth: 'Distance from Earth',
    welcome: 'Welcome to Cosmos Explorer',
    subtitle: 'Journey from Earth to the edge of the observable universe',
  },
  fr: {
    startTour: 'Commencer la Visite',
    quickJump: 'Saut Rapide',
    controls: 'Contrôles',
    scrollZoom: 'Molette pour zoomer',
    dragRotate: 'Glisser pour tourner',
    rightDragPan: 'Clic droit pour déplacer',
    distanceFromEarth: 'Distance de la Terre',
    welcome: 'Bienvenue dans Cosmos Explorer',
    subtitle: 'Voyage de la Terre aux confins de l\'univers observable',
  },
};

export const CosmosUI = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { startTour, toggleQuickJump, showControlHints, setShowControlHints } = useCosmosStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    const container = document.querySelector('[data-cosmos-container]');
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  return (
    <>
      {/* Welcome overlay for first visit */}
      {showControlHints && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 p-3">
          <div className="text-center space-y-3 sm:space-y-5 max-w-sm sm:max-w-md px-4">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">{t.welcome}</h1>
            <p className="text-sm sm:text-base text-white/70">{t.subtitle}</p>
            
            <div className="space-y-1.5 text-left bg-white/10 rounded-lg p-3 sm:p-4">
              <p className="text-white/90 font-medium text-sm sm:text-base">{t.controls}:</p>
              <p className="text-white/70 text-xs sm:text-sm">• {t.scrollZoom}</p>
              <p className="text-white/70 text-xs sm:text-sm">• {t.dragRotate}</p>
              <p className="text-white/70 text-xs sm:text-sm">• {t.rightDragPan}</p>
            </div>

            <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
              <Button size="sm" onClick={() => { setShowControlHints(false); startTour(); }} className="text-xs sm:text-sm">
                {t.startTour}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowControlHints(false)} className="text-xs sm:text-sm">
                {language === 'fr' ? 'Explorer' : 'Explore'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top controls - compact on mobile */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-1 sm:gap-2 z-40">
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={toggleFullscreen} 
          className="h-7 w-7 sm:h-9 sm:w-9 bg-white/10 hover:bg-white/20 text-white"
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> : <Maximize className="w-3.5 h-3.5 sm:w-5 sm:h-5" />}
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={toggleQuickJump} 
          className="h-7 w-7 sm:h-9 sm:w-9 bg-white/10 hover:bg-white/20 text-white"
        >
          <Compass className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={() => setShowControlHints(true)} 
          className="h-7 w-7 sm:h-9 sm:w-9 bg-white/10 hover:bg-white/20 text-white"
        >
          <HelpCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </Button>
      </div>

      {/* Bottom tour button - smaller on mobile */}
      {!showControlHints && (
        <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40">
          <Button size="sm" onClick={startTour} className="animate-pulse text-xs sm:text-sm">
            {t.startTour}
          </Button>
        </div>
      )}
    </>
  );
};
