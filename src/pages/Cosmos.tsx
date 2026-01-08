import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Starfield } from '@/components/Starfield';
import { CosmosExplorer } from '@/components/cosmos/CosmosExplorer';
import { useLanguage } from '@/i18n/LanguageContext';
import { useEffect } from 'react';

const Cosmos = () => {
  const { language } = useLanguage();

  useEffect(() => {
    document.title =
      language === 'fr'
        ? 'Explorateur du Cosmos | Par Dens'
        : 'Cosmos Explorer | By Dens';
  }, [language]);

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
            </div>
          </div>
        </section>

        {/* 3D Cosmos Section */}
        <section className="container mx-auto px-4 sm:px-6 max-w-7xl pb-8">
          <div 
            className="w-full h-[50vh] sm:h-[55vh] md:h-[65vh] lg:h-[70vh] rounded-lg overflow-hidden border border-border"
            style={{ backgroundColor: '#000', colorScheme: 'dark' }}
            data-theme="dark"
            data-cosmos-container
          >
            <CosmosExplorer />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Cosmos;
