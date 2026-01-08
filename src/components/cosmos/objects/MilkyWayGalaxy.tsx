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

// Create dust lane texture - darker, more opaque
const createDustTexture = () => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(40, 20, 10, 0.9)');
  gradient.addColorStop(0.2, 'rgba(40, 20, 10, 0.6)');
  gradient.addColorStop(0.5, 'rgba(40, 20, 10, 0.25)');
  gradient.addColorStop(1, 'rgba(40, 20, 10, 0)');
  
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
  const dustTexture = useMemo(() => createDustTexture(), []);
  
  // Generate detailed galaxy particle systems
  const { bulgeGeo, barGeo, diskGeo, armCoreGeo, dustGeo, nebulaGeo, gasCloudGeo, starClusterGeo, globularGeo, haloGeo } = useMemo(() => {
    const color = new THREE.Color();
    
    // === CENTRAL BULGE (YELLOW/GOLDEN core - spheroidal) ===
    const bulgeCount = 90000;
    const bulgePos = new Float32Array(bulgeCount * 3);
    const bulgeCol = new Float32Array(bulgeCount * 3);
    
    for (let i = 0; i < bulgeCount; i++) {
      const i3 = i * 3;
      
      // Spheroidal bulge with strong concentration toward center
      const r = Math.pow(Math.random(), 0.7) * MILKY_WAY.bulgeRadius * gs * 0.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // VERY flattened spheroid - thin profile like reference
      bulgePos[i3] = r * Math.sin(phi) * Math.cos(theta);
      bulgePos[i3 + 1] = r * Math.cos(phi) * 0.15; // Much thinner
      bulgePos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      
      // GOLDEN/CREAM center - muted like reference images
      const dist = r / (MILKY_WAY.bulgeRadius * gs * 0.7);
      const brightness = 0.55 + (1 - dist) * 0.35; // Dimmer overall
      
      if (dist < 0.2) {
        // Very center - bright cream/white
        color.setHSL(0.11 + Math.random() * 0.02, 0.45 + Math.random() * 0.15, brightness + 0.15);
      } else if (dist < 0.45) {
        // Inner - golden yellow (muted)
        color.setHSL(0.10 + Math.random() * 0.03, 0.4 + Math.random() * 0.15, brightness);
      } else if (dist < 0.7) {
        // Middle - warm tan/cream
        color.setHSL(0.09 + Math.random() * 0.03, 0.35 + Math.random() * 0.15, brightness - 0.05);
      } else {
        // Outer bulge - muted orange-brown transition
        color.setHSL(0.07 + Math.random() * 0.04, 0.3 + Math.random() * 0.15, brightness - 0.1);
      }
      bulgeCol[i3] = color.r;
      bulgeCol[i3 + 1] = color.g;
      bulgeCol[i3 + 2] = color.b;
    }
    
    // === CENTRAL BAR (GOLDEN bar structure - muted) ===
    const barCount = 60000;
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
      barPos[i3 + 1] = (Math.random() - 0.5) * 80 * gs * widthFactor; // Much thinner
      barPos[i3 + 2] = x * Math.sin(barAngle) + z * Math.cos(barAngle);
      
      // MUTED golden bar - matching reference
      const dist = Math.abs(alongBar);
      const brightness = 0.5 + (1 - dist) * 0.25;
      if (dist < 0.5) {
        // Golden cream bar
        color.setHSL(0.10 + Math.random() * 0.02, 0.35 + Math.random() * 0.15, brightness);
      } else {
        // Transition to blue-grey at ends
        color.setHSL(0.58 + Math.random() * 0.08, 0.2 + Math.random() * 0.1, brightness - 0.1);
      }
      barCol[i3] = color.r;
      barCol[i3 + 1] = color.g;
      barCol[i3 + 2] = color.b;
    }
    
    // === SPIRAL ARMS (MUTED BLUE-GREY like reference) ===
    const diskCount = 280000;
    const diskPos = new Float32Array(diskCount * 3);
    const diskCol = new Float32Array(diskCount * 3);
    
    for (let i = 0; i < diskCount; i++) {
      const i3 = i * 3;
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      const t = Math.pow(Math.random(), 0.35);
      const minR = 5000;
      const r = (minR + t * (MILKY_WAY.diskRadius - minR)) * gs;
      const normalizedR = (r / gs - minR) / (MILKY_WAY.diskRadius - minR);
      
      const winding = 0.22;
      const spiralAngle = arm.startAngle + Math.log(r / (minR * gs) + 0.1) / winding;
      
      const armWidth = (2500 + t * 2000) * gs;
      const spreadGaussian = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const spread = spreadGaussian * armWidth;
      
      // More inter-arm stars to fill gaps
      const interArm = Math.random() < 0.4;
      const extraSpread = interArm ? (Math.random() - 0.5) * armWidth * 5 : 0;
      
      const finalAngle = spiralAngle + (spread + extraSpread) / (r + 1);
      
      diskPos[i3] = Math.cos(finalAngle) * r;
      diskPos[i3 + 1] = (Math.random() - 0.5) * 60 * gs * Math.exp(-t * 1.5); // Much thinner disk
      diskPos[i3 + 2] = Math.sin(finalAngle) * r;
      
      // MUTED BLUE-GREY spiral arms like reference
      const inCore = Math.abs(spreadGaussian) < 0.3;
      const brightness = 0.35 + Math.random() * 0.2; // Much dimmer
      
      if (interArm) {
        // Inter-arm - very dim grey-blue
        color.setHSL(0.58 + Math.random() * 0.1, 0.15 + Math.random() * 0.1, brightness - 0.08);
      } else if (normalizedR < 0.15) {
        // Very inner - warm tan transition
        color.setHSL(0.08 + Math.random() * 0.04, 0.25 + Math.random() * 0.15, brightness + 0.1);
      } else if (normalizedR < 0.35) {
        // Inner - grey with slight warmth
        color.setHSL(0.55 + Math.random() * 0.1, 0.18 + Math.random() * 0.12, brightness);
      } else {
        // Middle to outer - MUTED blue-grey
        if (inCore) {
          // Arm cores - slightly brighter blue-grey
          color.setHSL(0.58 + Math.random() * 0.06, 0.25 + Math.random() * 0.15, brightness + 0.08);
        } else {
          // Arm edges - dim blue-grey
          color.setHSL(0.56 + Math.random() * 0.08, 0.2 + Math.random() * 0.12, brightness);
        }
      }
      diskCol[i3] = color.r;
      diskCol[i3 + 1] = color.g;
      diskCol[i3 + 2] = color.b;
    }
    
    // === ARM CORES (brighter spots in arms - still muted) ===
    const armCoreCount = 50000;
    const armCorePos = new Float32Array(armCoreCount * 3);
    const armCoreCol = new Float32Array(armCoreCount * 3);
    
    for (let i = 0; i < armCoreCount; i++) {
      const i3 = i * 3;
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      const t = Math.pow(Math.random(), 0.4);
      const minR = 6000;
      const r = (minR + t * 45000) * gs;
      
      const winding = 0.22;
      const spiralAngle = arm.startAngle + Math.log(r / (5000 * gs) + 0.1) / winding;
      const spread = (Math.random() - 0.5) * 600 * gs;
      
      armCorePos[i3] = Math.cos(spiralAngle + spread / r) * r;
      armCorePos[i3 + 1] = (Math.random() - 0.5) * 30 * gs; // Very thin
      armCorePos[i3 + 2] = Math.sin(spiralAngle + spread / r) * r;
      
      // Muted blue-white arm cores
      color.setHSL(0.58 + Math.random() * 0.06, 0.3 + Math.random() * 0.15, 0.5 + Math.random() * 0.2);
      armCoreCol[i3] = color.r;
      armCoreCol[i3 + 1] = color.g;
      armCoreCol[i3 + 2] = color.b;
    }
    
    // === DUST LANES (VERY PROMINENT dark brown bands - like reference side view) ===
    const dustCount = 150000;
    const dustPos = new Float32Array(dustCount * 3);
    const dustCol = new Float32Array(dustCount * 3);
    
    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;
      
      // Dust concentrated along the disk midplane and arm edges
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      const t = Math.pow(Math.random(), 0.3);
      const r = (3000 + t * 50000) * gs;
      
      const winding = 0.22;
      const spiralAngle = arm.startAngle + Math.log(r / (4000 * gs) + 0.1) / winding;
      
      // Create prominent lane structure - inner edges of arms + scattered through disk
      const laneType = Math.random();
      let laneOffset;
      if (laneType < 0.5) {
        // Inner edge of arm - most prominent
        laneOffset = -0.1 + (Math.random() - 0.5) * 0.04;
      } else if (laneType < 0.75) {
        // Through arm center
        laneOffset = (Math.random() - 0.5) * 0.15;
      } else {
        // Between arms - scattered
        laneOffset = (Math.random() - 0.5) * 0.5;
      }
      
      const spread = (Math.random() - 0.5) * 2500 * gs;
      const finalAngle = spiralAngle + laneOffset + spread / (r + 1);
      
      dustPos[i3] = Math.cos(finalAngle) * r;
      dustPos[i3 + 1] = (Math.random() - 0.5) * 15 * gs; // Very thin - concentrated in midplane
      dustPos[i3 + 2] = Math.sin(finalAngle) * r;
      
      // DARK brown/reddish dust - very dark like reference
      const dustBrightness = 0.02 + Math.random() * 0.06;
      color.setHSL(0.02 + Math.random() * 0.04, 0.7 + Math.random() * 0.25, dustBrightness);
      dustCol[i3] = color.r;
      dustCol[i3 + 1] = color.g;
      dustCol[i3 + 2] = color.b;
    }
    
    // === NEBULAE / smooth gas clouds (muted blue-grey-tan gradient) ===
    const nebulaCount = 120000;
    const nebulaPos = new Float32Array(nebulaCount * 3);
    const nebulaCol = new Float32Array(nebulaCount * 3);
    
    for (let i = 0; i < nebulaCount; i++) {
      const i3 = i * 3;
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      const t = 0.01 + Math.random() * 0.98;
      const r = (2000 + t * 52000) * gs;
      const normalizedR = t;
      
      const winding = 0.22;
      const spiralAngle = arm.startAngle + Math.log(r / (5000 * gs) + 0.1) / winding;
      const spread = (Math.random() - 0.5) * 4000 * gs; // Wider spread for smoothness
      
      nebulaPos[i3] = Math.cos(spiralAngle + spread / r) * r;
      nebulaPos[i3 + 1] = (Math.random() - 0.5) * 50 * gs; // Thin
      nebulaPos[i3 + 2] = Math.sin(spiralAngle + spread / r) * r;
      
      // MUTED colors like reference - cream center to grey-blue outer
      const brightness = 0.3 + Math.random() * 0.15;
      if (normalizedR < 0.18) {
        // Inner - warm cream/tan
        color.setHSL(0.09 + Math.random() * 0.03, 0.3 + Math.random() * 0.15, brightness + 0.15);
      } else if (normalizedR < 0.35) {
        // Transition - muted grey-tan
        color.setHSL(0.07 + Math.random() * 0.05, 0.2 + Math.random() * 0.1, brightness + 0.05);
      } else if (normalizedR < 0.6) {
        // Middle - grey-blue
        color.setHSL(0.58 + Math.random() * 0.08, 0.15 + Math.random() * 0.1, brightness);
      } else {
        // Outer - muted blue-grey
        color.setHSL(0.56 + Math.random() * 0.1, 0.18 + Math.random() * 0.12, brightness - 0.03);
      }
      nebulaCol[i3] = color.r;
      nebulaCol[i3 + 1] = color.g;
      nebulaCol[i3 + 2] = color.b;
    }
    
    // === GAS CLOUDS (MASSIVE diffuse clouds - ultra smooth like reference) ===
    const gasCloudCount = 200000;
    const gasCloudPos = new Float32Array(gasCloudCount * 3);
    const gasCloudCol = new Float32Array(gasCloudCount * 3);
    
    for (let i = 0; i < gasCloudCount; i++) {
      const i3 = i * 3;
      
      // Fill entire disk for smooth appearance
      const t = Math.pow(Math.random(), 0.25);
      const r = (1500 + t * 54000) * gs;
      const normalizedR = t;
      
      // Mix of arm-following and gap-filling
      const followArm = Math.random() < 0.55;
      let finalAngle;
      
      if (followArm) {
        const armIdx = Math.floor(Math.random() * 4);
        const arm = MILKY_WAY.arms[armIdx];
        const winding = 0.22;
        const spiralAngle = arm.startAngle + Math.log(r / (5000 * gs) + 0.1) / winding;
        const spread = (Math.random() - 0.5) * 6000 * gs;
        finalAngle = spiralAngle + spread / (r + 1);
      } else {
        finalAngle = Math.random() * Math.PI * 2;
      }
      
      gasCloudPos[i3] = Math.cos(finalAngle) * r;
      gasCloudPos[i3 + 1] = (Math.random() - 0.5) * 80 * gs; // Thin disk
      gasCloudPos[i3 + 2] = Math.sin(finalAngle) * r;
      
      // MUTED gradient: cream center → grey → blue-grey outer
      const brightness = 0.25 + Math.random() * 0.12;
      if (normalizedR < 0.12) {
        // Core - warm cream/yellow (muted)
        color.setHSL(0.10 + Math.random() * 0.03, 0.35 + Math.random() * 0.15, brightness + 0.2);
      } else if (normalizedR < 0.28) {
        // Inner - tan/grey-tan
        color.setHSL(0.08 + Math.random() * 0.04, 0.22 + Math.random() * 0.12, brightness + 0.08);
      } else if (normalizedR < 0.5) {
        // Middle - grey with slight blue
        color.setHSL(0.55 + Math.random() * 0.1, 0.12 + Math.random() * 0.1, brightness);
      } else if (normalizedR < 0.75) {
        // Outer-middle - blue-grey
        color.setHSL(0.58 + Math.random() * 0.08, 0.15 + Math.random() * 0.1, brightness - 0.02);
      } else {
        // Outer - muted blue-grey
        color.setHSL(0.56 + Math.random() * 0.1, 0.18 + Math.random() * 0.12, brightness - 0.04);
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
      {/* Central bulge - golden cream core */}
      <points geometry={bulgeGeo}>
        <pointsMaterial
          size={gs * 120}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Central bar */}
      <points geometry={barGeo}>
        <pointsMaterial
          size={gs * 100}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Main disk / spiral arms - MUTED */}
      <points geometry={diskGeo}>
        <pointsMaterial
          size={gs * 50}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Arm cores - slightly brighter */}
      <points geometry={armCoreGeo}>
        <pointsMaterial
          size={gs * 60}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Dust lanes - VERY PROMINENT dark brown bands */}
      <points geometry={dustGeo}>
        <pointsMaterial
          size={gs * 1200}
          map={dustTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.85}
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Nebulae - smooth gas for continuous appearance */}
      <points geometry={nebulaGeo}>
        <pointsMaterial
          size={gs * 2500}
          map={cloudTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Gas clouds - MASSIVE for ultra smooth effect */}
      <points geometry={gasCloudGeo}>
        <pointsMaterial
          size={gs * 4000}
          map={cloudTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Star clusters */}
      <points geometry={starClusterGeo}>
        <pointsMaterial
          size={gs * 60}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Globular clusters */}
      <points geometry={globularGeo}>
        <pointsMaterial
          size={gs * 50}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Stellar halo */}
      <points geometry={haloGeo}>
        <pointsMaterial
          size={gs * 70}
          map={starTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Core glow - MUTED golden cream center like reference */}
      {/* Outer diffuse grey-blue */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 1.2, 32, 32]} />
        <meshBasicMaterial
          color="#667788"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Grey-tan transition */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.8, 32, 32]} />
        <meshBasicMaterial
          color="#998877"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Warm tan */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.5, 32, 32]} />
        <meshBasicMaterial
          color="#ccaa88"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Golden cream */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.3, 32, 32]} />
        <meshBasicMaterial
          color="#ddbb88"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Bright cream core */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.15, 32, 32]} />
        <meshBasicMaterial
          color="#eedd99"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* White center */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.06, 32, 32]} />
        <meshBasicMaterial
          color="#ffeecc"
          transparent
          opacity={0.6}
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
