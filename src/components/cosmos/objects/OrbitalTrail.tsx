import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

interface OrbitalTrailProps {
  objectId: string;
  color: string;
  maxPoints?: number;
  opacity?: number;
}

export const OrbitalTrail = ({ 
  objectId, 
  color, 
  maxPoints = 200,
  opacity = 0.6 
}: OrbitalTrailProps) => {
  const lineRef = useRef<THREE.Line>(null);
  const positionsRef = useRef<Float32Array>(new Float32Array(maxPoints * 3));
  const colorsRef = useRef<Float32Array>(new Float32Array(maxPoints * 4));
  const currentIndexRef = useRef(0);
  const lastPositionRef = useRef<[number, number, number] | null>(null);
  const frameCountRef = useRef(0);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  
  const objectWorldPositions = useCosmosStore(state => state.objectWorldPositions);
  const timeSpeed = useCosmosStore(state => state.timeSpeed);
  
  // Parse the color once
  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  
  // Create geometry and material once
  const { geometry, material, line } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxPoints * 4), 4));
    
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const ln = new THREE.Line(geo, mat);
    geometryRef.current = geo;
    
    return { geometry: geo, material: mat, line: ln };
  }, [maxPoints]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);
  
  useFrame(() => {
    const worldPos = objectWorldPositions[objectId];
    if (!worldPos || !geometryRef.current) return;
    
    // Only add points every few frames for performance, adjusted by time speed
    frameCountRef.current++;
    const frameInterval = Math.max(1, Math.floor(3 / Math.max(timeSpeed, 0.5)));
    if (frameCountRef.current < frameInterval) return;
    frameCountRef.current = 0;
    
    // Check if position has changed significantly (avoid duplicate points when paused)
    if (lastPositionRef.current) {
      const dx = worldPos[0] - lastPositionRef.current[0];
      const dy = worldPos[1] - lastPositionRef.current[1];
      const dz = worldPos[2] - lastPositionRef.current[2];
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < 0.01) return; // Skip if barely moved
    }
    lastPositionRef.current = [...worldPos];
    
    const geo = geometryRef.current;
    const positionAttr = geo.attributes.position as THREE.BufferAttribute;
    const colorAttr = geo.attributes.color as THREE.BufferAttribute;
    const idx = currentIndexRef.current;
    
    // Add new position
    positionAttr.setXYZ(idx, worldPos[0], worldPos[1], worldPos[2]);
    
    // Update colors with fade effect - newest points are brightest
    for (let i = 0; i < maxPoints; i++) {
      // Calculate age of this point (0 = newest, 1 = oldest)
      const pointAge = ((idx - i + maxPoints) % maxPoints) / maxPoints;
      const fadeFactor = Math.max(0, 1 - pointAge);
      const alpha = fadeFactor * fadeFactor * opacity; // Quadratic fade for smoother trail
      
      colorAttr.setXYZW(i, baseColor.r, baseColor.g, baseColor.b, alpha);
    }
    
    currentIndexRef.current = (idx + 1) % maxPoints;
    
    // Mark attributes for update
    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  });
  
  return <primitive object={line} ref={lineRef} />;
};
