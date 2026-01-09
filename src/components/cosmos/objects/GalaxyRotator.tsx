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
 */
export const GalaxyRotator = ({ children }: GalaxyRotatorProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);

  const currentScale = useCosmosStore((state) => state.currentScale);
  const timeSpeed = useCosmosStore((state) => state.timeSpeed);

  // Only rotate when at stellar scale or larger
  const shouldRotate =
    currentScale === 'stellar' ||
    currentScale === 'milkyWay' ||
    currentScale === 'localGroup' ||
    currentScale === 'universe';

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (!shouldRotate) return;

    // Base rotation speed * timeSpeed multiplier
    // 0.025 rad/s base = one full rotation every ~4 minutes at 1x speed
    currentRotation.current += delta * 0.025 * timeSpeed;
    groupRef.current.rotation.y = currentRotation.current;
  });

  return <group ref={groupRef}>{children}</group>;
};
