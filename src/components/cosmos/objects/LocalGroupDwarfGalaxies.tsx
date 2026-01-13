import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';

interface LocalGroupDwarfGalaxiesProps {
  visualScale: number;
}

// Dwarf galaxy types for visual variety
type DwarfType = 'irregular' | 'elliptical' | 'spheroidal';

interface DwarfGalaxy {
  position: [number, number, number];
  size: number; // in light-years
  type: DwarfType;
  color: THREE.Color;
  brightness: number;
  seed: number;
}

// Generate ~80 realistic Local Group dwarf galaxies
// Real Local Group spans roughly 10 million light-years
// Most dwarfs are 1,000 - 10,000 light-years across
const generateDwarfGalaxies = (gs: number): DwarfGalaxy[] => {
  const galaxies: DwarfGalaxy[] = [];
  const count = 82; // Match real Local Group count
  
  // Seeded random for consistency
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  };
  
  // Local Group rough bounds in light-years
  const localGroupRadius = 5e6; // 5 million light-years
  
  // Colors for different dwarf types
  const irregularColors = [
    new THREE.Color('#8ecae6'), // Blue (active star formation)
    new THREE.Color('#a0d2db'),
    new THREE.Color('#bee3db'),
  ];
  
  const ellipticalColors = [
    new THREE.Color('#ffd6a5'), // Yellow/orange (older stars)
    new THREE.Color('#ffb88c'),
    new THREE.Color('#f9c74f'),
  ];
  
  const spheroidalColors = [
    new THREE.Color('#e6ccb2'), // Pale (very old, little gas)
    new THREE.Color('#ddb892'),
    new THREE.Color('#b08968'),
  ];
  
  for (let i = 0; i < count; i++) {
    const seed = i * 12345.6789;
    
    // Distribute in a rough sphere with clustering toward center
    const u = seededRandom(seed);
    const v = seededRandom(seed + 1);
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    
    // Use exponential falloff for realistic clustering
    const radialU = seededRandom(seed + 2);
    const distance = localGroupRadius * Math.pow(radialU, 0.4) * 0.9; // Most within 4.5Mly
    
    // Add some vertical flattening (Local Group is slightly flattened)
    const flattenFactor = 0.7;
    
    const x = distance * Math.sin(phi) * Math.cos(theta);
    const y = distance * Math.cos(phi) * flattenFactor;
    const z = distance * Math.sin(phi) * Math.sin(theta);
    
    // Avoid placing galaxies too close to major galaxies
    // (Milky Way at origin, Andromeda at ~2.5Mly, Triangulum at ~2.7Mly)
    const distFromOrigin = Math.sqrt(x * x + y * y + z * z);
    if (distFromOrigin < 50000) continue; // Skip if too close to Milky Way core
    
    // Size: most dwarfs are 1,000-10,000 ly, some up to 30,000 ly
    const sizeRand = seededRandom(seed + 3);
    const size = 1000 + Math.pow(sizeRand, 2) * 29000; // Bias toward smaller
    
    // Type distribution: 40% irregular, 25% elliptical, 35% spheroidal
    const typeRand = seededRandom(seed + 4);
    let type: DwarfType;
    let colors: THREE.Color[];
    
    if (typeRand < 0.4) {
      type = 'irregular';
      colors = irregularColors;
    } else if (typeRand < 0.65) {
      type = 'elliptical';
      colors = ellipticalColors;
    } else {
      type = 'spheroidal';
      colors = spheroidalColors;
    }
    
    const colorIndex = Math.floor(seededRandom(seed + 5) * colors.length);
    const color = colors[colorIndex].clone();
    
    // Slight color variation
    color.r += (seededRandom(seed + 6) - 0.5) * 0.1;
    color.g += (seededRandom(seed + 7) - 0.5) * 0.1;
    color.b += (seededRandom(seed + 8) - 0.5) * 0.1;
    
    // Brightness varies with size and type
    const brightness = 0.3 + seededRandom(seed + 9) * 0.7;
    
    galaxies.push({
      position: [x * gs, y * gs, z * gs],
      size: size * gs,
      type,
      color,
      brightness,
      seed,
    });
  }
  
  return galaxies;
};

// Single instanced mesh for all dwarf galaxies (maximum performance)
export const LocalGroupDwarfGalaxies = ({ visualScale }: LocalGroupDwarfGalaxiesProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const matrixRef = useRef(new THREE.Matrix4());
  const vec3Ref = useRef(new THREE.Vector3());
  
  const gs = UNITS.KM_PER_LY * visualScale;
  
  const galaxies = useMemo(() => generateDwarfGalaxies(gs), [gs]);
  
  // Create instanced attributes
  const { geometry, colors, count } = useMemo(() => {
    const count = galaxies.length;
    
    // Simple sprite geometry - just a plane
    const geo = new THREE.PlaneGeometry(1, 1);
    
    // Instance colors
    const colorArray = new Float32Array(count * 3);
    
    galaxies.forEach((g, i) => {
      colorArray[i * 3] = g.color.r * g.brightness;
      colorArray[i * 3 + 1] = g.color.g * g.brightness;
      colorArray[i * 3 + 2] = g.color.b * g.brightness;
    });
    
    return { geometry: geo, colors: colorArray, count };
  }, [galaxies]);
  
  // Create sprite texture for dwarf galaxies
  const texture = useMemo(() => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Radial gradient for soft galaxy appearance
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);
  
  // Set up instance matrices on mount
  useEffect(() => {
    if (!meshRef.current) return;
    
    const mesh = meshRef.current;
    const matrix = new THREE.Matrix4();
    
    galaxies.forEach((g, i) => {
      // Position
      matrix.makeTranslation(g.position[0], g.position[1], g.position[2]);
      
      // Scale based on size and type
      let scale = g.size * 2;
      if (g.type === 'irregular') scale *= 1.2;
      if (g.type === 'spheroidal') scale *= 0.8;
      
      const scaleMatrix = new THREE.Matrix4().makeScale(scale, scale, scale);
      matrix.multiply(scaleMatrix);
      
      mesh.setMatrixAt(i, matrix);
    });
    
    mesh.instanceMatrix.needsUpdate = true;
    
    // Also set instance colors here
    mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
  }, [galaxies, colors]);
  
  // Billboard - make sprites face camera (throttled for performance)
  const frameCount = useRef(0);
  useFrame(() => {
    if (!meshRef.current) return;
    
    // Only update every 3 frames for performance
    frameCount.current++;
    if (frameCount.current % 3 !== 0) return;
    
    const mesh = meshRef.current;
    const matrix = matrixRef.current;
    const position = vec3Ref.current;
    
    // Get camera rotation for billboarding
    const camQuat = camera.quaternion;
    
    galaxies.forEach((g, i) => {
      mesh.getMatrixAt(i, matrix);
      position.setFromMatrixPosition(matrix);
      
      // Reset matrix with billboarding
      matrix.makeRotationFromQuaternion(camQuat);
      
      // Scale
      let scale = g.size * 2;
      if (g.type === 'irregular') scale *= 1.2;
      if (g.type === 'spheroidal') scale *= 0.8;
      
      matrix.scale(new THREE.Vector3(scale, scale, scale));
      matrix.setPosition(position);
      
      mesh.setMatrixAt(i, matrix);
    });
    
    mesh.instanceMatrix.needsUpdate = true;
  });
  
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, count]}
      frustumCulled={false}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
      />
    </instancedMesh>
  );
};
