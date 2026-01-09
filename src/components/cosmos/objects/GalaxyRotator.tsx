import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';

interface GalaxyRotatorProps {
  children: React.ReactNode;
  visualScale: number;
}

// Milky Way parameters - must match MilkyWayGalaxy.tsx
const MILKY_WAY = {
  sunDistance: 26000, // light-years from galactic center
  sunAngle: Math.PI * 0.72,
};

/**
 * Rotates children around the galactic center.
 * Only rotates when zoomed out to galaxy scale - stays static when viewing solar system.
 */
export const GalaxyRotator = ({ children, visualScale }: GalaxyRotatorProps) => {
  const rotatorRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);
  
  const currentScale = useCosmosStore(state => state.currentScale);
  
  // Only rotate when at galaxy scale or larger
  const shouldRotate = currentScale === 'milkyWay' || currentScale === 'localGroup' || currentScale === 'universe';
  
  const gs = UNITS.KM_PER_LY * visualScale;
  
  // The galaxy center position relative to solar system
  const galaxyCenterX = -Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs;
  const galaxyCenterZ = -Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs;
  
  useFrame((_, delta) => {
    if (rotatorRef.current && shouldRotate) {
      // Slow rotation - accumulate based on delta time
      currentRotation.current += delta * 0.025;
      rotatorRef.current.rotation.y = currentRotation.current;
    }
  });
  
  return (
    // Move to galaxy center, rotate, then move back
    <group position={[galaxyCenterX, 0, galaxyCenterZ]}>
      <group ref={rotatorRef}>
        <group position={[-galaxyCenterX, 0, -galaxyCenterZ]}>
          {children}
        </group>
      </group>
    </group>
  );
};
