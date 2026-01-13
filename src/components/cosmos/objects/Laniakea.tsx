import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';

interface LaniakeaProps {
  visualScale: number;
}

// Real astronomical data for Laniakea Supercluster
// Reference: Tully et al. 2014 - Laniakea contains ~100,000+ galaxies
// Diameter: ~520 Mly, Great Attractor is gravitational center

interface Supercluster {
  name: string;
  position: [number, number, number]; // in million light-years from Milky Way
  diameter: number; // in Mly
  galaxyDensity: number; // relative density 0-1
  color: string; // hex color
}

// Major components of Laniakea
// Based on Tully et al. 2014 and cosmic flow studies
const LANIAKEA_SUPERCLUSTERS: Supercluster[] = [
  // Virgo Supercluster (our home) - centered at origin
  { name: 'Virgo Supercluster', position: [0, 0, 0], diameter: 110, galaxyDensity: 0.8, color: '#FFE4B5' },
  
  // Centaurus Supercluster - direction of Great Attractor (~150-200 Mly)
  { name: 'Centaurus Supercluster', position: [145, 35, 85], diameter: 140, galaxyDensity: 0.9, color: '#FFA07A' },
  
  // Hydra Supercluster (~160 Mly)
  { name: 'Hydra Supercluster', position: [120, -55, 95], diameter: 100, galaxyDensity: 0.75, color: '#E6E6FA' },
  
  // Pavo-Indus Supercluster (~200 Mly away)
  { name: 'Pavo-Indus Supercluster', position: [-85, 90, 165], diameter: 120, galaxyDensity: 0.7, color: '#87CEEB' },
  
  // Southern Supercluster (~120 Mly)
  { name: 'Southern Supercluster', position: [-60, -130, 55], diameter: 90, galaxyDensity: 0.65, color: '#DDA0DD' },
  
  // Additional clusters in Laniakea periphery
  // Antlia Cluster region
  { name: 'Antlia Cluster Region', position: [90, -40, 55], diameter: 50, galaxyDensity: 0.5, color: '#B0E0E6' },
  
  // Centaurus Cluster (Abell 3526) - heart of Great Attractor
  { name: 'Great Attractor Region', position: [165, 25, 95], diameter: 60, galaxyDensity: 1.0, color: '#FFC125' },
  
  // Norma Cluster (Abell 3627) - behind Milky Way
  { name: 'Norma Cluster Region', position: [180, -15, 85], diameter: 45, galaxyDensity: 0.85, color: '#F0E68C' },
  
  // Puppis Cluster
  { name: 'Puppis Cluster', position: [45, -65, 70], diameter: 35, galaxyDensity: 0.55, color: '#ADD8E6' },
  
  // Cancer Cluster
  { name: 'Cancer Cluster', position: [195, -90, -25], diameter: 40, galaxyDensity: 0.5, color: '#98FB98' },
];

// Cosmic voids in Laniakea (sparse regions)
const COSMIC_VOIDS = [
  { name: 'Local Void', position: [-30, 50, -30], radius: 60 },
  { name: 'Eridanus Void', position: [-40, -100, 40], radius: 50 },
  { name: 'Taurus Void', position: [-90, -150, -20], radius: 55 },
  { name: 'Gemini Void', position: [50, -130, -40], radius: 45 },
  { name: 'Cygnus Void', position: [-20, 140, -60], radius: 50 },
  { name: 'Delphinus Void', position: [20, 95, -40], radius: 40 },
  { name: 'Leo Void', position: [130, -20, 25], radius: 45 },
  { name: 'Corvus Void', position: [110, -30, 65], radius: 40 },
];

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Check if point is inside any void
const isInVoid = (x: number, y: number, z: number): boolean => {
  for (const v of COSMIC_VOIDS) {
    const dx = x - v.position[0];
    const dy = y - v.position[1];
    const dz = z - v.position[2];
    if (dx * dx + dy * dy + dz * dz < v.radius * v.radius * 0.7) {
      return true;
    }
  }
  return false;
};

export const Laniakea = ({ visualScale }: LaniakeaProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const currentScale = useCosmosStore(state => state.currentScale);
  
  const mlyScale = UNITS.KM_PER_MLY * visualScale;
  
  // Only visible at Laniakea scale and beyond
  const isVisible = currentScale === 'laniakea' || currentScale === 'universe';
  
  const { geometry, material } = useMemo(() => {
    const allPositions: number[] = [];
    const allColors: number[] = [];
    const allSizes: number[] = [];
    
    // Generate galaxies for each supercluster
    LANIAKEA_SUPERCLUSTERS.forEach((sc, scIdx) => {
      const count = Math.floor(sc.diameter * sc.galaxyDensity * 15);
      const radius = sc.diameter * 0.5;
      
      for (let i = 0; i < count; i++) {
        const seed = scIdx * 10000 + i;
        
        const r = Math.pow(seededRandom(seed), 0.6) * radius;
        const theta = seededRandom(seed + 1) * Math.PI * 2;
        const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
        
        const x = sc.position[0] + r * Math.sin(phi) * Math.cos(theta);
        const y = sc.position[1] + r * Math.cos(phi) * 0.65;
        const z = sc.position[2] + r * Math.sin(phi) * Math.sin(theta);
        
        // Skip if in void
        if (isInVoid(x, y, z)) continue;
        
        allPositions.push(x * mlyScale, y * mlyScale, z * mlyScale);
        
        const baseColor = new THREE.Color(sc.color);
        const variation = 0.1 + seededRandom(seed + 3) * 0.15;
        baseColor.offsetHSL(seededRandom(seed + 4) * 0.05 - 0.025, 0, variation - 0.12);
        
        allColors.push(baseColor.r, baseColor.g, baseColor.b);
        allSizes.push((0.8 + seededRandom(seed + 5) * 0.6) * sc.galaxyDensity);
      }
    });
    
    // Add field galaxies distributed across Laniakea (~260 Mly radius)
    const fieldCount = 8000;
    for (let i = 0; i < fieldCount; i++) {
      const seed = i + 100000;
      
      const radius = 260 * Math.pow(seededRandom(seed), 0.55);
      const theta = seededRandom(seed + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.5;
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      // Skip if in void
      if (isInVoid(x, y, z)) continue;
      
      allPositions.push(x * mlyScale, y * mlyScale, z * mlyScale);
      
      // Dim galaxies for field
      const hue = 0.58 + seededRandom(seed + 3) * 0.1;
      const color = new THREE.Color().setHSL(hue, 0.25, 0.35);
      allColors.push(color.r, color.g, color.b);
      allSizes.push(0.2 + seededRandom(seed + 4) * 0.25);
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(allPositions), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(allColors), 3));
    geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(allSizes), 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // Soft glow texture
    const texSize = 64;
    const canvas = document.createElement('canvas');
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(texSize / 2, texSize / 2, 0, texSize / 2, texSize / 2, texSize / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.75)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.35)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, texSize, texSize);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
        uOpacity: { value: 1.0 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          float dist = -mvPosition.z;
          float pointSize = size * 120000.0 / dist;
          gl_PointSize = clamp(pointSize, 1.0, 25.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uOpacity;
        varying vec3 vColor;
        
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          if (tex.a < 0.01) discard;
          gl_FragColor = vec4(vColor, uOpacity) * tex;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    
    return { geometry: geo, material: mat };
  }, [mlyScale]);
  
  useFrame(() => {
    if (!pointsRef.current || !isVisible) return;
    
    const distance = camera.position.length();
    const fadeIn = THREE.MathUtils.smoothstep(distance, mlyScale * 80, mlyScale * 200);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(distance, mlyScale * 1500, mlyScale * 3000);
    
    (material as THREE.ShaderMaterial).uniforms.uOpacity.value = Math.min(fadeIn, fadeOut) * 0.75;
  });
  
  if (!isVisible) return null;
  
  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
};