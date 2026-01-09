import * as THREE from 'three';
import { useRef } from 'react';

interface GalaxyRotatorProps {
  children: React.ReactNode;
  visualScale: number;
}

/**
 * No-op wrapper kept for compatibility.
 * Galaxy rotation is handled inside MilkyWayGalaxy so the galaxy center offset stays stable.
 */
export const GalaxyRotator = ({ children }: GalaxyRotatorProps) => {
  const groupRef = useRef<THREE.Group>(null);
  return <group ref={groupRef}>{children}</group>;
};
