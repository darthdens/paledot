import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useCosmosStore } from '../store/useCosmosStore';
import { UNITS } from '../types';

interface GalaxyRotatorProps {
  children: React.ReactNode;
  visualScale: number;
}

// Distance threshold (in scene units) below which we consider "zoomed in" on a star
// This is roughly equivalent to being within the Oort Cloud of a star system
const STAR_ZOOM_THRESHOLD = 50000 * UNITS.KM_PER_AU * 0.001; // ~50,000 AU in scene units

/**
 * Rotates all children (solar system, stars, nebulae) around the galaxy center.
 * This simulates the orbit of objects around the Milky Way.
 * 
 * Rotation is paused when:
 * - At solar system scale or smaller (zoomed in on Sun)
 * - Zoomed in close to any star (e.g., Proxima Centauri)
 */
export const GalaxyRotator = ({ children }: GalaxyRotatorProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);
  const { camera } = useThree();

  const currentScale = useCosmosStore((state) => state.currentScale);
  const timeSpeed = useCosmosStore((state) => state.timeSpeed);
  const selectedObject = useCosmosStore((state) => state.selectedObject);
  const objectWorldPositions = useCosmosStore((state) => state.objectWorldPositions);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Don't rotate at earth or solar system scale
    const atLocalScale = currentScale === 'earth' || currentScale === 'solarSystem';
    if (atLocalScale) return;

    // Check if zoomed in close to a star (including Proxima Centauri)
    if (selectedObject?.type === 'star' || selectedObject?.category === 'stars') {
      const starPos = objectWorldPositions[selectedObject.id];
      if (starPos) {
        const camPos = camera.position;
        const distance = Math.sqrt(
          (camPos.x - starPos[0]) ** 2 +
          (camPos.y - starPos[1]) ** 2 +
          (camPos.z - starPos[2]) ** 2
        );
        // If close to the star, don't rotate
        if (distance < STAR_ZOOM_THRESHOLD) return;
      }
    }

    // Only rotate when at stellar scale or larger
    const shouldRotate =
      currentScale === 'stellar' ||
      currentScale === 'milkyWay' ||
      currentScale === 'localGroup' ||
      currentScale === 'universe';

    if (!shouldRotate) return;

    // Base rotation speed * timeSpeed multiplier
    // 0.025 rad/s base = one full rotation every ~4 minutes at 1x speed
    currentRotation.current += delta * 0.025 * timeSpeed;
    groupRef.current.rotation.y = currentRotation.current;
  });

  return <group ref={groupRef}>{children}</group>;
};
