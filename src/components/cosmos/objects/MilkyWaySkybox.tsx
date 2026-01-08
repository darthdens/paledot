import { useMemo } from 'react';
import * as THREE from 'three';

interface MilkyWaySkyboxProps {
  visualScale: number;
}

// Real Milky Way starfield as seen from inside our solar system
// This creates the starry sky dome with the band of the Milky Way across it
export const MilkyWaySkybox = ({ visualScale }: MilkyWaySkyboxProps) => {
  // Distance from origin - far enough to encompass solar system but not interfere
  const skyboxRadius = 5e9 * visualScale; // 5 billion km equivalent - past Oort cloud inner edge
  
  // Generate realistic starfield with Milky Way band
  const { starGeo, milkyWayGeo, brightStarsGeo, nebulaGeo } = useMemo(() => {
    const color = new THREE.Color();
    
    // === GENERAL STAR FIELD (random distribution with some concentration toward galactic plane) ===
    const starCount = 20000;
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Spherical distribution with slight flattening toward galactic plane
      const theta = Math.random() * Math.PI * 2;
      // Bias toward equator (galactic plane) but still spread everywhere
      const rawPhi = Math.acos(2 * Math.random() - 1);
      // Slight concentration toward equator
      const phi = rawPhi + (Math.PI / 2 - rawPhi) * 0.15 * Math.pow(Math.random(), 2);
      
      const r = skyboxRadius * (0.98 + Math.random() * 0.04);
      
      starPos[i3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i3 + 1] = r * Math.cos(phi);
      starPos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      
      // Realistic stellar colors - mostly white/cream with some variety
      const rand = Math.random();
      if (rand < 0.05) {
        // Hot blue-white O/B stars
        color.setHSL(0.6 + Math.random() * 0.05, 0.3 + Math.random() * 0.3, 0.9 + Math.random() * 0.1);
      } else if (rand < 0.15) {
        // Blue-white A stars
        color.setHSL(0.58, 0.2 + Math.random() * 0.15, 0.9 + Math.random() * 0.1);
      } else if (rand < 0.35) {
        // White F stars
        color.setHSL(0.15, 0.05 + Math.random() * 0.1, 0.95 + Math.random() * 0.05);
      } else if (rand < 0.6) {
        // Yellow-white G stars (like Sun)
        color.setHSL(0.13, 0.1 + Math.random() * 0.15, 0.9 + Math.random() * 0.1);
      } else if (rand < 0.85) {
        // Orange K stars
        color.setHSL(0.08, 0.3 + Math.random() * 0.2, 0.85 + Math.random() * 0.1);
      } else {
        // Red M stars
        color.setHSL(0.02 + Math.random() * 0.03, 0.5 + Math.random() * 0.3, 0.7 + Math.random() * 0.15);
      }
      
      starCol[i3] = color.r;
      starCol[i3 + 1] = color.g;
      starCol[i3 + 2] = color.b;
      
      // Variable star sizes - mostly small, few larger
      starSizes[i] = Math.pow(Math.random(), 2.5) * 3 + 0.5;
    }
    
    // === MILKY WAY BAND (dense star band across the sky) ===
    // The Milky Way appears as a band across the night sky
    // Galactic plane runs roughly through Sagittarius (center) to Cygnus
    const bandCount = 35000;
    const bandPos = new Float32Array(bandCount * 3);
    const bandCol = new Float32Array(bandCount * 3);
    const bandSizes = new Float32Array(bandCount);
    
    for (let i = 0; i < bandCount; i++) {
      const i3 = i * 3;
      
      // Band runs along galactic equator
      const theta = Math.random() * Math.PI * 2;
      
      // Concentrated strongly in galactic plane with Gaussian-like falloff
      const bandWidth = 0.2 + Math.random() * 0.15; // Narrower band
      const verticalSpread = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5 * bandWidth;
      const phi = Math.PI / 2 + verticalSpread;
      
      const r = skyboxRadius * (0.97 + Math.random() * 0.06);
      
      // Add some warping for realism - the Milky Way isn't a perfect line
      const warp = Math.sin(theta * 2) * 0.05;
      const phiWarped = phi + warp;
      
      bandPos[i3] = r * Math.sin(phiWarped) * Math.cos(theta);
      bandPos[i3 + 1] = r * Math.cos(phiWarped);
      bandPos[i3 + 2] = r * Math.sin(phiWarped) * Math.sin(theta);
      
      // Density variation along the band - brighter toward galactic center (Sagittarius)
      const centerAngle = Math.PI * 0.75; // Galactic center direction
      const distFromCenter = Math.abs(Math.cos(theta - centerAngle));
      const inCenter = distFromCenter > 0.7;
      
      // Colors - mix of stellar populations
      const rand = Math.random();
      if (inCenter && rand < 0.3) {
        // More reddish/orange near center (older stars, dust reddening)
        color.setHSL(0.08 + Math.random() * 0.05, 0.3 + Math.random() * 0.2, 0.7 + Math.random() * 0.2);
      } else if (rand < 0.2) {
        // Blue-white young stars in spiral arms
        color.setHSL(0.58 + Math.random() * 0.05, 0.25 + Math.random() * 0.2, 0.85 + Math.random() * 0.1);
      } else {
        // General white/cream stellar population
        color.setHSL(0.12 + Math.random() * 0.06, 0.08 + Math.random() * 0.12, 0.85 + Math.random() * 0.12);
      }
      
      bandCol[i3] = color.r;
      bandCol[i3 + 1] = color.g;
      bandCol[i3 + 2] = color.b;
      
      // Smaller, denser particles for the band
      bandSizes[i] = Math.pow(Math.random(), 2) * 1.8 + 0.3;
    }
    
    // === BRIGHT NAMED STARS (simulating visible bright stars) ===
    const brightCount = 200;
    const brightPos = new Float32Array(brightCount * 3);
    const brightCol = new Float32Array(brightCount * 3);
    const brightSizes = new Float32Array(brightCount);
    
    for (let i = 0; i < brightCount; i++) {
      const i3 = i * 3;
      
      // Random spherical positions for bright stars
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = skyboxRadius;
      
      brightPos[i3] = r * Math.sin(phi) * Math.cos(theta);
      brightPos[i3 + 1] = r * Math.cos(phi);
      brightPos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      
      // Varied bright star colors
      const rand = Math.random();
      if (rand < 0.2) {
        // Blue-white giants (Rigel, Spica)
        color.setHSL(0.6, 0.4, 1);
      } else if (rand < 0.4) {
        // Red giants/supergiants (Betelgeuse, Antares)
        color.setHSL(0.03, 0.7, 0.9);
      } else if (rand < 0.6) {
        // Orange giants (Arcturus, Aldebaran)
        color.setHSL(0.08, 0.5, 0.95);
      } else if (rand < 0.8) {
        // Yellow-white (Sirius, Vega, Canopus)
        color.setHSL(0.14, 0.15, 1);
      } else {
        // White
        color.setHSL(0.15, 0.05, 1);
      }
      
      brightCol[i3] = color.r;
      brightCol[i3 + 1] = color.g;
      brightCol[i3 + 2] = color.b;
      
      // Large, prominent sizes
      brightSizes[i] = 5 + Math.random() * 6;
    }
    
    // === NEBULAE AND STAR FORMING REGIONS (colored patches in the band) ===
    const nebulaCount = 2000;
    const nebulaPos = new Float32Array(nebulaCount * 3);
    const nebulaCol = new Float32Array(nebulaCount * 3);
    
    for (let i = 0; i < nebulaCount; i++) {
      const i3 = i * 3;
      
      // Position in the Milky Way band
      const theta = Math.random() * Math.PI * 2;
      const verticalSpread = (Math.random() - 0.5) * 0.25;
      const phi = Math.PI / 2 + verticalSpread;
      const r = skyboxRadius * (0.96 + Math.random() * 0.05);
      
      nebulaPos[i3] = r * Math.sin(phi) * Math.cos(theta);
      nebulaPos[i3 + 1] = r * Math.cos(phi);
      nebulaPos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      
      // Nebula colors - emission nebulae (pink/red), reflection (blue), dark
      const rand = Math.random();
      if (rand < 0.4) {
        // Red/pink emission nebulae (HII regions)
        color.setHSL(0.95 + Math.random() * 0.08, 0.5 + Math.random() * 0.3, 0.4 + Math.random() * 0.2);
      } else if (rand < 0.6) {
        // Blue reflection nebulae
        color.setHSL(0.6 + Math.random() * 0.05, 0.4 + Math.random() * 0.2, 0.4 + Math.random() * 0.2);
      } else if (rand < 0.8) {
        // Yellowish star-forming regions
        color.setHSL(0.1 + Math.random() * 0.05, 0.3 + Math.random() * 0.2, 0.35 + Math.random() * 0.15);
      } else {
        // Dark nebulae (very dim reddish-brown)
        color.setHSL(0.02, 0.4, 0.15 + Math.random() * 0.1);
      }
      
      nebulaCol[i3] = color.r;
      nebulaCol[i3 + 1] = color.g;
      nebulaCol[i3 + 2] = color.b;
    }
    
    // Build geometries
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    
    const milkyWayGeo = new THREE.BufferGeometry();
    milkyWayGeo.setAttribute('position', new THREE.BufferAttribute(bandPos, 3));
    milkyWayGeo.setAttribute('color', new THREE.BufferAttribute(bandCol, 3));
    milkyWayGeo.setAttribute('size', new THREE.BufferAttribute(bandSizes, 1));
    
    const brightStarsGeo = new THREE.BufferGeometry();
    brightStarsGeo.setAttribute('position', new THREE.BufferAttribute(brightPos, 3));
    brightStarsGeo.setAttribute('color', new THREE.BufferAttribute(brightCol, 3));
    brightStarsGeo.setAttribute('size', new THREE.BufferAttribute(brightSizes, 1));
    
    const nebulaGeo = new THREE.BufferGeometry();
    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
    nebulaGeo.setAttribute('color', new THREE.BufferAttribute(nebulaCol, 3));
    
    return { starGeo, milkyWayGeo, brightStarsGeo, nebulaGeo };
  }, [skyboxRadius]);
  
  const baseSize = skyboxRadius * 0.00015;
  
  return (
    <group>
      {/* General starfield - scattered across the sky */}
      <points geometry={starGeo}>
        <pointsMaterial
          size={baseSize * 1.5}
          vertexColors
          sizeAttenuation={false}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Milky Way band - dense star concentration */}
      <points geometry={milkyWayGeo}>
        <pointsMaterial
          size={baseSize * 0.8}
          vertexColors
          sizeAttenuation={false}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Bright prominent stars */}
      <points geometry={brightStarsGeo}>
        <pointsMaterial
          size={baseSize * 3}
          vertexColors
          sizeAttenuation={false}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Nebulae - larger diffuse patches */}
      <points geometry={nebulaGeo}>
        <pointsMaterial
          size={baseSize * 6}
          vertexColors
          sizeAttenuation={false}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Galactic center glow - subtle brightening in Sagittarius direction */}
      <mesh 
        position={[
          skyboxRadius * 0.95 * Math.cos(Math.PI * 0.75),
          0,
          skyboxRadius * 0.95 * Math.sin(Math.PI * 0.75)
        ]}
        rotation={[0, -Math.PI * 0.75, 0]}
      >
        <planeGeometry args={[skyboxRadius * 0.4, skyboxRadius * 0.15]} />
        <meshBasicMaterial
          color="#ffddaa"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
