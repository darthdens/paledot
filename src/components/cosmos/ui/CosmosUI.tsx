import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Rocket, HelpCircle, Compass } from 'lucide-react';
import { useCosmosStore } from '../store/useCosmosStore';

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

  return (
    <>
      {/* Welcome overlay for first visit */}
      {showControlHints && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="text-center space-y-6 max-w-md px-6">
            <h1 className="text-4xl font-bold text-white">{t.welcome}</h1>
            <p className="text-lg text-white/70">{t.subtitle}</p>
            
            <div className="space-y-2 text-left bg-white/10 rounded-lg p-4">
              <p className="text-white/90 font-medium">{t.controls}:</p>
              <p className="text-white/70 text-sm">• {t.scrollZoom}</p>
              <p className="text-white/70 text-sm">• {t.dragRotate}</p>
              <p className="text-white/70 text-sm">• {t.rightDragPan}</p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => { setShowControlHints(false); startTour(); }} className="gap-2">
                <Rocket className="w-4 h-4" />
                {t.startTour}
              </Button>
              <Button variant="outline" onClick={() => setShowControlHints(false)}>
                Explore Freely
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-40">
        <Button size="icon" variant="ghost" onClick={toggleQuickJump} className="bg-white/10 hover:bg-white/20 text-white">
          <Compass className="w-5 h-5" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => setShowControlHints(true)} className="bg-white/10 hover:bg-white/20 text-white">
          <HelpCircle className="w-5 h-5" />
        </Button>
      </div>

      {/* Bottom tour button */}
      {!showControlHints && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
          <Button onClick={startTour} className="gap-2 animate-pulse">
            <Rocket className="w-4 h-4" />
            {t.startTour}
          </Button>
        </div>
      )}
    </>
  );
};
