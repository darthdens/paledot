import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { HelpCircle, Compass, Maximize, Minimize } from 'lucide-react';
import { useCosmosStore } from '../store/useCosmosStore';
import { useState, useCallback, useEffect } from 'react';

const translations = {
  en: {
    startTour: 'Start Guided Tour',
    quickJump: 'Quick Jump',
    controls: 'Controls',
    scrollZoom: 'Scroll to zoom in/out',
    dragRotate: 'Left-drag to rotate view',
    rightDragPan: 'Right-drag to pan',
    clickSelect: 'Click objects to select',
    distanceFromEarth: 'Distance from Earth',
    welcome: 'Welcome to Cosmos Explorer',
    subtitle: 'Journey through our solar system and beyond',
    explore: 'Explore',
  },
  fr: {
    startTour: 'Commencer la Visite',
    quickJump: 'Saut Rapide',
    controls: 'Contrôles',
    scrollZoom: 'Molette pour zoomer',
    dragRotate: 'Glisser pour tourner',
    rightDragPan: 'Clic droit pour déplacer',
    clickSelect: 'Cliquer pour sélectionner',
    distanceFromEarth: 'Distance de la Terre',
    welcome: 'Bienvenue dans Cosmos Explorer',
    subtitle: 'Voyagez à travers notre système solaire et au-delà',
    explore: 'Explorer',
  },
};

export const CosmosUI = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { startTour, toggleQuickJump, showControlHints, setShowControlHints } = useCosmosStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for fullscreen changes (e.g., user presses Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement);
      setIsFullscreen(isFs);
      
      // Also handle CSS fallback cleanup
      const container = document.querySelector('[data-cosmos-container]');
      if (!isFs && container) {
        container.classList.remove('fixed', 'inset-0', 'z-[100]', 'h-screen', 'w-screen', 'rounded-none');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = document.querySelector('[data-cosmos-container]');
    if (!container) return;

    const doc = document as any;
    const elem = container as any;
    
    const isCurrentlyFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement;

    if (!isCurrentlyFullscreen) {
      // Enter fullscreen - try native API first
      const requestFs = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
      if (requestFs) {
        requestFs.call(elem)
          .then(() => setIsFullscreen(true))
          .catch(() => {
            // Fallback: use CSS to simulate fullscreen
            container.classList.add('fixed', 'inset-0', 'z-[100]', 'h-screen', 'w-screen', 'rounded-none');
            setIsFullscreen(true);
          });
      } else {
        // No fullscreen API - use CSS fallback
        container.classList.add('fixed', 'inset-0', 'z-[100]', 'h-screen', 'w-screen', 'rounded-none');
        setIsFullscreen(true);
      }
    } else {
      // Exit fullscreen
      const exitFs = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
      if (exitFs) {
        exitFs.call(doc)
          .then(() => {
            setIsFullscreen(false);
            container.classList.remove('fixed', 'inset-0', 'z-[100]', 'h-screen', 'w-screen', 'rounded-none');
          })
          .catch(() => {
            setIsFullscreen(false);
            container.classList.remove('fixed', 'inset-0', 'z-[100]', 'h-screen', 'w-screen', 'rounded-none');
          });
      } else {
        // CSS fallback exit
        container.classList.remove('fixed', 'inset-0', 'z-[100]', 'h-screen', 'w-screen', 'rounded-none');
        setIsFullscreen(false);
      }
    }
  }, []);

  return (
    <>
      {/* Welcome overlay for first visit */}
      {showControlHints && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-50 p-3">
          <div className="text-center space-y-3 sm:space-y-5 max-w-sm sm:max-w-md px-4">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">{t.welcome}</h1>
            <p className="text-sm sm:text-base text-white/70">{t.subtitle}</p>
            
            <div className="space-y-1.5 text-left bg-white/10 rounded-lg p-3 sm:p-4">
              <p className="text-white/90 font-medium text-sm sm:text-base">{t.controls}:</p>
              <p className="text-white/70 text-xs sm:text-sm">• {t.scrollZoom}</p>
              <p className="text-white/70 text-xs sm:text-sm">• {t.dragRotate}</p>
              <p className="text-white/70 text-xs sm:text-sm">• {t.rightDragPan}</p>
              <p className="text-white/70 text-xs sm:text-sm">• {t.clickSelect}</p>
            </div>

            <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
              <Button size="sm" onClick={() => { setShowControlHints(false); startTour(); }} className="text-xs sm:text-sm">
                {t.startTour}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowControlHints(false)} className="text-xs sm:text-sm">
                {t.explore}
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
