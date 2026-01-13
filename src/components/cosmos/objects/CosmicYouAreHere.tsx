import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { useLanguage } from '@/i18n/LanguageContext';

interface CosmicYouAreHereProps {
  visualScale: number;
}

// "You Are Here" marker for cosmic scales
// Shows our position (Milky Way/Local Group) at Virgo, Laniakea, and Universe scales

export const CosmicYouAreHere = ({ visualScale }: CosmicYouAreHereProps) => {
  const markerRef = useRef<THREE.Group>(null);
  const pulseRef1 = useRef<THREE.Mesh>(null);
  const pulseRef2 = useRef<THREE.Mesh>(null);
  const pulseRef3 = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const { language } = useLanguage();
  const currentScale = useCosmosStore(state => state.currentScale);
  
  const mlyScale = UNITS.KM_PER_MLY * visualScale;
  
  // Only visible at supercluster scales and beyond
  const isVisible = currentScale === 'virgoSupercluster' || currentScale === 'laniakea' || currentScale === 'universe';
  
  // Get appropriate label based on scale
  const getLabel = () => {
    if (currentScale === 'virgoSupercluster') {
      return {
        primary: language === 'fr' ? 'Groupe Local' : 'Local Group',
        secondary: language === 'fr' ? 'Voie Lactée' : 'Milky Way',
      };
    } else if (currentScale === 'laniakea') {
      return {
        primary: language === 'fr' ? 'Superamas de la Vierge' : 'Virgo Supercluster',
        secondary: language === 'fr' ? 'Groupe Local' : 'Local Group',
      };
    } else {
      return {
        primary: language === 'fr' ? 'Laniakea' : 'Laniakea',
        secondary: language === 'fr' ? 'Notre Superamas' : 'Our Supercluster',
      };
    }
  };
  
  const label = getLabel();
  
  // Marker size based on scale
  const getMarkerSize = () => {
    if (currentScale === 'virgoSupercluster') return 0.5 * mlyScale;
    if (currentScale === 'laniakea') return 5 * mlyScale;
    return 50 * mlyScale;
  };
  
  const markerSize = getMarkerSize();
  
  // Geometry for pulsing rings
  const ringGeometry = useMemo(() => new THREE.RingGeometry(0.8, 1, 32), []);
  
  useFrame(({ clock }) => {
    if (!isVisible || !markerRef.current) return;
    
    const t = clock.getElapsedTime();
    
    // Scale marker based on camera distance
    const distance = camera.position.length();
    const dynamicScale = Math.max(1, distance * 0.0015);
    markerRef.current.scale.setScalar(dynamicScale);
    
    // Make marker face camera
    markerRef.current.quaternion.copy(camera.quaternion);
    
    // Animate pulse rings
    if (pulseRef1.current) {
      const phase1 = (t * 0.8) % 1;
      pulseRef1.current.scale.setScalar(1 + phase1 * 3);
      (pulseRef1.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase1) * 0.6;
    }
    if (pulseRef2.current) {
      const phase2 = ((t * 0.8) + 0.33) % 1;
      pulseRef2.current.scale.setScalar(1 + phase2 * 3);
      (pulseRef2.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase2) * 0.6;
    }
    if (pulseRef3.current) {
      const phase3 = ((t * 0.8) + 0.66) % 1;
      pulseRef3.current.scale.setScalar(1 + phase3 * 3);
      (pulseRef3.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase3) * 0.6;
    }
  });
  
  if (!isVisible) return null;
  
  return (
    <group ref={markerRef} position={[0, 0, 0]}>
      {/* Central bright point */}
      <mesh>
        <sphereGeometry args={[markerSize * 0.15, 16, 16]} />
        <meshBasicMaterial color="#00FF88" transparent opacity={0.9} />
      </mesh>
      
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[markerSize * 0.4, 16, 16]} />
        <meshBasicMaterial color="#00FF88" transparent opacity={0.3} />
      </mesh>
      
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[markerSize * 0.8, 16, 16]} />
        <meshBasicMaterial color="#00DD77" transparent opacity={0.1} />
      </mesh>
      
      {/* Pulsing rings */}
      <mesh ref={pulseRef1} rotation={[0, 0, 0]} scale={1}>
        <ringGeometry args={[markerSize * 0.6, markerSize * 0.7, 32]} />
        <meshBasicMaterial color="#00FF88" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      
      <mesh ref={pulseRef2} rotation={[0, 0, 0]} scale={1}>
        <ringGeometry args={[markerSize * 0.6, markerSize * 0.7, 32]} />
        <meshBasicMaterial color="#00FF88" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      
      <mesh ref={pulseRef3} rotation={[0, 0, 0]} scale={1}>
        <ringGeometry args={[markerSize * 0.6, markerSize * 0.7, 32]} />
        <meshBasicMaterial color="#00FF88" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Label */}
      <Html
        center
        distanceFactor={markerSize * 8}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div className="flex flex-col items-center gap-0.5 whitespace-nowrap">
          <div 
            className="px-3 py-1.5 rounded-lg text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.25), rgba(0, 200, 100, 0.15))',
              border: '1px solid rgba(0, 255, 136, 0.5)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div className="text-[#00FF88] font-bold text-sm tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse" />
              {language === 'fr' ? 'VOUS ÊTES ICI' : 'YOU ARE HERE'}
            </div>
            <div className="text-white/90 text-xs font-medium mt-0.5">
              {label.primary}
            </div>
            <div className="text-white/60 text-[10px]">
              {label.secondary}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};