import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCosmosStore } from '../store/useCosmosStore';
import { UNITS } from '../types';

interface GalaxyRotatorProps {
  children: React.ReactNode;
  visualScale: number;
}

/**
 * Rotates all children (solar system, stars, nebulae) around the galaxy center.
 * This simulates the orbit of objects around the Milky Way.
 */
export const GalaxyRotator = ({ children, visualScale }: GalaxyRotatorProps) => {
  const pivotRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);

  const timeSpeed = useCosmosStore((state) => state.timeSpeed);
  const isInStarSystem = useCosmosStore((state) => state.isInStarSystem);
  const currentScale = useCosmosStore((state) => state.currentScale);

  // Galaxy center in scene units (matches MilkyWayGalaxy offset so Sun stays at origin)
  const galaxyCenter = useMemo<[number, number, number]>(() => {
    const sunDistanceLy = 26000;
    const sunAngle = Math.PI * 0.72;
    const gs = UNITS.KM_PER_LY * visualScale;
    return [
      -Math.cos(sunAngle) * sunDistanceLy * gs,
      0,
      -Math.sin(sunAngle) * sunDistanceLy * gs,
    ];
  }, [visualScale]);

  const inverseCenter = useMemo<[number, number, number]>(
    () => [-galaxyCenter[0], -galaxyCenter[1], -galaxyCenter[2]],
    [galaxyCenter]
  );

  useFrame((_, delta) => {
    if (!pivotRef.current) return;

    // Don't rotate when inside a star system
    if (isInStarSystem) return;

    // Don't rotate when viewing far outside the Milky Way
    if (currentScale === 'localGroup' || currentScale === 'universe') return;

    // Base rotation speed * timeSpeed multiplier
    currentRotation.current += delta * 0.00625 * timeSpeed;
    pivotRef.current.rotation.y = currentRotation.current;
  });

  // Pivot technique: translate scene so galaxy center is origin, rotate, translate back.
  return (
    <group ref={pivotRef} position={galaxyCenter}>
      <group position={inverseCenter}>{children}</group>
    </group>
  );
};
