import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCosmosStore } from '../store/useCosmosStore';

interface GalaxyRotatorProps {
  children: React.ReactNode;
  visualScale: number;
}

/**
 * Rotates all children (solar system, stars, nebulae) around the galaxy center.
 * This simulates the orbit of objects around the Milky Way.
 * 
 * Rotation is paused when:
 * - Inside any star system (Sun or Proxima Centauri)
 * - Viewing from outside the Milky Way (milkyWay, localGroup, or universe scale)
 */
export const GalaxyRotator = ({ children }: GalaxyRotatorProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);

  const timeSpeed = useCosmosStore((state) => state.timeSpeed);
  const isInStarSystem = useCosmosStore((state) => state.isInStarSystem);
  const currentScale = useCosmosStore((state) => state.currentScale);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Don't rotate when inside a star system (solar system or Proxima)
    if (isInStarSystem) return;
    
    // Don't rotate when viewing from beyond the galaxy (localGroup, universe)
    // At those scales the galaxy should appear stationary
    if (currentScale === 'localGroup' || currentScale === 'universe') return;

    // Base rotation speed * timeSpeed multiplier
    // At milkyWay scale, use a slower speed so the orbits are visible but not distracting
    // 0.00625 rad/s base = one full rotation every ~16 minutes at 1x speed
    const baseSpeed = currentScale === 'milkyWay' ? 0.003 : 0.00625;
    currentRotation.current += delta * baseSpeed * timeSpeed;
    groupRef.current.rotation.y = currentRotation.current;
  });

  return <group ref={groupRef}>{children}</group>;
};
