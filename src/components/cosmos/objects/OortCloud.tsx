import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';

interface OortCloudProps {
  visualScale: number;
  highlight?: boolean;
}

// Oort Cloud parameters - scaled for visibility
const OORT_INNER = 2000 * UNITS.KM_PER_AU; // ~2,000 AU
const OORT_OUTER = 50000 * UNITS.KM_PER_AU; // ~50,000 AU (reduced for performance)

export const OortCloud = ({ visualScale, highlight = false }: OortCloudProps) => {
  const materialRef = useRef<THREE.PointsMaterial>(null);

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

  // Only a subtle pulse when highlighted (no size/shape changes)
  useFrame(({ clock }) => {
    if (!highlight || !materialRef.current) return;
    const t = clock.getElapsedTime();
    const p = 0.5 + 0.5 * Math.sin(t * 1.2);
    materialRef.current.opacity = 0.28 + p * 0.12;
  });

  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color={highlight ? '#00ff88' : '#8899aa'}
        size={50000 * visualScale}
        sizeAttenuation
        transparent
        opacity={highlight ? 0.34 : 0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

