import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { HelpCircle, Compass, Maximize, Minimize, CircleDot, CircleOff } from 'lucide-react';
import { useCosmosStore } from '../store/useCosmosStore';
import { useFullscreenStore } from '../store/useFullscreenStore';
import { useCallback, useEffect } from 'react';

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
    showOrbits: 'Show orbits',
    hideOrbits: 'Hide orbits',
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
    showOrbits: 'Afficher les orbites',
    hideOrbits: 'Masquer les orbites',
  },
};

export const CosmosUI = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const {
    startTour,
    toggleQuickJump,
    showControlHints,
    setShowControlHints,
    showOrbits,
    toggleOrbits,
  } = useCosmosStore();
  const { isFullscreen, setIsFullscreen } = useFullscreenStore();

  const setPageChromeHidden = useCallback((hidden: boolean) => {
    const nav = document.querySelector('nav') as HTMLElement | null;
    const footer = document.querySelector('footer') as HTMLElement | null;

    const setHidden = (el: HTMLElement | null) => {
      if (!el) return;

      const key = 'cosmosPrevDisplay';

      if (hidden) {
        if (el.dataset[key] === undefined) el.dataset[key] = el.style.display || '';
        el.style.display = 'none';
      } else {
        el.style.display = el.dataset[key] ?? '';
        delete el.dataset[key];
      }
    };

    setHidden(nav);
    setHidden(footer);
  }, []);

  // Safety: always restore page chrome on unmount / when fullscreen is off.
  useEffect(() => {
    if (!isFullscreen) setPageChromeHidden(false);
    return () => setPageChromeHidden(false);
  }, [isFullscreen, setPageChromeHidden]);

  const savePrevContainerStyles = useCallback((el: HTMLElement) => {
    const keys = [
      'position',
      'inset',
      'zIndex',
      'width',
      'height',
      'borderRadius',
      'border',
      'maxWidth',
      'backgroundColor',
    ] as const;

    keys.forEach((key) => {
      const datasetKey = `cosmosPrev${key[0].toUpperCase()}${key.slice(1)}`;
      if ((el.dataset as any)[datasetKey] === undefined) {
        (el.dataset as any)[datasetKey] = (el.style as any)[key] ?? '';
      }
    });
  }, []);

  const restorePrevContainerStyles = useCallback((el: HTMLElement) => {
    const keys = [
      'position',
      'inset',
      'zIndex',
      'width',
      'height',
      'borderRadius',
      'border',
      'maxWidth',
      'backgroundColor',
    ] as const;

    keys.forEach((key) => {
      const datasetKey = `cosmosPrev${key[0].toUpperCase()}${key.slice(1)}`;
      const prev = (el.dataset as any)[datasetKey];
      (el.style as any)[key] = prev ?? '';
      delete (el.dataset as any)[datasetKey];
    });
  }, []);

  const applyFullscreenFallback = useCallback(
    (containerEl: HTMLElement) => {
      savePrevContainerStyles(containerEl);
      containerEl.setAttribute('data-cosmos-fullscreen-fallback', 'true');

      // Force true viewport fill (Tailwind class ordering can't override h-[50vh] reliably)
      containerEl.style.position = 'fixed';
      containerEl.style.inset = '0';
      containerEl.style.zIndex = '9999';
      containerEl.style.width = '100vw';
      // iOS Safari support: prefer 100vh fallback, then 100dvh when available
      containerEl.style.height = '100vh';
      containerEl.style.height = '100dvh';
      containerEl.style.borderRadius = '0px';
      containerEl.style.border = '0px';
      containerEl.style.maxWidth = 'none';

      // Ensure canvas area stays opaque even after we exit fullscreen.
      containerEl.style.backgroundColor = '#000';

      setPageChromeHidden(true);

      // Prevent page scroll behind the fullscreen canvas
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    },
    [savePrevContainerStyles, setPageChromeHidden]
  );

  const clearFullscreenOverrides = useCallback(
    (containerEl: HTMLElement) => {
      containerEl.removeAttribute('data-cosmos-fullscreen-fallback');

      restorePrevContainerStyles(containerEl);

      setPageChromeHidden(false);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    },
    [restorePrevContainerStyles, setPageChromeHidden]
  );


  // Listen for native fullscreen changes (e.g., user presses Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const container = document.querySelector('[data-cosmos-container]') as HTMLElement | null;

      const isNativeFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement);
      const isFallbackFs = !!container?.getAttribute('data-cosmos-fullscreen-fallback');

      const next = isNativeFs || isFallbackFs;
      setIsFullscreen(next);

      // If native fullscreen ended, ensure we restore any overrides.
      if (!next && container) {
        clearFullscreenOverrides(container);
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
  }, [clearFullscreenOverrides]);

  const toggleFullscreen = useCallback(() => {
    const container = document.querySelector('[data-cosmos-container]') as HTMLElement | null;
    if (!container) return;

    const doc = document as any;
    const elem = container as any;

    const isNativeFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement);
    const isFallbackFs = !!container.getAttribute('data-cosmos-fullscreen-fallback');
    const isCurrentlyFullscreen = isNativeFs || isFallbackFs;

    if (!isCurrentlyFullscreen) {
      // Save current inline styles so we can reliably restore after fullscreen.
      savePrevContainerStyles(container);

      // Make it look like "real" fullscreen (no border / rounding)
      container.style.borderRadius = '0px';
      container.style.border = '0px';

      const requestFs =
        elem.requestFullscreen ||
        elem.webkitRequestFullscreen ||
        elem.mozRequestFullScreen ||
        elem.msRequestFullscreen;

      if (requestFs) {
        try {
          const result = requestFs.call(elem);

          // Some browsers (notably iOS webkit) don't return a Promise here.
          if (result && typeof (result as any).then === 'function') {
            (result as Promise<void>)
              .then(() => setIsFullscreen(true))
              .catch(() => {
                applyFullscreenFallback(container);
                setIsFullscreen(true);
              });
          } else {
            // Optimistically set state, then verify and fallback if native fullscreen didn't happen.
            setIsFullscreen(true);
            window.setTimeout(() => {
              const stillNotNative = !(
                doc.fullscreenElement ||
                doc.webkitFullscreenElement ||
                doc.mozFullScreenElement
              );
              if (stillNotNative) {
                applyFullscreenFallback(container);
                setIsFullscreen(true);
              }
            }, 250);
          }
        } catch {
          applyFullscreenFallback(container);
          setIsFullscreen(true);
        }
      } else {
        applyFullscreenFallback(container);
        setIsFullscreen(true);
      }

      return;
    }

    // Exit fullscreen
    if (isNativeFs) {
      const exitFs =
        doc.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.mozCancelFullScreen ||
        doc.msExitFullscreen;
      if (exitFs) {
        try {
          const result = exitFs.call(doc);
          if (result && typeof (result as any).then === 'function') {
            (result as Promise<void>)
              .then(() => {
                clearFullscreenOverrides(container);
                setIsFullscreen(false);
              })
              .catch(() => {
                clearFullscreenOverrides(container);
                setIsFullscreen(false);
              });
          } else {
            clearFullscreenOverrides(container);
            setIsFullscreen(false);
          }
        } catch {
          clearFullscreenOverrides(container);
          setIsFullscreen(false);
        }
        return;
      }
    }

    // CSS fallback exit (or no exit API)
    clearFullscreenOverrides(container);
    setIsFullscreen(false);
  }, [applyFullscreenFallback, clearFullscreenOverrides, savePrevContainerStyles]);


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
      <div
        className={`${isFullscreen ? 'fixed' : 'absolute'} top-2 sm:top-4 right-2 sm:right-4 flex gap-1 sm:gap-2 z-[10000]`}
        style={
          isFullscreen
            ? {
                top: 'calc(0.5rem + env(safe-area-inset-top))',
                right: 'calc(0.5rem + env(safe-area-inset-right))',
              }
            : undefined
        }
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleFullscreen}
          className="h-7 w-7 sm:h-9 sm:w-9 bg-white/10 hover:bg-white/20 text-white"
        >
          {isFullscreen ? (
            <Minimize className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          ) : (
            <Maximize className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          )}
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
