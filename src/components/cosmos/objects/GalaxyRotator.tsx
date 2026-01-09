import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

interface GalaxyRotatorProps {
  children: React.ReactNode;
  visualScale: number;
}

/**
 * Rotates its children in-place around the scene origin.
 * The galaxy is offset so the solar system stays at (0,0,0).
 * This avoids large world coordinates that cause GPU precision issues.
 */
export const GalaxyRotator = ({ children }: GalaxyRotatorProps) => {
  const rotatorRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);

  const currentScale = useCosmosStore((state) => state.currentScale);
  const timeSpeed = useCosmosStore((state) => state.timeSpeed);

  // Only rotate when at galaxy scale or larger
  const shouldRotate =
    currentScale === 'stellar' ||
    currentScale === 'milkyWay' ||
    currentScale === 'localGroup' ||
    currentScale === 'universe';

  useFrame((_, delta) => {
    if (!rotatorRef.current) return;
    if (!shouldRotate) return;

    // Base rotation speed * timeSpeed multiplier
    // 0.025 rad/s base = one full rotation every ~4 minutes at 1x speed
    currentRotation.current += delta * 0.025 * timeSpeed;
    rotatorRef.current.rotation.y = currentRotation.current;
  });

  return <group ref={rotatorRef}>{children}</group>;
};
