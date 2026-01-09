import { useMemo } from 'react';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';

interface OortCloudProps {
  visualScale: number;
}

// Oort Cloud parameters - scaled for visibility
const OORT_INNER = 2000 * UNITS.KM_PER_AU;  // ~2,000 AU
const OORT_OUTER = 50000 * UNITS.KM_PER_AU; // ~50,000 AU (reduced for performance)

export const OortCloud = ({ visualScale }: OortCloudProps) => {
  const currentScale = useCosmosStore(state => state.currentScale);
  
  // At galaxy scale, render as a single bright white star
  const isGalaxyScale = currentScale === 'stellar' || currentScale === 'milkyWay' || currentScale === 'localGroup' || currentScale === 'universe';
  
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
  
  // At galaxy scale, show as a bright white star point
  if (isGalaxyScale) {
    return (
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={1}
            array={new Float32Array([0, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          size={6}
          sizeAttenuation={false}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    );
  }
  
  // At solar system scale, show the full particle cloud
  return (
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
  );
};
