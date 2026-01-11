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

    // Don't rotate when inside a star system
    if (isInStarSystem) return;
    
    // Don't rotate when viewing the galaxy from outside (would make it look like it's orbiting something)
    // Only rotate when at stellar scale (traveling between stars within the galaxy)
    if (currentScale === 'milkyWay' || currentScale === 'localGroup' || currentScale === 'universe') return;

    // Base rotation speed * timeSpeed multiplier
    // 0.00625 rad/s base = one full rotation every ~16 minutes at 1x speed (slower for better viewing)
    currentRotation.current += delta * 0.00625 * timeSpeed;
    groupRef.current.rotation.y = currentRotation.current;
  });

  return <group ref={groupRef}>{children}</group>;
};
