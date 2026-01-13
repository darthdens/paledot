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
const VIRGO_CLUSTERS: GalaxyCluster[] = [
  // === VIRGO CLUSTER COMPLEX (gravitational center) ===
  { name: 'Virgo Cluster', position: [53, 10, 12], galaxyCount: 2000, diameter: 15, type: 'rich' },
  { name: 'Virgo W Cloud', position: [58, 15, 8], galaxyCount: 150, diameter: 5, type: 'group' },
  { name: 'Virgo M Cloud', position: [48, 8, 18], galaxyCount: 120, diameter: 4, type: 'group' },
  { name: 'Virgo S Cloud', position: [52, 5, 20], galaxyCount: 100, diameter: 4, type: 'group' },
  
  // === FORNAX-ERIDANUS CLOUD ===
  { name: 'Fornax Cluster', position: [15, -45, 35], galaxyCount: 350, diameter: 8, type: 'rich' },
  { name: 'Eridanus Cluster', position: [-20, -55, 48], galaxyCount: 200, diameter: 6, type: 'poor' },
  { name: 'Dorado Group', position: [10, -38, 42], galaxyCount: 70, diameter: 4, type: 'group' },
  { name: 'NGC 1407 Group', position: [18, -50, 40], galaxyCount: 45, diameter: 3, type: 'group' },
  
  // === URSA MAJOR CLOUD ===
  { name: 'Ursa Major Cluster', position: [45, 35, -8], galaxyCount: 180, diameter: 6, type: 'poor' },
  { name: 'NGC 3992 Group', position: [48, 38, -5], galaxyCount: 40, diameter: 2.5, type: 'group' },
  { name: 'M109 Group', position: [50, 40, -3], galaxyCount: 50, diameter: 3, type: 'group' },
  
  // === CANES VENATICI CLOUD ===
  { name: 'Canes I Group', position: [40, 25, -15], galaxyCount: 80, diameter: 4, type: 'group' },
  { name: 'Canes II Group', position: [44, 28, -12], galaxyCount: 60, diameter: 3, type: 'group' },
  { name: 'M94 Group', position: [38, 22, -18], galaxyCount: 45, diameter: 2.5, type: 'group' },
  
  // === LEO CLOUD ===
  { name: 'Leo I Group', position: [28, 18, 8], galaxyCount: 80, diameter: 4, type: 'group' },
  { name: 'Leo II Groups', position: [52, -12, 35], galaxyCount: 120, diameter: 5, type: 'group' },
  { name: 'M96 Group', position: [30, 20, 5], galaxyCount: 65, diameter: 3.5, type: 'group' },
  { name: 'M66 Group', position: [26, 16, 10], galaxyCount: 50, diameter: 3, type: 'group' },
  
  // === NGC 5033/5055 REGION ===
  { name: 'NGC 5033 Group', position: [38, 22, 5], galaxyCount: 60, diameter: 3, type: 'group' },
  { name: 'NGC 5055 Group', position: [40, 24, 3], galaxyCount: 45, diameter: 2.5, type: 'group' },
  
  // === VIRGO III CLOUD ===
  { name: 'Virgo III Groups', position: [48, 8, 28], galaxyCount: 90, diameter: 4, type: 'group' },
  { name: 'NGC 4697 Group', position: [55, 15, 18], galaxyCount: 50, diameter: 3, type: 'group' },
  
  // === LOCAL GROUPS NEARBY ===
  { name: 'Local Group', position: [0, 0, 0], galaxyCount: 80, diameter: 3, type: 'group' },
  { name: 'Sculptor Group', position: [6, -8, 9], galaxyCount: 20, diameter: 2, type: 'group' },
  { name: 'Maffei Group', position: [8, 2, -5], galaxyCount: 15, diameter: 2, type: 'group' },
  { name: 'M81 Group', position: [12, 6, 3], galaxyCount: 35, diameter: 3, type: 'group' },
  { name: 'Centaurus A Group', position: [14, -8, 12], galaxyCount: 30, diameter: 3, type: 'group' },
  
  // === ADDITIONAL GROUPS ===
  { name: 'NGC 1023 Group', position: [-15, -12, 32], galaxyCount: 45, diameter: 3, type: 'group' },
  { name: 'NGC 2997 Group', position: [8, -28, 32], galaxyCount: 55, diameter: 3, type: 'group' },
  { name: 'Hydra Cloud', position: [30, -30, 20], galaxyCount: 60, diameter: 4, type: 'group' },
  { name: 'Antlia Cloud', position: [25, -35, 22], galaxyCount: 35, diameter: 2.5, type: 'group' },
  { name: 'Coma Berenices Cloud', position: [40, 30, 15], galaxyCount: 55, diameter: 3, type: 'group' },
];

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Generate filamentary connections between clusters
const generateFilaments = (clusters: GalaxyCluster[], maxDist: number) => {
  const filaments: { from: THREE.Vector3; to: THREE.Vector3; strength: number }[] = [];
  
  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const from = new THREE.Vector3(...clusters[i].position);
      const to = new THREE.Vector3(...clusters[j].position);
      const dist = from.distanceTo(to);
      
      if (dist < maxDist && dist > 3) {
        const strength = (1 - dist / maxDist) * 
          (clusters[i].type === 'rich' ? 1.5 : 1) * 
          (clusters[j].type === 'rich' ? 1.5 : 1);
        filaments.push({ from, to, strength });
      }
    }
  }
  
  return filaments;
};

export const VirgoSupercluster = ({ visualScale }: VirgoSuperclusterProps) => {
  const clusterPointsRef = useRef<THREE.Points>(null);
  const filamentPointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const currentScale = useCosmosStore(state => state.currentScale);
  
  const mlyScale = UNITS.KM_PER_MLY * visualScale;
  
  const isVisible = currentScale === 'virgoSupercluster' || currentScale === 'laniakea' || currentScale === 'universe';
  
  const { clusterGeometry, clusterMaterial, filamentGeometry, filamentMaterial } = useMemo(() => {
    // === CLUSTER GALAXIES ===
    const clusterPositions: number[] = [];
    const clusterColors: number[] = [];
    const clusterSizes: number[] = [];
    
    VIRGO_CLUSTERS.forEach((cluster, clusterIdx) => {
      const count = Math.min(cluster.galaxyCount * 0.5, 1000);
      const radius = cluster.diameter * 0.5;
      
      for (let i = 0; i < count; i++) {
        const seed = clusterIdx * 10000 + i;
        const u = seededRandom(seed);
        const v = seededRandom(seed + 10000);
        const w = seededRandom(seed + 20000);
        
        const r = Math.pow(u, 0.45) * radius;
        const theta = v * Math.PI * 2;
        const phi = Math.acos(2 * w - 1);
        
        const x = cluster.position[0] + r * Math.sin(phi) * Math.cos(theta);
        const y = cluster.position[1] + r * Math.cos(phi) * 0.6;
        const z = cluster.position[2] + r * Math.sin(phi) * Math.sin(theta);
        
        clusterPositions.push(x * mlyScale, y * mlyScale, z * mlyScale);
        
        // Color based on cluster type - warmer for rich clusters
        const baseHue = cluster.type === 'rich' ? 0.08 : cluster.type === 'poor' ? 0.15 : 0.55;
        const hue = baseHue + seededRandom(seed + 30000) * 0.08;
        const sat = cluster.type === 'rich' ? 0.6 : 0.4;
        const light = 0.5 + seededRandom(seed + 40000) * 0.25;
        
        const color = new THREE.Color().setHSL(hue, sat, light);
        clusterColors.push(color.r, color.g, color.b);
        
        const baseSize = cluster.type === 'rich' ? 1.8 : cluster.type === 'poor' ? 1.2 : 0.9;
        clusterSizes.push(baseSize * (0.5 + seededRandom(seed + 50000) * 0.5));
      }
    });
    
    const clusterGeo = new THREE.BufferGeometry();
    clusterGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(clusterPositions), 3));
    clusterGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(clusterColors), 3));
    clusterGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(clusterSizes), 1));
    clusterGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // === FILAMENTS CONNECTING CLUSTERS ===
    const filaments = generateFilaments(VIRGO_CLUSTERS, 25);
    const filamentPositions: number[] = [];
    const filamentColors: number[] = [];
    const filamentSizes: number[] = [];
    
    filaments.forEach((fil, fIdx) => {
      const filLength = fil.from.distanceTo(fil.to);
      const segmentCount = Math.floor(filLength * 3);
      const filWidth = 0.8 + fil.strength * 0.6;
      
      for (let s = 0; s <= segmentCount; s++) {
        const t = s / segmentCount;
        const seed = fIdx * 1000 + s;
        
        // Curved path
        const curveT = Math.sin(t * Math.PI);
        const curve = (seededRandom(seed) - 0.5) * filLength * 0.1 * curveT;
        
        const baseX = fil.from.x + (fil.to.x - fil.from.x) * t + curve;
        const baseY = fil.from.y + (fil.to.y - fil.from.y) * t;
        const baseZ = fil.from.z + (fil.to.z - fil.from.z) * t + curve * 0.5;
        
        // Multiple particles per segment
        const particlesPerSeg = 4 + Math.floor(fil.strength * 6);
        for (let p = 0; p < particlesPerSeg; p++) {
          const pseed = seed + p * 100;
          const scatter = filWidth * (seededRandom(pseed) - 0.5);
          
          filamentPositions.push(
            (baseX + scatter) * mlyScale,
            (baseY + scatter * 0.3) * mlyScale,
            (baseZ + scatter) * mlyScale
          );
          
          // Blue/purple filament colors
          const hue = 0.6 + seededRandom(pseed + 1) * 0.15;
          const light = 0.3 + fil.strength * 0.25;
          const color = new THREE.Color().setHSL(hue, 0.45, light);
          filamentColors.push(color.r, color.g, color.b);
          filamentSizes.push(0.4 + fil.strength * 0.4);
        }
      }
    });
    
    // Field galaxies distributed across the supercluster
    const fieldCount = 15000;
    for (let i = 0; i < fieldCount; i++) {
      const seed = i + 100000;
      const radius = 55 * Math.pow(seededRandom(seed), 0.5);
      const theta = seededRandom(seed + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.55;
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      filamentPositions.push(x * mlyScale, y * mlyScale, z * mlyScale);
      
      const hue = 0.55 + seededRandom(seed + 3) * 0.12;
      const color = new THREE.Color().setHSL(hue, 0.3, 0.35);
      filamentColors.push(color.r, color.g, color.b);
      filamentSizes.push(0.25 + seededRandom(seed + 4) * 0.2);
    }
    
    const filamentGeo = new THREE.BufferGeometry();
    filamentGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(filamentPositions), 3));
    filamentGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(filamentColors), 3));
    filamentGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(filamentSizes), 1));
    filamentGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // Shared texture
    const texSize = 64;
    const canvas = document.createElement('canvas');
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(texSize / 2, texSize / 2, 0, texSize / 2, texSize / 2, texSize / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.35)');
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
          gl_PointSize = clamp(pointSize, 1.0, 35.0);
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
      clusterGeometry: clusterGeo, 
      clusterMaterial: createMaterial(60000.0),
      filamentGeometry: filamentGeo,
      filamentMaterial: createMaterial(45000.0),
    };
  }, [mlyScale]);
  
  useFrame(() => {
    if (!isVisible) return;
    
    const distance = camera.position.length();
    const fadeIn = THREE.MathUtils.smoothstep(distance, mlyScale * 20, mlyScale * 60);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(distance, mlyScale * 400, mlyScale * 800);
    const opacity = Math.min(fadeIn, fadeOut);
    
    if (clusterPointsRef.current) {
      (clusterMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = opacity * 0.9;
    }
    if (filamentPointsRef.current) {
      (filamentMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = opacity * 0.7;
    }
  });
  
  if (!isVisible) return null;
  
  return (
    <group>
      <points ref={filamentPointsRef} geometry={filamentGeometry} material={filamentMaterial} frustumCulled={false} />
      <points ref={clusterPointsRef} geometry={clusterGeometry} material={clusterMaterial} frustumCulled={false} />
    </group>
  );
};
