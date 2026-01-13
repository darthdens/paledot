import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';

interface LocalGroupDwarfGalaxiesProps {
  visualScale: number;
}

// Galaxy positions must match existing galaxies in CosmosExplorer:
// Andromeda: [2.537e6 * 0.7, 2.537e6 * 0.15, 2.537e6 * 0.7] ly from Milky Way
// Triangulum: [-2.73e6 * 0.5, 2.73e6 * 0.1, 2.73e6 * 0.85] ly from Milky Way

const ANDROMEDA_POS = {
  x: 2.537e6 * 0.7,
  y: 2.537e6 * 0.15,
  z: 2.537e6 * 0.7,
};

const TRIANGULUM_POS = {
  x: -2.73e6 * 0.5,
  y: 2.73e6 * 0.1,
  z: 2.73e6 * 0.85,
};

interface DwarfGalaxyData {
  name: string;
  position: [number, number, number]; // position in light-years from Milky Way center
  type: 'irregular' | 'elliptical' | 'spheroidal';
  sizeLy: number;
  brightness: number;
}

// Real Local Group members with positions matching our coordinate system
// Milky Way satellites orbit around origin (0,0,0)
// Andromeda satellites orbit around ANDROMEDA_POS
const LOCAL_GROUP_GALAXIES: DwarfGalaxyData[] = [
  // ===== MILKY WAY SATELLITES (close to origin) =====
  // Large/Small Magellanic Clouds - closest and brightest
  { name: 'Large Magellanic Cloud', position: [-80000, -50000, 130000], type: 'irregular', sizeLy: 14000, brightness: 1.0 },
  { name: 'Small Magellanic Cloud', position: [-90000, -60000, 160000], type: 'irregular', sizeLy: 7000, brightness: 0.9 },
  
  // Sagittarius Dwarf - being absorbed by Milky Way
  { name: 'Sagittarius Dwarf', position: [15000, -10000, -70000], type: 'spheroidal', sizeLy: 10000, brightness: 0.6 },
  
  // Classical dwarf spheroidals - close satellites
  { name: 'Ursa Minor Dwarf', position: [30000, 190000, 60000], type: 'spheroidal', sizeLy: 2000, brightness: 0.5 },
  { name: 'Draco Dwarf', position: [40000, 230000, 100000], type: 'spheroidal', sizeLy: 2500, brightness: 0.5 },
  { name: 'Carina Dwarf', position: [-200000, -200000, 165000], type: 'spheroidal', sizeLy: 1600, brightness: 0.45 },
  { name: 'Sextans Dwarf', position: [-90000, 60000, 270000], type: 'spheroidal', sizeLy: 3000, brightness: 0.45 },
  { name: 'Sculptor Dwarf', position: [30000, -230000, 175000], type: 'spheroidal', sizeLy: 2000, brightness: 0.5 },
  { name: 'Fornax Dwarf', position: [90000, -320000, 320000], type: 'spheroidal', sizeLy: 6000, brightness: 0.55 },
  
  // Leo group - far from Milky Way plane
  { name: 'Leo I', position: [700000, 330000, 290000], type: 'spheroidal', sizeLy: 2000, brightness: 0.5 },
  { name: 'Leo II', position: [520000, 310000, 345000], type: 'spheroidal', sizeLy: 1500, brightness: 0.45 },
  
  // Ursa Major satellites
  { name: 'Ursa Major I', position: [100000, 280000, 140000], type: 'spheroidal', sizeLy: 800, brightness: 0.4 },
  { name: 'Ursa Major II', position: [35000, 80000, 50000], type: 'spheroidal', sizeLy: 500, brightness: 0.35 },
  { name: 'Boötes Dwarf', position: [50000, 150000, 120000], type: 'spheroidal', sizeLy: 700, brightness: 0.35 },
  
  // Canes Venatici
  { name: 'Canes Venatici I', position: [360000, 430000, 430000], type: 'spheroidal', sizeLy: 1500, brightness: 0.45 },
  { name: 'Canes Venatici II', position: [250000, 280000, 310000], type: 'spheroidal', sizeLy: 500, brightness: 0.35 },
  
  // ===== ANDROMEDA SATELLITES (offset from ANDROMEDA_POS) =====
  // M32 and M110 - bright elliptical companions
  { name: 'M32', position: [ANDROMEDA_POS.x - 20000, ANDROMEDA_POS.y - 5000, ANDROMEDA_POS.z + 15000], type: 'elliptical', sizeLy: 8000, brightness: 0.85 },
  { name: 'M110', position: [ANDROMEDA_POS.x + 40000, ANDROMEDA_POS.y + 15000, ANDROMEDA_POS.z - 30000], type: 'elliptical', sizeLy: 15000, brightness: 0.8 },
  
  // NGC ellipticals near Andromeda
  { name: 'NGC 185', position: [ANDROMEDA_POS.x - 200000, ANDROMEDA_POS.y + 50000, ANDROMEDA_POS.z - 100000], type: 'elliptical', sizeLy: 6000, brightness: 0.6 },
  { name: 'NGC 147', position: [ANDROMEDA_POS.x - 180000, ANDROMEDA_POS.y + 40000, ANDROMEDA_POS.z - 80000], type: 'elliptical', sizeLy: 6000, brightness: 0.55 },
  
  // Andromeda dwarf spheroidals
  { name: 'Andromeda I', position: [ANDROMEDA_POS.x - 40000, ANDROMEDA_POS.y - 10000, ANDROMEDA_POS.z + 50000], type: 'spheroidal', sizeLy: 2000, brightness: 0.4 },
  { name: 'Andromeda II', position: [ANDROMEDA_POS.x + 100000, ANDROMEDA_POS.y - 30000, ANDROMEDA_POS.z + 120000], type: 'spheroidal', sizeLy: 3500, brightness: 0.45 },
  { name: 'Andromeda III', position: [ANDROMEDA_POS.x + 80000, ANDROMEDA_POS.y - 25000, ANDROMEDA_POS.z + 100000], type: 'spheroidal', sizeLy: 1500, brightness: 0.4 },
  
  // IC 10 - starburst irregular near Andromeda
  { name: 'IC 10', position: [ANDROMEDA_POS.x - 350000, ANDROMEDA_POS.y + 100000, ANDROMEDA_POS.z - 200000], type: 'irregular', sizeLy: 5000, brightness: 0.7 },
  
  // ===== TRIANGULUM SATELLITES =====
  { name: 'LGS 3', position: [TRIANGULUM_POS.x + 80000, TRIANGULUM_POS.y - 20000, TRIANGULUM_POS.z + 50000], type: 'irregular', sizeLy: 1000, brightness: 0.4 },
  
  // ===== ISOLATED LOCAL GROUP MEMBERS =====
  // Between Milky Way and Andromeda/Triangulum
  { name: 'NGC 6822', position: [490000, -490000, 1470000], type: 'irregular', sizeLy: 7000, brightness: 0.65 },
  { name: 'IC 1613', position: [950000, -1430000, 1670000], type: 'irregular', sizeLy: 10000, brightness: 0.6 },
  
  // Southern isolated members
  { name: 'Phoenix Dwarf', position: [290000, -1220000, 720000], type: 'irregular', sizeLy: 1500, brightness: 0.45 },
  { name: 'Tucana Dwarf', position: [-850000, -2560000, 850000], type: 'spheroidal', sizeLy: 1000, brightness: 0.4 },
  { name: 'Cetus Dwarf', position: [250000, -1970000, 1480000], type: 'spheroidal', sizeLy: 1500, brightness: 0.4 },
  { name: 'WLM', position: [460000, -2280000, 1970000], type: 'irregular', sizeLy: 8000, brightness: 0.55 },
  
  // Aquarius/Pegasus region
  { name: 'Aquarius Dwarf', position: [1120000, -2080000, 2150000], type: 'irregular', sizeLy: 2000, brightness: 0.45 },
  { name: 'SagDIG', position: [1360000, -1870000, 2480000], type: 'irregular', sizeLy: 2500, brightness: 0.45 },
  { name: 'Pegasus Dwarf', position: [1800000, -1500000, 1860000], type: 'irregular', sizeLy: 4000, brightness: 0.5 },
  { name: 'Pisces Dwarf', position: [1380000, -1130000, 1760000], type: 'irregular', sizeLy: 1500, brightness: 0.45 },
  
  // ===== OUTER LOCAL GROUP (edge members ~4+ Mly) =====
  { name: 'Leo A', position: [1800000, 1410000, 1160000], type: 'irregular', sizeLy: 3000, brightness: 0.5 },
  { name: 'Sextans A', position: [-2580000, 3230000, 1290000], type: 'irregular', sizeLy: 5000, brightness: 0.5 },
  { name: 'Sextans B', position: [-2440000, 3550000, 1110000], type: 'irregular', sizeLy: 4000, brightness: 0.48 },
  { name: 'NGC 3109', position: [-3440000, 1720000, 1940000], type: 'irregular', sizeLy: 16000, brightness: 0.55 },
  { name: 'Antlia Dwarf', position: [-3020000, 1410000, 2220000], type: 'spheroidal', sizeLy: 2000, brightness: 0.4 },
];

// Seeded random for procedural variety
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Add procedural ultra-faint dwarfs to fill the Local Group
const generateProceduralDwarfs = (): DwarfGalaxyData[] => {
  const extras: DwarfGalaxyData[] = [];
  const count = 42; // Fill to ~85 total
  
  for (let i = 0; i < count; i++) {
    const seed = (i + 100) * 12345.6789;
    
    // Cluster more around Milky Way and Andromeda
    const clusterChoice = seededRandom(seed);
    let baseX = 0, baseY = 0, baseZ = 0;
    let maxDist = 800000;
    
    if (clusterChoice < 0.5) {
      // Near Milky Way
      maxDist = 600000;
    } else if (clusterChoice < 0.8) {
      // Near Andromeda
      baseX = ANDROMEDA_POS.x;
      baseY = ANDROMEDA_POS.y;
      baseZ = ANDROMEDA_POS.z;
      maxDist = 400000;
    } else {
      // Scattered in Local Group
      maxDist = 3000000;
    }
    
    // Random spherical offset
    const u = seededRandom(seed + 1);
    const v = seededRandom(seed + 2);
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const dist = 100000 + seededRandom(seed + 3) * maxDist;
    
    const x = baseX + dist * Math.sin(phi) * Math.cos(theta);
    const y = baseY + dist * Math.cos(phi) * 0.6; // Slight flattening
    const z = baseZ + dist * Math.sin(phi) * Math.sin(theta);
    
    const typeRand = seededRandom(seed + 4);
    const type: 'irregular' | 'elliptical' | 'spheroidal' = 
      typeRand < 0.25 ? 'irregular' : typeRand < 0.4 ? 'elliptical' : 'spheroidal';
    
    const sizeLy = 400 + seededRandom(seed + 5) * 3000;
    const brightness = 0.25 + seededRandom(seed + 6) * 0.35;
    
    extras.push({
      name: `UF Dwarf ${i + 1}`,
      position: [x, y, z],
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
  
  const { geometry, material, baseSizes } = useMemo(() => {
    const positions = new Float32Array(ALL_DWARFS.length * 3);
    const colors = new Float32Array(ALL_DWARFS.length * 3);
    const sizes = new Float32Array(ALL_DWARFS.length);
    const storedSizes: number[] = [];
    
    ALL_DWARFS.forEach((g, i) => {
      // Convert light-year positions to scene coordinates
      const x = g.position[0] * gs;
      const y = g.position[1] * gs;
      const z = g.position[2] * gs;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
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
    gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.85)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, texSize, texSize);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    // Shader with proper size attenuation for cosmic scales
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Size attenuation - proper perspective scaling
          float dist = -mvPosition.z;
          // Scale factor to make them visible at galactic distances
          float pointSize = size / dist * 800.0;
          
          // Clamp to reasonable screen pixels
          gl_PointSize = clamp(pointSize, 2.0, 80.0);
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
    
    return { geometry, material, baseSizes: storedSizes };
  }, [gs]);
  
  // Keep sizes updated for dynamic viewing
  useFrame(() => {
    if (!pointsRef.current) return;
    const sizeAttr = pointsRef.current.geometry.getAttribute('size') as THREE.BufferAttribute;
    for (let i = 0; i < ALL_DWARFS.length; i++) {
      sizeAttr.setX(i, baseSizes[i]);
    }
    sizeAttr.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
};
