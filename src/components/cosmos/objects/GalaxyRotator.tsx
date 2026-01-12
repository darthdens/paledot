import { useMemo, type ReactNode } from 'react';
import { UNITS } from '../types';

// Milky Way parameters - must match MilkyWayGalaxy.tsx / GalacticOrbitRing.tsx
const MILKY_WAY = {
  sunDistance: 26000, // light-years from galactic center
  sunAngle: Math.PI * 0.72,
};

interface GalaxyRotatorProps {
  children: ReactNode;
  visualScale: number;
}

/**
 * Wrapper that positions children relative to the Milky Way's galactic center.
 * 
 * Galactic rotation is disabled to simplify navigation and camera tracking.
 * The Milky Way's internal star rotation (via DifferentialRotationMaterial)
 * still provides visual motion at galaxy scale.
 */
export const GalaxyRotator = ({ children, visualScale }: GalaxyRotatorProps) => {

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

  // Galactic rotation is disabled - objects stay fixed relative to the Milky Way
  // This simplifies navigation and camera tracking
  // The Milky Way's internal star rotation (via DifferentialRotationMaterial) 
  // still provides visual motion at galaxy scale

  return (
    <group position={galacticCenter}>
      <group position={inverseCenter}>{children}</group>
    </group>
  );
};

