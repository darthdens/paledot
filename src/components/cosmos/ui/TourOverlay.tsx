import { useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack, X } from 'lucide-react';
import { useCosmosStore } from '../store/useCosmosStore';
import { useFullscreenStore } from '../store/useFullscreenStore';
import { tourStops } from '../data/tourStops';
import { celestialObjects } from '../data/celestialObjects';

const translations = {
  en: {
    stop: 'Stop',
    of: 'of',
    exitTour: 'Exit Tour',
    previous: 'Previous',
    next: 'Next',
    pause: 'Pause',
    play: 'Play',
  },
  fr: {
    stop: 'Étape',
    of: 'sur',
    exitTour: 'Quitter',
    previous: 'Précédent',
    next: 'Suivant',
    pause: 'Pause',
    play: 'Lecture',
  },
};

export const TourOverlay = () => {
  const { language } = useLanguage();
  const t = translations[language];
  
  const isTouring = useCosmosStore(state => state.isTouring);
  const tourIndex = useCosmosStore(state => state.tourIndex);
  const isPaused = useCosmosStore(state => state.isPaused);
  const stopTour = useCosmosStore(state => state.stopTour);
  const setTourIndex = useCosmosStore(state => state.setTourIndex);
  const togglePause = useCosmosStore(state => state.togglePause);
  const setSelectedObject = useCosmosStore(state => state.setSelectedObject);
  const setTourCameraTarget = useCosmosStore(state => state.setTourCameraTarget);
  const isFullscreen = useFullscreenStore(state => state.isFullscreen);
  
  const currentStop = tourStops[tourIndex];
  const totalStops = tourStops.length;
  
  // Navigate to a tour stop
  const goToStop = useCallback((index: number) => {
    if (index < 0 || index >= tourStops.length) return;
    
    const stop = tourStops[index];
    setTourIndex(index);
    
    // Find and select the object for this stop
    const targetObject = celestialObjects.find(obj => obj.id === stop.locationId);
    if (targetObject) {
      setSelectedObject(targetObject);
    }
    
    // Set tour camera target for the CameraController
    setTourCameraTarget({
      position: stop.cameraPosition as [number, number, number],
      lookAt: stop.lookAt as [number, number, number],
    });
  }, [setTourIndex, setSelectedObject, setTourCameraTarget]);
  
  // Initialize tour on first render when touring starts
  useEffect(() => {
    if (isTouring && tourIndex === 0) {
      goToStop(0);
    }
  }, [isTouring, tourIndex, goToStop]);
  
  // Auto-advance when not paused
  useEffect(() => {
    if (!isTouring || isPaused || !currentStop) return;
    
    const duration = currentStop.duration * 1000; // Convert to ms
    const timer = setTimeout(() => {
      if (tourIndex < tourStops.length - 1) {
        goToStop(tourIndex + 1);
      } else {
        // Tour complete - stop
        stopTour();
      }
    }, duration);
    
    return () => clearTimeout(timer);
  }, [isTouring, isPaused, tourIndex, currentStop, goToStop, stopTour]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isTouring) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for our shortcuts
      if (['ArrowLeft', 'ArrowRight', 'Space', 'Escape'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'ArrowLeft':
          if (tourIndex > 0) {
            goToStop(tourIndex - 1);
          }
          break;
        case 'ArrowRight':
          if (tourIndex < tourStops.length - 1) {
            goToStop(tourIndex + 1);
          }
          break;
        case 'Space':
          togglePause();
          break;
        case 'Escape':
          stopTour();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTouring, tourIndex, goToStop, togglePause, stopTour]);
  
  const handlePrevious = () => {
    if (tourIndex > 0) {
      goToStop(tourIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (tourIndex < tourStops.length - 1) {
      goToStop(tourIndex + 1);
    } else {
      stopTour();
    }
  };
  
  const handleExit = () => {
    stopTour();
  };
  
  if (!isTouring || !currentStop) return null;
  
  return (
    <div 
      className={`${isFullscreen ? 'fixed' : 'absolute'} top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-auto z-[10001] w-auto sm:w-96 md:w-[28rem] bg-black/90 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden`}
      style={isFullscreen ? { 
        top: 'calc(0.5rem + env(safe-area-inset-top))',
        left: 'calc(0.5rem + env(safe-area-inset-left))',
      } : undefined}
    >
      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((tourIndex + 1) / totalStops) * 100}%` }}
        />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs">
            {t.stop} {tourIndex + 1} {t.of} {totalStops}
          </span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleExit}
          className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        <h2 className="text-white font-bold text-lg sm:text-xl">
          {currentStop.title[language]}
        </h2>
        <p className="text-white/80 text-sm leading-relaxed">
          {currentStop.narration[language]}
        </p>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-t border-white/10 bg-white/5">
        <Button
          size="sm"
          variant="ghost"
          onClick={handlePrevious}
          disabled={tourIndex === 0}
          className="text-xs text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
        >
          <SkipBack className="w-4 h-4 mr-1" />
          {t.previous}
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={togglePause}
          className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          {isPaused ? (
            <Play className="w-5 h-5" />
          ) : (
            <Pause className="w-5 h-5" />
          )}
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleNext}
          className="text-xs text-white/70 hover:text-white hover:bg-white/10"
        >
          {t.next}
          <SkipForward className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
