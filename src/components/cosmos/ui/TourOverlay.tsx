import { useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack, X } from 'lucide-react';
import { useCosmosStore } from '../store/useCosmosStore';
import { useFullscreenStore } from '../store/useFullscreenStore';
import { tourStops } from '../data/tourStops';
import { celestialObjects } from '../data/celestialObjects';
import { UNITS } from '../types';

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

  const isTouring = useCosmosStore((state) => state.isTouring);
  const tourIndex = useCosmosStore((state) => state.tourIndex);
  const isPaused = useCosmosStore((state) => state.isPaused);
  const stopTour = useCosmosStore((state) => state.stopTour);
  const setTourIndex = useCosmosStore((state) => state.setTourIndex);
  const togglePause = useCosmosStore((state) => state.togglePause);
  const setSelectedObject = useCosmosStore((state) => state.setSelectedObject);
  const setTourCameraTarget = useCosmosStore((state) => state.setTourCameraTarget);
  const isFullscreen = useFullscreenStore((state) => state.isFullscreen);

  const currentStop = tourStops[tourIndex];
  const totalStops = tourStops.length;

  const UNIFIED_SCALE = 0.001;

  const normalize3 = (v: [number, number, number]): [number, number, number] => {
    const len = Math.hypot(v[0], v[1], v[2]);
    if (!len) return [1, 0, 0];
    return [v[0] / len, v[1] / len, v[2] / len];
  };

  // Navigate to a tour stop
  const goToStop = useCallback(
    (index: number) => {
      if (index < 0 || index >= tourStops.length) return;

      const stop = tourStops[index];
      setTourIndex(index);

      // Find and select the object for this stop
      const targetObject = celestialObjects.find((obj) => obj.id === stop.locationId);
      if (targetObject) {
        setSelectedObject(targetObject);
      }

      const store = useCosmosStore.getState();

      // Prefer live world position when available (keeps tour accurate even when the galaxy rotates)
      const livePos = store.objectWorldPositions[stop.locationId];

      const fallbackTargetPos = (): [number, number, number] => {
        if (!targetObject) return [0, 0, 0];

        // Nebulae positions are stored in light-years in celestialObjects.ts
        if (targetObject.category === 'nebulae') {
          const gs = UNITS.KM_PER_LY * UNIFIED_SCALE;
          return [
            targetObject.position[0] * gs,
            targetObject.position[1] * gs,
            targetObject.position[2] * gs,
          ];
        }

        // Most other objects store positions in km
        return [
          targetObject.position[0] * UNIFIED_SCALE,
          targetObject.position[1] * UNIFIED_SCALE,
          targetObject.position[2] * UNIFIED_SCALE,
        ];
      };

      const targetPos: [number, number, number] = livePos ?? fallbackTargetPos();
      const lookAtPos: [number, number, number] = targetPos;

      // Tour stop cameraPosition is treated as an offset vector in km
      const offsetScene: [number, number, number] = [
        stop.cameraPosition[0] * UNIFIED_SCALE,
        stop.cameraPosition[1] * UNIFIED_SCALE,
        stop.cameraPosition[2] * UNIFIED_SCALE,
      ];

      let cameraPos: [number, number, number];

      // For solar system bodies, place the camera on the sun-facing side so the lit hemisphere is visible
      if (targetObject?.category === 'solarSystem') {
        const sunPos = store.objectWorldPositions['sun'] ?? ([0, 0, 0] as [number, number, number]);
        const dirToSun = normalize3([
          sunPos[0] - targetPos[0],
          sunPos[1] - targetPos[1],
          sunPos[2] - targetPos[2],
        ]);

        const dist = Math.hypot(offsetScene[0], offsetScene[1], offsetScene[2]) || 1;

        cameraPos = [
          targetPos[0] + dirToSun[0] * dist,
          targetPos[1] + dirToSun[1] * dist + offsetScene[1] * 0.35,
          targetPos[2] + dirToSun[2] * dist,
        ];
      } else {
        // Default: apply the offset directly in scene space
        cameraPos = [
          targetPos[0] + offsetScene[0],
          targetPos[1] + offsetScene[1],
          targetPos[2] + offsetScene[2],
        ];
      }

      // Set tour camera target for the CameraController
      setTourCameraTarget({
        position: cameraPos,
        lookAt: lookAtPos,
        space: 'scene',
      });
    },
    [setTourIndex, setSelectedObject, setTourCameraTarget]
  );
  
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
          className="h-full bg-blue-500 transition-all duration-300"
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
