import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

/**
 * Invisible tracker that updates the solar system's world position every frame.
 * This is needed for the camera to follow the solar system as the galaxy rotates,
 * even when the MilkyWayGalaxy visualization isn't rendered.
 */
export const SolarSystemTracker = () => {
  const groupRef = useRef<THREE.Group>(null);
  const worldPos = useRef(new THREE.Vector3());
  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);

  useFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.getWorldPosition(worldPos.current);
    setObjectWorldPosition('solar-system-marker', [
      worldPos.current.x,
      worldPos.current.y,
      worldPos.current.z,
    ]);
  });

  // Invisible group at the solar system origin (0,0,0 in local space)
  return <group ref={groupRef} position={[0, 0, 0]} />;
};
