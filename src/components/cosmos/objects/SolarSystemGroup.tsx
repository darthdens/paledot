// SolarSystemGroup - Wraps all solar system objects and follows the Sun's galactic position
import { useRef, ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

interface SolarSystemGroupProps {
  children: ReactNode;
  /** If true, the group follows the sun_galactic position */
  followGalacticSun?: boolean;
}

export const SolarSystemGroup = ({ children, followGalacticSun = false }: SolarSystemGroupProps) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (followGalacticSun && groupRef.current) {
      const sunGalacticPos = useCosmosStore.getState().objectWorldPositions['sun_galactic'];
      if (sunGalacticPos) {
        groupRef.current.position.set(sunGalacticPos[0], sunGalacticPos[1], sunGalacticPos[2]);
      }
    } else if (groupRef.current) {
      // Reset to origin when not following
      groupRef.current.position.set(0, 0, 0);
    }
  });
  
  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
};
