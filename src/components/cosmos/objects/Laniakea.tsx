import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';

interface LaniakeaProps {
  visualScale: number;
}

// Laniakea: ~520 Mly diameter, ~100,000+ galaxies
// Great Attractor is the gravitational center

interface Supercluster {
  name: string;
  position: [number, number, number];
  diameter: number;
  galaxyDensity: number;
  color: string;
}

// Major structures in and around Laniakea
const LANIAKEA_STRUCTURES: Supercluster[] = [
  // LANIAKEA CORE
  { name: 'Virgo Supercluster', position: [0, 0, 0], diameter: 110, galaxyDensity: 0.85, color: '#FFE4B5' },
  { name: 'Centaurus Supercluster', position: [145, 35, 85], diameter: 160, galaxyDensity: 0.95, color: '#FFA07A' },
  { name: 'Great Attractor', position: [200, 20, 100], diameter: 90, galaxyDensity: 1.0, color: '#FFD700' },
  { name: 'Norma Wall', position: [210, -15, 95], diameter: 110, galaxyDensity: 0.9, color: '#F0E68C' },
  { name: 'Hydra Supercluster', position: [120, -55, 95], diameter: 130, galaxyDensity: 0.8, color: '#E6E6FA' },
  { name: 'Pavo-Indus Supercluster', position: [-85, 90, 165], diameter: 140, galaxyDensity: 0.75, color: '#87CEEB' },
  { name: 'Southern Supercluster', position: [-60, -130, 55], diameter: 110, galaxyDensity: 0.7, color: '#DDA0DD' },
  { name: 'Antlia Wall', position: [90, -40, 55], diameter: 80, galaxyDensity: 0.65, color: '#B0E0E6' },
  { name: 'Puppis Filament', position: [55, -70, 80], diameter: 70, galaxyDensity: 0.6, color: '#ADD8E6' },
  { name: 'Telescopium Wall', position: [-50, 60, 120], diameter: 75, galaxyDensity: 0.55, color: '#98D8C8' },
  
  // NEIGHBORING SUPERCLUSTERS
  { name: 'Perseus-Pisces', position: [-250, 30, -180], diameter: 220, galaxyDensity: 0.85, color: '#FF6B6B' },
  { name: 'Coma Supercluster', position: [280, 90, -50], diameter: 200, galaxyDensity: 0.9, color: '#4ECDC4' },
  { name: 'Shapley Supercluster', position: [450, -35, 180], diameter: 280, galaxyDensity: 1.0, color: '#FF9F43' },
  { name: 'Hercules Supercluster', position: [380, 65, -120], diameter: 180, galaxyDensity: 0.75, color: '#A8E6CF' },
  { name: 'Leo Supercluster', position: [320, 45, 25], diameter: 160, galaxyDensity: 0.7, color: '#FFD93D' },
  { name: 'Horologium-Reticulum', position: [-180, -200, 300], diameter: 200, galaxyDensity: 0.8, color: '#6C5CE7' },
  { name: 'Sculptor Supercluster', position: [-200, -150, 180], diameter: 140, galaxyDensity: 0.65, color: '#A29BFE' },
  { name: 'Corona Borealis', position: [750, 50, -100], diameter: 160, galaxyDensity: 0.7, color: '#FD79A8' },
  { name: 'Boötes Supercluster', position: [650, 80, 50], diameter: 150, galaxyDensity: 0.65, color: '#74B9FF' },
  { name: 'Ursa Major Supercluster', position: [480, 120, -80], diameter: 130, galaxyDensity: 0.6, color: '#55A8B5' },
  { name: 'Pisces-Cetus', position: [-300, -80, -120], diameter: 180, galaxyDensity: 0.7, color: '#F8B500' },
  { name: 'Aquarius Supercluster', position: [-180, -120, -200], diameter: 140, galaxyDensity: 0.6, color: '#00CED1' },
];

const COSMIC_VOIDS = [
  { name: 'Local Void', position: [-30, 50, -30], radius: 80 },
  { name: 'Eridanus Void', position: [-40, -100, 40], radius: 70 },
  { name: 'Taurus Void', position: [-90, -150, -20], radius: 80 },
  { name: 'Sculptor Void', position: [-120, -80, 100], radius: 90 },
  { name: 'Boötes Void', position: [450, 120, -80], radius: 180 },
  { name: 'Capricornus Void', position: [100, -180, -50], radius: 80 },
  { name: 'Coma Void', position: [200, 150, -30], radius: 70 },
  { name: 'Microscopium Void', position: [80, -120, 150], radius: 75 },
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

export const Laniakea = ({ visualScale }: LaniakeaProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const currentScale = useCosmosStore(state => state.currentScale);
  
  const mlyScale = UNITS.KM_PER_MLY * visualScale;
  
  const isVisible = currentScale === 'laniakea' || currentScale === 'universe';
  
  const { geometry, material } = useMemo(() => {
    const allPositions: number[] = [];
    const allColors: number[] = [];
    const allSizes: number[] = [];
    
    // Supercluster galaxies
    LANIAKEA_STRUCTURES.forEach((sc, scIdx) => {
      const count = Math.floor(sc.diameter * sc.galaxyDensity * 35);
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
        
        allPositions.push(x * mlyScale, y * mlyScale, z * mlyScale);
        
        const baseColor = new THREE.Color(sc.color);
        const variation = 0.1 + seededRandom(seed + 3) * 0.15;
        baseColor.offsetHSL(seededRandom(seed + 4) * 0.06 - 0.03, 0, variation - 0.1);
        
        allColors.push(baseColor.r, baseColor.g, baseColor.b);
        allSizes.push((0.7 + seededRandom(seed + 5) * 0.7) * sc.galaxyDensity);
      }
    });
    
    // Dense field galaxies across the visible region
    const fieldCount = 60000;
    for (let i = 0; i < fieldCount; i++) {
      const seed = i + 100000;
      
      const radius = 500 * Math.pow(seededRandom(seed), 0.45);
      const theta = seededRandom(seed + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.4;
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      if (isInVoid(x, y, z)) continue;
      
      allPositions.push(x * mlyScale, y * mlyScale, z * mlyScale);
      
      const hue = 0.52 + seededRandom(seed + 3) * 0.15;
      const color = new THREE.Color().setHSL(hue, 0.28, 0.32 + seededRandom(seed + 4) * 0.12);
      allColors.push(color.r, color.g, color.b);
      allSizes.push(0.18 + seededRandom(seed + 5) * 0.25);
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(allPositions), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(allColors), 3));
    geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(allSizes), 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
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
          float pointSize = size * 180000.0 / dist;
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
    
    return { geometry: geo, material: mat };
  }, [mlyScale]);
  
  useFrame(() => {
    if (!pointsRef.current || !isVisible) return;
    
    const distance = camera.position.length();
    const fadeIn = THREE.MathUtils.smoothstep(distance, mlyScale * 60, mlyScale * 180);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(distance, mlyScale * 2500, mlyScale * 5000);
    
    (material as THREE.ShaderMaterial).uniforms.uOpacity.value = Math.min(fadeIn, fadeOut) * 0.85;
  });
  
  if (!isVisible) return null;
  
  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
};