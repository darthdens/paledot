import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';

interface LocalGroupDwarfGalaxiesProps {
  visualScale: number;
}

// Real Local Group dwarf galaxies with accurate distances (in light-years from Milky Way)
// Based on astronomical data - positions approximate 3D layout from reference maps
interface DwarfGalaxyData {
  name: string;
  distanceLy: number; // distance from Milky Way in light-years
  direction: [number, number, number]; // normalized direction vector
  type: 'irregular' | 'elliptical' | 'spheroidal';
  sizeLy: number; // diameter in light-years
  brightness: number;
}

// Real Local Group members with approximate positions
// Distances and positions based on astronomical catalogs
const LOCAL_GROUP_GALAXIES: DwarfGalaxyData[] = [
  // Milky Way satellites (close)
  { name: 'Large Magellanic Cloud', distanceLy: 160000, direction: [-0.5, -0.3, 0.8], type: 'irregular', sizeLy: 14000, brightness: 1.0 },
  { name: 'Small Magellanic Cloud', distanceLy: 200000, direction: [-0.55, -0.35, 0.75], type: 'irregular', sizeLy: 7000, brightness: 0.9 },
  { name: 'Sagittarius Dwarf', distanceLy: 70000, direction: [0.2, -0.1, -0.97], type: 'spheroidal', sizeLy: 10000, brightness: 0.6 },
  { name: 'Ursa Minor Dwarf', distanceLy: 200000, direction: [0.1, 0.95, 0.3], type: 'spheroidal', sizeLy: 2000, brightness: 0.5 },
  { name: 'Draco Dwarf', distanceLy: 260000, direction: [0.15, 0.9, 0.4], type: 'spheroidal', sizeLy: 2500, brightness: 0.5 },
  { name: 'Carina Dwarf', distanceLy: 330000, direction: [-0.6, -0.6, 0.5], type: 'spheroidal', sizeLy: 1600, brightness: 0.45 },
  { name: 'Sextans Dwarf', distanceLy: 290000, direction: [-0.3, 0.2, 0.93], type: 'spheroidal', sizeLy: 3000, brightness: 0.45 },
  { name: 'Sculptor Dwarf', distanceLy: 290000, direction: [0.1, -0.8, 0.6], type: 'spheroidal', sizeLy: 2000, brightness: 0.5 },
  { name: 'Fornax Dwarf', distanceLy: 460000, direction: [0.2, -0.7, 0.7], type: 'spheroidal', sizeLy: 6000, brightness: 0.55 },
  { name: 'Leo I', distanceLy: 820000, direction: [0.85, 0.4, 0.35], type: 'spheroidal', sizeLy: 2000, brightness: 0.5 },
  { name: 'Leo II', distanceLy: 690000, direction: [0.75, 0.45, 0.5], type: 'spheroidal', sizeLy: 1500, brightness: 0.45 },
  { name: 'Ursa Major I', distanceLy: 330000, direction: [0.3, 0.85, 0.43], type: 'spheroidal', sizeLy: 800, brightness: 0.4 },
  { name: 'Ursa Major II', distanceLy: 100000, direction: [0.35, 0.8, 0.5], type: 'spheroidal', sizeLy: 500, brightness: 0.35 },
  { name: 'Boötes Dwarf', distanceLy: 197000, direction: [0.25, 0.75, 0.6], type: 'spheroidal', sizeLy: 700, brightness: 0.35 },
  { name: 'Canes Venatici I', distanceLy: 720000, direction: [0.5, 0.6, 0.6], type: 'spheroidal', sizeLy: 1500, brightness: 0.45 },
  { name: 'Canes Venatici II', distanceLy: 490000, direction: [0.55, 0.55, 0.62], type: 'spheroidal', sizeLy: 500, brightness: 0.35 },
  
  // Andromeda satellites (near M31 at ~2.5 Mly)
  { name: 'M32', distanceLy: 2490000, direction: [0.85, 0.15, 0.5], type: 'elliptical', sizeLy: 8000, brightness: 0.85 },
  { name: 'M110', distanceLy: 2690000, direction: [0.83, 0.18, 0.53], type: 'elliptical', sizeLy: 15000, brightness: 0.8 },
  { name: 'NGC 185', distanceLy: 2050000, direction: [0.78, 0.25, 0.58], type: 'elliptical', sizeLy: 6000, brightness: 0.6 },
  { name: 'NGC 147', distanceLy: 2530000, direction: [0.8, 0.22, 0.56], type: 'elliptical', sizeLy: 6000, brightness: 0.55 },
  { name: 'Andromeda I', distanceLy: 2430000, direction: [0.84, 0.12, 0.53], type: 'spheroidal', sizeLy: 2000, brightness: 0.4 },
  { name: 'Andromeda II', distanceLy: 2220000, direction: [0.82, 0.08, 0.57], type: 'spheroidal', sizeLy: 3500, brightness: 0.45 },
  { name: 'Andromeda III', distanceLy: 2440000, direction: [0.81, 0.1, 0.58], type: 'spheroidal', sizeLy: 1500, brightness: 0.4 },
  { name: 'IC 10', distanceLy: 2200000, direction: [0.75, 0.35, 0.56], type: 'irregular', sizeLy: 5000, brightness: 0.7 },
  
  // Isolated Local Group members
  { name: 'NGC 6822', distanceLy: 1630000, direction: [0.3, -0.3, 0.9], type: 'irregular', sizeLy: 7000, brightness: 0.65 },
  { name: 'IC 1613', distanceLy: 2380000, direction: [0.4, -0.6, 0.7], type: 'irregular', sizeLy: 10000, brightness: 0.6 },
  { name: 'Phoenix Dwarf', distanceLy: 1440000, direction: [0.2, -0.85, 0.5], type: 'irregular', sizeLy: 1500, brightness: 0.45 },
  { name: 'Tucana Dwarf', distanceLy: 2840000, direction: [-0.3, -0.9, 0.3], type: 'spheroidal', sizeLy: 1000, brightness: 0.4 },
  { name: 'Cetus Dwarf', distanceLy: 2460000, direction: [0.1, -0.8, 0.6], type: 'spheroidal', sizeLy: 1500, brightness: 0.4 },
  { name: 'WLM', distanceLy: 3040000, direction: [0.15, -0.75, 0.65], type: 'irregular', sizeLy: 8000, brightness: 0.55 },
  { name: 'Aquarius Dwarf', distanceLy: 3200000, direction: [0.35, -0.65, 0.67], type: 'irregular', sizeLy: 2000, brightness: 0.45 },
  { name: 'SagDIG', distanceLy: 3390000, direction: [0.4, -0.55, 0.73], type: 'irregular', sizeLy: 2500, brightness: 0.45 },
  { name: 'Pegasus Dwarf', distanceLy: 3000000, direction: [0.6, -0.5, 0.62], type: 'irregular', sizeLy: 4000, brightness: 0.5 },
  { name: 'Pisces Dwarf', distanceLy: 2510000, direction: [0.55, -0.45, 0.7], type: 'irregular', sizeLy: 1500, brightness: 0.45 },
  
  // Outer Local Group (edge members)
  { name: 'Leo A', distanceLy: 2570000, direction: [0.7, 0.55, 0.45], type: 'irregular', sizeLy: 3000, brightness: 0.5 },
  { name: 'Sextans A', distanceLy: 4310000, direction: [-0.6, 0.75, 0.3], type: 'irregular', sizeLy: 5000, brightness: 0.5 },
  { name: 'Sextans B', distanceLy: 4440000, direction: [-0.55, 0.8, 0.25], type: 'irregular', sizeLy: 4000, brightness: 0.48 },
  { name: 'NGC 3109', distanceLy: 4300000, direction: [-0.8, 0.4, 0.45], type: 'irregular', sizeLy: 16000, brightness: 0.55 },
  { name: 'Antlia Dwarf', distanceLy: 4030000, direction: [-0.75, 0.35, 0.55], type: 'spheroidal', sizeLy: 2000, brightness: 0.4 },
  { name: 'LGS 3', distanceLy: 2020000, direction: [0.5, -0.4, 0.77], type: 'irregular', sizeLy: 1000, brightness: 0.4 },
];

// Seeded random for adding variety
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Add procedural galaxies to fill out the group
const generateProceduralDwarfs = (): DwarfGalaxyData[] => {
  const extras: DwarfGalaxyData[] = [];
  const count = 45; // Fill to ~85 total
  
  for (let i = 0; i < count; i++) {
    const seed = (i + 100) * 12345.6789;
    
    // Distribution: more closer to center, some out to edge
    const distanceLy = 300000 + seededRandom(seed) * 4500000;
    
    // Random direction on sphere
    const u = seededRandom(seed + 1);
    const v = seededRandom(seed + 2);
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    
    const direction: [number, number, number] = [
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi) * 0.7, // slight flattening
      Math.sin(phi) * Math.sin(theta),
    ];
    
    // Normalize
    const len = Math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2);
    direction[0] /= len;
    direction[1] /= len;
    direction[2] /= len;
    
    const typeRand = seededRandom(seed + 3);
    const type: 'irregular' | 'elliptical' | 'spheroidal' = 
      typeRand < 0.3 ? 'irregular' : typeRand < 0.5 ? 'elliptical' : 'spheroidal';
    
    const sizeLy = 500 + seededRandom(seed + 4) * 4000;
    const brightness = 0.3 + seededRandom(seed + 5) * 0.4;
    
    extras.push({
      name: `Dwarf ${i + 1}`,
      distanceLy,
      direction,
      type,
      sizeLy,
      brightness,
    });
  }
  
  return extras;
};

const ALL_DWARFS = [...LOCAL_GROUP_GALAXIES, ...generateProceduralDwarfs()];

// Color palettes by type
const getGalaxyColor = (type: string, seed: number): THREE.Color => {
  const rand = seededRandom(seed);
  
  if (type === 'irregular') {
    // Blue-ish (star forming)
    return new THREE.Color().setHSL(0.55 + rand * 0.1, 0.6, 0.65);
  } else if (type === 'elliptical') {
    // Yellow-orange (old stars)
    return new THREE.Color().setHSL(0.08 + rand * 0.05, 0.5, 0.7);
  } else {
    // Warm tan (old stars, dim)
    return new THREE.Color().setHSL(0.06 + rand * 0.04, 0.35, 0.6);
  }
};

export const LocalGroupDwarfGalaxies = ({ visualScale }: LocalGroupDwarfGalaxiesProps) => {
  const gs = UNITS.KM_PER_LY * visualScale;
  const pointsRef = useRef<THREE.Points>(null);
  
  const { geometry, material, basePositions, baseSizes } = useMemo(() => {
    const positions = new Float32Array(ALL_DWARFS.length * 3);
    const colors = new Float32Array(ALL_DWARFS.length * 3);
    const sizes = new Float32Array(ALL_DWARFS.length);
    const storedPositions: THREE.Vector3[] = [];
    const storedSizes: number[] = [];
    
    ALL_DWARFS.forEach((g, i) => {
      // Convert to scene coordinates
      const x = g.direction[0] * g.distanceLy * gs;
      const y = g.direction[1] * g.distanceLy * gs;
      const z = g.direction[2] * g.distanceLy * gs;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      storedPositions.push(new THREE.Vector3(x, y, z));
      
      // Visual size based on actual galaxy size
      const visualSize = g.sizeLy * gs;
      storedSizes.push(visualSize);
      sizes[i] = visualSize;
      
      const color = getGalaxyColor(g.type, i * 777);
      colors[i * 3] = color.r * g.brightness;
      colors[i * 3 + 1] = color.g * g.brightness;
      colors[i * 3 + 2] = color.b * g.brightness;
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Soft glow texture
    const texSize = 64;
    const canvas = document.createElement('canvas');
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(texSize / 2, texSize / 2, 0, texSize / 2, texSize / 2, texSize / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, texSize, texSize);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    // Shader with size attenuation (gets smaller with distance like real objects)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
        uMinSize: { value: 2.0 }, // minimum screen pixels
        uMaxSize: { value: 60.0 }, // maximum screen pixels
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float uMinSize;
        uniform float uMaxSize;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Size attenuation - divide by distance
          float dist = -mvPosition.z;
          float pointSize = size / dist * 500.0;
          
          // Clamp to reasonable screen size
          gl_PointSize = clamp(pointSize, uMinSize, uMaxSize);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        varying vec3 vColor;
        
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          if (tex.a < 0.01) discard;
          gl_FragColor = vec4(vColor, 1.0) * tex;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    
    return { geometry, material, basePositions: storedPositions, baseSizes: storedSizes };
  }, [gs]);
  
  // Update sizes dynamically based on camera distance (for consistent visibility)
  useFrame(({ camera }) => {
    if (!pointsRef.current) return;
    
    const sizeAttr = pointsRef.current.geometry.getAttribute('size') as THREE.BufferAttribute;
    
    for (let i = 0; i < ALL_DWARFS.length; i++) {
      // Keep base size - the shader handles attenuation
      sizeAttr.setX(i, baseSizes[i]);
    }
    
    sizeAttr.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
};
