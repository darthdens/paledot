import { useMemo } from 'react';
import * as THREE from 'three';

interface MilkyWaySkyboxProps {
  visualScale: number;
}

// Optimized Milky Way starfield visible from within the solar system
export const MilkyWaySkybox = ({ visualScale }: MilkyWaySkyboxProps) => {
  const skyboxRadius = 5e9 * visualScale;
  
  const { starGeo, milkyWayGeo, brightStarsGeo } = useMemo(() => {
    const color = new THREE.Color();
    
    // === GENERAL STAR FIELD (4000 stars) ===
    const starCount = 4000;
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      starPos[i3] = skyboxRadius * Math.sin(phi) * Math.cos(theta);
      starPos[i3 + 1] = skyboxRadius * Math.cos(phi);
      starPos[i3 + 2] = skyboxRadius * Math.sin(phi) * Math.sin(theta);
      
      // Varied stellar colors
      const rand = Math.random();
      if (rand < 0.08) {
        color.setHSL(0.6, 0.35, 0.95); // Blue-white
      } else if (rand < 0.2) {
        color.setHSL(0.08, 0.35, 0.9); // Orange
      } else if (rand < 0.35) {
        color.setHSL(0.03, 0.5, 0.85); // Red
      } else {
        color.setHSL(0.13, 0.12, 0.95); // White/cream
      }
      
      starCol[i3] = color.r;
      starCol[i3 + 1] = color.g;
      starCol[i3 + 2] = color.b;
    }
    
    // === MILKY WAY BAND (8000 particles - concentrated band) ===
    const bandCount = 8000;
    const bandPos = new Float32Array(bandCount * 3);
    const bandCol = new Float32Array(bandCount * 3);
    
    for (let i = 0; i < bandCount; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      
      // Gaussian distribution for band width
      const bandWidth = 0.18;
      const spread = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5 * bandWidth;
      const phi = Math.PI / 2 + spread + Math.sin(theta * 2) * 0.04;
      
      bandPos[i3] = skyboxRadius * Math.sin(phi) * Math.cos(theta);
      bandPos[i3 + 1] = skyboxRadius * Math.cos(phi);
      bandPos[i3 + 2] = skyboxRadius * Math.sin(phi) * Math.sin(theta);
      
      // Brighter toward galactic center
      const centerAngle = Math.PI * 0.75;
      const nearCenter = Math.abs(Math.cos(theta - centerAngle)) > 0.6;
      
      const rand = Math.random();
      if (nearCenter && rand < 0.25) {
        color.setHSL(0.08, 0.3, 0.8); // Warmer near center
      } else if (rand < 0.15) {
        color.setHSL(0.58, 0.25, 0.9); // Blue young stars
      } else if (rand < 0.25) {
        color.setHSL(0.95, 0.4, 0.7); // Pink nebulae hints
      } else {
        color.setHSL(0.12, 0.1, 0.88); // White/cream
      }
      
      bandCol[i3] = color.r;
      bandCol[i3 + 1] = color.g;
      bandCol[i3 + 2] = color.b;
    }
    
    // === BRIGHT STARS (100 prominent stars) ===
    const brightCount = 100;
    const brightPos = new Float32Array(brightCount * 3);
    const brightCol = new Float32Array(brightCount * 3);
    
    for (let i = 0; i < brightCount; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      brightPos[i3] = skyboxRadius * Math.sin(phi) * Math.cos(theta);
      brightPos[i3 + 1] = skyboxRadius * Math.cos(phi);
      brightPos[i3 + 2] = skyboxRadius * Math.sin(phi) * Math.sin(theta);
      
      const rand = Math.random();
      if (rand < 0.25) {
        color.setHSL(0.6, 0.4, 1); // Blue giants
      } else if (rand < 0.45) {
        color.setHSL(0.03, 0.65, 0.95); // Red giants
      } else if (rand < 0.65) {
        color.setHSL(0.08, 0.45, 0.98); // Orange giants
      } else {
        color.setHSL(0.14, 0.1, 1); // White
      }
      
      brightCol[i3] = color.r;
      brightCol[i3 + 1] = color.g;
      brightCol[i3 + 2] = color.b;
    }
    
    // Build geometries
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    
    const milkyWayGeo = new THREE.BufferGeometry();
    milkyWayGeo.setAttribute('position', new THREE.BufferAttribute(bandPos, 3));
    milkyWayGeo.setAttribute('color', new THREE.BufferAttribute(bandCol, 3));
    
    const brightStarsGeo = new THREE.BufferGeometry();
    brightStarsGeo.setAttribute('position', new THREE.BufferAttribute(brightPos, 3));
    brightStarsGeo.setAttribute('color', new THREE.BufferAttribute(brightCol, 3));
    
    return { starGeo, milkyWayGeo, brightStarsGeo };
  }, [skyboxRadius]);
  
  return (
    <group>
      {/* General starfield */}
      <points geometry={starGeo}>
        <pointsMaterial
          size={2}
          vertexColors
          sizeAttenuation={false}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Milky Way band */}
      <points geometry={milkyWayGeo}>
        <pointsMaterial
          size={1.2}
          vertexColors
          sizeAttenuation={false}
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Bright prominent stars */}
      <points geometry={brightStarsGeo}>
        <pointsMaterial
          size={4}
          vertexColors
          sizeAttenuation={false}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
