import { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useLanguage } from '@/i18n/LanguageContext';

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

interface CosmosLoaderProps {
  onLoadComplete: () => void;
}

export const CosmosLoader = ({ onLoadComplete }: CosmosLoaderProps) => {
  const { language } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState('');
  const [fadeOut, setFadeOut] = useState(false);

  // Planet names for display
  const textureNames: Record<string, { en: string; fr: string }> = useMemo(() => ({
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
  }), []);

  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    let loaded = 0;
    const total = ALL_TEXTURES.length;

    const loadTexture = (url: string): Promise<void> => {
      return new Promise((resolve) => {
        const name = textureNames[url]?.[language] || 'Unknown';
        setCurrentItem(name);
        
        textureLoader.load(
          url,
          (texture) => {
            // Configure texture
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.colorSpace = THREE.SRGBColorSpace;
            
            loaded++;
            setProgress(Math.round((loaded / total) * 100));
            resolve();
          },
          undefined,
          () => {
            // On error, still count as loaded to prevent hanging
            loaded++;
            setProgress(Math.round((loaded / total) * 100));
            resolve();
          }
        );
      });
    };

    const loadAll = async () => {
      // Load textures sequentially for smooth progress
      for (const texture of ALL_TEXTURES) {
        await loadTexture(texture);
      }
      
      // Small delay then fade out
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          onLoadComplete();
        }, 500);
      }, 300);
    };

    loadAll();
  }, [language, textureNames, onLoadComplete]);

  return (
    <div 
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ backgroundColor: '#0a0a0f' }}
    >
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.2,
              animationDelay: Math.random() * 2 + 's',
              animationDuration: Math.random() * 2 + 1 + 's',
            }}
          />
        ))}
      </div>

      {/* Central loader content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4">
        {/* Orbiting planet animation */}
        <div className="relative w-24 h-24">
          {/* Sun glow */}
          <div 
            className="absolute inset-1/4 rounded-full"
            style={{
              background: 'radial-gradient(circle, #FDB813 0%, #FF8C00 50%, transparent 70%)',
              boxShadow: '0 0 40px 10px rgba(253, 184, 19, 0.4)',
            }}
          />
          
          {/* Orbiting planet */}
          <div 
            className="absolute w-full h-full animate-spin"
            style={{ animationDuration: '4s' }}
          >
            <div 
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #6b93d6 0%, #4a7bc2 50%, #2a5a9a 100%)',
                top: '0',
                left: '50%',
                transform: 'translateX(-50%)',
                boxShadow: '0 0 8px 2px rgba(107, 147, 214, 0.5)',
              }}
            />
          </div>
          
          {/* Orbit ring */}
          <div 
            className="absolute inset-0 rounded-full border border-white/10"
            style={{ transform: 'rotateX(60deg)' }}
          />
        </div>

        {/* Title */}
        <h2 className="text-xl font-serif text-white/90">
          {language === 'fr' ? 'Chargement du Cosmos' : 'Loading the Cosmos'}
        </h2>

        {/* Progress bar container */}
        <div className="w-64 sm:w-80">
          {/* Progress bar background */}
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            {/* Progress bar fill */}
            <div 
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #4a7bc2, #6b93d6, #8bb3e6)',
                boxShadow: '0 0 10px rgba(107, 147, 214, 0.6)',
              }}
            />
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 animate-pulse"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                animationDuration: '1.5s',
              }}
            />
          </div>

          {/* Progress text */}
          <div className="flex justify-between items-center mt-2 text-xs text-white/60">
            <span className="truncate max-w-[180px]">
              {currentItem && (
                language === 'fr' 
                  ? `Chargement: ${currentItem}` 
                  : `Loading: ${currentItem}`
              )}
            </span>
            <span className="font-mono ml-2">{progress}%</span>
          </div>
        </div>

        {/* Tip */}
        <p className="text-xs text-white/40 text-center max-w-xs mt-4">
          {language === 'fr' 
            ? 'Astuce: Utilisez la molette pour zoomer à travers les échelles de l\'univers'
            : 'Tip: Use scroll wheel to zoom through the scales of the universe'}
        </p>
      </div>
    </div>
  );
};
