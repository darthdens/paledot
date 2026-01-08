import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';

interface MilkyWayGalaxyProps {
  visualScale: number;
  showYouAreHere?: boolean;
}

// Milky Way parameters based on current astronomical data
const MILKY_WAY = {
  diskRadius: 52500,           // ~105,000 ly diameter
  bulgeRadius: 10000,          // Central bulge
  barLength: 27000,            // Central bar length
  barWidth: 4500,
  sunDistance: 26000,          // Sun's distance from center
  sunAngle: Math.PI * 0.72,    // Position in Orion-Cygnus arm
  
  // 4 major spiral arms - starting from bar ends
  arms: [
    { name: 'Perseus', startAngle: 0.45, hue: 0.58 },
    { name: 'Sagittarius-Carina', startAngle: Math.PI / 2 + 0.45, hue: 0.56 },
    { name: 'Scutum-Centaurus', startAngle: Math.PI + 0.45, hue: 0.60 },
    { name: 'Norma-Outer', startAngle: 1.5 * Math.PI + 0.45, hue: 0.54 },
  ],
};

// Create circular star texture procedurally
const createStarTexture = () => {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  // Radial gradient for soft circular glow
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  return new THREE.CanvasTexture(canvas);
};

// Create soft gas/nebula texture
const createGasTexture = () => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  // Very soft, diffuse gradient
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  return new THREE.CanvasTexture(canvas);
};

export const MilkyWayGalaxy = ({ visualScale, showYouAreHere = true }: MilkyWayGalaxyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  
  const gs = UNITS.KM_PER_LY * visualScale; // galaxy scale
  
  // Offset galaxy so Sun (at origin) is at correct position
  const galaxyOffset = useMemo(() => new THREE.Vector3(
    -Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs,
    0,
    -Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs
  ), [gs]);
  
  // Create textures once
  const starTexture = useMemo(() => createStarTexture(), []);
  const gasTexture = useMemo(() => createGasTexture(), []);
  
  // Generate detailed galaxy particle systems
  const { bulgeGeo, barGeo, diskGeo, armCoreGeo, dustGeo, nebulaGeo, gasCloudGeo, starClusterGeo, haloGeo } = useMemo(() => {
    const color = new THREE.Color();
    
    // === CENTRAL BULGE (warm golden/orange core - spheroidal) ===
    const bulgeCount = 50000;
    const bulgePos = new Float32Array(bulgeCount * 3);
    const bulgeCol = new Float32Array(bulgeCount * 3);
    
    for (let i = 0; i < bulgeCount; i++) {
      const i3 = i * 3;
      
      // Spheroidal bulge with concentration toward center
      const r = Math.pow(Math.random(), 0.7) * MILKY_WAY.bulgeRadius * gs * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Flattened spheroid
      bulgePos[i3] = r * Math.sin(phi) * Math.cos(theta);
      bulgePos[i3 + 1] = r * Math.cos(phi) * 0.4; // Flatten vertically
      bulgePos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      
      // Golden/orange colors - brighter toward center
      const dist = r / (MILKY_WAY.bulgeRadius * gs * 0.8);
      const brightness = 0.7 + (1 - dist) * 0.25;
      color.setHSL(
        0.08 + dist * 0.04,           // Orange → yellow outward
        0.85 - dist * 0.3,             // More saturated at center
        brightness
      );
      bulgeCol[i3] = color.r;
      bulgeCol[i3 + 1] = color.g;
      bulgeCol[i3 + 2] = color.b;
    }
    
    // === CENTRAL BAR (bright golden bar structure) ===
    const barCount = 35000;
    const barPos = new Float32Array(barCount * 3);
    const barCol = new Float32Array(barCount * 3);
    const barAngle = 0.45; // Bar tilted ~25 degrees to line of sight
    
    for (let i = 0; i < barCount; i++) {
      const i3 = i * 3;
      
      // Bar with tapered ends
      const alongBar = (Math.random() - 0.5) * 2; // -1 to 1
      const barLen = MILKY_WAY.barLength * gs * 0.5;
      const barW = MILKY_WAY.barWidth * gs;
      
      // Gaussian profile for bar width
      const widthFactor = Math.exp(-alongBar * alongBar * 2);
      const perpOffset = (Math.random() - 0.5) * barW * widthFactor;
      
      const x = alongBar * barLen;
      const z = perpOffset;
      
      // Rotate by bar angle
      barPos[i3] = x * Math.cos(barAngle) - z * Math.sin(barAngle);
      barPos[i3 + 1] = (Math.random() - 0.5) * 300 * gs * widthFactor;
      barPos[i3 + 2] = x * Math.sin(barAngle) + z * Math.cos(barAngle);
      
      // Golden bar colors
      const dist = Math.abs(alongBar);
      color.setHSL(
        0.10 + dist * 0.02,
        0.75 - dist * 0.2,
        0.75 + Math.random() * 0.15
      );
      barCol[i3] = color.r;
      barCol[i3 + 1] = color.g;
      barCol[i3 + 2] = color.b;
    }
    
    // === SPIRAL ARMS (blue-white stars with structure) ===
    const diskCount = 150000;
    const diskPos = new Float32Array(diskCount * 3);
    const diskCol = new Float32Array(diskCount * 3);
    
    for (let i = 0; i < diskCount; i++) {
      const i3 = i * 3;
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      // Radial position - exponential disk profile
      const t = Math.pow(Math.random(), 0.45);
      const minR = 6000; // Arms start after bar
      const r = (minR + t * (MILKY_WAY.diskRadius - minR)) * gs;
      
      // Tighter logarithmic spiral
      const winding = 0.22; // Tighter winding
      const spiralAngle = arm.startAngle + Math.log(r / (minR * gs) + 0.1) / winding;
      
      // Arm width - narrower for more defined structure
      const armWidth = (1800 + t * 1500) * gs;
      const spreadGaussian = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const spread = spreadGaussian * armWidth;
      
      // Inter-arm population (dimmer)
      const interArm = Math.random() < 0.25;
      const extraSpread = interArm ? (Math.random() - 0.5) * armWidth * 3 : 0;
      
      const finalAngle = spiralAngle + (spread + extraSpread) / (r + 1);
      
      diskPos[i3] = Math.cos(finalAngle) * r;
      diskPos[i3 + 1] = (Math.random() - 0.5) * 200 * gs * Math.exp(-t * 1.5);
      diskPos[i3 + 2] = Math.sin(finalAngle) * r;
      
      // Color gradient - bluer in arms, whiter between
      if (interArm) {
        // Dimmer inter-arm stars
        color.setHSL(0.12, 0.1, 0.55 + Math.random() * 0.15);
      } else {
        // Brighter arm stars with blue tint
        const inCore = Math.abs(spreadGaussian) < 0.4;
        if (inCore) {
          color.setHSL(0.58 + Math.random() * 0.05, 0.6 + Math.random() * 0.2, 0.75 + Math.random() * 0.2);
        } else {
          color.setHSL(0.15 + Math.random() * 0.1, 0.2, 0.7 + Math.random() * 0.2);
        }
      }
      diskCol[i3] = color.r;
      diskCol[i3 + 1] = color.g;
      diskCol[i3 + 2] = color.b;
    }
    
    // === ARM CORES (bright blue-white star forming regions) ===
    const armCoreCount = 30000;
    const armCorePos = new Float32Array(armCoreCount * 3);
    const armCoreCol = new Float32Array(armCoreCount * 3);
    
    for (let i = 0; i < armCoreCount; i++) {
      const i3 = i * 3;
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      const t = Math.pow(Math.random(), 0.5);
      const minR = 8000;
      const r = (minR + t * 35000) * gs;
      
      const winding = 0.22;
      const spiralAngle = arm.startAngle + Math.log(r / (6000 * gs) + 0.1) / winding;
      
      // Very tight to arm core
      const spread = (Math.random() - 0.5) * 800 * gs;
      
      armCorePos[i3] = Math.cos(spiralAngle + spread / r) * r;
      armCorePos[i3 + 1] = (Math.random() - 0.5) * 80 * gs;
      armCorePos[i3 + 2] = Math.sin(spiralAngle + spread / r) * r;
      
      // Bright blue-white
      color.setHSL(0.6 + Math.random() * 0.05, 0.7, 0.85 + Math.random() * 0.1);
      armCoreCol[i3] = color.r;
      armCoreCol[i3 + 1] = color.g;
      armCoreCol[i3 + 2] = color.b;
    }
    
    // === DUST LANES (dark bands on inner edge of arms) ===
    const dustCount = 25000;
    const dustPos = new Float32Array(dustCount * 3);
    const dustCol = new Float32Array(dustCount * 3);
    
    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      const t = Math.pow(Math.random(), 0.45);
      const r = (7000 + t * 38000) * gs;
      
      const winding = 0.22;
      const spiralAngle = arm.startAngle + Math.log(r / (6000 * gs) + 0.1) / winding;
      const laneOffset = -0.06; // Inner edge of arm
      
      const spread = (Math.random() - 0.5) * 600 * gs;
      const finalAngle = spiralAngle + laneOffset + spread / (r + 1);
      
      dustPos[i3] = Math.cos(finalAngle) * r;
      dustPos[i3 + 1] = (Math.random() - 0.5) * 50 * gs;
      dustPos[i3 + 2] = Math.sin(finalAngle) * r;
      
      // Dark reddish-brown dust
      color.setHSL(0.02 + Math.random() * 0.03, 0.7, 0.08 + Math.random() * 0.05);
      dustCol[i3] = color.r;
      dustCol[i3 + 1] = color.g;
      dustCol[i3 + 2] = color.b;
    }
    
    // === NEBULAE / HII REGIONS (pink/red emission in arms) ===
    const nebulaCount = 40000;
    const nebulaPos = new Float32Array(nebulaCount * 3);
    const nebulaCol = new Float32Array(nebulaCount * 3);
    
    for (let i = 0; i < nebulaCount; i++) {
      const i3 = i * 3;
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      const t = 0.05 + Math.random() * 0.85;
      const r = (7000 + t * 40000) * gs;
      
      const winding = 0.22;
      const spiralAngle = arm.startAngle + Math.log(r / (6000 * gs) + 0.1) / winding;
      const spread = (Math.random() - 0.5) * 1500 * gs;
      
      nebulaPos[i3] = Math.cos(spiralAngle + spread / r) * r;
      nebulaPos[i3 + 1] = (Math.random() - 0.5) * 120 * gs;
      nebulaPos[i3 + 2] = Math.sin(spiralAngle + spread / r) * r;
      
      // Pink/magenta HII regions with more variety
      const rand = Math.random();
      if (rand < 0.6) {
        color.setHSL(0.92 + Math.random() * 0.08, 0.75 + Math.random() * 0.2, 0.5 + Math.random() * 0.25);
      } else if (rand < 0.85) {
        // Blue reflection nebulae
        color.setHSL(0.58 + Math.random() * 0.05, 0.65, 0.55 + Math.random() * 0.2);
      } else {
        // Cyan/teal emission
        color.setHSL(0.5 + Math.random() * 0.05, 0.7, 0.5 + Math.random() * 0.2);
      }
      nebulaCol[i3] = color.r;
      nebulaCol[i3 + 1] = color.g;
      nebulaCol[i3 + 2] = color.b;
    }
    
    // === GAS CLOUDS (diffuse hydrogen gas along arms) ===
    const gasCloudCount = 50000;
    const gasCloudPos = new Float32Array(gasCloudCount * 3);
    const gasCloudCol = new Float32Array(gasCloudCount * 3);
    
    for (let i = 0; i < gasCloudCount; i++) {
      const i3 = i * 3;
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      const t = Math.pow(Math.random(), 0.5);
      const r = (6000 + t * 45000) * gs;
      
      const winding = 0.22;
      const spiralAngle = arm.startAngle + Math.log(r / (6000 * gs) + 0.1) / winding;
      
      // Wider spread for diffuse gas
      const spread = (Math.random() - 0.5) * 2500 * gs;
      const finalAngle = spiralAngle + spread / (r + 1);
      
      gasCloudPos[i3] = Math.cos(finalAngle) * r;
      gasCloudPos[i3 + 1] = (Math.random() - 0.5) * 180 * gs;
      gasCloudPos[i3 + 2] = Math.sin(finalAngle) * r;
      
      // Mix of colors for gas - purple, blue, and subtle pink
      const rand = Math.random();
      if (rand < 0.4) {
        // Purple/violet gas
        color.setHSL(0.75 + Math.random() * 0.1, 0.5 + Math.random() * 0.3, 0.35 + Math.random() * 0.15);
      } else if (rand < 0.7) {
        // Blue gas
        color.setHSL(0.6 + Math.random() * 0.05, 0.45 + Math.random() * 0.25, 0.35 + Math.random() * 0.2);
      } else {
        // Subtle pink/magenta
        color.setHSL(0.88 + Math.random() * 0.1, 0.4 + Math.random() * 0.3, 0.3 + Math.random() * 0.15);
      }
      gasCloudCol[i3] = color.r;
      gasCloudCol[i3 + 1] = color.g;
      gasCloudCol[i3 + 2] = color.b;
    }
    
    // === STAR CLUSTERS (bright concentrated groups along arms) ===
    const starClusterCount = 35000;
    const starClusterPos = new Float32Array(starClusterCount * 3);
    const starClusterCol = new Float32Array(starClusterCount * 3);
    const starClusterSizes = new Float32Array(starClusterCount);
    
    // Create ~200 cluster centers with varied sizes
    const numClusters = 200;
    let starIdx = 0;
    
    for (let c = 0; c < numClusters && starIdx < starClusterCount; c++) {
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      // Cluster position along arm
      const t = 0.08 + Math.random() * 0.85;
      const r = (7000 + t * 42000) * gs;
      const winding = 0.22;
      const spiralAngle = arm.startAngle + Math.log(r / (6000 * gs) + 0.1) / winding;
      const armSpread = (Math.random() - 0.5) * 1500 * gs;
      
      const clusterX = Math.cos(spiralAngle + armSpread / r) * r;
      const clusterZ = Math.sin(spiralAngle + armSpread / r) * r;
      const clusterY = (Math.random() - 0.5) * 100 * gs;
      
      // Cluster size varies dramatically - some tiny, some large
      const sizeRand = Math.random();
      const clusterRadius = sizeRand < 0.3 
        ? (50 + Math.random() * 100) * gs   // Small clusters
        : sizeRand < 0.7 
          ? (150 + Math.random() * 250) * gs  // Medium clusters
          : (400 + Math.random() * 500) * gs; // Large clusters
      
      // Stars per cluster based on cluster size
      const starsInCluster = Math.floor(80 + (clusterRadius / gs) * 0.4);
      
      // Cluster color type - more variety
      const colorType = Math.random();
      let baseHue: number, baseSat: number, baseLightness: number;
      
      if (colorType < 0.35) {
        // Young blue clusters (O/B stars)
        baseHue = 0.58 + Math.random() * 0.08;
        baseSat = 0.6 + Math.random() * 0.35;
        baseLightness = 0.8;
      } else if (colorType < 0.55) {
        // Blue-white clusters
        baseHue = 0.55 + Math.random() * 0.1;
        baseSat = 0.4 + Math.random() * 0.3;
        baseLightness = 0.85;
      } else if (colorType < 0.7) {
        // White clusters
        baseHue = 0.15 + Math.random() * 0.1;
        baseSat = 0.1 + Math.random() * 0.2;
        baseLightness = 0.9;
      } else if (colorType < 0.85) {
        // Yellow-white (older) clusters
        baseHue = 0.12 + Math.random() * 0.08;
        baseSat = 0.35 + Math.random() * 0.25;
        baseLightness = 0.8;
      } else if (colorType < 0.93) {
        // Orange/gold clusters (globular-like)
        baseHue = 0.08 + Math.random() * 0.06;
        baseSat = 0.5 + Math.random() * 0.3;
        baseLightness = 0.75;
      } else {
        // Rare pink/magenta clusters (young with emission)
        baseHue = 0.9 + Math.random() * 0.1;
        baseSat = 0.5 + Math.random() * 0.3;
        baseLightness = 0.75;
      }
      
      for (let s = 0; s < starsInCluster && starIdx < starClusterCount; s++) {
        const i3 = starIdx * 3;
        
        // Gaussian distribution within cluster - tighter core
        const concentration = Math.pow(Math.random(), 0.6);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const dist = concentration * clusterRadius;
        
        const dx = dist * Math.sin(phi) * Math.cos(theta);
        const dy = dist * Math.cos(phi) * 0.4; // Flattened
        const dz = dist * Math.sin(phi) * Math.sin(theta);
        
        starClusterPos[i3] = clusterX + dx;
        starClusterPos[i3 + 1] = clusterY + dy;
        starClusterPos[i3 + 2] = clusterZ + dz;
        
        // Individual star variation
        const starVariation = (Math.random() - 0.5) * 0.1;
        const brightness = baseLightness + (1 - concentration) * 0.15 + starVariation;
        const satVariation = baseSat + (Math.random() - 0.5) * 0.15;
        
        color.setHSL(
          baseHue + (Math.random() - 0.5) * 0.05,
          Math.max(0, Math.min(1, satVariation)),
          Math.max(0.6, Math.min(1, brightness))
        );
        starClusterCol[i3] = color.r;
        starClusterCol[i3 + 1] = color.g;
        starClusterCol[i3 + 2] = color.b;
        
        // Star size variation - brighter stars larger
        starClusterSizes[starIdx] = 0.6 + Math.random() * 0.8 + (1 - concentration) * 0.4;
        
        starIdx++;
      }
    }
    
    // === STELLAR HALO (faint outer stars and globular clusters) ===
    const haloCount = 10000;
    const haloPos = new Float32Array(haloCount * 3);
    const haloCol = new Float32Array(haloCount * 3);
    
    for (let i = 0; i < haloCount; i++) {
      const i3 = i * 3;
      
      // Spherical halo distribution
      const r = (10000 + Math.pow(Math.random(), 0.4) * 70000) * gs;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      haloPos[i3] = r * Math.sin(phi) * Math.cos(theta);
      haloPos[i3 + 1] = r * Math.cos(phi) * 0.7; // Slightly flattened
      haloPos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      
      // Old yellow/white stars
      color.setHSL(0.12 + Math.random() * 0.05, 0.3, 0.7 + Math.random() * 0.2);
      haloCol[i3] = color.r;
      haloCol[i3 + 1] = color.g;
      haloCol[i3 + 2] = color.b;
    }
    
    // Build geometries
    const bulgeGeo = new THREE.BufferGeometry();
    bulgeGeo.setAttribute('position', new THREE.BufferAttribute(bulgePos, 3));
    bulgeGeo.setAttribute('color', new THREE.BufferAttribute(bulgeCol, 3));
    
    const barGeo = new THREE.BufferGeometry();
    barGeo.setAttribute('position', new THREE.BufferAttribute(barPos, 3));
    barGeo.setAttribute('color', new THREE.BufferAttribute(barCol, 3));
    
    const diskGeo = new THREE.BufferGeometry();
    diskGeo.setAttribute('position', new THREE.BufferAttribute(diskPos, 3));
    diskGeo.setAttribute('color', new THREE.BufferAttribute(diskCol, 3));
    
    const armCoreGeo = new THREE.BufferGeometry();
    armCoreGeo.setAttribute('position', new THREE.BufferAttribute(armCorePos, 3));
    armCoreGeo.setAttribute('color', new THREE.BufferAttribute(armCoreCol, 3));
    
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol, 3));
    
    const nebulaGeo = new THREE.BufferGeometry();
    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
    nebulaGeo.setAttribute('color', new THREE.BufferAttribute(nebulaCol, 3));
    
    const gasCloudGeo = new THREE.BufferGeometry();
    gasCloudGeo.setAttribute('position', new THREE.BufferAttribute(gasCloudPos, 3));
    gasCloudGeo.setAttribute('color', new THREE.BufferAttribute(gasCloudCol, 3));
    
    const starClusterGeo = new THREE.BufferGeometry();
    starClusterGeo.setAttribute('position', new THREE.BufferAttribute(starClusterPos.slice(0, starIdx * 3), 3));
    starClusterGeo.setAttribute('color', new THREE.BufferAttribute(starClusterCol.slice(0, starIdx * 3), 3));
    starClusterGeo.setAttribute('size', new THREE.BufferAttribute(starClusterSizes.slice(0, starIdx), 1));
    
    const haloGeo = new THREE.BufferGeometry();
    haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPos, 3));
    haloGeo.setAttribute('color', new THREE.BufferAttribute(haloCol, 3));
    
    return { bulgeGeo, barGeo, diskGeo, armCoreGeo, dustGeo, nebulaGeo, gasCloudGeo, starClusterGeo, haloGeo };
  }, [gs]);
  
  const pulseRef2 = useRef<THREE.Mesh>(null);
  const markerGroupRef = useRef<THREE.Group>(null);
  
  // Animate pulse and scale marker based on camera distance
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    
    // Pulse animation
    if (pulseRef.current) {
      const phase = (t * 2) % 1;
      pulseRef.current.scale.setScalar(1 + phase * 4);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.8;
    }
    
    if (pulseRef2.current) {
      const phase = ((t * 2) + 0.5) % 1;
      pulseRef2.current.scale.setScalar(1 + phase * 4);
      (pulseRef2.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.8;
    }
    
    // Scale marker group based on camera distance
    if (markerGroupRef.current) {
      const markerWorldPos = new THREE.Vector3();
      markerGroupRef.current.getWorldPosition(markerWorldPos);
      const distance = camera.position.distanceTo(markerWorldPos);
      const scale = Math.max(1, distance * 0.025);
      markerGroupRef.current.scale.setScalar(scale);
    }
  });
  
  const baseMarkerSize = gs * 300;
  
  return (
    <group ref={groupRef} position={galaxyOffset}>
      {/* Central bulge - warm golden glow */}
      <points geometry={bulgeGeo}>
        <pointsMaterial
          size={gs * 150}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Central bar */}
      <points geometry={barGeo}>
        <pointsMaterial
          size={gs * 120}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Main disk / spiral arms */}
      <points geometry={diskGeo}>
        <pointsMaterial
          size={gs * 60}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Bright arm cores */}
      <points geometry={armCoreGeo}>
        <pointsMaterial
          size={gs * 80}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Dust lanes - larger soft particles */}
      <points geometry={dustGeo}>
        <pointsMaterial
          size={gs * 350}
          map={gasTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.6}
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Nebulae - pink emission gas clouds */}
      <points geometry={nebulaGeo}>
        <pointsMaterial
          size={gs * 400}
          map={gasTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Gas clouds - diffuse hydrogen along arms */}
      <points geometry={gasCloudGeo}>
        <pointsMaterial
          size={gs * 500}
          map={gasTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Star clusters - bright concentrated groups */}
      <points geometry={starClusterGeo}>
        <pointsMaterial
          size={gs * 90}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Stellar halo */}
      <points geometry={haloGeo}>
        <pointsMaterial
          size={gs * 100}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Core glow layers - brighter center */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.6, 32, 32]} />
        <meshBasicMaterial
          color="#ffbb55"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.3, 32, 32]} />
        <meshBasicMaterial
          color="#ffaa33"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.12, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* "You Are Here" marker */}
      {showYouAreHere && (
        <group 
          ref={markerGroupRef}
          position={[
            Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs,
            0,
            Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs
          ]}
        >
          {/* Core dot */}
          <mesh>
            <sphereGeometry args={[baseMarkerSize, 16, 16]} />
            <meshBasicMaterial color="#00ff44" />
          </mesh>
          
          {/* Inner glow */}
          <mesh>
            <sphereGeometry args={[baseMarkerSize * 1.5, 16, 16]} />
            <meshBasicMaterial
              color="#00ff44"
              transparent
              opacity={0.5}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Outer glow */}
          <mesh>
            <sphereGeometry args={[baseMarkerSize * 3, 16, 16]} />
            <meshBasicMaterial
              color="#00ff44"
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Pulse ring 1 */}
          <mesh ref={pulseRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[baseMarkerSize * 1.5, baseMarkerSize * 2.5, 32]} />
            <meshBasicMaterial
              color="#00ff44"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Pulse ring 2 */}
          <mesh ref={pulseRef2} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[baseMarkerSize * 1.5, baseMarkerSize * 2.5, 32]} />
            <meshBasicMaterial
              color="#00ff44"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};
