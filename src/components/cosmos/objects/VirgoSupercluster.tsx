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
// Contains: Local Group, Virgo Cluster (center), Fornax Cluster, Eridanus Cluster, etc.
// Virgo Cluster is the gravitational center, ~55-65 Mly from Milky Way

interface GalaxyCluster {
  name: string;
  position: [number, number, number]; // in million light-years from Milky Way
  galaxyCount: number; // approximate number of galaxies
  diameter: number; // in Mly
  type: 'rich' | 'poor' | 'group';
}

// Galaxy clusters and groups in the Virgo Supercluster
// Positions approximate, based on research data
const VIRGO_CLUSTERS: GalaxyCluster[] = [
  // Virgo Cluster - center of supercluster, ~65 Mly away
  { name: 'Virgo Cluster', position: [53, 10, 12], galaxyCount: 2000, diameter: 15, type: 'rich' },
  
  // Fornax Cluster - south of Local Group, ~62 Mly
  { name: 'Fornax Cluster', position: [15, -45, 35], galaxyCount: 350, diameter: 8, type: 'rich' },
  
  // Eridanus Cluster - ~75 Mly
  { name: 'Eridanus Cluster', position: [-20, -55, 48], galaxyCount: 200, diameter: 6, type: 'poor' },
  
  // Canes Groups (Canes I, II) - ~50 Mly
  { name: 'Canes Groups', position: [40, 25, -15], galaxyCount: 150, diameter: 5, type: 'group' },
  
  // Leo I Group - ~35 Mly
  { name: 'Leo I Group', position: [28, 18, 8], galaxyCount: 80, diameter: 4, type: 'group' },
  
  // Ursa Major Groups - ~55 Mly
  { name: 'Ursa Major Cluster', position: [45, 35, -8], galaxyCount: 180, diameter: 6, type: 'poor' },
  
  // NGC 5033/5055 region
  { name: 'NGC 5033 Group', position: [38, 22, 5], galaxyCount: 60, diameter: 3, type: 'group' },
  
  // Leo II Groups - ~75 Mly
  { name: 'Leo II Groups', position: [52, -12, 35], galaxyCount: 120, diameter: 5, type: 'group' },
  
  // Virgo III Groups - ~60 Mly
  { name: 'Virgo III Groups', position: [48, 8, 28], galaxyCount: 90, diameter: 4, type: 'group' },
  
  // NGC 4697 Group
  { name: 'NGC 4697 Group', position: [55, 15, 18], galaxyCount: 50, diameter: 3, type: 'group' },
  
  // M101/M51 region - ~30 Mly
  { name: 'M101 Group', position: [22, 12, -8], galaxyCount: 40, diameter: 2, type: 'group' },
  
  // Sculptor Group - ~12 Mly
  { name: 'Sculptor Group', position: [6, -8, 9], galaxyCount: 20, diameter: 2, type: 'group' },
  
  // Maffei Group - ~12 Mly
  { name: 'Maffei Group', position: [8, 2, -5], galaxyCount: 15, diameter: 2, type: 'group' },
  
  // Dorado Group - ~55 Mly
  { name: 'Dorado Group', position: [10, -38, 42], galaxyCount: 70, diameter: 4, type: 'group' },
  
  // NGC 1023 Group - ~35 Mly
  { name: 'NGC 1023 Group', position: [-15, -12, 32], galaxyCount: 45, diameter: 3, type: 'group' },
  
  // NGC 2997 Group - ~40 Mly
  { name: 'NGC 2997 Group', position: [8, -28, 32], galaxyCount: 55, diameter: 3, type: 'group' },
  
  // IC 342/Maffei Group extension
  { name: 'IC 342 Group', position: [10, 4, -8], galaxyCount: 25, diameter: 2, type: 'group' },
  
  // NGC 6744 Group - ~30 Mly
  { name: 'NGC 6744 Group', position: [-25, -5, 18], galaxyCount: 30, diameter: 2, type: 'group' },
  
  // NGC 7582 Group - ~70 Mly
  { name: 'NGC 7582 Group', position: [-45, -8, 52], galaxyCount: 65, diameter: 4, type: 'group' },
];

// Seeded random for consistent procedural content
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Generate galaxy particles for a cluster
const generateClusterGalaxies = (cluster: GalaxyCluster, seed: number): Float32Array => {
  const count = Math.min(cluster.galaxyCount * 0.3, 600); // Limit particles per cluster
  const positions = new Float32Array(count * 3);
  const radius = cluster.diameter * 0.5;
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    // Concentrated toward center (King profile approximation)
    const u = seededRandom(seed + i);
    const v = seededRandom(seed + i + 10000);
    const w = seededRandom(seed + i + 20000);
    
    const r = Math.pow(u, 0.5) * radius; // Centrally concentrated
    const theta = v * Math.PI * 2;
    const phi = Math.acos(2 * w - 1);
    
    // Slightly flattened (ellipsoidal)
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
  
  // Scale: 1 Mly = UNITS.KM_PER_MLY * visualScale
  const mlyScale = UNITS.KM_PER_MLY * visualScale;
  
  // Only visible at Virgo Supercluster scale and beyond
  const isVisible = currentScale === 'virgoSupercluster' || currentScale === 'laniakea' || currentScale === 'universe';
  
  const { geometry, material } = useMemo(() => {
    // Generate all cluster galaxies
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
        
        // Color based on cluster type
        const baseHue = cluster.type === 'rich' ? 0.08 : cluster.type === 'poor' ? 0.12 : 0.58;
        const hue = baseHue + seededRandom(clusterIdx * 777 + i) * 0.05;
        const sat = 0.4 + seededRandom(clusterIdx * 888 + i) * 0.3;
        const light = 0.5 + seededRandom(clusterIdx * 999 + i) * 0.2;
        
        const color = new THREE.Color().setHSL(hue, sat, light);
        allColors.push(color.r, color.g, color.b);
        
        // Size based on cluster richness
        const baseSize = cluster.type === 'rich' ? 1.5 : cluster.type === 'poor' ? 1.0 : 0.7;
        allSizes.push(baseSize * (0.5 + seededRandom(clusterIdx * 555 + i) * 0.5));
      }
    });
    
    // Add field galaxies between clusters
    const fieldCount = 2000;
    for (let i = 0; i < fieldCount; i++) {
      const seed = i + 50000;
      // Distribute across the supercluster volume (~110 Mly diameter)
      const radius = 55 * Math.pow(seededRandom(seed), 0.6);
      const theta = seededRandom(seed + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.6; // Flattened
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      allPositions.push(x * mlyScale, y * mlyScale, z * mlyScale);
      
      // Dim blue-white for field galaxies
      const hue = 0.58 + seededRandom(seed + 3) * 0.08;
      const color = new THREE.Color().setHSL(hue, 0.3, 0.4);
      allColors.push(color.r, color.g, color.b);
      allSizes.push(0.3 + seededRandom(seed + 4) * 0.3);
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
  
  // Fade based on camera distance
  useFrame(() => {
    if (!pointsRef.current || !isVisible) return;
    
    const distance = camera.position.length();
    // Fade in at supercluster scale, fade out at universe scale
    const fadeIn = THREE.MathUtils.smoothstep(distance, mlyScale * 20, mlyScale * 60);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(distance, mlyScale * 400, mlyScale * 800);
    
    (material as THREE.ShaderMaterial).uniforms.uOpacity.value = Math.min(fadeIn, fadeOut) * 0.8;
  });
  
  if (!isVisible) return null;
  
  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
};