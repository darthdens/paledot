import { useEffect, useCallback, useState, useRef } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack, X, ChevronUp, ChevronDown } from 'lucide-react';
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
    expand: 'Expand',
    collapse: 'Collapse',
  },
  fr: {
    stop: 'Étape',
    of: 'sur',
    exitTour: 'Quitter',
    previous: 'Précédent',
    next: 'Suivant',
    pause: 'Pause',
    play: 'Lecture',
    expand: 'Agrandir',
    collapse: 'Réduire',
  },
};

export const TourOverlay = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [timerProgress, setTimerProgress] = useState(0); // 0 to 100
  const timerStartRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // Swipe gesture handling
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50; // minimum distance for a swipe

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

      const computeAndSetCamera = (livePos: [number, number, number] | undefined) => {
        const store = useCosmosStore.getState();

        const getSunPos = (s: typeof store): [number, number, number] | null => {
          // In our scene, the Sun is at the solar system origin, so the solar-system-marker
          // is a valid fallback if the Sun mesh isn't currently reporting positions yet.
          return s.objectWorldPositions['sun'] ?? s.objectWorldPositions['solar-system-marker'] ?? null;
        };

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

          // Stars (like Proxima Centauri) positions are also in light-years
          if (targetObject.category === 'stars') {
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

        // If lookAt is not defined, look at the target object
        // If lookAt is defined and not [0,0,0], use it (for milky way scale etc)
        let lookAtPos: [number, number, number];
        if (stop.lookAt && (stop.lookAt[0] !== 0 || stop.lookAt[1] !== 0 || stop.lookAt[2] !== 0)) {
          // lookAt is in km
          lookAtPos = [
            stop.lookAt[0] * UNIFIED_SCALE,
            stop.lookAt[1] * UNIFIED_SCALE,
            stop.lookAt[2] * UNIFIED_SCALE,
          ];
        } else if (!stop.lookAt) {
          // No lookAt defined - look at the object itself
          lookAtPos = targetPos;
        } else {
          // lookAt is [0,0,0] - look at the origin (Sun for solar system)
          lookAtPos = [0, 0, 0];
        }

        // Tour stop cameraPosition is treated as an offset vector in km
        const offsetScene: [number, number, number] = [
          stop.cameraPosition[0] * UNIFIED_SCALE,
          stop.cameraPosition[1] * UNIFIED_SCALE,
          stop.cameraPosition[2] * UNIFIED_SCALE,
        ];

        let cameraPos: [number, number, number];

        // For solar system bodies (except the sun itself), place the camera on the sun-facing side
        if (targetObject?.category === 'solarSystem' && targetObject.id !== 'sun') {
          const sunPos = getSunPos(store) ?? ([0, 0, 0] as [number, number, number]);

          // Direction from object to sun
          const dx = sunPos[0] - targetPos[0];
          const dy = sunPos[1] - targetPos[1];
          const dz = sunPos[2] - targetPos[2];
          const len = Math.hypot(dx, dy, dz);

          // Calculate camera distance from offset
          const dist = Math.hypot(offsetScene[0], offsetScene[1], offsetScene[2]) || 1;

          if (len > 0) {
            const dirToSun = [dx / len, dy / len, dz / len];

            // Position camera on the sun-facing side with proper elevation
            // Use both the direction to sun AND the offset height for better framing
            cameraPos = [
              targetPos[0] + dirToSun[0] * dist * 0.8,
              targetPos[1] + dist * 0.4, // Consistent elevation relative to distance
              targetPos[2] + dirToSun[2] * dist * 0.8,
            ];
          } else {
            // Fallback if somehow at sun's position - use simple offset
            cameraPos = [
              targetPos[0] + offsetScene[0],
              targetPos[1] + offsetScene[1],
              targetPos[2] + offsetScene[2],
            ];
          }
        } else if (stop.scaleLevel === 'milkyWay') {
          // For milky way scale, use absolute positions from the stop
          cameraPos = [
            stop.cameraPosition[0] * UNIFIED_SCALE,
            stop.cameraPosition[1] * UNIFIED_SCALE,
            stop.cameraPosition[2] * UNIFIED_SCALE,
          ];
        } else if (targetObject?.category === 'stars' && targetObject.id !== 'sun') {
          // For distant stars like Proxima Centauri, use the tour stop's camera position
          // directly as an offset from the star's position (in km, scaled to scene)
          cameraPos = [
            targetPos[0] + offsetScene[0],
            targetPos[1] + offsetScene[1],
            targetPos[2] + offsetScene[2],
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
        const followObjectId = stop.lookAt ? undefined : stop.locationId;
        const offset: [number, number, number] = [
          cameraPos[0] - targetPos[0],
          cameraPos[1] - targetPos[1],
          cameraPos[2] - targetPos[2],
        ];

        setTourCameraTarget({
          position: cameraPos,
          lookAt: lookAtPos,
          space: 'scene',
          followObjectId,
          offset,
        });
      };

      const store = useCosmosStore.getState();
      const livePos = store.objectWorldPositions[stop.locationId];

      const getHasSunPos = (s: typeof store) =>
        !!(s.objectWorldPositions['sun'] || s.objectWorldPositions['solar-system-marker']);

      const isValidLivePos = (pos: [number, number, number] | undefined) => {
        if (!pos) return false;
        // For most objects, any vector is fine.
        // For solar-system bodies (except the Sun), an initial [0,0,0] can appear briefly on mount
        // before their orbital position is applied, which would incorrectly aim the camera at the Sun.
        if (targetObject?.category === 'solarSystem' && targetObject.id !== 'sun') {
          const dist = Math.hypot(pos[0], pos[1], pos[2]);
          const expectedOrbit = (targetObject.orbitRadius ?? 0) * UNIFIED_SCALE;
          const minDist = expectedOrbit > 0 ? expectedOrbit * 0.2 : 1;
          return dist > minDist;
        }
        return true;
      };

      // For solar system bodies, we need both the object's live position AND the sun's position
      // to correctly calculate sun-facing camera placement
      const needsSunPos = targetObject?.category === 'solarSystem' && targetObject?.id !== 'sun';
      const hasSunPos = getHasSunPos(store);

      if (isValidLivePos(livePos) && (!needsSunPos || hasSunPos)) {
        // We have all positions we need, compute immediately
        computeAndSetCamera(livePos);
      } else {
        // Wait for live positions to become available (and be non-zero/valid)
        let done = false;
        const unsubscribe = useCosmosStore.subscribe((state) => {
          if (done) return;
          const objPos = state.objectWorldPositions[stop.locationId];
          const sunOk = !needsSunPos || getHasSunPos(state);
          if (isValidLivePos(objPos) && sunOk) {
            done = true;
            unsubscribe();
            computeAndSetCamera(objPos);
          }
        });

        // Fallback: if positions never arrive (e.g., static objects), compute with fallback after a short delay
        setTimeout(() => {
          if (!done) {
            done = true;
            unsubscribe();
            computeAndSetCamera(undefined);
          }
        }, 1200);
      }
    },
    [setTourIndex, setSelectedObject, setTourCameraTarget]
  );
  
  // Initialize tour on first render when touring starts - always go to stop 0
  useEffect(() => {
    if (isTouring) {
      // Always navigate to the first stop when tour starts, regardless of current position
      goToStop(0);
    }
  }, [isTouring, goToStop]);
  
  // Auto-advance when not paused + animate progress bar
  useEffect(() => {
    if (!isTouring || !currentStop) {
      setTimerProgress(0);
      return;
    }
    
    const duration = currentStop.duration * 1000; // Convert to ms
    
    // Reset timer start when stop changes or tour resumes
    if (!isPaused) {
      timerStartRef.current = performance.now();
      
      // Animate the progress bar
      const animate = () => {
        const elapsed = performance.now() - timerStartRef.current;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setTimerProgress(progress);
        
        if (progress < 100 && !useCosmosStore.getState().isPaused) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    // Auto-advance timer
    const timer = !isPaused ? setTimeout(() => {
      if (tourIndex < tourStops.length - 1) {
        goToStop(tourIndex + 1);
      } else {
        // Tour complete - stop
        stopTour();
      }
    }, duration) : undefined;
    
    return () => {
      if (timer) clearTimeout(timer);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTouring, isPaused, tourIndex, currentStop, goToStop, stopTour]);
  
  // Reset progress when changing stops
  useEffect(() => {
    setTimerProgress(0);
  }, [tourIndex]);

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

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    
    // Only register horizontal swipes (ignore if vertical movement is larger)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        // Swipe right - go to previous
        handlePrevious();
      } else {
        // Swipe left - go to next
        handleNext();
      }
    }
    
    touchStartX.current = null;
    touchStartY.current = null;
  };
  
  if (!isTouring || !currentStop) return null;

  // Collapsed/minimized view
  if (isCollapsed) {
    return (
      <div 
        className={`${isFullscreen ? 'fixed' : 'absolute'} z-[10001] bg-black/90 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden cursor-pointer
          bottom-2 left-2 right-2 
          sm:bottom-4 sm:top-auto sm:left-auto sm:right-4 sm:w-auto`}
        style={isFullscreen ? {
          bottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
          left: 'calc(0.5rem + env(safe-area-inset-left))',
          right: 'calc(0.5rem + env(safe-area-inset-right))',
        } : undefined}
        onClick={toggleCollapse}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
          {/* Progress indicator */}
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeDasharray={`${((tourIndex + 1) / totalStops) * 100} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs text-white font-medium">
              {tourIndex + 1}
            </span>
          </div>
          
          {/* Title */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs sm:text-sm font-medium truncate">
              {currentStop.title[language]}
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                togglePause();
              }}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              {isPaused ? (
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="h-7 w-7 sm:h-8 sm:w-8 text-white/70 hover:text-white hover:bg-white/10"
            >
              <SkipForward className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            
            <ChevronUp className="w-4 h-4 text-white/50 ml-1" />
          </div>
        </div>
      </div>
    );
  }
  
  // Expanded view
  return (
    <div 
      className={`${isFullscreen ? 'fixed' : 'absolute'} z-[10001] bg-black/90 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden
        bottom-2 left-2 right-2 max-h-[45vh]
        sm:bottom-4 sm:top-auto sm:left-auto sm:right-4 sm:w-80 sm:max-h-none
        md:w-96`}
      style={isFullscreen ? { 
        bottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
        left: 'calc(0.5rem + env(safe-area-inset-left))',
        right: 'calc(0.5rem + env(safe-area-inset-right))',
      } : undefined}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Overall tour progress bar */}
      <div className="h-1 bg-white/10">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((tourIndex + 1) / totalStops) * 100}%` }}
        />
      </div>
      
      {/* Timer progress bar - shows time left on current stop */}
      <div className="h-0.5 bg-white/5">
        <div 
          className="h-full bg-emerald-500/80"
          style={{ 
            width: `${100 - timerProgress}%`,
            transition: isPaused ? 'none' : 'width 100ms linear'
          }}
        />
      </div>
      
      {/* Header - clickable to collapse */}
      <div 
        className="flex items-center justify-between px-3 py-2 sm:p-3 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-[10px] sm:text-xs">
            {tourIndex + 1}/{totalStops}
          </span>
          <h2 className="text-white font-semibold text-sm sm:hidden truncate max-w-[180px]">
            {currentStop.title[language]}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <ChevronDown className="w-4 h-4 text-white/70" />
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleExit();
            }}
            className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Content - scrollable and compact on mobile */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto max-h-[25vh] sm:max-h-none">
        <h2 className="hidden sm:block text-white font-bold text-lg">
          {currentStop.title[language]}
        </h2>
        <p className="text-white/80 text-xs sm:text-sm leading-relaxed line-clamp-4 sm:line-clamp-none">
          {currentStop.narration[language]}
        </p>
      </div>
      
      {/* Controls - more compact on mobile */}
      <div className="flex items-center justify-between px-2 py-2 sm:p-3 border-t border-white/10 bg-white/5">
        <Button
          size="sm"
          variant="ghost"
          onClick={handlePrevious}
          disabled={tourIndex === 0}
          className="text-[10px] sm:text-xs text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 px-2 sm:px-3 h-7 sm:h-8"
        >
          <SkipBack className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
          <span className="hidden xs:inline">{t.previous}</span>
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={togglePause}
          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          {isPaused ? (
            <Play className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleNext}
          className="text-[10px] sm:text-xs text-white/70 hover:text-white hover:bg-white/10 px-2 sm:px-3 h-7 sm:h-8"
        >
          <span className="hidden xs:inline">{t.next}</span>
          <SkipForward className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5 sm:ml-1" />
        </Button>
      </div>
    </div>
  );
};
