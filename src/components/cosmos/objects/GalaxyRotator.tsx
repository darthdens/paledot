import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCosmosStore } from '../store/useCosmosStore';
import { UNITS } from '../types';

// Milky Way parameters - must match MilkyWayGalaxy.tsx
const MILKY_WAY = {
  sunDistance: 26000, // light-years from galactic center
  sunAngle: Math.PI * 0.72,
};

interface GalaxyRotatorProps {
  children: React.ReactNode;
  visualScale: number;
}

/**
 * Rotates children (solar system, stars, nebulae) around the Milky Way's galactic center.
 * This simulates the orbit of the Sun around the galaxy core.
 * 
 * The solar system is positioned at scene origin (0,0,0).
 * The Milky Way center is offset from the solar system.
 * We rotate around the galaxy center, NOT around the solar system.
 * 
 * Rotation is paused when:
 * - Inside any star system (Sun or Proxima Centauri)
 * - Viewing from outside the Milky Way (localGroup or universe scale)
 */
export const GalaxyRotator = ({ children, visualScale }: GalaxyRotatorProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);

  const timeSpeed = useCosmosStore((state) => state.timeSpeed);
  const isInStarSystem = useCosmosStore((state) => state.isInStarSystem);
  const currentScale = useCosmosStore((state) => state.currentScale);

  // Calculate the galactic center position (same as MilkyWayGalaxy's galaxyOffset)
  const gs = UNITS.KM_PER_LY * visualScale;
  const galaxyCenterX = -Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs;
  const galaxyCenterZ = -Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Don't rotate when inside a star system
    if (isInStarSystem) return;
    // Don't rotate when viewing the galaxy from far outside (would make it look like it's orbiting something)
    // Rotate at stellar + milkyWay scales (traveling between stars / viewing the galaxy as a whole)
    if (currentScale === 'localGroup' || currentScale === 'universe') return;

    // Base rotation speed * timeSpeed multiplier
    // 0.00625 rad/s base = one full rotation every ~16 minutes at 1x speed (slower for better viewing)
    currentRotation.current += delta * 0.00625 * timeSpeed;

    // To rotate around the galaxy center instead of the origin:
    // 1. Translate so galaxy center is at origin
    // 2. Rotate
    // 3. Translate back
    // This is done by setting position based on rotation angle
    
    // The solar system's position relative to galaxy center (in a circle)
    const distanceFromCenter = Math.sqrt(galaxyCenterX * galaxyCenterX + galaxyCenterZ * galaxyCenterZ);
    
    // Calculate the initial angle of the solar system relative to galaxy center
    // Since galaxy center is at (galaxyCenterX, 0, galaxyCenterZ), 
    // and solar system is at (0, 0, 0), the vector from center to sun is (-galaxyCenterX, 0, -galaxyCenterZ)
    const initialAngle = Math.atan2(-galaxyCenterZ, -galaxyCenterX);
    
    // New angle after rotation
    const newAngle = initialAngle + currentRotation.current;
    
    // New position of the group (offset from origin)
    // We move the group so that when it's at this position, rotating around galaxy center works correctly
    // The group contains the solar system at its local origin
    // We want the solar system to orbit around the galaxy center
    
    // Position of solar system relative to galaxy center after rotation:
    const newSolarX = Math.cos(newAngle) * distanceFromCenter;
    const newSolarZ = Math.sin(newAngle) * distanceFromCenter;
    
    // The group needs to be positioned such that:
    // group position + galaxy center (in local coords) = actual galaxy center (fixed)
    // So: group position = newSolar - (0,0,0) = newSolar position
    // But we want the galaxy center to stay fixed at galaxyOffset from original solar position
    
    // Simpler approach: just rotate the group around the galaxy center point
    groupRef.current.position.x = galaxyCenterX + newSolarX;
    groupRef.current.position.z = galaxyCenterZ + newSolarZ;
    
    // Also rotate the group itself so orientation is correct (objects face the right way)
    groupRef.current.rotation.y = currentRotation.current;
  });

  return <group ref={groupRef}>{children}</group>;
};
