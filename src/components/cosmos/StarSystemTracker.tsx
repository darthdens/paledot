import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { useCosmosStore } from './store/useCosmosStore';
import { UNITS } from './types';

// Distance threshold (in scene units) below which we consider "zoomed in" on a star system
// This is roughly equivalent to being within the Oort Cloud of a star system (~50,000 AU)
const STAR_ZOOM_THRESHOLD = 50000 * UNITS.KM_PER_AU * 0.001;

/**
 * Tracks whether the camera is inside a star system (our Sun or distant stars like Proxima).
 * Updates the store so components outside the Canvas can react to this state.
 */
export const StarSystemTracker = () => {
  const { camera } = useThree();
  const lastValue = useRef<boolean | null>(null);
  
  const currentScale = useCosmosStore((state) => state.currentScale);
  const selectedObject = useCosmosStore((state) => state.selectedObject);
  const objectWorldPositions = useCosmosStore((state) => state.objectWorldPositions);
  const setIsInStarSystem = useCosmosStore((state) => state.setIsInStarSystem);

  useFrame(() => {
    let isInSystem = false;

    // Always in star system at earth or solar system scale (our Sun)
    if (currentScale === 'earth' || currentScale === 'solarSystem') {
      isInSystem = true;
    } else if (selectedObject?.type === 'star' || selectedObject?.category === 'stars') {
      // Check if zoomed in close to a distant star (including Proxima Centauri)
      const starPos = objectWorldPositions[selectedObject.id];
      if (starPos) {
        const camPos = camera.position;
        const distance = Math.sqrt(
          (camPos.x - starPos[0]) ** 2 +
          (camPos.y - starPos[1]) ** 2 +
          (camPos.z - starPos[2]) ** 2
        );
        if (distance < STAR_ZOOM_THRESHOLD) {
          isInSystem = true;
        }
      }
    }

    // Only update store if value changed to avoid unnecessary re-renders
    if (lastValue.current !== isInSystem) {
      lastValue.current = isInSystem;
      setIsInStarSystem(isInSystem);
    }
  });

  return null;
};
