import { useState, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCosmosStore, EXPECTED_GEOMETRIES } from '../store/useCosmosStore';

// Import all textures that need to be preloaded
import earthDayTexture from '@/assets/textures/earth-day.jpg';
import earthNightTexture from '@/assets/textures/earth-night.jpg';
import earthCloudsTexture from '@/assets/textures/earth-clouds.jpg';
import moonTexture from '@/assets/textures/moon.jpg';
import mercuryTexture from '@/assets/textures/mercury.jpg';
import venusTexture from '@/assets/textures/venus.jpg';
import marsTexture from '@/assets/textures/mars.jpg';
import jupiterTexture from '@/assets/textures/jupiter.jpg';
import saturnTexture from '@/assets/textures/saturn.jpg';
import uranusTexture from '@/assets/textures/uranus.jpg';
import neptuneTexture from '@/assets/textures/neptune.jpg';
import plutoTexture from '@/assets/textures/pluto.jpg';
import titanTexture from '@/assets/textures/titan.jpg';
import europaTexture from '@/assets/textures/europa.jpg';
import ceresTexture from '@/assets/textures/ceres.jpg';
import enceladusTexture from '@/assets/textures/enceladus.jpg';
import tritonTexture from '@/assets/textures/triton.jpg';
import iapetusTexture from '@/assets/textures/iapetus.jpg';

// All texture paths to preload
const ALL_TEXTURES = [
  earthDayTexture,
  earthNightTexture,
  earthCloudsTexture,
  moonTexture,
  mercuryTexture,
  venusTexture,
  marsTexture,
  jupiterTexture,
  saturnTexture,
  uranusTexture,
  neptuneTexture,
  plutoTexture,
  titanTexture,
  europaTexture,
  ceresTexture,
  enceladusTexture,
  tritonTexture,
  iapetusTexture,
];

// Human-readable names for geometries
const GEOMETRY_NAMES: Record<string, { en: string; fr: string }> = {
  'milky-way': { en: 'Milky Way Galaxy', fr: 'Voie Lactée' },
  'andromeda': { en: 'Andromeda Galaxy', fr: 'Galaxie d\'Andromède' },
  'triangulum': { en: 'Triangulum Galaxy', fr: 'Galaxie du Triangle' },
  'whirlpool': { en: 'Whirlpool Galaxy', fr: 'Galaxie du Tourbillon' },
  'sombrero': { en: 'Sombrero Galaxy', fr: 'Galaxie du Sombrero' },
  'cosmic-web': { en: 'Cosmic Web', fr: 'Toile Cosmique' },
  'virgo-supercluster': { en: 'Virgo Supercluster', fr: 'Superamas de la Vierge' },
  'laniakea': { en: 'Laniakea Supercluster', fr: 'Superamas Laniakea' },
};

interface CosmosLoaderProps {
  onTexturesComplete: () => void;
  /** When true, the loader fades out (controlled by parent). */
  dismiss?: boolean;
  /** Called after the fade-out completes so parent can unmount safely. */
  onDismissed?: () => void;
}

type LoadingStage = 'textures' | 'geometries' | 'finalizing';

export const CosmosLoader = ({
  onTexturesComplete,
  dismiss = false,
  onDismissed,
}: CosmosLoaderProps) => {
  const { language } = useLanguage();
  const [fadeOut, setFadeOut] = useState(false);
  const [stage, setStage] = useState<LoadingStage>('textures');
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  
  const loadingProgress = useCosmosStore((s) => s.loadingProgress);
  const setTextureProgress = useCosmosStore((s) => s.setTextureProgress);

  // Planet names for display
  const textureNames: Record<string, { en: string; fr: string }> = useMemo(
    () => ({
      [earthDayTexture]: { en: 'Earth', fr: 'Terre' },
      [earthNightTexture]: { en: 'Earth (Night)', fr: 'Terre (Nuit)' },
      [earthCloudsTexture]: { en: 'Earth (Clouds)', fr: 'Terre (Nuages)' },
      [moonTexture]: { en: 'Moon', fr: 'Lune' },
      [mercuryTexture]: { en: 'Mercury', fr: 'Mercure' },
      [venusTexture]: { en: 'Venus', fr: 'Vénus' },
      [marsTexture]: { en: 'Mars', fr: 'Mars' },
      [jupiterTexture]: { en: 'Jupiter', fr: 'Jupiter' },
      [saturnTexture]: { en: 'Saturn', fr: 'Saturne' },
      [uranusTexture]: { en: 'Uranus', fr: 'Uranus' },
      [neptuneTexture]: { en: 'Neptune', fr: 'Neptune' },
      [plutoTexture]: { en: 'Pluto', fr: 'Pluton' },
      [titanTexture]: { en: 'Titan', fr: 'Titan' },
      [europaTexture]: { en: 'Europa', fr: 'Europe' },
      [ceresTexture]: { en: 'Ceres', fr: 'Cérès' },
      [enceladusTexture]: { en: 'Enceladus', fr: 'Encelade' },
      [tritonTexture]: { en: 'Triton', fr: 'Triton' },
      [iapetusTexture]: { en: 'Iapetus', fr: 'Japet' },
    }),
    []
  );

  // Load textures
  useEffect(() => {
    THREE.Cache.enabled = true;

    const textureLoader = new THREE.TextureLoader();
    let loaded = 0;
    const total = ALL_TEXTURES.length;

    const loadTexture = (url: string): Promise<void> => {
      return new Promise((resolve) => {
        const name = textureNames[url]?.[language] || 'Unknown';
        setTextureProgress(loaded, total, name);

        textureLoader.load(
          url,
          (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.colorSpace = THREE.SRGBColorSpace;

            loaded++;
            setTextureProgress(loaded, total, name);
            resolve();
          },
          undefined,
          () => {
            loaded++;
            setTextureProgress(loaded, total, name);
            resolve();
          }
        );
      });
    };

    const loadAll = async () => {
      for (const texture of ALL_TEXTURES) {
        await loadTexture(texture);
      }
      setStage('geometries');
      onTexturesComplete();
    };

    loadAll();
  }, [language, textureNames, onTexturesComplete, setTextureProgress]);

  // Track geometry progress
  const geometriesReady = loadingProgress.geometriesReady;
  const geometriesCount = geometriesReady.size;
  const geometriesTotal = EXPECTED_GEOMETRIES.length;

  // Move to finalizing when all geometries are ready
  useEffect(() => {
    if (stage === 'geometries' && geometriesCount >= geometriesTotal) {
      setStage('finalizing');
    }
  }, [stage, geometriesCount, geometriesTotal]);

  // Simulate gradual progress during geometry loading to avoid jumps
  useEffect(() => {
    if (stage !== 'geometries') {
      setSimulatedProgress(0);
      return;
    }

    // Target based on real geometry progress
    const targetProgress = (geometriesCount / geometriesTotal) * 100;
    
    const interval = setInterval(() => {
      setSimulatedProgress(prev => {
        // Slowly increment toward target, but never exceed it
        const nextTarget = Math.min(targetProgress, 100);
        if (prev >= nextTarget - 1) return nextTarget;
        // Increment by small random amount for natural feel
        const increment = Math.random() * 3 + 0.5;
        return Math.min(prev + increment, nextTarget);
      });
    }, 150);

    return () => clearInterval(interval);
  }, [stage, geometriesCount, geometriesTotal]);

  // Calculate overall progress - more granular with simulated increments
  const texturesProgress = loadingProgress.texturesTotal > 0
    ? loadingProgress.texturesLoaded / loadingProgress.texturesTotal
    : 0;

  // Weighted progress: textures = 35%, geometries = 55%, finalizing = 10%
  let overallProgress = 0;
  if (stage === 'textures') {
    overallProgress = texturesProgress * 35;
  } else if (stage === 'geometries') {
    // Use simulated progress for smoother animation
    overallProgress = 35 + (simulatedProgress / 100) * 55;
  } else {
    overallProgress = 90 + (dismiss ? 10 : 8); // 98% while finalizing, 100% when dismiss
  }

  // Current item display
  const getCurrentItemDisplay = useCallback(() => {
    if (stage === 'textures') {
      const name = loadingProgress.currentItem;
      return language === 'fr' ? `Texture: ${name}` : `Texture: ${name}`;
    } else if (stage === 'geometries') {
      const lastGeometry = Array.from(geometriesReady).pop();
      if (lastGeometry) {
        const name = GEOMETRY_NAMES[lastGeometry]?.[language] || lastGeometry;
        return language === 'fr' ? `Génération: ${name}` : `Building: ${name}`;
      }
      return language === 'fr' ? 'Génération des galaxies…' : 'Building galaxies…';
    } else {
      return language === 'fr' ? 'Compilation des shaders…' : 'Compiling shaders…';
    }
  }, [stage, loadingProgress.currentItem, geometriesReady, language]);

  // Handle fade out
  useEffect(() => {
    if (!dismiss) return;

    setFadeOut(true);
    const t = window.setTimeout(() => {
      onDismissed?.();
    }, 600);

    return () => window.clearTimeout(t);
  }, [dismiss, onDismissed]);

  // Generate random stars once
  const stars = useMemo(() => 
    [...Array(80)].map((_, i) => ({
      id: i,
      size: Math.random() * 1.5 + 0.5,
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: Math.random() * 0.6 + 0.2,
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 2,
    })),
    []
  );

  return (
    <div 
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-600 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ backgroundColor: '#050510' }}
    >
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full"
            style={{
              width: star.size + 'px',
              height: star.size + 'px',
              left: star.x + '%',
              top: star.y + '%',
              opacity: star.opacity,
              background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(180,200,255,0.5) 50%, transparent 100%)',
              animation: `pulse ${star.duration}s ease-in-out infinite`,
              animationDelay: star.delay + 's',
            }}
          />
        ))}
      </div>

      {/* Central loader content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        
        {/* Earth orbiting Sun animation - polished */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Orbit ring */}
          <div 
            className="absolute w-28 h-28 rounded-full border border-white/15"
            style={{
              boxShadow: '0 0 20px 2px rgba(255,200,100,0.05)',
            }}
          />
          
          {/* Sun at center */}
          <div 
            className="absolute w-8 h-8 rounded-full"
            style={{
              background: 'radial-gradient(circle, #fff9e6 0%, #ffcc33 30%, #ff9500 70%, #cc6600 100%)',
              boxShadow: '0 0 30px 12px rgba(255,180,50,0.4), 0 0 60px 20px rgba(255,150,50,0.2)',
              animation: 'pulse 4s ease-in-out infinite',
            }}
          />
          
          {/* Orbiting Earth container */}
          <div 
            className="absolute w-28 h-28"
            style={{ animation: 'spin 8s linear infinite' }}
          >
            {/* Earth */}
            <div 
              className="absolute w-4 h-4 rounded-full"
              style={{
                top: '0',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'radial-gradient(circle at 35% 35%, #87ceeb 0%, #4a90d9 40%, #1e5799 70%, #0d3a6e 100%)',
                boxShadow: '0 0 10px 3px rgba(100,180,255,0.4)',
              }}
            >
              {/* Moon orbiting Earth */}
              <div 
                className="absolute w-6 h-6 -top-1 -left-1"
                style={{ animation: 'spin 2s linear infinite' }}
              >
                <div 
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    top: '-2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'radial-gradient(circle at 40% 40%, #f5f5f5 0%, #c0c0c0 50%, #808080 100%)',
                    boxShadow: '0 0 4px 1px rgba(200,200,200,0.3)',
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Subtle outer glow ring */}
          <div 
            className="absolute w-32 h-32 rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 40%, rgba(255,180,80,0.03) 60%, transparent 80%)',
              animation: 'pulse 5s ease-in-out infinite',
            }}
          />
        </div>

        {/* Title */}
        <h2 className="text-xl font-serif text-white/90 tracking-wide">
          {language === 'fr' ? 'Chargement du Cosmos' : 'Loading the Cosmos'}
        </h2>

        {/* Stage indicator */}
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span className={stage === 'textures' ? 'text-white/90' : 'text-white/30'}>
            {language === 'fr' ? 'Textures' : 'Textures'}
          </span>
          <span className="text-white/20">→</span>
          <span className={stage === 'geometries' ? 'text-white/90' : 'text-white/30'}>
            {language === 'fr' ? 'Galaxies' : 'Galaxies'}
          </span>
          <span className="text-white/20">→</span>
          <span className={stage === 'finalizing' ? 'text-white/90' : 'text-white/30'}>
            {language === 'fr' ? 'Shaders' : 'Shaders'}
          </span>
        </div>

        {/* Progress bar container */}
        <div className="w-72 sm:w-96">
          {/* Progress bar background */}
          <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
            {/* Progress bar fill */}
            <div 
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(overallProgress, 100)}%`,
                background: 'linear-gradient(90deg, #3b5998, #6b93d6, #9bb8e6)',
                boxShadow: '0 0 12px rgba(107, 147, 214, 0.5)',
              }}
            />
          </div>

          {/* Progress text */}
          <div className="flex justify-between items-center mt-3 text-xs">
            <span className="text-white/60 truncate max-w-[240px]">
              {getCurrentItemDisplay()}
            </span>
            <span className="font-mono text-white/80 ml-2 tabular-nums">
              {Math.round(overallProgress)}%
            </span>
          </div>
        </div>

        {/* Tip */}
        <p className="text-xs text-white/30 text-center max-w-xs mt-2">
          {language === 'fr' 
            ? 'Astuce: Utilisez la molette pour zoomer à travers les échelles de l\'univers'
            : 'Tip: Use scroll wheel to zoom through the scales of the universe'}
        </p>
      </div>
    </div>
  );
};
