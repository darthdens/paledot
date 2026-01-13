import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';

interface VirgoSuperclusterProps {
  visualScale: number;
}

// Real astronomical data for Virgo Supercluster
// Reference: NASA/research - Virgo Supercluster is ~110 Mly diameter
// Contains ~100+ galaxy groups and clusters, ~2000+ galaxies total

interface GalaxyCluster {
  name: string;
  position: [number, number, number]; // in million light-years from Milky Way
  galaxyCount: number;
  diameter: number; // in Mly
  type: 'rich' | 'poor' | 'group';
}

// Comprehensive list of galaxy groups and clusters in the Virgo Supercluster
// Positions based on Tully et al. surveys and 2MASS redshift data
const VIRGO_CLUSTERS: GalaxyCluster[] = [
  // === VIRGO CLUSTER COMPLEX (gravitational center) ===
  { name: 'Virgo Cluster', position: [53, 10, 12], galaxyCount: 2000, diameter: 15, type: 'rich' },
  { name: 'Virgo W Cloud', position: [58, 15, 8], galaxyCount: 150, diameter: 5, type: 'group' },
  { name: 'Virgo M Cloud', position: [48, 8, 18], galaxyCount: 120, diameter: 4, type: 'group' },
  { name: 'Virgo S Cloud', position: [52, 5, 20], galaxyCount: 100, diameter: 4, type: 'group' },
  
  // === FORNAX-ERIDANUS CLOUD (southern region) ===
  { name: 'Fornax Cluster', position: [15, -45, 35], galaxyCount: 350, diameter: 8, type: 'rich' },
  { name: 'Eridanus Cluster', position: [-20, -55, 48], galaxyCount: 200, diameter: 6, type: 'poor' },
  { name: 'Dorado Group', position: [10, -38, 42], galaxyCount: 70, diameter: 4, type: 'group' },
  { name: 'NGC 1407 Group', position: [18, -50, 40], galaxyCount: 45, diameter: 3, type: 'group' },
  { name: 'NGC 1332 Group', position: [12, -48, 38], galaxyCount: 35, diameter: 2.5, type: 'group' },
  
  // === URSA MAJOR CLOUD ===
  { name: 'Ursa Major Cluster', position: [45, 35, -8], galaxyCount: 180, diameter: 6, type: 'poor' },
  { name: 'NGC 3992 Group', position: [48, 38, -5], galaxyCount: 40, diameter: 2.5, type: 'group' },
  { name: 'NGC 4051 Group', position: [42, 32, -10], galaxyCount: 35, diameter: 2, type: 'group' },
  { name: 'M109 Group', position: [50, 40, -3], galaxyCount: 50, diameter: 3, type: 'group' },
  
  // === CANES VENATICI CLOUD ===
  { name: 'Canes I Group', position: [40, 25, -15], galaxyCount: 80, diameter: 4, type: 'group' },
  { name: 'Canes II Group', position: [44, 28, -12], galaxyCount: 60, diameter: 3, type: 'group' },
  { name: 'M94 Group', position: [38, 22, -18], galaxyCount: 45, diameter: 2.5, type: 'group' },
  { name: 'M106 Group', position: [36, 20, -20], galaxyCount: 55, diameter: 3, type: 'group' },
  
  // === LEO CLOUD ===
  { name: 'Leo I Group', position: [28, 18, 8], galaxyCount: 80, diameter: 4, type: 'group' },
  { name: 'Leo II Groups', position: [52, -12, 35], galaxyCount: 120, diameter: 5, type: 'group' },
  { name: 'NGC 3379 Group', position: [32, 15, 12], galaxyCount: 40, diameter: 2.5, type: 'group' },
  { name: 'NGC 3607 Group', position: [35, 12, 15], galaxyCount: 35, diameter: 2, type: 'group' },
  { name: 'M96 Group', position: [30, 20, 5], galaxyCount: 65, diameter: 3.5, type: 'group' },
  { name: 'M66 Group', position: [26, 16, 10], galaxyCount: 50, diameter: 3, type: 'group' },
  
  // === NGC 5033/5055 REGION ===
  { name: 'NGC 5033 Group', position: [38, 22, 5], galaxyCount: 60, diameter: 3, type: 'group' },
  { name: 'NGC 5055 Group', position: [40, 24, 3], galaxyCount: 45, diameter: 2.5, type: 'group' },
  
  // === VIRGO III CLOUD ===
  { name: 'Virgo III Groups', position: [48, 8, 28], galaxyCount: 90, diameter: 4, type: 'group' },
  { name: 'NGC 4697 Group', position: [55, 15, 18], galaxyCount: 50, diameter: 3, type: 'group' },
  { name: 'NGC 5846 Group', position: [52, 12, 25], galaxyCount: 55, diameter: 3, type: 'group' },
  
  // === M101/COMA-SCULPTOR FILAMENT ===
  { name: 'M101 Group', position: [22, 12, -8], galaxyCount: 40, diameter: 2, type: 'group' },
  { name: 'M51 Group', position: [25, 8, -5], galaxyCount: 35, diameter: 2, type: 'group' },
  { name: 'NGC 5485 Group', position: [28, 10, -3], galaxyCount: 30, diameter: 2, type: 'group' },
  
  // === SCULPTOR CLOUD (nearby groups) ===
  { name: 'Sculptor Group', position: [6, -8, 9], galaxyCount: 20, diameter: 2, type: 'group' },
  { name: 'NGC 253 Group', position: [8, -10, 8], galaxyCount: 25, diameter: 2, type: 'group' },
  
  // === MAFFEI COMPLEX ===
  { name: 'Maffei Group', position: [8, 2, -5], galaxyCount: 15, diameter: 2, type: 'group' },
  { name: 'IC 342 Group', position: [10, 4, -8], galaxyCount: 25, diameter: 2, type: 'group' },
  
  // === M81/M82 COMPLEX ===
  { name: 'M81 Group', position: [12, 6, 3], galaxyCount: 35, diameter: 3, type: 'group' },
  { name: 'NGC 2403 Group', position: [10, 5, 5], galaxyCount: 20, diameter: 2, type: 'group' },
  
  // === CENTAURUS A/M83 REGION ===
  { name: 'Centaurus A Group', position: [14, -8, 12], galaxyCount: 30, diameter: 3, type: 'group' },
  { name: 'M83 Group', position: [16, -6, 10], galaxyCount: 25, diameter: 2.5, type: 'group' },
  
  // === NGC 1023 CLOUD ===
  { name: 'NGC 1023 Group', position: [-15, -12, 32], galaxyCount: 45, diameter: 3, type: 'group' },
  { name: 'NGC 891 Group', position: [-18, -8, 28], galaxyCount: 30, diameter: 2.5, type: 'group' },
  
  // === NGC 2997 CLOUD ===
  { name: 'NGC 2997 Group', position: [8, -28, 32], galaxyCount: 55, diameter: 3, type: 'group' },
  { name: 'NGC 3109 Group', position: [5, -25, 35], galaxyCount: 20, diameter: 2, type: 'group' },
  
  // === NGC 6744 REGION ===
  { name: 'NGC 6744 Group', position: [-25, -5, 18], galaxyCount: 30, diameter: 2, type: 'group' },
  { name: 'NGC 6769 Group', position: [-28, -8, 22], galaxyCount: 25, diameter: 2, type: 'group' },
  
  // === NGC 7582 REGION ===
  { name: 'NGC 7582 Group', position: [-45, -8, 52], galaxyCount: 65, diameter: 4, type: 'group' },
  { name: 'NGC 7552 Group', position: [-42, -5, 48], galaxyCount: 40, diameter: 3, type: 'group' },
  
  // === ADDITIONAL PERIPHERAL GROUPS ===
  { name: 'Pavo Group', position: [-35, 15, 45], galaxyCount: 35, diameter: 2.5, type: 'group' },
  { name: 'Telescopium Group', position: [-30, 20, 40], galaxyCount: 30, diameter: 2, type: 'group' },
  { name: 'NGC 5128 Cloud', position: [20, -12, 15], galaxyCount: 40, diameter: 3, type: 'group' },
  { name: 'NGC 4038 Group', position: [45, -5, 30], galaxyCount: 35, diameter: 2.5, type: 'group' },
  { name: 'Pegasus I Group', position: [-50, 5, 55], galaxyCount: 45, diameter: 3, type: 'group' },
  { name: 'Pegasus II Group', position: [-55, 8, 52], galaxyCount: 40, diameter: 2.5, type: 'group' },
  { name: 'NGC 7331 Group', position: [-48, 12, 48], galaxyCount: 30, diameter: 2, type: 'group' },
  { name: 'Grus Cloud', position: [-40, -20, 50], galaxyCount: 50, diameter: 3.5, type: 'group' },
  { name: 'Phoenix Cloud', position: [-35, -35, 45], galaxyCount: 35, diameter: 2.5, type: 'group' },
  { name: 'Coma Berenices Cloud', position: [40, 30, 15], galaxyCount: 55, diameter: 3, type: 'group' },
  { name: 'Crater Cloud', position: [35, -20, 25], galaxyCount: 40, diameter: 3, type: 'group' },
  { name: 'Corvus Cloud', position: [42, -18, 28], galaxyCount: 45, diameter: 3, type: 'group' },
  { name: 'Hydra Cloud', position: [30, -30, 20], galaxyCount: 60, diameter: 4, type: 'group' },
  { name: 'Antlia Cloud', position: [25, -35, 22], galaxyCount: 35, diameter: 2.5, type: 'group' },
  { name: 'Sextans Cloud', position: [22, -5, 28], galaxyCount: 30, diameter: 2, type: 'group' },
];

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

const generateClusterGalaxies = (cluster: GalaxyCluster, seed: number): Float32Array => {
  const count = Math.min(cluster.galaxyCount * 0.4, 800);
  const positions = new Float32Array(count * 3);
  const radius = cluster.diameter * 0.5;
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const u = seededRandom(seed + i);
    const v = seededRandom(seed + i + 10000);
    const w = seededRandom(seed + i + 20000);
    
    const r = Math.pow(u, 0.5) * radius;
    const theta = v * Math.PI * 2;
    const phi = Math.acos(2 * w - 1);
    
    positions[i3] = cluster.position[0] + r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = cluster.position[1] + r * Math.cos(phi) * 0.7;
    positions[i3 + 2] = cluster.position[2] + r * Math.sin(phi) * Math.sin(theta);
  }
  
  return positions;
};

export const VirgoSupercluster = ({ visualScale }: VirgoSuperclusterProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const currentScale = useCosmosStore(state => state.currentScale);
  
  const mlyScale = UNITS.KM_PER_MLY * visualScale;
  
  const isVisible = currentScale === 'virgoSupercluster' || currentScale === 'laniakea' || currentScale === 'universe';
  
  const { geometry, material } = useMemo(() => {
    const allPositions: number[] = [];
    const allColors: number[] = [];
    const allSizes: number[] = [];
    
    VIRGO_CLUSTERS.forEach((cluster, clusterIdx) => {
      const positions = generateClusterGalaxies(cluster, clusterIdx * 12345);
      const particleCount = positions.length / 3;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        allPositions.push(
          positions[i3] * mlyScale,
          positions[i3 + 1] * mlyScale,
          positions[i3 + 2] * mlyScale
        );
        
        const baseHue = cluster.type === 'rich' ? 0.08 : cluster.type === 'poor' ? 0.12 : 0.58;
        const hue = baseHue + seededRandom(clusterIdx * 777 + i) * 0.05;
        const sat = 0.4 + seededRandom(clusterIdx * 888 + i) * 0.3;
        const light = 0.5 + seededRandom(clusterIdx * 999 + i) * 0.2;
        
        const color = new THREE.Color().setHSL(hue, sat, light);
        allColors.push(color.r, color.g, color.b);
        
        const baseSize = cluster.type === 'rich' ? 1.5 : cluster.type === 'poor' ? 1.0 : 0.7;
        allSizes.push(baseSize * (0.5 + seededRandom(clusterIdx * 555 + i) * 0.5));
      }
    });
    
    // Dense field galaxies across the supercluster
    const fieldCount = 8000;
    for (let i = 0; i < fieldCount; i++) {
      const seed = i + 50000;
      const radius = 55 * Math.pow(seededRandom(seed), 0.55);
      const theta = seededRandom(seed + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.5;
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      allPositions.push(x * mlyScale, y * mlyScale, z * mlyScale);
      
      const hue = 0.55 + seededRandom(seed + 3) * 0.1;
      const color = new THREE.Color().setHSL(hue, 0.3, 0.4);
      allColors.push(color.r, color.g, color.b);
      allSizes.push(0.3 + seededRandom(seed + 4) * 0.3);
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
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
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
          float pointSize = size * 50000.0 / dist;
          gl_PointSize = clamp(pointSize, 1.5, 30.0);
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
    const fadeIn = THREE.MathUtils.smoothstep(distance, mlyScale * 20, mlyScale * 60);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(distance, mlyScale * 400, mlyScale * 800);
    
    (material as THREE.ShaderMaterial).uniforms.uOpacity.value = Math.min(fadeIn, fadeOut) * 0.85;
  });
  
  if (!isVisible) return null;
  
  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
};