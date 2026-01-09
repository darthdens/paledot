import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';

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
 * The pivot point is offset so the solar system (at 0,0,0) orbits the galaxy center.
 */
export const GalaxyRotator = ({ children, visualScale }: GalaxyRotatorProps) => {
  const pivotRef = useRef<THREE.Group>(null);
  const rotatorRef = useRef<THREE.Group>(null);
  
  const gs = UNITS.KM_PER_LY * visualScale;
  
  // The galaxy center position relative to solar system
  const galaxyCenterX = -Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs;
  const galaxyCenterZ = -Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs;
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    // Slow rotation - one full rotation every ~4 minutes
    if (rotatorRef.current) {
      rotatorRef.current.rotation.y = t * 0.025;
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
