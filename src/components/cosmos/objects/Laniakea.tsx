import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';

interface LaniakeaProps {
  visualScale: number;
}

// Laniakea Supercluster - our cosmic home
// Diameter: ~520 Mly, contains ~100,000+ galaxies
// Great Attractor region is the gravitational center

interface Supercluster {
  name: string;
  position: [number, number, number]; // in Mly from Milky Way
  diameter: number; // in Mly
  galaxyDensity: number;
  hue: number;
}

// Major superclusters and structures in and around Laniakea
const LANIAKEA_STRUCTURES: Supercluster[] = [
  // === LANIAKEA CORE ===
  { name: 'Virgo Supercluster', position: [0, 0, 0], diameter: 110, galaxyDensity: 0.8, hue: 0.12 },
  { name: 'Centaurus Supercluster', position: [145, 35, 85], diameter: 150, galaxyDensity: 0.95, hue: 0.08 },
  { name: 'Great Attractor', position: [200, 20, 100], diameter: 80, galaxyDensity: 1.0, hue: 0.1 },
  { name: 'Norma Wall', position: [210, -15, 95], diameter: 100, galaxyDensity: 0.9, hue: 0.11 },
  { name: 'Hydra Supercluster', position: [120, -55, 95], diameter: 120, galaxyDensity: 0.8, hue: 0.65 },
  { name: 'Pavo-Indus Supercluster', position: [-85, 90, 165], diameter: 130, galaxyDensity: 0.75, hue: 0.58 },
  { name: 'Southern Supercluster', position: [-60, -130, 55], diameter: 100, galaxyDensity: 0.7, hue: 0.75 },
  { name: 'Antlia Wall', position: [90, -40, 55], diameter: 70, galaxyDensity: 0.65, hue: 0.55 },
  { name: 'Puppis Filament', position: [55, -70, 80], diameter: 60, galaxyDensity: 0.55, hue: 0.6 },
  
  // === NEIGHBORING SUPERCLUSTERS ===
  { name: 'Perseus-Pisces', position: [-250, 30, -180], diameter: 200, galaxyDensity: 0.85, hue: 0.02 },
  { name: 'Coma Supercluster', position: [280, 90, -50], diameter: 180, galaxyDensity: 0.9, hue: 0.48 },
  { name: 'Shapley Supercluster', position: [450, -35, 180], diameter: 250, galaxyDensity: 1.0, hue: 0.06 },
  { name: 'Hercules Supercluster', position: [380, 65, -120], diameter: 160, galaxyDensity: 0.75, hue: 0.4 },
  { name: 'Leo Supercluster', position: [320, 45, 25], diameter: 140, galaxyDensity: 0.7, hue: 0.14 },
  { name: 'Horologium-Reticulum', position: [-180, -200, 300], diameter: 180, galaxyDensity: 0.8, hue: 0.72 },
  { name: 'Sculptor Supercluster', position: [-200, -150, 180], diameter: 120, galaxyDensity: 0.65, hue: 0.78 },
  { name: 'Corona Borealis', position: [750, 50, -100], diameter: 140, galaxyDensity: 0.7, hue: 0.92 },
  { name: 'Boötes Supercluster', position: [650, 80, 50], diameter: 130, galaxyDensity: 0.65, hue: 0.55 },
];

// Cosmic voids
const COSMIC_VOIDS = [
  { name: 'Local Void', position: [-30, 50, -30], radius: 70 },
  { name: 'Eridanus Void', position: [-40, -100, 40], radius: 60 },
  { name: 'Sculptor Void', position: [-120, -80, 100], radius: 80 },
  { name: 'Boötes Void', position: [450, 120, -80], radius: 150 },
];

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

const isInVoid = (x: number, y: number, z: number): boolean => {
  for (const v of COSMIC_VOIDS) {
    const dx = x - v.position[0];
    const dy = y - v.position[1];
    const dz = z - v.position[2];
    if (dx * dx + dy * dy + dz * dz < v.radius * v.radius * 0.5) {
      return true;
    }
  }
  return false;
};

// Generate filaments between superclusters
const generateSuperclusterFilaments = (structures: Supercluster[], maxDist: number) => {
  const filaments: { from: THREE.Vector3; to: THREE.Vector3; strength: number }[] = [];
  
  for (let i = 0; i < structures.length; i++) {
    for (let j = i + 1; j < structures.length; j++) {
      const from = new THREE.Vector3(...structures[i].position);
      const to = new THREE.Vector3(...structures[j].position);
      const dist = from.distanceTo(to);
      
      if (dist < maxDist && dist > 30) {
        const strength = (1 - dist / maxDist) * 
          structures[i].galaxyDensity * structures[j].galaxyDensity;
        filaments.push({ from, to, strength });
      }
    }
  }
  
  return filaments;
};

export const Laniakea = ({ visualScale }: LaniakeaProps) => {
  const superclusterPointsRef = useRef<THREE.Points>(null);
  const filamentPointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const currentScale = useCosmosStore(state => state.currentScale);
  
  const mlyScale = UNITS.KM_PER_MLY * visualScale;
  
  const isVisible = currentScale === 'laniakea' || currentScale === 'universe';
  
  const { superclusterGeometry, superclusterMaterial, filamentGeometry, filamentMaterial } = useMemo(() => {
    // === SUPERCLUSTER GALAXIES ===
    const scPositions: number[] = [];
    const scColors: number[] = [];
    const scSizes: number[] = [];
    
    LANIAKEA_STRUCTURES.forEach((sc, scIdx) => {
      const count = Math.floor(sc.diameter * sc.galaxyDensity * 30);
      const radius = sc.diameter * 0.5;
      
      for (let i = 0; i < count; i++) {
        const seed = scIdx * 10000 + i;
        
        const r = Math.pow(seededRandom(seed), 0.5) * radius;
        const theta = seededRandom(seed + 1) * Math.PI * 2;
        const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
        
        const x = sc.position[0] + r * Math.sin(phi) * Math.cos(theta);
        const y = sc.position[1] + r * Math.cos(phi) * 0.55;
        const z = sc.position[2] + r * Math.sin(phi) * Math.sin(theta);
        
        if (isInVoid(x, y, z)) continue;
        
        scPositions.push(x * mlyScale, y * mlyScale, z * mlyScale);
        
        const hue = sc.hue + (seededRandom(seed + 3) - 0.5) * 0.08;
        const sat = 0.5 + seededRandom(seed + 4) * 0.3;
        const light = 0.45 + seededRandom(seed + 5) * 0.2 + sc.galaxyDensity * 0.15;
        
        const color = new THREE.Color().setHSL(hue, sat, light);
        scColors.push(color.r, color.g, color.b);
        scSizes.push((0.7 + seededRandom(seed + 6) * 0.5) * sc.galaxyDensity);
      }
    });
    
    const scGeo = new THREE.BufferGeometry();
    scGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(scPositions), 3));
    scGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(scColors), 3));
    scGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(scSizes), 1));
    scGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // === FILAMENTS BETWEEN SUPERCLUSTERS ===
    const filaments = generateSuperclusterFilaments(LANIAKEA_STRUCTURES, 400);
    const filPositions: number[] = [];
    const filColors: number[] = [];
    const filSizes: number[] = [];
    
    filaments.forEach((fil, fIdx) => {
      const filLength = fil.from.distanceTo(fil.to);
      const segmentCount = Math.floor(filLength / 8);
      const filWidth = 15 + fil.strength * 25;
      
      for (let s = 0; s <= segmentCount; s++) {
        const t = s / segmentCount;
        const seed = fIdx * 1000 + s;
        
        const curveT = Math.sin(t * Math.PI);
        const curve = (seededRandom(seed) - 0.5) * filLength * 0.12 * curveT;
        
        const baseX = fil.from.x + (fil.to.x - fil.from.x) * t + curve;
        const baseY = fil.from.y + (fil.to.y - fil.from.y) * t;
        const baseZ = fil.from.z + (fil.to.z - fil.from.z) * t + curve * 0.6;
        
        const particlesPerSeg = 6 + Math.floor(fil.strength * 10);
        for (let p = 0; p < particlesPerSeg; p++) {
          const pseed = seed + p * 100;
          
          // Gaussian distribution
          const r1 = seededRandom(pseed);
          const r2 = seededRandom(pseed + 1);
          const gaussR = Math.sqrt(-2 * Math.log(Math.max(r1, 0.001))) * Math.cos(2 * Math.PI * r2);
          
          const scatter = filWidth * gaussR * 0.4;
          
          const x = baseX + scatter;
          const y = baseY + scatter * 0.3;
          const z = baseZ + scatter;
          
          if (isInVoid(x, y, z)) continue;
          
          filPositions.push(x * mlyScale, y * mlyScale, z * mlyScale);
          
          // Blue/purple filaments
          const hue = 0.65 + seededRandom(pseed + 2) * 0.15;
          const light = 0.25 + fil.strength * 0.25;
          const color = new THREE.Color().setHSL(hue, 0.45, light);
          filColors.push(color.r, color.g, color.b);
          filSizes.push(0.35 + fil.strength * 0.45);
        }
      }
    });
    
    // Field galaxies distributed across entire visible region
    const fieldCount = 40000;
    for (let i = 0; i < fieldCount; i++) {
      const seed = i + 200000;
      
      const radius = 500 * Math.cbrt(seededRandom(seed)); // Volume-uniform
      const theta = seededRandom(seed + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.5;
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      if (isInVoid(x, y, z)) continue;
      
      filPositions.push(x * mlyScale, y * mlyScale, z * mlyScale);
      
      const hue = 0.55 + seededRandom(seed + 3) * 0.15;
      const color = new THREE.Color().setHSL(hue, 0.25, 0.3);
      filColors.push(color.r, color.g, color.b);
      filSizes.push(0.18 + seededRandom(seed + 4) * 0.15);
    }
    
    const filGeo = new THREE.BufferGeometry();
    filGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(filPositions), 3));
    filGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(filColors), 3));
    filGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(filSizes), 1));
    filGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // Shared texture
    const texSize = 64;
    const canvas = document.createElement('canvas');
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(texSize / 2, texSize / 2, 0, texSize / 2, texSize / 2, texSize / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.12, 'rgba(255, 255, 255, 0.85)');
    gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, texSize, texSize);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const createMaterial = (sizeMultiplier: number) => new THREE.ShaderMaterial({
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
          float pointSize = size * ${sizeMultiplier.toFixed(1)} / dist;
          gl_PointSize = clamp(pointSize, 0.8, 28.0);
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
    
    return { 
      superclusterGeometry: scGeo, 
      superclusterMaterial: createMaterial(180000.0),
      filamentGeometry: filGeo,
      filamentMaterial: createMaterial(140000.0),
    };
  }, [mlyScale]);
  
  useFrame(() => {
    if (!isVisible) return;
    
    const distance = camera.position.length();
    const fadeIn = THREE.MathUtils.smoothstep(distance, mlyScale * 80, mlyScale * 200);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(distance, mlyScale * 2000, mlyScale * 4000);
    const opacity = Math.min(fadeIn, fadeOut);
    
    if (superclusterPointsRef.current) {
      (superclusterMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = opacity * 0.85;
    }
    if (filamentPointsRef.current) {
      (filamentMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = opacity * 0.7;
    }
  });
  
  if (!isVisible) return null;
  
  return (
    <group>
      <points ref={filamentPointsRef} geometry={filamentGeometry} material={filamentMaterial} frustumCulled={false} />
      <points ref={superclusterPointsRef} geometry={superclusterGeometry} material={superclusterMaterial} frustumCulled={false} />
    </group>
  );
};
