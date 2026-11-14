import { LeftBehindOverlay } from '@/features/left-behind/ui/LeftBehindOverlay';
import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCosmosStore } from '../store/useCosmosStore';
import { useFullscreenStore } from '../store/useFullscreenStore';
import { Button } from '@/components/ui/button';
import { Globe, Sun, Star, Sparkles, Circle, Infinity, ChevronDown, ChevronUp, Hexagon, Waypoints } from 'lucide-react';
import type { ScaleLevel } from '../types';

// Which cosmic structure each galaxy belongs to
const GALAXY_STRUCTURES: Record<string, 'localGroup' | 'virgoCluster' | 'otherSupercluster'> = {
  // Local Group galaxies
  'milky-way-center': 'localGroup',
  'andromeda': 'localGroup',
  'triangulum': 'localGroup',
  // Virgo Cluster / Supercluster galaxies
  'sombrero': 'virgoCluster',
  'whirlpool': 'virgoCluster',
};

const translations = {
  en: {
    currentLocation: 'Current Location',
    // Scale-specific locations for LOCAL GROUP path (Milky Way, Andromeda, Triangulum)
    earth: {
      title: 'Earth Orbit',
      subtitle: 'Inner Solar System',
      details: ['Third planet from the Sun', '1 AU from the Sun', 'Home of humanity'],
    },
    solarSystem: {
      title: 'Solar System',
      subtitle: 'Our cosmic neighborhood',
      details: ['8 planets orbiting the Sun', 'Located in the Orion Arm', '~4.6 billion years old'],
    },
    stellar: {
      title: 'Local Stellar Neighborhood',
      subtitle: 'Nearby stars',
      details: ['Within a few light-years of the Sun', 'Proxima Centauri: 4.24 ly away', 'Part of the Orion-Cygnus Arm'],
    },
    milkyWay: {
      title: 'Milky Way Galaxy',
      subtitle: 'Our galactic home',
      details: ['~100-400 billion stars', '~100,000 light-years across', 'Sun is 26,000 ly from center'],
    },
    localGroup: {
      title: 'Local Group',
      subtitle: 'Our galaxy cluster',
      details: ['~80+ galaxies', 'Andromeda is our neighbor', '~10 million light-years across'],
    },
    virgoSupercluster: {
      title: 'Virgo Supercluster',
      subtitle: 'Our supercluster home',
      details: ['Contains ~100 galaxy groups', 'Virgo Cluster at its heart', '~110 million light-years across'],
    },
    laniakea: {
      title: 'Laniakea Supercluster',
      subtitle: 'Our cosmic basin',
      details: ['Contains ~100,000 galaxies', 'Great Attractor at center', '~520 million light-years across'],
    },
    universe: {
      title: 'Observable Universe',
      subtitle: 'The cosmic web',
      details: ['~2 trillion galaxies', '~93 billion light-years diameter', '~13.8 billion years old'],
    },
    // For galaxies in Virgo Cluster (Sombrero, Whirlpool, etc.)
    virgoClusterGalaxy: {
      title: 'Virgo Cluster Galaxy',
      subtitle: 'Heart of the Virgo Supercluster',
      details: ['~1,500 galaxies in Virgo Cluster', '~54 million light-years away', 'Largest nearby galaxy cluster'],
    },
    virgoSuperclusterFromVirgo: {
      title: 'Virgo Supercluster',
      subtitle: 'Viewing from Virgo Cluster',
      details: ['You are near the center', 'Contains Local Group on edge', '~110 million light-years across'],
    },
  },
  fr: {
    currentLocation: 'Position Actuelle',
    earth: {
      title: 'Orbite Terrestre',
      subtitle: 'Système Solaire Interne',
      details: ['Troisième planète depuis le Soleil', '1 UA du Soleil', 'Berceau de l\'humanité'],
    },
    solarSystem: {
      title: 'Système Solaire',
      subtitle: 'Notre voisinage cosmique',
      details: ['8 planètes orbitant le Soleil', 'Situé dans le Bras d\'Orion', '~4,6 milliards d\'années'],
    },
    stellar: {
      title: 'Voisinage Stellaire Local',
      subtitle: 'Étoiles proches',
      details: ['À quelques années-lumière du Soleil', 'Proxima Centauri: 4,24 al', 'Partie du Bras d\'Orion-Cygne'],
    },
    milkyWay: {
      title: 'Voie Lactée',
      subtitle: 'Notre galaxie',
      details: ['~100-400 milliards d\'étoiles', '~100 000 années-lumière de diamètre', 'Soleil à 26 000 al du centre'],
    },
    localGroup: {
      title: 'Groupe Local',
      subtitle: 'Notre amas de galaxies',
      details: ['~80+ galaxies', 'Andromède est notre voisine', '~10 millions d\'années-lumière'],
    },
    virgoSupercluster: {
      title: 'Superamas de la Vierge',
      subtitle: 'Notre superamas',
      details: ['Contient ~100 groupes de galaxies', 'Amas de la Vierge en son cœur', '~110 millions d\'années-lumière'],
    },
    laniakea: {
      title: 'Superamas Laniakea',
      subtitle: 'Notre bassin cosmique',
      details: ['Contient ~100 000 galaxies', 'Grand Attracteur au centre', '~520 millions d\'années-lumière'],
    },
    universe: {
      title: 'Univers Observable',
      subtitle: 'La toile cosmique',
      details: ['~2 000 milliards de galaxies', '~93 milliards d\'années-lumière', '~13,8 milliards d\'années'],
    },
    virgoClusterGalaxy: {
      title: 'Galaxie de l\'Amas de la Vierge',
      subtitle: 'Cœur du Superamas de la Vierge',
      details: ['~1 500 galaxies dans l\'Amas de la Vierge', '~54 millions d\'années-lumière', 'Plus grand amas proche'],
    },
    virgoSuperclusterFromVirgo: {
      title: 'Superamas de la Vierge',
      subtitle: 'Vue depuis l\'Amas de la Vierge',
      details: ['Vous êtes près du centre', 'Contient le Groupe Local en périphérie', '~110 millions d\'années-lumière'],
    },
  },
};

export const YouAreHereLabel = () => {
  const { language, tr, tx, numberLocale } = useLanguage();
  const t = tr(translations);
  const currentScale: ScaleLevel = useCosmosStore((state) => state.currentScale as ScaleLevel);
  const selectedObject = useCosmosStore((state) => state.selectedObject);
  const [isMinimized, setIsMinimized] = useState(true);
  const isFullscreen = useFullscreenStore((state) => state.isFullscreen);

  // Determine which cosmic structure we're viewing from
  const getGalaxyStructure = () => {
    if (!selectedObject || selectedObject.type !== 'galaxy') return 'localGroup';
    return GALAXY_STRUCTURES[selectedObject.id] || 'localGroup';
  };
  
  const galaxyStructure = getGalaxyStructure();
  const isInVirgoCluster = galaxyStructure === 'virgoCluster';
  
  // Get location info based on current scale and which galaxy we're viewing
  const getLocationInfo = () => {
    // If viewing a Virgo Cluster galaxy (Sombrero, Whirlpool), use different context
    if (isInVirgoCluster) {
      switch (currentScale) {
        case 'milkyWay':
          return t.virgoClusterGalaxy;
        case 'localGroup':
        case 'virgoSupercluster':
          return t.virgoSuperclusterFromVirgo;
        case 'laniakea':
          return t.laniakea;
        case 'universe':
          return t.universe;
        default:
          return t.virgoClusterGalaxy;
      }
    }
    
    // Standard Local Group path (Milky Way, Andromeda, Triangulum)
    switch (currentScale) {
      case 'earth':
        return t.earth;
      case 'solarSystem':
        return t.solarSystem;
      case 'stellar':
        return t.stellar;
      case 'milkyWay':
        return t.milkyWay;
      case 'localGroup':
        return t.localGroup;
      case 'virgoSupercluster':
        return t.virgoSupercluster;
      case 'laniakea':
        return t.laniakea;
      case 'universe':
        return t.universe;
      default:
        return t.solarSystem;
    }
  };
  
  const getScaleIcon = (scale: ScaleLevel) => {
    // Different icons based on whether viewing from Virgo Cluster
    if (isInVirgoCluster && scale === 'milkyWay') {
      return <Sparkles className="w-4 h-4" />; // Galaxy icon for Virgo Cluster galaxy
    }
    
    switch (scale) {
      case 'earth':
        return <Globe className="w-4 h-4" />;
      case 'solarSystem':
        return <Sun className="w-4 h-4" />;
      case 'stellar':
        return <Star className="w-4 h-4" />;
      case 'milkyWay':
        return <Sparkles className="w-4 h-4" />;
      case 'localGroup':
        return <Circle className="w-4 h-4" />;
      case 'virgoSupercluster':
        return <Hexagon className="w-4 h-4" />;
      case 'laniakea':
        return <Waypoints className="w-4 h-4" />;
      case 'universe':
        return <Infinity className="w-4 h-4" />;
      default:
        return <Sun className="w-4 h-4" />;
    }
  };
  
  const locationInfo = getLocationInfo();
  
  return (
    <div className={`${isFullscreen
      ? 'fixed top-[calc(3rem+env(safe-area-inset-top))] sm:top-[calc(4rem+env(safe-area-inset-top))] lg:top-[calc(0.5rem+env(safe-area-inset-top))] right-[calc(0.5rem+env(safe-area-inset-right))] lg:right-auto lg:left-[calc(0.5rem+env(safe-area-inset-left))]'
      : 'absolute top-12 sm:top-16 lg:top-4 right-2 sm:right-4 lg:right-auto lg:left-4'} z-10 max-w-[calc(100%-2rem)] animate-fade-in`}>
      <div className="bg-white/10 backdrop-blur-md rounded-lg overflow-hidden max-w-[220px] sm:max-w-none">
        <Button
          variant="ghost"
          onClick={() => setIsMinimized(!isMinimized)}
          className="h-auto w-full grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors"
        >
          <div className="flex min-w-0 items-center gap-2 text-white">
            <span className="shrink-0">{getScaleIcon(currentScale)}</span>
            <span className="truncate text-sm font-semibold">{locationInfo.title}</span>
          </div>
          {isMinimized ? (
            <ChevronDown className="w-4 h-4 shrink-0 text-white/60" />
          ) : (
            <ChevronUp className="w-4 h-4 shrink-0 text-white/60" />
          )}
        </Button>
        
        <div 
          className={`grid transition-all duration-300 ease-out ${isMinimized ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
        >
          <div className="overflow-hidden">
            <div className="px-3 pb-3 space-y-1 border-t border-white/10 pt-2">
              <p className="text-white/70 text-xs">{locationInfo.subtitle}</p>
              <div className="mt-2 space-y-0.5">
                {locationInfo.details.map((detail, index) => (
                  <p key={index} className="text-white/60 text-xs">• {detail}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <LeftBehindOverlay />
    </div>
  );
};
