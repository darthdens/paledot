import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

interface GalaxyRotatorProps {
  children: React.ReactNode;
  visualScale: number;
}

/**
 * Rotates its children in-place (around the scene origin) when zoomed out to galaxy scale.
 * This keeps the solar system + galaxy + marker moving together without the camera target drifting.
 */
export const GalaxyRotator = ({ children }: GalaxyRotatorProps) => {
  const rotatorRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);

  const currentScale = useCosmosStore((state) => state.currentScale);

  // Only rotate when at galaxy scale or larger
  const shouldRotate =
    currentScale === 'stellar' ||
    currentScale === 'milkyWay' ||
    currentScale === 'localGroup' ||
    currentScale === 'universe';

  useFrame((_, delta) => {
    if (!rotatorRef.current) return;
    if (!shouldRotate) return;

    // Slow rotation - accumulate based on delta time
    currentRotation.current += delta * 0.025;
    rotatorRef.current.rotation.y = currentRotation.current;
  });

  return <group ref={rotatorRef}>{children}</group>;
};

