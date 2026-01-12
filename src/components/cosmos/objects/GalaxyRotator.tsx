import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCosmosStore } from '../store/useCosmosStore';
import { UNITS } from '../types';

// Milky Way parameters - must match MilkyWayGalaxy.tsx / GalacticOrbitRing.tsx
const MILKY_WAY = {
  sunDistance: 26000, // light-years from galactic center
  sunAngle: Math.PI * 0.72,
};

interface GalaxyRotatorProps {
  children: React.ReactNode;
  visualScale: number;
}

/**
 * Rotates children (solar system, nearby stars, nebulae, etc.) around the Milky Way's galactic center.
 *
 * IMPORTANT: Do NOT place the MilkyWayGalaxy itself inside this rotator.
 * Otherwise the entire Milky Way will appear to orbit around the Sun.
 */
export const GalaxyRotator = ({ children, visualScale }: GalaxyRotatorProps) => {
  const pivotRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);

  const timeSpeed = useCosmosStore((state) => state.timeSpeed);
  const isInStarSystem = useCosmosStore((state) => state.isInStarSystem);
  const currentScale = useCosmosStore((state) => state.currentScale);

  // Galactic center (in scene units). The Sun/solar system starts at world origin.
  // We rotate around this point by using a pivot group at the galactic center.
  const galacticCenter = useMemo<[number, number, number]>(() => {
    const gs = UNITS.KM_PER_LY * visualScale;
    return [
      -Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs,
      0,
      -Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs,
    ];
  }, [visualScale]);

  const inverseCenter = useMemo<[number, number, number]>(
    () => [-galacticCenter[0], -galacticCenter[1], -galacticCenter[2]],
    [galacticCenter]
  );

  useFrame((_, delta) => {
    if (!pivotRef.current) return;

    // Don't rotate when inside a star system
    if (isInStarSystem) return;

    // Don't rotate when viewing the galaxy from far outside
    if (currentScale === 'localGroup' || currentScale === 'universe') return;

    // Base rotation speed * timeSpeed multiplier
    // NEGATIVE rotation to match the Milky Way's internal star rotation direction
    // (DifferentialRotationMaterial rotates stars with positive angle, which is counter-clockwise;
    // we need the solar system to move in the same direction relative to the galaxy center)
    currentRotation.current -= delta * 0.00625 * timeSpeed;
    pivotRef.current.rotation.y = currentRotation.current;
  });

  return (
    <group ref={pivotRef} position={galacticCenter}>
      <group position={inverseCenter}>{children}</group>
    </group>
  );
};

