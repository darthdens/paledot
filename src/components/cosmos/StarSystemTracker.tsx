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
 * Also tracks WHICH star system we're in.
 */
export const StarSystemTracker = () => {
  const { camera } = useThree();
  const lastValue = useRef<string | null | undefined>(undefined);
  
  const currentScale = useCosmosStore((state) => state.currentScale);
  const selectedObject = useCosmosStore((state) => state.selectedObject);
  const objectWorldPositions = useCosmosStore((state) => state.objectWorldPositions);
  const setIsInStarSystem = useCosmosStore((state) => state.setIsInStarSystem);

  useFrame(() => {
    let isInSystem = false;
    let starSystemId: string | null = null;

    // Check distance to Sun (solar system at origin)
    const sunPos = objectWorldPositions['sun'] || [0, 0, 0];
    const camPos = camera.position;
    const distanceToSun = Math.sqrt(
      (camPos.x - sunPos[0]) ** 2 +
      (camPos.y - sunPos[1]) ** 2 +
      (camPos.z - sunPos[2]) ** 2
    );

    // Check distance to Proxima Centauri
    const proximaPos = objectWorldPositions['proxima-centauri'];
    let distanceToProxima = Infinity;
    if (proximaPos) {
      distanceToProxima = Math.sqrt(
        (camPos.x - proximaPos[0]) ** 2 +
        (camPos.y - proximaPos[1]) ** 2 +
        (camPos.z - proximaPos[2]) ** 2
      );
    }

    // Determine which star system we're in (if any)
    // At stellar or milkyWay scale, we're zoomed out enough that we shouldn't be "in" a star system
    // (this allows galactic rotation to work at those scales)
    if (currentScale === 'stellar' || currentScale === 'milkyWay') {
      isInSystem = false;
      starSystemId = null;
    } else if (distanceToSun < STAR_ZOOM_THRESHOLD && distanceToSun <= distanceToProxima) {
      isInSystem = true;
      starSystemId = 'sun';
    } else if (distanceToProxima < STAR_ZOOM_THRESHOLD && distanceToProxima < distanceToSun) {
      isInSystem = true;
      starSystemId = 'proxima-centauri';
    } else if (currentScale === 'earth' || currentScale === 'solarSystem') {
      // Fallback: if at earth/solar system scale, assume Sun's system
      isInSystem = true;
      starSystemId = 'sun';
    }

    // Only update store if value changed to avoid unnecessary re-renders
    if (lastValue.current !== starSystemId) {
      lastValue.current = starSystemId;
      setIsInStarSystem(isInSystem, starSystemId);
    }
  });

  return null;
};