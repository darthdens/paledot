import { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { getObjectById } from '../data/celestialObjects';

interface OortCloudProps {
  visualScale: number;
  /** If provided, clicking the Oort Cloud will select this star */
  parentStarId?: string;
}

// Oort Cloud parameters - scaled for visibility
const OORT_INNER = 2000 * UNITS.KM_PER_AU;  // ~2,000 AU
const OORT_OUTER = 50000 * UNITS.KM_PER_AU; // ~50,000 AU (reduced for performance)

export const OortCloud = ({ visualScale, parentStarId }: OortCloudProps) => {
  const setSelectedObject = useCosmosStore((s) => s.setSelectedObject);
  
  // Get the parent star object for click handling
  const parentStar = useMemo(() => 
    parentStarId ? getObjectById(parentStarId) : null, 
    [parentStarId]
  );
  
  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (parentStar) {
      setSelectedObject(parentStar);
    }
  }, [parentStar, setSelectedObject]);
  
  // Generate static Oort Cloud particles
  const geometry = useMemo(() => {
    const particleCount = 4000;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Spherical shell - bias toward inner regions
      const t = Math.pow(Math.random(), 0.4);
      const radius = (OORT_INNER + t * (OORT_OUTER - OORT_INNER)) * visualScale;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi);
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [visualScale]);
  
  // Click target radius - use the outer Oort Cloud radius
  const clickTargetRadius = OORT_OUTER * visualScale;
  
  return (
    <group>
      <points geometry={geometry}>
        <pointsMaterial
          color="#aabbcc"
          size={0.8}
          sizeAttenuation={false}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Large invisible click target sphere for selecting the parent star */}
      {parentStarId && (
        <mesh onClick={handleClick} onPointerDown={handleClick}>
          <sphereGeometry args={[clickTargetRadius, 16, 16]} />
          <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};