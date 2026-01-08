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

// Create soft gas/nebula texture - MUCH softer for smooth appearance
const createGasTexture = () => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  // Very soft, diffuse gradient - more gradual falloff
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.5)');
  gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.25)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.08)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  return new THREE.CanvasTexture(canvas);
};

// Create extra-soft large cloud texture for smooth nebula effect
const createCloudTexture = () => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  // Super soft gradient for large overlapping clouds
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.35)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.15)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.04)');
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
  const cloudTexture = useMemo(() => createCloudTexture(), []);
  
  // Generate detailed galaxy particle systems
  const { bulgeGeo, barGeo, diskGeo, armCoreGeo, dustGeo, nebulaGeo, gasCloudGeo, starClusterGeo, globularGeo, haloGeo } = useMemo(() => {
    const color = new THREE.Color();
    
    // === CENTRAL BULGE (YELLOW/GOLDEN core - spheroidal) ===
    const bulgeCount = 70000;
    const bulgePos = new Float32Array(bulgeCount * 3);
    const bulgeCol = new Float32Array(bulgeCount * 3);
    
    for (let i = 0; i < bulgeCount; i++) {
      const i3 = i * 3;
      
      // Spheroidal bulge with strong concentration toward center
      const r = Math.pow(Math.random(), 0.8) * MILKY_WAY.bulgeRadius * gs * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Flattened spheroid
      bulgePos[i3] = r * Math.sin(phi) * Math.cos(theta);
      bulgePos[i3 + 1] = r * Math.cos(phi) * 0.35;
      bulgePos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      
      // YELLOW/GOLDEN center - like the reference images
      const dist = r / (MILKY_WAY.bulgeRadius * gs * 0.8);
      const brightness = 0.85 + (1 - dist) * 0.15;
      
      if (dist < 0.25) {
        // Very center - bright yellow/gold
        color.setHSL(0.12 + Math.random() * 0.02, 0.7 + Math.random() * 0.2, brightness);
      } else if (dist < 0.5) {
        // Inner - golden yellow
        color.setHSL(0.10 + Math.random() * 0.03, 0.65 + Math.random() * 0.2, brightness - dist * 0.1);
      } else if (dist < 0.75) {
        // Middle - orange/gold transitioning
        color.setHSL(0.08 + Math.random() * 0.04, 0.55 + Math.random() * 0.2, brightness - dist * 0.15);
      } else {
        // Outer bulge - transition to pink/purple
        color.setHSL(0.95 + Math.random() * 0.1, 0.5 + Math.random() * 0.2, brightness - dist * 0.2);
      }
      bulgeCol[i3] = color.r;
      bulgeCol[i3 + 1] = color.g;
      bulgeCol[i3 + 2] = color.b;
    }
    
    // === CENTRAL BAR (YELLOW/GOLDEN bar structure) ===
    const barCount = 50000;
    const barPos = new Float32Array(barCount * 3);
    const barCol = new Float32Array(barCount * 3);
    const barAngle = 0.45;
    
    for (let i = 0; i < barCount; i++) {
      const i3 = i * 3;
      
      const alongBar = (Math.random() - 0.5) * 2;
      const barLen = MILKY_WAY.barLength * gs * 0.5;
      const barW = MILKY_WAY.barWidth * gs;
      
      const widthFactor = Math.exp(-alongBar * alongBar * 2);
      const perpOffset = (Math.random() - 0.5) * barW * widthFactor;
      
      const x = alongBar * barLen;
      const z = perpOffset;
      
      barPos[i3] = x * Math.cos(barAngle) - z * Math.sin(barAngle);
      barPos[i3 + 1] = (Math.random() - 0.5) * 250 * gs * widthFactor;
      barPos[i3 + 2] = x * Math.sin(barAngle) + z * Math.cos(barAngle);
      
      // YELLOW/GOLDEN bar - matching the center
      const dist = Math.abs(alongBar);
      if (dist < 0.6) {
        // Golden yellow bar
        color.setHSL(0.11 + Math.random() * 0.03, 0.6 + Math.random() * 0.2, 0.75 + Math.random() * 0.15);
      } else {
        // Transition to pink/purple at ends
        color.setHSL(0.9 + Math.random() * 0.1, 0.5 + Math.random() * 0.2, 0.65 + Math.random() * 0.15);
      }
      barCol[i3] = color.r;
      barCol[i3 + 1] = color.g;
      barCol[i3 + 2] = color.b;
    }
    
    // === SPIRAL ARMS (BLUE glow with stars) ===
    const diskCount = 220000;
    const diskPos = new Float32Array(diskCount * 3);
    const diskCol = new Float32Array(diskCount * 3);
    
    for (let i = 0; i < diskCount; i++) {
      const i3 = i * 3;
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      const t = Math.pow(Math.random(), 0.4);
      const minR = 6000;
      const r = (minR + t * (MILKY_WAY.diskRadius - minR)) * gs;
      const normalizedR = (r / gs - minR) / (MILKY_WAY.diskRadius - minR);
      
      const winding = 0.22;
      const spiralAngle = arm.startAngle + Math.log(r / (minR * gs) + 0.1) / winding;
      
      const armWidth = (2000 + t * 1800) * gs;
      const spreadGaussian = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const spread = spreadGaussian * armWidth;
      
      // MORE inter-arm stars to FILL THE GAPS
      const interArm = Math.random() < 0.35;
      const extraSpread = interArm ? (Math.random() - 0.5) * armWidth * 4 : 0;
      
      const finalAngle = spiralAngle + (spread + extraSpread) / (r + 1);
      
      diskPos[i3] = Math.cos(finalAngle) * r;
      diskPos[i3 + 1] = (Math.random() - 0.5) * 200 * gs * Math.exp(-t * 1.2);
      diskPos[i3 + 2] = Math.sin(finalAngle) * r;
      
      // BLUE SPIRAL ARMS with purple inner transition
      if (interArm) {
        // Inter-arm stars - dimmer blue/purple
        color.setHSL(0.62 + Math.random() * 0.1, 0.3 + Math.random() * 0.2, 0.4 + Math.random() * 0.2);
      } else {
        const inCore = Math.abs(spreadGaussian) < 0.35;
        
        if (normalizedR < 0.2) {
          // Inner - purple/magenta transition from yellow center
          color.setHSL(0.82 + Math.random() * 0.1, 0.5 + Math.random() * 0.3, 0.6 + Math.random() * 0.25);
        } else if (normalizedR < 0.4) {
          // Inner-middle - purple-blue
          color.setHSL(0.72 + Math.random() * 0.1, 0.5 + Math.random() * 0.3, 0.6 + Math.random() * 0.25);
        } else {
          // Middle to outer - BLUE dominant
          if (inCore) {
            // Bright blue arm cores
            color.setHSL(0.58 + Math.random() * 0.08, 0.6 + Math.random() * 0.3, 0.7 + Math.random() * 0.25);
          } else {
            // Blue arm edges
            color.setHSL(0.6 + Math.random() * 0.1, 0.45 + Math.random() * 0.25, 0.55 + Math.random() * 0.2);
          }
        }
      }
      diskCol[i3] = color.r;
      diskCol[i3 + 1] = color.g;
      diskCol[i3 + 2] = color.b;
    }
    
    // === ARM CORES (BRIGHT BLUE star forming regions) ===
    const armCoreCount = 45000;
    const armCorePos = new Float32Array(armCoreCount * 3);
    const armCoreCol = new Float32Array(armCoreCount * 3);
    
    for (let i = 0; i < armCoreCount; i++) {
      const i3 = i * 3;
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      const t = Math.pow(Math.random(), 0.45);
      const minR = 7000;
      const r = (minR + t * 42000) * gs;
      
      const winding = 0.22;
      const spiralAngle = arm.startAngle + Math.log(r / (6000 * gs) + 0.1) / winding;
      const spread = (Math.random() - 0.5) * 800 * gs;
      
      armCorePos[i3] = Math.cos(spiralAngle + spread / r) * r;
      armCorePos[i3 + 1] = (Math.random() - 0.5) * 80 * gs;
      armCorePos[i3 + 2] = Math.sin(spiralAngle + spread / r) * r;
      
      // BRIGHT BLUE arm cores
      color.setHSL(0.58 + Math.random() * 0.08, 0.65 + Math.random() * 0.3, 0.75 + Math.random() * 0.2);
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
    
    // === NEBULAE / HII REGIONS (pink/magenta inner, blue-purple outer) ===
    const nebulaCount = 80000;
    const nebulaPos = new Float32Array(nebulaCount * 3);
    const nebulaCol = new Float32Array(nebulaCount * 3);
    
    for (let i = 0; i < nebulaCount; i++) {
      const i3 = i * 3;
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      const t = 0.01 + Math.random() * 0.95;
      const r = (3000 + t * 50000) * gs;
      const normalizedR = t;
      
      const winding = 0.22;
      const spiralAngle = arm.startAngle + Math.log(r / (6000 * gs) + 0.1) / winding;
      const spread = (Math.random() - 0.5) * 2500 * gs;
      
      nebulaPos[i3] = Math.cos(spiralAngle + spread / r) * r;
      nebulaPos[i3 + 1] = (Math.random() - 0.5) * 160 * gs;
      nebulaPos[i3 + 2] = Math.sin(spiralAngle + spread / r) * r;
      
      // Color based on radius - saturated pink inner → purple middle → blue outer
      if (normalizedR < 0.25) {
        // Inner - bright pink/salmon
        color.setHSL(0.95 + Math.random() * 0.05, 0.7 + Math.random() * 0.25, 0.55 + Math.random() * 0.3);
      } else if (normalizedR < 0.45) {
        // Inner-middle - pink/magenta
        color.setHSL(0.88 + Math.random() * 0.1, 0.65 + Math.random() * 0.25, 0.5 + Math.random() * 0.25);
      } else if (normalizedR < 0.65) {
        // Middle - purple/violet
        color.setHSL(0.78 + Math.random() * 0.1, 0.55 + Math.random() * 0.3, 0.45 + Math.random() * 0.25);
      } else if (normalizedR < 0.82) {
        // Outer-middle - blue-purple
        color.setHSL(0.68 + Math.random() * 0.1, 0.5 + Math.random() * 0.3, 0.45 + Math.random() * 0.25);
      } else {
        // Outer - blue/cyan
        color.setHSL(0.58 + Math.random() * 0.1, 0.5 + Math.random() * 0.35, 0.4 + Math.random() * 0.25);
      }
      nebulaCol[i3] = color.r;
      nebulaCol[i3 + 1] = color.g;
      nebulaCol[i3 + 2] = color.b;
    }
    
    // === GAS CLOUDS (MASSIVE diffuse clouds for smooth nebula effect - FILL GAPS) ===
    const gasCloudCount = 150000;
    const gasCloudPos = new Float32Array(gasCloudCount * 3);
    const gasCloudCol = new Float32Array(gasCloudCount * 3);
    
    for (let i = 0; i < gasCloudCount; i++) {
      const i3 = i * 3;
      
      // FILL THE ENTIRE DISK - not just arms
      const t = Math.pow(Math.random(), 0.3);
      const r = (2000 + t * 55000) * gs;
      const normalizedR = t;
      
      // Random angle to fill gaps between arms
      const randomAngle = Math.random() * Math.PI * 2;
      
      // Some follow arms, some fill gaps
      const followArm = Math.random() < 0.6;
      let finalAngle;
      
      if (followArm) {
        const armIdx = Math.floor(Math.random() * 4);
        const arm = MILKY_WAY.arms[armIdx];
        const winding = 0.22;
        const spiralAngle = arm.startAngle + Math.log(r / (6000 * gs) + 0.1) / winding;
        const spread = (Math.random() - 0.5) * 5000 * gs;
        finalAngle = spiralAngle + spread / (r + 1);
      } else {
        // Fill the gaps - random distribution
        finalAngle = randomAngle;
      }
      
      gasCloudPos[i3] = Math.cos(finalAngle) * r;
      gasCloudPos[i3 + 1] = (Math.random() - 0.5) * 300 * gs;
      gasCloudPos[i3 + 2] = Math.sin(finalAngle) * r;
      
      // YELLOW center → PURPLE middle → BLUE outer
      if (normalizedR < 0.15) {
        // Core - golden yellow
        color.setHSL(0.12 + Math.random() * 0.04, 0.5 + Math.random() * 0.3, 0.5 + Math.random() * 0.25);
      } else if (normalizedR < 0.3) {
        // Inner - orange/salmon transition
        color.setHSL(0.05 + Math.random() * 0.08, 0.45 + Math.random() * 0.25, 0.45 + Math.random() * 0.2);
      } else if (normalizedR < 0.5) {
        // Inner-middle - purple/magenta
        color.setHSL(0.82 + Math.random() * 0.1, 0.45 + Math.random() * 0.25, 0.4 + Math.random() * 0.2);
      } else if (normalizedR < 0.75) {
        // Middle-outer - purple-blue
        color.setHSL(0.7 + Math.random() * 0.1, 0.4 + Math.random() * 0.25, 0.38 + Math.random() * 0.18);
      } else {
        // Outer - BLUE
        color.setHSL(0.58 + Math.random() * 0.1, 0.4 + Math.random() * 0.3, 0.35 + Math.random() * 0.18);
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
    
    // === GLOBULAR CLUSTERS (dense spherical clusters in halo) ===
    const globularCount = 20000;
    const globularPos = new Float32Array(globularCount * 3);
    const globularCol = new Float32Array(globularCount * 3);
    
    // ~160 globular clusters (Milky Way has ~150-200)
    const numGlobulars = 160;
    let globIdx = 0;
    
    for (let g = 0; g < numGlobulars && globIdx < globularCount; g++) {
      // Globular cluster position in halo - concentrated toward center
      const distFromCenter = (3000 + Math.pow(Math.random(), 0.5) * 80000) * gs;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const clusterX = distFromCenter * Math.sin(phi) * Math.cos(theta);
      const clusterY = distFromCenter * Math.cos(phi) * 0.8; // Slightly flattened
      const clusterZ = distFromCenter * Math.sin(phi) * Math.sin(theta);
      
      // Globular cluster size - varies from small to large
      const sizeRand = Math.random();
      const clusterRadius = sizeRand < 0.4
        ? (30 + Math.random() * 50) * gs    // Small globulars
        : sizeRand < 0.8
          ? (80 + Math.random() * 120) * gs   // Medium globulars
          : (200 + Math.random() * 300) * gs; // Large globulars (like Omega Centauri)
      
      // Stars per globular based on size
      const starsInGlobular = Math.floor(50 + (clusterRadius / gs) * 0.5);
      
      // Globular color - old yellow/orange/red giant dominated
      const colorType = Math.random();
      let baseHue: number, baseSat: number;
      
      if (colorType < 0.5) {
        // Yellow-orange (most common)
        baseHue = 0.10 + Math.random() * 0.05;
        baseSat = 0.4 + Math.random() * 0.3;
      } else if (colorType < 0.8) {
        // Orange-gold
        baseHue = 0.07 + Math.random() * 0.04;
        baseSat = 0.5 + Math.random() * 0.35;
      } else {
        // Slightly reddish (metal-rich)
        baseHue = 0.03 + Math.random() * 0.05;
        baseSat = 0.45 + Math.random() * 0.3;
      }
      
      for (let s = 0; s < starsInGlobular && globIdx < globularCount; s++) {
        const i3 = globIdx * 3;
        
        // Very concentrated King profile - dense core
        const concentration = Math.pow(Math.random(), 1.5);
        const starTheta = Math.random() * Math.PI * 2;
        const starPhi = Math.acos(2 * Math.random() - 1);
        const dist = concentration * clusterRadius;
        
        globularPos[i3] = clusterX + dist * Math.sin(starPhi) * Math.cos(starTheta);
        globularPos[i3 + 1] = clusterY + dist * Math.cos(starPhi);
        globularPos[i3 + 2] = clusterZ + dist * Math.sin(starPhi) * Math.sin(starTheta);
        
        // Brighter toward center, with some blue stragglers
        const isBlueStraggler = Math.random() < 0.03;
        if (isBlueStraggler) {
          color.setHSL(0.58 + Math.random() * 0.05, 0.6, 0.85 + Math.random() * 0.1);
        } else {
          const brightness = 0.7 + (1 - concentration) * 0.25;
          color.setHSL(
            baseHue + (Math.random() - 0.5) * 0.03,
            baseSat + (Math.random() - 0.5) * 0.1,
            brightness
          );
        }
        globularCol[i3] = color.r;
        globularCol[i3 + 1] = color.g;
        globularCol[i3 + 2] = color.b;
        
        globIdx++;
      }
    }
    
    // === STELLAR HALO (faint outer field stars) ===
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
    
    const globularGeo = new THREE.BufferGeometry();
    globularGeo.setAttribute('position', new THREE.BufferAttribute(globularPos.slice(0, globIdx * 3), 3));
    globularGeo.setAttribute('color', new THREE.BufferAttribute(globularCol.slice(0, globIdx * 3), 3));
    
    const haloGeo = new THREE.BufferGeometry();
    haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPos, 3));
    haloGeo.setAttribute('color', new THREE.BufferAttribute(haloCol, 3));
    
    return { bulgeGeo, barGeo, diskGeo, armCoreGeo, dustGeo, nebulaGeo, gasCloudGeo, starClusterGeo, globularGeo, haloGeo };
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
      {/* Central bulge - bright white/cream core */}
      <points geometry={bulgeGeo}>
        <pointsMaterial
          size={gs * 200}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Central bar */}
      <points geometry={barGeo}>
        <pointsMaterial
          size={gs * 180}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Main disk / spiral arms */}
      <points geometry={diskGeo}>
        <pointsMaterial
          size={gs * 80}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Bright arm cores */}
      <points geometry={armCoreGeo}>
        <pointsMaterial
          size={gs * 100}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Dust lanes - dark lanes for realism */}
      <points geometry={dustGeo}>
        <pointsMaterial
          size={gs * 600}
          map={gasTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.5}
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Nebulae - large overlapping gas clouds for smooth appearance */}
      <points geometry={nebulaGeo}>
        <pointsMaterial
          size={gs * 2000}
          map={cloudTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Gas clouds - VERY large diffuse clouds for ultra smooth nebula effect */}
      <points geometry={gasCloudGeo}>
        <pointsMaterial
          size={gs * 3000}
          map={cloudTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.55}
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
      
      {/* Globular clusters - dense spherical clusters in halo */}
      <points geometry={globularGeo}>
        <pointsMaterial
          size={gs * 70}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.95}
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
      
      {/* Core glow layers - YELLOW/GOLDEN center with purple transition */}
      {/* Outer blue glow */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 1.5, 32, 32]} />
        <meshBasicMaterial
          color="#4466cc"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Purple outer */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 1.1, 32, 32]} />
        <meshBasicMaterial
          color="#7755bb"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Purple-pink transition */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.8, 32, 32]} />
        <meshBasicMaterial
          color="#aa6699"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Pink/salmon ring */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.55, 32, 32]} />
        <meshBasicMaterial
          color="#dd9977"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Orange/gold */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.35, 32, 32]} />
        <meshBasicMaterial
          color="#ffaa44"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* BRIGHT YELLOW core */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.2, 32, 32]} />
        <meshBasicMaterial
          color="#ffcc44"
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Brightest yellow center */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.1, 32, 32]} />
        <meshBasicMaterial
          color="#ffdd66"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* White hot center point */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.04, 32, 32]} />
        <meshBasicMaterial
          color="#ffffee"
          transparent
          opacity={0.95}
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
