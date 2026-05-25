import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Starfield } from '@/components/Starfield';
import { CosmosExplorer } from '@/components/cosmos/CosmosExplorer';
import { WebGLBoundary } from '@/components/cosmos/WebGLBoundary';
import { useLanguage } from '@/i18n/LanguageContext';
import { useEffect } from 'react';
import { isNativeApp } from '@/lib/platform';

const Cosmos = () => {
  const { language } = useLanguage();
  const native = isNativeApp();

  useEffect(() => {
    document.title =
      language === 'fr'
        ? 'Explorateur du Cosmos | Par Dens'
        : 'Cosmos Explorer | By Dens';
  }, [language]);

  // Native iOS / iPadOS / macOS / visionOS app: render the explorer
  // edge-to-edge with no marketing chrome (no nav, no hero, no footer).
  if (native) {
    return (
      <div
        className="dark fixed inset-0 w-screen overflow-hidden"
        style={{
          height: '100dvh',
          backgroundColor: '#0a0a0f',
          colorScheme: 'dark',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
        data-cosmos-container
        data-cosmos-native="true"
      >
        <WebGLBoundary>
          <CosmosExplorer />
        </WebGLBoundary>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col">
      <Starfield />
      <Navigation />

      <main className="flex-1 relative z-10 pt-16">
        {/* Hero Section */}
        <section className="min-h-[10vh] flex items-center justify-center pt-8 md:pt-12 pb-4 md:pb-6">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                {language === 'fr' ? 'Explorateur du Cosmos' : 'Cosmos Explorer'}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
                {language === 'fr' 
                  ? 'Un voyage interactif de la Terre aux confins de l\'univers observable'
                  : 'An interactive journey from Earth to the edge of the observable universe'}
              </p>
              <p className="text-sm text-muted-foreground/70 italic">
                {language === 'fr' 
                  ? '— Toujours et à jamais un travail en cours —'
                  : '— Always and forever a work in progress —'}
              </p>
            </div>
          </div>
        </section>

        {/* 3D Cosmos Section - Force dark theme regardless of system preference */}
        <section className="container mx-auto px-4 sm:px-6 max-w-7xl pb-8">
          <div 
            className="dark w-full h-[65vh] sm:h-[60vh] md:h-[65vh] lg:h-[70vh] rounded-lg overflow-hidden border border-neutral-800"
            style={{ 
              backgroundColor: '#0a0a0f', 
              colorScheme: 'dark',
            }}
            data-cosmos-container
          >
            <WebGLBoundary>
              <CosmosExplorer />
            </WebGLBoundary>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Cosmos;
