import { useMemo, useCallback, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
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
  const currentStarSystem = useCosmosStore((s) => s.currentStarSystem);
  const [isHovered, setIsHovered] = useState(false);
  const hoverGlowRef = useRef<THREE.Mesh>(null);
  const currentOpacity = useRef(0);
  
  // Show this Oort Cloud when:
  // 1. We're in its parent star's system (for detailed view)
  // 2. We're NOT in any star system (galaxy/stellar scale - can see both)
  // If no parentStarId, always show (backward compat)
  const shouldShow = !parentStarId || currentStarSystem === parentStarId || currentStarSystem === null;
  
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
  
  const handlePointerOver = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setIsHovered(true);
  }, []);
  
  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
  }, []);
  
  // Animate hover glow opacity
  useFrame((_, delta) => {
    if (!hoverGlowRef.current) return;
    
    const targetOpacity = isHovered ? 0.15 : 0;
    const speed = 4; // Transition speed
    
    currentOpacity.current += (targetOpacity - currentOpacity.current) * Math.min(delta * speed, 1);
    
    const material = hoverGlowRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = currentOpacity.current;
  });
  
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
  
  // Don't render if we're in a different star system
  if (!shouldShow) return null;
  
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
        <>
          <mesh 
            onClick={handleClick} 
            onPointerDown={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <sphereGeometry args={[clickTargetRadius, 16, 16]} />
            <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
          </mesh>
          
          {/* Hover glow effect - subtle shell highlight */}
          <mesh ref={hoverGlowRef}>
            <sphereGeometry args={[clickTargetRadius * 0.98, 32, 32]} />
            <meshBasicMaterial 
              color="#66aaff"
              transparent 
              opacity={0} 
              depthWrite={false}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </>
      )}
    </group>
  );
};