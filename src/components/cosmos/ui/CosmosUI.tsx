import { lazy, Suspense } from 'react';
const LeftBehindDateControl = lazy(() => import('@/features/left-behind/ui/DateControl').then(m => ({ default: m.DateControl })));
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { useSimClock } from '@/features/left-behind/state/useSimClock';
import { dateCopy, formatSimDate } from '@/features/left-behind/lib/dateCopy';
import { LeftBehindMenu } from '@/features/left-behind/ui/LeftBehindMenu';
import { TourChoices } from '@/features/left-behind/ui/TourChoices';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Compass, Satellite, Maximize, Minimize, CircleDot, CircleOff, Clock, Timer, TimerOff, Orbit, Activity, Home, Scaling, BarChart3, Info, MoreVertical } from 'lucide-react';
import { useCosmosStore } from '../store/useCosmosStore';
import { useFullscreenStore } from '../store/useFullscreenStore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectSearch } from './ObjectSearch';
import { useIsMobile } from '@/hooks/use-mobile';
import { AboutModal } from './AboutModal';
import { AmbientMusicController } from './AmbientMusicController';
import { isNativeApp } from '@/lib/platform';
import { useSiteBrand } from '@/lib/site-brand';
import { LanguageButton, LanguageMenuList } from './LanguagePicker';
import { FlagIcon } from './FlagIcon';
import { useLeftBehindStore } from '@/features/left-behind/state/useLeftBehindStore';
import { leftBehindCopy } from '@/features/left-behind/lib/copy';
import { useShallow } from 'zustand/react/shallow';
const translations = {
  en: {
    startTour: 'Start Guided Tour',
    quickJump: 'Quick Jump',
    controls: 'Controls',
    // Desktop controls
    scrollZoom: 'Scroll to zoom in/out',
    dragRotate: 'Left-drag to rotate view',
    rightDragPan: 'Right-drag to pan',
    clickSelect: 'Click objects to select',
    // Touch controls (mobile/tablet)
    pinchZoom: 'Pinch to zoom in/out',
    dragRotateTouch: 'Drag to rotate view',
    twoFingerPan: 'Two-finger drag to pan',
    tapSelect: 'Tap objects to select',
    distanceFromEarth: 'Distance from Earth',
    welcome: 'Welcome to Cosmos Explorer',
    subtitle: 'Journey through our solar system and beyond',
    explore: 'Explore',
    showOrbits: 'Show orbits',
    hideOrbits: 'Hide orbits',
    timeSpeed: 'Time Speed',
    paused: 'Paused',
    realTime: 'Real-time',
    fast: 'Fast',
    showPeriods: 'Show periods',
    hidePeriods: 'Hide periods',
    showTrails: 'Show trails',
    hideTrails: 'Hide trails',
    showStats: 'Show performance stats',
    hideStats: 'Hide performance stats',
    home: 'Go to Earth',
    sizeComparison: 'Size comparison',
    exaggeratedScale: 'Exaggerated scale',
    realisticScale: 'Realistic scale',
    // Touch tip
    useButtons: 'Use buttons to control',
    // Button tooltips
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    help: 'Help & Controls',
    about: 'About',
  },
  fr: {
    startTour: 'Commencer la Visite',
    quickJump: 'Saut Rapide',
    controls: 'Contrôles',
    // Desktop controls
    scrollZoom: 'Molette pour zoomer',
    dragRotate: 'Glisser pour tourner',
    rightDragPan: 'Clic droit pour déplacer',
    clickSelect: 'Cliquer pour sélectionner',
    // Touch controls (mobile/tablet)
    pinchZoom: 'Pincer pour zoomer',
    dragRotateTouch: 'Glisser pour tourner',
    twoFingerPan: 'Deux doigts pour déplacer',
    tapSelect: 'Toucher pour sélectionner',
    distanceFromEarth: 'Distance de la Terre',
    welcome: 'Bienvenue dans Cosmos Explorer',
    subtitle: 'Voyagez à travers notre système solaire et au-delà',
    explore: 'Explorer',
    showOrbits: 'Afficher les orbites',
    hideOrbits: 'Masquer les orbites',
    timeSpeed: 'Vitesse du temps',
    paused: 'Pause',
    realTime: 'Temps réel',
    fast: 'Rapide',
    showPeriods: 'Afficher périodes',
    hidePeriods: 'Masquer périodes',
    showTrails: 'Afficher traînées',
    hideTrails: 'Masquer traînées',
    showStats: 'Afficher stats performance',
    hideStats: 'Masquer stats performance',
    home: 'Aller sur Terre',
    sizeComparison: 'Comparaison tailles',
    exaggeratedScale: 'Échelle exagérée',
    realisticScale: 'Échelle réaliste',
    // Touch tip
    useButtons: 'Utilisez les boutons',
    // Button tooltips
    fullscreen: 'Plein écran',
    exitFullscreen: 'Quitter plein écran',
    help: 'Aide & Contrôles',
    about: 'À propos',
  },
};

export const CosmosUI = () => {
  const { language, tr, tx, numberLocale, locale } = useLanguage();
  const t = tr(translations);
  const isMobile = useIsMobile();
  // In the native iOS / iPadOS / macOS / visionOS app the experience is
  // already full-bleed, so the fullscreen toggle is unnecessary.
  const brand = useSiteBrand();
  const menuOpen = useLeftBehindStore(s => s.menuOpen);
  const dateControlOpen = useSimClock(s => s.dateControlOpen);
  const rate = useSimClock(s => s.rate);
  const simSecond = useSimClock(s => Math.floor(s.simDate / 1000));
  const clockName = tr({ en: dateCopy[language].date, fr: dateCopy[language].date });
  const announceDropdown = () => window.dispatchEvent(new CustomEvent('cosmos:dropdown-open', { detail: 'toolbar' }));
  const toggleTimeMenu = () => { announceDropdown(); useLeftBehindStore.getState().setMenuOpen(false); useSimClock.getState().setDateControlOpen(!dateControlOpen); setShowMoreMenu(false); setShowLanguageMenu(false); useCosmosStore.setState({showQuickJump:false}); };
  const lbCopy = leftBehindCopy[language];
  const lbName = tr({ en: lbCopy.name, fr: lbCopy.name });
  const toggleLeftBehind = () => { announceDropdown(); useSimClock.getState().setDateControlOpen(false); useLeftBehindStore.getState().setMenuOpen(!menuOpen); setShowMoreMenu(false); setShowLanguageMenu(false); useCosmosStore.setState({showQuickJump:false}); };
  // Pale Dot is always full-bleed too, so it hides the fullscreen toggle like the native app.
  const native = isNativeApp() || brand === 'paledot';
  // In fullscreen, dropdowns appear directly below the button row (h-8 = 32px + gap)
  const fullscreenDropdownOffsetPx = isMobile ? 40 : 44;
  const quickJumpButtonRef = useRef<HTMLButtonElement | null>(null);
  const {
    startTour,
    isTouring,
    showQuickJump,
    toggleQuickJump,
    setQuickJumpAnchorRect,
    showControlHints,
    setShowControlHints,
    showOrbits,
    toggleOrbits,
    showTrails,
    toggleTrails,
    showRealPeriods,
    toggleRealPeriods,
    showPerformanceHUD,
    togglePerformanceHUD,
    toggleSizeComparison,
    goHome,
  } = useCosmosStore(useShallow(state=>({
    startTour:state.startTour,isTouring:state.isTouring,showQuickJump:state.showQuickJump,
    toggleQuickJump:state.toggleQuickJump,setQuickJumpAnchorRect:state.setQuickJumpAnchorRect,
    showControlHints:state.showControlHints,setShowControlHints:state.setShowControlHints,
    showOrbits:state.showOrbits,toggleOrbits:state.toggleOrbits,showTrails:state.showTrails,
    toggleTrails:state.toggleTrails,showRealPeriods:state.showRealPeriods,toggleRealPeriods:state.toggleRealPeriods,
    showPerformanceHUD:state.showPerformanceHUD,togglePerformanceHUD:state.togglePerformanceHUD,
    toggleSizeComparison:state.toggleSizeComparison,goHome:state.goHome,
  })));
  const { isFullscreen, setIsFullscreen } = useFullscreenStore();
  const uiFixed = isFullscreen && brand !== 'paledot';
  const timeMenuOpen = dateControlOpen;
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showTourChoices, setShowTourChoices] = useState(false);
  
  const timeSliderRef = useRef<HTMLDivElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const moreMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const languageMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const timeSpeedButtonRef = useRef<HTMLButtonElement | null>(null);

  // The region card announces itself; close toolbar dropdowns so only one is open.
  useEffect(() => {
    const onRegion = (e: Event) => {
      if ((e as CustomEvent).detail !== 'region') return;
      setShowMoreMenu(false); setShowLanguageMenu(false);
      useSimClock.getState().setDateControlOpen(false); useLeftBehindStore.getState().setMenuOpen(false); useCosmosStore.setState({ showQuickJump: false });
    };
    window.addEventListener('cosmos:dropdown-open', onRegion);
    return () => window.removeEventListener('cosmos:dropdown-open', onRegion);
  }, []);

  // Click-outside and Escape key handlers for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      
      // Close time slider if clicking outside
      if (timeMenuOpen && timeSliderRef.current && !timeSliderRef.current.contains(target) && 
          timeSpeedButtonRef.current && !timeSpeedButtonRef.current.contains(target)) {
        useSimClock.getState().setDateControlOpen(false);
      }
      
      // Close more menu if clicking outside
      if (showMoreMenu && moreMenuRef.current && !moreMenuRef.current.contains(target) &&
          moreMenuButtonRef.current && !moreMenuButtonRef.current.contains(target)) {
        setShowMoreMenu(false);
      }

      // Close language menu if clicking outside
      if (showLanguageMenu && languageMenuRef.current && !languageMenuRef.current.contains(target) &&
          languageMenuButtonRef.current && !languageMenuButtonRef.current.contains(target)) {
        setShowLanguageMenu(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (timeMenuOpen) { useSimClock.getState().setDateControlOpen(false); }
        if (showMoreMenu) setShowMoreMenu(false);
        if (showLanguageMenu) setShowLanguageMenu(false);
        if (showQuickJump) toggleQuickJump();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [timeMenuOpen, showMoreMenu, showLanguageMenu, showQuickJump, toggleQuickJump]);

  const handleQuickJumpClick = () => {
    announceDropdown();
    setShowMoreMenu(false); setShowLanguageMenu(false); useSimClock.getState().setDateControlOpen(false); useLeftBehindStore.getState().setMenuOpen(false);
    const el = quickJumpButtonRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setQuickJumpAnchorRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    } else {
      setQuickJumpAnchorRect(null);
    }
    toggleQuickJump();
  };

  const setPageChromeHidden = useCallback((hidden: boolean) => {
    const nav = (document.querySelector('[data-app-nav]') || document.querySelector('nav')) as HTMLElement | null;
    const footer = document.querySelector('footer') as HTMLElement | null;

    const setHidden = (el: HTMLElement | null, datasetPrefix: string) => {
      if (!el) return;

      const prevDisplayKey = `${datasetPrefix}PrevDisplay`;
      const prevPriorityKey = `${datasetPrefix}PrevDisplayPriority`;

      if (hidden) {
        if ((el.dataset as any)[prevDisplayKey] === undefined) {
          (el.dataset as any)[prevDisplayKey] = el.style.display || '';
          (el.dataset as any)[prevPriorityKey] = el.style.getPropertyPriority('display') || '';
        }
        el.style.setProperty('display', 'none', 'important');
      } else {
        const prevDisplay = (el.dataset as any)[prevDisplayKey] ?? '';
        const prevPriority = (el.dataset as any)[prevPriorityKey] ?? '';

        if (!prevDisplay) {
          el.style.removeProperty('display');
        } else {
          el.style.setProperty('display', prevDisplay, prevPriority || undefined);
        }

        delete (el.dataset as any)[prevDisplayKey];
        delete (el.dataset as any)[prevPriorityKey];
      }
    };

    setHidden(nav, 'cosmosNav');
    setHidden(footer, 'cosmosFooter');
  }, []);

  // Keep page chrome (header/footer) and Echo widget hidden while fullscreen is active.
  // This must run for BOTH native fullscreen and CSS fallback (iOS Safari is inconsistent).
  useEffect(() => {
    setPageChromeHidden(isFullscreen);

    const echoContainer = document.getElementById('echo-chat-container') as HTMLElement | null;
    if (echoContainer) {
      if (isFullscreen) {
        if (echoContainer.dataset["cosmosPrevDisplay"] === undefined) {
          echoContainer.dataset["cosmosPrevDisplay"] = echoContainer.style.display || '';
          echoContainer.dataset["cosmosPrevDisplayPriority"] = echoContainer.style.getPropertyPriority('display') || '';
        }
        echoContainer.style.setProperty('display', 'none', 'important');
      } else if (echoContainer.dataset["cosmosPrevDisplay"] !== undefined) {
        const prevDisplay = echoContainer.dataset["cosmosPrevDisplay"] || '';
        const prevPriority = echoContainer.dataset["cosmosPrevDisplayPriority"] || '';

        if (!prevDisplay) {
          echoContainer.style.removeProperty('display');
        } else {
          echoContainer.style.setProperty('display', prevDisplay, prevPriority || undefined);
        }

        delete echoContainer.dataset["cosmosPrevDisplay"];
        delete echoContainer.dataset["cosmosPrevDisplayPriority"];
      }
    }

    return () => {
      setPageChromeHidden(false);
      if (echoContainer && echoContainer.dataset["cosmosPrevDisplay"] !== undefined) {
        const prevDisplay = echoContainer.dataset["cosmosPrevDisplay"] || '';
        const prevPriority = echoContainer.dataset["cosmosPrevDisplayPriority"] || '';
        if (!prevDisplay) echoContainer.style.removeProperty('display');
        else echoContainer.style.setProperty('display', prevDisplay, prevPriority || undefined);
        delete echoContainer.dataset["cosmosPrevDisplay"];
        delete echoContainer.dataset["cosmosPrevDisplayPriority"];
      }
    };
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
      const datasetKey = `cosmosPrev${key[0]!.toUpperCase()}${key.slice(1)}`;
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
      const datasetKey = `cosmosPrev${key[0]!.toUpperCase()}${key.slice(1)}`;
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
      containerEl.style.setProperty('position', 'fixed', 'important');
      containerEl.style.setProperty('inset', '0', 'important');
      containerEl.style.setProperty('z-index', '2147483647', 'important');
      containerEl.style.setProperty('width', '100vw', 'important');
      // iOS Safari support: prefer 100vh fallback, then 100dvh when available
      containerEl.style.setProperty('height', '100vh', 'important');
      containerEl.style.setProperty('height', '100dvh', 'important');
      containerEl.style.borderRadius = '0px';
      containerEl.style.border = '0px';
      containerEl.style.maxWidth = 'none';

      // Ensure canvas area stays dark regardless of theme
      containerEl.style.backgroundColor = '#0a0a0f';

      setPageChromeHidden(true);

      // Hide Echo widget in fullscreen (we do not modify the widget itself; we only hide its container)
      const echoContainer = document.getElementById('echo-chat-container') as HTMLElement | null;
      if (echoContainer) {
        if (echoContainer.dataset["cosmosPrevDisplay"] === undefined) {
          echoContainer.dataset["cosmosPrevDisplay"] = echoContainer.style.display || '';
          echoContainer.dataset["cosmosPrevDisplayPriority"] = echoContainer.style.getPropertyPriority('display') || '';
        }
        echoContainer.style.setProperty('display', 'none', 'important');
      }

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

      // Restore Echo widget
      const echoContainer = document.getElementById('echo-chat-container') as HTMLElement | null;
      if (echoContainer && echoContainer.dataset["cosmosPrevDisplay"] !== undefined) {
        const prevDisplay = echoContainer.dataset["cosmosPrevDisplay"] || '';
        const prevPriority = echoContainer.dataset["cosmosPrevDisplayPriority"] || '';

        if (!prevDisplay) {
          echoContainer.style.removeProperty('display');
        } else {
          echoContainer.style.setProperty('display', prevDisplay, prevPriority || undefined);
        }

        delete echoContainer.dataset["cosmosPrevDisplay"];
        delete echoContainer.dataset["cosmosPrevDisplayPriority"];
      }

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
               .then(() => {
                 // Some mobile browsers resolve even if they didn't truly enter fullscreen.
                 const isActuallyNative = !!(
                   doc.fullscreenElement ||
                   doc.webkitFullscreenElement ||
                   doc.mozFullScreenElement
                 );

                 if (!isActuallyNative) {
                   applyFullscreenFallback(container);
                 }

                 setIsFullscreen(true);
               })
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
        <div className="absolute inset-0 flex items-center justify-center bg-black z-[20000] p-3 animate-fade-in">
          <div className="text-center space-y-3 sm:space-y-5 max-w-sm sm:max-w-lg px-4">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">{brand === 'paledot' ? (tx('Welcome to Pale Dot', 'Bienvenue dans Pale Dot')) : t.welcome}</h1>
            <p className="text-sm sm:text-base text-white/70">{t.subtitle}</p>

            <div className={`grid gap-3 text-left ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              <div className={`rounded-lg p-3 sm:p-4 space-y-1.5 ${brand === 'paledot' ? 'pd-card' : 'bg-white/10'}`}>
                <p className="text-white/90 font-medium text-sm sm:text-base">{t.controls}:</p>
                {isMobile ? (
                  <>
                    <p className="text-white/70 text-xs sm:text-sm">• {t.pinchZoom}</p>
                    <p className="text-white/70 text-xs sm:text-sm">• {t.dragRotateTouch}</p>
                    <p className="text-white/70 text-xs sm:text-sm">• {t.twoFingerPan}</p>
                    <p className="text-white/70 text-xs sm:text-sm">• {t.tapSelect}</p>
                  </>
                ) : (
                  <>
                    <p className="text-white/70 text-xs sm:text-sm">• {t.scrollZoom}</p>
                    <p className="text-white/70 text-xs sm:text-sm">• {t.dragRotate}</p>
                    <p className="text-white/70 text-xs sm:text-sm">• {t.rightDragPan}</p>
                    <p className="text-white/70 text-xs sm:text-sm">• {t.clickSelect}</p>
                  </>
                )}
              </div>

              {/* Keyboard shortcuts - only on desktop */}
              {!isMobile && (
                <div className={`rounded-lg p-3 sm:p-4 space-y-1.5 ${brand === 'paledot' ? 'pd-card' : 'bg-white/10'}`}>
                  <p className="text-white/90 font-medium text-sm sm:text-base">
                    {tx('Shortcuts:', 'Raccourcis:')}
                  </p>
                  <p className="text-white/70 text-xs sm:text-sm">• 1-9: {tx('Planets', 'Planètes')}</p>
                  <p className="text-white/70 text-xs sm:text-sm">• 0/S: {tx('Sun', 'Soleil')}</p>
                  <p className="text-white/70 text-xs sm:text-sm">• ←/→: {tx('Navigate', 'Naviguer')}</p>
                  <p className="text-white/70 text-xs sm:text-sm">• +/-: {tx('Speed', 'Vitesse')}</p>
                  <p className="text-white/70 text-xs sm:text-sm">• {tx('Space', 'Espace')}: {tx('Pause', 'Pause')}</p>
                </div>
              )}

              {/* Mobile tip - use UI buttons */}
              {isMobile && (
                <div className={`rounded-lg p-3 sm:p-4 space-y-1.5 ${brand === 'paledot' ? 'pd-card' : 'bg-white/10'}`}>
                  <p className="text-white/90 font-medium text-sm sm:text-base">
                    {tx('Tip:', 'Astuce:')}
                  </p>
                  <p className="text-white/70 text-xs sm:text-sm">• {t.useButtons}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
              <Button
                size="sm"
                aria-expanded={brand === 'paledot' ? showTourChoices : undefined}
                onClick={() => {
                  if (brand === 'paledot') setShowTourChoices(!showTourChoices);
                  else { setShowControlHints(false); startTour(); }
                }}
                className={brand === 'paledot' ? "pd-pill pd-primary" : "text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white border-0"}
              >
                {t.startTour}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowControlHints(false);
                  goHome();
                }}
                className={brand === 'paledot' ? "pd-pill" : "text-xs sm:text-sm bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"}
              >
                {t.explore}
              </Button>
              {brand === 'paledot' && <Button size="sm" variant="outline" className="pd-pill h-auto min-h-11" onClick={() => { setShowControlHints(false); useLeftBehindStore.getState().openFraming('intro'); }}>
                <span className="flex flex-col gap-1"><span>{tr({ en: lbCopy.entry, fr: lbCopy.entry })}</span><span className="text-[10px] text-muted-foreground">(NASA Space Apps Challenge)</span></span>
              </Button>}
            </div>
            {brand === 'paledot' && showTourChoices && <div className="pd-card rounded-lg p-2 max-h-[min(360px,40dvh)] overflow-y-auto mx-auto w-full max-w-sm"><TourChoices onBegin={id => { setShowTourChoices(false); setShowControlHints(false); startTour(id); }} /></div>}
          </div>
        </div>
      )}

      {/* Top controls - icon buttons with tooltips */}
      <div
        data-explorer-toolbar
        className={`${uiFixed ? 'fixed' : 'absolute'} top-2 left-2 right-2 sm:top-4 sm:left-auto sm:right-4 z-[10000]`}
        style={
          uiFixed
            ? {
                top: 'calc(0.5rem + env(safe-area-inset-top))',
                left: 'calc(0.5rem + env(safe-area-inset-left))',
                right: 'calc(0.5rem + env(safe-area-inset-right))',
              }
            : undefined
        }
      >
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center justify-end gap-1 sm:gap-1.5">
            {brand === 'paledot' && <>
              <Tooltip>
                <TooltipTrigger asChild><Button data-lb-menu-trigger size="icon" variant="ghost" aria-label={lbName} aria-pressed={menuOpen} onClick={toggleLeftBehind} className={`h-8 w-8 sm:h-9 sm:w-9 backdrop-blur-xs text-foreground ${menuOpen ? 'bg-foreground/25' : 'bg-foreground/10 hover:bg-foreground/20'}`}><Satellite className={`w-4 h-4 sm:w-5 sm:h-5 ${menuOpen ? '' : 'pd-lb-buzz'}`} /></Button></TooltipTrigger>
                <TooltipContent variant="dark" side="bottom"><span className="block">{lbName}</span><span className="block text-[10px] text-muted-foreground">(NASA Space Apps Challenge)</span></TooltipContent>
              </Tooltip>
              <div role="separator" aria-orientation="vertical" className="hidden lg:block w-px h-6 bg-border mx-1" />
            </>}
            <ObjectSearch onOpen={() => { announceDropdown(); setShowMoreMenu(false); setShowLanguageMenu(false); useSimClock.getState().setDateControlOpen(false); useLeftBehindStore.getState().setMenuOpen(false); useCosmosStore.setState({showQuickJump:false}); }} />
            {/* Essential controls - always visible */}
            {!native && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label={isFullscreen ? t.exitFullscreen : t.fullscreen} onClick={toggleFullscreen} className="h-8 w-8 sm:h-9 sm:w-9 bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white">
                    {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent variant="dark" side="bottom">
                  {isFullscreen ? t.exitFullscreen : t.fullscreen}
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button ref={quickJumpButtonRef} size="icon" variant="ghost" aria-label={t.quickJump} onClick={handleQuickJumpClick} className={`h-8 w-8 sm:h-9 sm:w-9 backdrop-blur-xs text-white ${showQuickJump ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'}`}>
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent variant="dark" side="bottom">
                {t.quickJump}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" aria-label={t.home} onClick={goHome} className="h-8 w-8 sm:h-9 sm:w-9 bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white">
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent variant="dark" side="bottom">
                {t.home}
              </TooltipContent>
            </Tooltip>

            {/* Divider before sound */}
            <div className="hidden lg:block w-px h-6 bg-white/20 mx-0.5" />

            {/* Ambient Music Controller - always visible */}
            <AmbientMusicController />

            {/* Divider after sound */}
            <div className="hidden lg:block w-px h-6 bg-white/20 mx-0.5" />

            {/* Desktop-only controls (hidden on mobile and tablet) */}
            <div className="hidden lg:flex items-center gap-1.5">
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label={showOrbits ? t.hideOrbits : t.showOrbits} onClick={toggleOrbits} className={`h-9 w-9 backdrop-blur-xs text-white ${showOrbits ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'}`}>
                    {showOrbits ? <CircleDot className="w-5 h-5" /> : <CircleOff className="w-5 h-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent variant="dark" side="bottom">
                  {showOrbits ? t.hideOrbits : t.showOrbits}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label={showTrails ? t.hideTrails : t.showTrails} onClick={toggleTrails} className={`h-9 w-9 backdrop-blur-xs text-white ${showTrails ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'}`}>
                    <Orbit className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent variant="dark" side="bottom">
                  {showTrails ? t.hideTrails : t.showTrails}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button ref={timeSpeedButtonRef} data-clock-trigger aria-label={clockName} aria-expanded={timeMenuOpen} size="icon" variant="ghost" onClick={toggleTimeMenu} className={`group relative h-9 w-9 backdrop-blur-xs text-foreground ${timeMenuOpen ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'}`}>
                    <Clock className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent variant="dark" side="bottom">
                  <span className="font-mono text-[11px] tabular-nums">{formatSimDate(simSecond * 1000, locale)}</span>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label={t.sizeComparison} onClick={toggleSizeComparison} className="h-9 w-9 bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white">
                    <BarChart3 className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent variant="dark" side="bottom">
                  {t.sizeComparison}
                </TooltipContent>
              </Tooltip>
              
              <div className="w-px h-6 bg-white/20 mx-0.5" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label={t.help} onClick={() => setShowControlHints(true)} className="h-9 w-9 bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white">
                    <HelpCircle className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent variant="dark" side="bottom">
                  {t.help}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label={t.about} onClick={() => setShowAbout(true)} className="h-9 w-9 bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white">
                    <Info className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent variant="dark" side="bottom">
                  {t.about}
                </TooltipContent>
              </Tooltip>
              <LanguageButton />
            </div>

            {/* Mobile & Tablet language button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  ref={languageMenuButtonRef}
                  size="icon"
                  variant="ghost"
                  onClick={() => { setShowMoreMenu(false); setShowLanguageMenu(!showLanguageMenu); }}
                  className={`hidden h-8 w-8 sm:h-9 sm:w-9 backdrop-blur-xs text-white ${showLanguageMenu ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  <FlagIcon locale={locale} className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent variant="dark" side="bottom">
                {tx('Language', 'Langue')}
              </TooltipContent>
            </Tooltip>

            {/* Mobile & Tablet more button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  ref={moreMenuButtonRef}
                  size="icon" 
                  variant="ghost" 
                  aria-label={tx("More options", "Plus d’options")} aria-expanded={showMoreMenu}
                  onClick={() => { announceDropdown(); useLeftBehindStore.getState().setMenuOpen(false); useSimClock.getState().setDateControlOpen(false); useCosmosStore.setState({showQuickJump:false}); setShowLanguageMenu(false); setShowMoreMenu(!showMoreMenu); }} 
                  className={`lg:hidden h-8 w-8 sm:h-9 sm:w-9 backdrop-blur-xs text-white ${showMoreMenu ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent variant="dark" side="bottom">
                {tx('More options', 'Plus d\'options')}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Mobile & Tablet more menu - same style as QuickJump */}
      <div
        ref={moreMenuRef}
        data-more-menu
        data-explorer-dropdown
        inert={!showMoreMenu}
        className={`lg:hidden ${uiFixed ? 'fixed' : 'absolute'} z-[10001] bg-white/10 backdrop-blur-xs rounded-lg overflow-hidden transition-all duration-300 ease-out ${
          showMoreMenu ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={
          uiFixed
            ? {
                top: `calc(0.5rem + env(safe-area-inset-top) + ${fullscreenDropdownOffsetPx}px)`,
                right: 'calc(0.5rem + env(safe-area-inset-right))',
              }
            : {
                top: isMobile ? '48px' : '60px',
                right: isMobile ? '8px' : '16px',
              }
        }
      >
        <div className={`grid transition-all duration-300 ease-out ${showMoreMenu ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <div className="p-2 w-full space-y-1">
              {/* Toggle options */}
              <Button variant="ghost"
                onClick={() => { toggleOrbits(); }}
                className="cosmos-more-row"
              >
                <div className="flex items-center gap-2">
                  {showOrbits ? <CircleDot className="w-4 h-4 text-muted-foreground" /> : <CircleOff className="w-4 h-4 text-muted-foreground" />}
                  <span className="text-sm text-foreground">{showOrbits ? t.hideOrbits : t.showOrbits}</span>
                </div>
                {showOrbits && <div className="w-2 h-2 rounded-full bg-primary" />}
              </Button>

              <Button variant="ghost"
                onClick={() => { toggleTrails(); }}
                className="cosmos-more-row"
              >
                <div className="flex items-center gap-2">
                  <Orbit className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{showTrails ? t.hideTrails : t.showTrails}</span>
                </div>
                {showTrails && <div className="w-2 h-2 rounded-full bg-primary" />}
              </Button>

              <Button variant="ghost"
                onClick={() => { toggleTimeMenu(); setShowMoreMenu(false); }}
                className="cosmos-more-row"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="flex flex-col items-start"><span className="text-sm text-foreground">{clockName}</span><span className="font-mono text-[10px] tabular-nums text-muted-foreground">{formatSimDate(simSecond * 1000, locale)}</span></span>
                </div>
                {rate > 1 && <div className="w-2 h-2 rounded-full bg-primary" />}
              </Button>

              <Button variant="ghost"
                onClick={() => { toggleSizeComparison(); setShowMoreMenu(false); }}
                className="cosmos-more-row"
              >
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{t.sizeComparison}</span>
              </Button>

              {/* Divider */}
              <div className="border-t border-border !my-2" />

              <Button variant="ghost"
                onClick={() => { setShowControlHints(true); setShowMoreMenu(false); }}
                className="cosmos-more-row"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{t.help}</span>
                </div>
              </Button>

              <Button variant="ghost"
                onClick={() => { setShowAbout(true); setShowMoreMenu(false); }}
                className="cosmos-more-row"
              >
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{t.about}</span>
              </Button>

              <Button variant="ghost"
                onClick={() => { setShowMoreMenu(false); setTimeout(() => setShowLanguageMenu(true), 0); }}
                className="cosmos-more-row"
              >
                <FlagIcon locale={locale} className="w-4 h-4" />
                <span className="text-sm text-foreground">{tx('Language', 'Langue')}</span>
              </Button>

            </div>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet language menu - same style as More menu */}
      <div
        ref={languageMenuRef}
        data-explorer-dropdown
        inert={!showLanguageMenu}
        className={`lg:hidden ${uiFixed ? 'fixed' : 'absolute'} z-[10001] bg-white/10 backdrop-blur-xs rounded-lg overflow-hidden transition-all duration-300 ease-out ${
          showLanguageMenu ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={
          uiFixed
            ? {
                top: `calc(0.5rem + env(safe-area-inset-top) + ${fullscreenDropdownOffsetPx}px)`,
                right: 'calc(0.5rem + env(safe-area-inset-right))',
              }
            : {
                top: isMobile ? '48px' : '60px',
                right: isMobile ? '8px' : '16px',
              }
        }
      >
        <div className={`grid transition-all duration-300 ease-out ${showLanguageMenu ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <div className="p-2 min-w-[200px] space-y-0.5">
              <LanguageMenuList onPick={() => setShowLanguageMenu(false)} />
            </div>
          </div>
        </div>
      </div>

      {/* Time speed slider */}
      {!showControlHints && (
        <div
          ref={timeSliderRef}
          data-explorer-dropdown
          data-date-control
          inert={!timeMenuOpen}
          className={`${uiFixed ? 'fixed' : 'absolute'} top-12 right-2 sm:top-[60px] sm:right-4 z-[10000] bg-white/10 backdrop-blur-xs rounded-lg overflow-hidden transition-all duration-300 ease-out ${
            timeMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
          style={
            uiFixed
              ? {
                  top: `calc(0.5rem + env(safe-area-inset-top) + ${fullscreenDropdownOffsetPx}px)`,
                  right: 'calc(0.5rem + env(safe-area-inset-right))',
                }
              : undefined
          }
        >
          <div 
            className={`grid transition-all duration-300 ease-out ${timeMenuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
          >
            <div className="overflow-hidden">
              {timeMenuOpen && <Suspense fallback={null}><LeftBehindDateControl /></Suspense>}
            </div>
          </div>
        </div>
      )}

      {brand === 'paledot' && !showControlHints && <LeftBehindMenu />}

      {/* About modal */}
      <AboutModal open={showAbout} onOpenChange={setShowAbout} />
    </>
  );
};
