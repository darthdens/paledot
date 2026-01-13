import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';

interface VirgoSuperclusterProps {
  visualScale: number;
}

// Virgo Supercluster: ~110 Mly diameter, ~100+ galaxy groups, ~2000+ galaxies
// We are near the edge, Virgo Cluster is the gravitational center

interface GalaxyCluster {
  name: string;
  position: [number, number, number];
  galaxyCount: number;
  diameter: number;
  type: 'rich' | 'poor' | 'group';
}

// Comprehensive catalog of Virgo Supercluster members
const VIRGO_CLUSTERS: GalaxyCluster[] = [
  // VIRGO CLUSTER COMPLEX
  { name: 'Virgo Cluster', position: [53, 10, 12], galaxyCount: 2000, diameter: 15, type: 'rich' },
  { name: 'Virgo W Cloud', position: [58, 15, 8], galaxyCount: 150, diameter: 5, type: 'group' },
  { name: 'Virgo M Cloud', position: [48, 8, 18], galaxyCount: 120, diameter: 4, type: 'group' },
  { name: 'Virgo S Cloud', position: [52, 5, 20], galaxyCount: 100, diameter: 4, type: 'group' },
  { name: 'Virgo E Cloud', position: [56, 12, 15], galaxyCount: 80, diameter: 3, type: 'group' },
  
  // FORNAX-ERIDANUS
  { name: 'Fornax Cluster', position: [15, -45, 35], galaxyCount: 350, diameter: 8, type: 'rich' },
  { name: 'Eridanus Cluster', position: [-20, -55, 48], galaxyCount: 200, diameter: 6, type: 'poor' },
  { name: 'Dorado Group', position: [10, -38, 42], galaxyCount: 70, diameter: 4, type: 'group' },
  { name: 'NGC 1407 Group', position: [18, -50, 40], galaxyCount: 45, diameter: 3, type: 'group' },
  
  // URSA MAJOR
  { name: 'Ursa Major Cluster', position: [45, 35, -8], galaxyCount: 180, diameter: 6, type: 'poor' },
  { name: 'NGC 3992 Group', position: [48, 38, -5], galaxyCount: 40, diameter: 2.5, type: 'group' },
  { name: 'M109 Group', position: [50, 40, -3], galaxyCount: 50, diameter: 3, type: 'group' },
  
  // CANES VENATICI
  { name: 'Canes I Group', position: [40, 25, -15], galaxyCount: 80, diameter: 4, type: 'group' },
  { name: 'Canes II Group', position: [44, 28, -12], galaxyCount: 60, diameter: 3, type: 'group' },
  { name: 'M94 Group', position: [38, 22, -18], galaxyCount: 45, diameter: 2.5, type: 'group' },
  { name: 'M106 Group', position: [36, 20, -20], galaxyCount: 55, diameter: 3, type: 'group' },
  
  // LEO CLOUD
  { name: 'Leo I Group', position: [28, 18, 8], galaxyCount: 80, diameter: 4, type: 'group' },
  { name: 'Leo II Groups', position: [52, -12, 35], galaxyCount: 120, diameter: 5, type: 'group' },
  { name: 'NGC 3379 Group', position: [32, 15, 12], galaxyCount: 40, diameter: 2.5, type: 'group' },
  { name: 'M96 Group', position: [30, 20, 5], galaxyCount: 65, diameter: 3.5, type: 'group' },
  { name: 'M66 Group', position: [26, 16, 10], galaxyCount: 50, diameter: 3, type: 'group' },
  
  // NGC 5033/5055
  { name: 'NGC 5033 Group', position: [38, 22, 5], galaxyCount: 60, diameter: 3, type: 'group' },
  { name: 'NGC 5055 Group', position: [40, 24, 3], galaxyCount: 45, diameter: 2.5, type: 'group' },
  
  // VIRGO III
  { name: 'Virgo III Groups', position: [48, 8, 28], galaxyCount: 90, diameter: 4, type: 'group' },
  { name: 'NGC 4697 Group', position: [55, 15, 18], galaxyCount: 50, diameter: 3, type: 'group' },
  { name: 'NGC 5846 Group', position: [52, 12, 25], galaxyCount: 55, diameter: 3, type: 'group' },
  
  // NEARBY GROUPS
  { name: 'Sculptor Group', position: [6, -8, 9], galaxyCount: 20, diameter: 2, type: 'group' },
  { name: 'Maffei Group', position: [8, 2, -5], galaxyCount: 15, diameter: 2, type: 'group' },
  { name: 'IC 342 Group', position: [10, 4, -8], galaxyCount: 25, diameter: 2, type: 'group' },
  { name: 'M81 Group', position: [12, 6, 3], galaxyCount: 35, diameter: 3, type: 'group' },
  { name: 'Centaurus A Group', position: [14, -8, 12], galaxyCount: 30, diameter: 3, type: 'group' },
  { name: 'M83 Group', position: [16, -6, 10], galaxyCount: 25, diameter: 2.5, type: 'group' },
  { name: 'M101 Group', position: [22, 12, -8], galaxyCount: 40, diameter: 2, type: 'group' },
  { name: 'M51 Group', position: [25, 8, -5], galaxyCount: 35, diameter: 2, type: 'group' },
  
  // ADDITIONAL GROUPS
  { name: 'NGC 1023 Group', position: [-15, -12, 32], galaxyCount: 45, diameter: 3, type: 'group' },
  { name: 'NGC 891 Group', position: [-18, -8, 28], galaxyCount: 30, diameter: 2.5, type: 'group' },
  { name: 'NGC 2997 Group', position: [8, -28, 32], galaxyCount: 55, diameter: 3, type: 'group' },
  { name: 'NGC 6744 Group', position: [-25, -5, 18], galaxyCount: 30, diameter: 2, type: 'group' },
  { name: 'NGC 7582 Group', position: [-45, -8, 52], galaxyCount: 65, diameter: 4, type: 'group' },
  { name: 'Pavo Group', position: [-35, 15, 45], galaxyCount: 35, diameter: 2.5, type: 'group' },
  { name: 'Grus Cloud', position: [-40, -20, 50], galaxyCount: 50, diameter: 3.5, type: 'group' },
  { name: 'Hydra Cloud', position: [30, -30, 20], galaxyCount: 60, diameter: 4, type: 'group' },
  { name: 'Antlia Cloud', position: [25, -35, 22], galaxyCount: 35, diameter: 2.5, type: 'group' },
  { name: 'Crater Cloud', position: [35, -20, 25], galaxyCount: 40, diameter: 3, type: 'group' },
  { name: 'Corvus Cloud', position: [42, -18, 28], galaxyCount: 45, diameter: 3, type: 'group' },
  { name: 'Coma Berenices', position: [40, 30, 15], galaxyCount: 55, diameter: 3, type: 'group' },
  { name: 'Pegasus I', position: [-50, 5, 55], galaxyCount: 45, diameter: 3, type: 'group' },
  { name: 'Pegasus II', position: [-55, 8, 52], galaxyCount: 40, diameter: 2.5, type: 'group' },
  { name: 'Phoenix Cloud', position: [-35, -35, 45], galaxyCount: 35, diameter: 2.5, type: 'group' },
];

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

const generateClusterGalaxies = (cluster: GalaxyCluster, seed: number): Float32Array => {
  const count = Math.min(cluster.galaxyCount * 0.5, 1000);
  const positions = new Float32Array(count * 3);
  const radius = cluster.diameter * 0.5;
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const u = seededRandom(seed + i);
    const v = seededRandom(seed + i + 10000);
    const w = seededRandom(seed + i + 20000);
    
    const r = Math.pow(u, 0.45) * radius;
    const theta = v * Math.PI * 2;
    const phi = Math.acos(2 * w - 1);
    
    positions[i3] = cluster.position[0] + r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = cluster.position[1] + r * Math.cos(phi) * 0.65;
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
    
    // Generate cluster galaxies
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
        
        const baseHue = cluster.type === 'rich' ? 0.08 : cluster.type === 'poor' ? 0.12 : 0.55;
        const hue = baseHue + seededRandom(clusterIdx * 777 + i) * 0.06;
        const sat = 0.45 + seededRandom(clusterIdx * 888 + i) * 0.35;
        const light = 0.5 + seededRandom(clusterIdx * 999 + i) * 0.25;
        
        const color = new THREE.Color().setHSL(hue, sat, light);
        allColors.push(color.r, color.g, color.b);
        
        const baseSize = cluster.type === 'rich' ? 1.8 : cluster.type === 'poor' ? 1.2 : 0.8;
        allSizes.push(baseSize * (0.4 + seededRandom(clusterIdx * 555 + i) * 0.6));
      }
    });
    
    // Dense field galaxies - fill the supercluster volume
    const fieldCount = 25000;
    for (let i = 0; i < fieldCount; i++) {
      const seed = i + 50000;
      // Distributed across 55 Mly radius
      const radius = 55 * Math.pow(seededRandom(seed), 0.5);
      const theta = seededRandom(seed + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.45;
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      allPositions.push(x * mlyScale, y * mlyScale, z * mlyScale);
      
      const hue = 0.52 + seededRandom(seed + 3) * 0.15;
      const color = new THREE.Color().setHSL(hue, 0.35, 0.4 + seededRandom(seed + 4) * 0.15);
      allColors.push(color.r, color.g, color.b);
      allSizes.push(0.25 + seededRandom(seed + 5) * 0.35);
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
          float pointSize = size * 60000.0 / dist;
          gl_PointSize = clamp(pointSize, 1.2, 35.0);
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
    const fadeIn = THREE.MathUtils.smoothstep(distance, mlyScale * 15, mlyScale * 50);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(distance, mlyScale * 500, mlyScale * 1000);
    
    (material as THREE.ShaderMaterial).uniforms.uOpacity.value = Math.min(fadeIn, fadeOut) * 0.9;
  });
  
  if (!isVisible) return null;
  
  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
};