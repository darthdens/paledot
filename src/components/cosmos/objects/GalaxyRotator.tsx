import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';
import { UNITS } from '../types';

interface GalaxyRotatorProps {
  children: React.ReactNode;
  visualScale: number;
}

// Must match the MilkyWayGalaxy parameters
const MILKY_WAY = {
  sunDistance: 26000,
  sunAngle: Math.PI * 0.72,
};

/**
 * Rotates its children around the Milky Way center (pivot), not around the scene origin.
 * This makes the solar-system marker (at origin) orbit the galactic center at galaxy scale.
 */
export const GalaxyRotator = ({ children, visualScale }: GalaxyRotatorProps) => {
  const pivotRef = useRef<THREE.Group>(null);
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

  // Pivot = Milky Way center position relative to the solar system origin
  const pivot: [number, number, number] = useMemo(() => {
    const gs = UNITS.KM_PER_LY * visualScale;
    return [
      -Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs,
      0,
      -Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs,
    ];
  }, [visualScale]);

  useFrame((_, delta) => {
    if (!pivotRef.current) return;
    if (!shouldRotate) return;

    currentRotation.current += delta * 0.025 * timeSpeed;
    pivotRef.current.rotation.y = currentRotation.current;
  });

  // Pivot trick:
  // - Move to pivot
  // - Rotate
  // - Move content back so original positions remain correct, but orbit around pivot
  return (
    <group ref={pivotRef} position={pivot}>
      <group ref={rotatorRef} position={[-pivot[0], -pivot[1], -pivot[2]]}>
        {children}
      </group>
    </group>
  );
};

