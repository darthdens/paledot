import { portraitFramingFactor } from '@/features/left-behind/lib/bodyScale';
import { useEffect, useCallback, useState, useRef, type ReactNode } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useCosmosStore } from '../store/useCosmosStore';
import { useFullscreenStore } from '../store/useFullscreenStore';
import { getTour, pickText } from '../data/tours';
import type { TourStop } from '../types';
import { useSimClock } from '@/features/left-behind/state/useSimClock';
import { followHardware, cancelPendingHardwareFollow } from '@/features/left-behind/lib/hardwareNavigation';
import { getPhotoManifest } from '@/features/left-behind/data/dataClient';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { celestialObjects } from '../data/celestialObjects';
import { UNITS } from '../types';
import { captionText } from '@/features/left-behind/lib/dataText';
import { tourPhotoIds } from '@/features/left-behind/lib/tourPresentation';
import { tourSlideSeconds } from '@/features/left-behind/lib/tourPlayback';
import { useTourPlayback } from '@/features/left-behind/lib/useTourPlayback';
import { OneLastLook, type LastLookPanel } from '@/features/left-behind/ui/OneLastLook';
import { useLeftBehindStore } from '@/features/left-behind/state/useLeftBehindStore';

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
  const { language, tr, tx, numberLocale } = useLanguage();
  const t = tr(translations);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
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

  const activeTourId = useCosmosStore((state) => state.activeTourId);
  const tour = getTour(activeTourId);
  const tourStops = tour.stops;
  const currentStop = tourStops[tourIndex];
  const isLastLook = activeTourId === 'voyager-1' && currentStop?.id === 'voyager-1-one-last-look';
  const totalStops = tourStops.length;
  const followRetry = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!isTouring) { if (followRetry.current) clearInterval(followRetry.current); followRetry.current = null; cancelPendingHardwareFollow(); }
    return () => { if (followRetry.current) clearInterval(followRetry.current); cancelPendingHardwareFollow(); };
  }, [isTouring, activeTourId]);

  // Left Behind stops: set/play the app clock and follow a machine through the normal machine follow.
  const playMachineStop = useCallback((stop: TourStop) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock = useSimClock.getState();
    if (stop.date) {
      const from = stop.date === 'now' ? Date.now() : Date.parse(stop.date);
      const until = stop.playUntil ? Date.parse(stop.playUntil) : undefined;
      // Reduced motion: jump to the end of the range instead of playing it.
      if (reduced && until !== undefined) clock.setTourPlayback(until);
      else clock.setTourPlayback(from, until, stop.rate);
    } else clock.setTourPlayback(clock.simDate);
    setTourCameraTarget(null);
    if (followRetry.current) { clearInterval(followRetry.current); followRetry.current = null; }
    if (!stop.follow?.startsWith('hw:')) return;
    const id = stop.follow.slice(3);
    const distance = stop.distanceKm ?? null;
    if (followHardware(id, distance)) return;
    // Trajectory data or a landing pin may still be loading: retry briefly.
    const started = Date.now();
    followRetry.current = setInterval(() => {
      if (followHardware(id, distance) || Date.now() - started > 20000) { if (followRetry.current) clearInterval(followRetry.current); followRetry.current = null; }
    }, 300);
  }, [setTourCameraTarget]);

  const finishTour = useCallback(() => {
    const endFrame = tour.onEnd === 'end-frame';
    stopTour();
    if (endFrame) window.dispatchEvent(new Event('cosmos:journey-end'));
  }, [tour, stopTour]);

  const UNIFIED_SCALE = 0.001;

  // Navigate to a tour stop
  const goToStop = useCallback(
    (index: number) => {
      if (index < 0 || index >= tourStops.length) return;

      const stop = tourStops[index];
      if (!stop) return;
      setTourIndex(index);
      if (stop.date || stop.follow) { playMachineStop(stop); return; }

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
        const framing = stop.lookAt ? 1 : portraitFramingFactor(window.innerWidth / window.innerHeight);
        const offsetScene: [number, number, number] = [
          stop.cameraPosition[0] * UNIFIED_SCALE * framing,
          stop.cameraPosition[1] * UNIFIED_SCALE * framing,
          stop.cameraPosition[2] * UNIFIED_SCALE * framing,
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
              targetPos[0] + (dirToSun[0] ?? 0) * dist * 0.8,
              targetPos[1] + dist * 0.4, // Consistent elevation relative to distance
              targetPos[2] + (dirToSun[2] ?? 0) * dist * 0.8,
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
            stop.cameraPosition[0] * UNIFIED_SCALE * framing,
            stop.cameraPosition[1] * UNIFIED_SCALE * framing,
            stop.cameraPosition[2] * UNIFIED_SCALE * framing,
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
    [tourStops, playMachineStop, setTourIndex, setSelectedObject, setTourCameraTarget]
  );
  
  // Initialize tour on first render when touring starts - always go to stop 0
  useEffect(() => {
    if (isTouring) {
      // Always navigate to the first stop when tour starts, regardless of current position
      const requested = useLeftBehindStore.getState().pendingStopId;
      useLeftBehindStore.setState({ pendingStopId: null });
      const index = requested ? tourStops.findIndex(s => s.id === requested) : 0;
      goToStop(Math.max(0, index));
    }
  }, [isTouring, activeTourId]); // eslint-disable-line react-hooks/exhaustive-deps
  
  useTourPlayback(
    isTouring && currentStop && !isLastLook ? `${activeTourId}:${currentStop.id}` : null,
    isPaused,
    currentStop ? tourSlideSeconds(currentStop, tour.onEnd !== 'end-frame') : 0,
    () => {
      if (tourIndex < tourStops.length - 1) {
        goToStop(tourIndex + 1);
      } else {
        finishTour();
      }
    }
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!isTouring || isLastLook) return;

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
  }, [isTouring, isLastLook, tourIndex, goToStop, togglePause, stopTour, tourStops.length]);
  
  const handlePrevious = () => {
    if (tourIndex > 0) {
      goToStop(tourIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (tourIndex < tourStops.length - 1) {
      goToStop(tourIndex + 1);
    } else {
      finishTour();
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
    const touch = e.touches[0];
    if (!touch) return;
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent, previous: () => void, next: () => void) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const touch = e.changedTouches[0];
    if (!touch) return;
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;
    
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    
    // Only register horizontal swipes (ignore if vertical movement is larger)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        // Swipe right - go to previous
        previous();
      } else {
        // Swipe left - go to next
        next();
      }
    }
    
    touchStartX.current = null;
    touchStartY.current = null;
  };
  
  if (!isTouring || !currentStop) return null;
  const renderPanel = ({ title, label, progress, children, previous, next, nextDisabled = false }: LastLookPanel) => (
    <div 
      data-tour-panel
      className={`${isFullscreen ? 'fixed' : 'absolute'} z-[10001] bg-card/90 backdrop-blur-xs rounded-lg border border-border overflow-hidden motion-safe:animate-slide-in-right
        bottom-2 left-2 right-2
        sm:bottom-4 sm:top-auto sm:left-auto sm:right-4 sm:w-80
        md:w-96`}
      style={isFullscreen ? { 
        bottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
        left: 'calc(0.5rem + env(safe-area-inset-left))',
        right: 'calc(0.5rem + env(safe-area-inset-right))',
      } : undefined}
      role="region"
      aria-label={pickText(tour.title, language, tr)}
      onTouchStart={handleTouchStart}
      onTouchEnd={e => handleTouchEnd(e, previous, next)}
    >
      {/* Overall tour progress bar - inside the card */}
      <div className="h-1 bg-muted/50">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      
      {/* Header - clickable to toggle collapse */}
      <div 
        className="flex items-center justify-between px-3 py-2 sm:p-3 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors gap-2"
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Progress indicator (visible when collapsed) */}
          <div className={`relative flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-8 h-8 sm:w-10 sm:h-10 opacity-100' : 'w-0 h-0 opacity-0 overflow-hidden'}`}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                className="stroke-border"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                className="stroke-primary"
                strokeWidth="3"
                strokeDasharray={`${progress * 100} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs text-foreground font-medium">
              {label}
            </span>
          </div>
          
          <span className={`text-muted-foreground text-[10px] sm:text-xs transition-opacity duration-300 flex-shrink-0 ${isCollapsed ? 'hidden' : 'block'}`}>
            {label}/{totalStops}
          </span>
          <div className="min-w-0">
            {tour.onEnd !== 'end-frame' && <p className="text-muted-foreground text-[10px] sm:text-xs truncate">{pickText(tour.title, language, tr)}</p>}
            <h2 className="text-foreground font-semibold text-sm truncate min-w-0">
              {title}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Collapsed controls */}
          <div className="flex items-center gap-1" hidden={!isCollapsed}>
            <Button
              size="icon"
              variant="ghost"
              aria-label={isPaused ? t.play : t.pause}
              onClick={(e) => {
                e.stopPropagation();
                togglePause();
              }}
              className="h-11 w-11 rounded-full bg-muted/50 hover:bg-muted text-foreground"
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
              aria-label={t.next}
              disabled={nextDisabled}
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="h-11 w-11 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <SkipForward className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
          
          <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground" aria-label={isCollapsed ? t.expand : t.collapse} aria-expanded={!isCollapsed} onClick={e => { e.stopPropagation(); toggleCollapse(); }}>
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleExit();
            }}
            aria-label={t.exitTour}
            className="h-11 w-11 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Content - collapsible with smooth animation */}
      <div 
        inert={isCollapsed}
        className={`grid transition-all duration-300 ease-out ${isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
      >
        <div className="overflow-hidden">
          {/* Content area */}
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-[25vh] sm:max-h-[50vh] overflow-y-auto overscroll-contain" aria-live="polite">
            {children}
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between px-2 py-2 sm:p-3 border-t border-border bg-muted/30">
            <Button
              size="sm"
              variant="ghost"
              onClick={previous}
              aria-label={t.previous}
              disabled={tourIndex === 0 && !isLastLook}
              className="text-[10px] sm:text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 px-2 sm:px-3 h-11"
            >
              <SkipBack className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              <span className="hidden xs:inline">{t.previous}</span>
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={togglePause}
              aria-label={isPaused ? t.play : t.pause}
              className="h-11 w-11 rounded-full bg-muted/50 hover:bg-muted text-foreground"
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
              onClick={next}
              aria-label={t.next}
              disabled={nextDisabled}
              className="text-[10px] sm:text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 px-2 sm:px-3 h-11"
            >
              <span className="hidden xs:inline">{t.next}</span>
              <SkipForward className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5 sm:ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
  if (isLastLook) return <OneLastLook tourIndex={tourIndex} totalStops={totalStops} renderPanel={renderPanel} onPrevious={handlePrevious} onNext={handleNext} />;
  const content: ReactNode = <>
    <p className="text-foreground/80 text-xs sm:text-sm leading-relaxed line-clamp-4 sm:line-clamp-none">{pickText(currentStop.narration, language, tr)}</p>
    <TourPhotos ids={tourPhotoIds(activeTourId, currentStop)} />
  </>;
  return renderPanel({ title: pickText(currentStop.title, language, tr), label: String(tourIndex + 1), progress: (tourIndex + 1) / totalStops, children: content, previous: handlePrevious, next: handleNext });
};

type TourPhoto = { id: string; imageUrl: string; alt: string; credit: string; nasaId: string; sourceUrl: string; caption: { en: string; fr: string } & Record<string, string> };

/** Stop thumbnails; tapping opens the same full-size viewer as the machine card. */
function TourPhotos({ ids }: { ids: string[] }) {
  const { language, tr } = useLanguage();
  const [photos, setPhotos] = useState<TourPhoto[]>([]);
  const [open, setOpen] = useState<TourPhoto | null>(null);
  useEffect(() => {
    let alive = true;
    void getPhotoManifest().then(list => { if (alive) setPhotos(ids.map(id => (list as unknown as TourPhoto[]).find(p => p.id === id)).filter((p): p is TourPhoto => !!p)); }).catch(() => {});
    return () => { alive = false; };
  }, [ids.join('|')]);
  if (!photos.length) return null;
  const caption = (p: TourPhoto) => captionText(p.id, p.caption, language);
  return <>
    <div className="flex gap-3 overflow-x-auto">
      {photos.map(p => <figure key={p.id} className="w-32 sm:w-44 shrink-0">
        <Button variant="ghost" type="button" onClick={() => setOpen(p)} aria-label={caption(p)} className="h-20 sm:h-24 w-full p-0 overflow-hidden rounded-md bg-muted/40">
          <img src={p.imageUrl} alt={caption(p)} loading="lazy" className="h-full w-full object-contain" />
        </Button>
        <figcaption className="mt-1 text-xs text-muted-foreground leading-snug">{caption(p)}<a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="block hover:underline">{p.credit} · {p.nasaId}</a></figcaption>
      </figure>)}
    </div>
    <Dialog open={!!open} onOpenChange={o => !o && setOpen(null)}>
      <DialogContent className="paledot dark max-w-[min(96vw,1100px)] border-border bg-background p-3">
        {open && <><DialogTitle className="sr-only">{caption(open)}</DialogTitle><DialogDescription className="sr-only">{caption(open)}</DialogDescription>
          <img src={open.imageUrl} alt={caption(open)} className="max-h-[78vh] w-full object-contain" />
          <p className="text-sm text-foreground">{caption(open)}<span className="block text-xs text-muted-foreground"><a href={open.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{open.credit} · {open.nasaId}</a></span></p></>}
      </DialogContent>
    </Dialog>
  </>;
}
