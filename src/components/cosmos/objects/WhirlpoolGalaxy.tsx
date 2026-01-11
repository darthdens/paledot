import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { getObjectById } from '../data/celestialObjects';
import { DifferentialRotationPoints } from './DifferentialRotationMaterial';

interface WhirlpoolGalaxyProps {
  visualScale: number;
}

// Whirlpool Galaxy (M51) parameters - based on real astronomical data
const WHIRLPOOL = {
  diskRadius: 38000, // Half of 76,000 ly diameter
  bulgeRadius: 5000, // Prominent central bulge
  branches: 2, // Two beautifully defined spiral arms
  spinTurns: 2.35, // Arms wrap ~250° around
  inclination: (20 * Math.PI) / 180, // ~20° inclination (nearly face-on)
  distanceFromMilkyWay: 23e6, // 23 million light-years
};

// Companion galaxy NGC 5195 parameters
// Position is calculated dynamically to stay at arm tip
const NGC5195 = {
  radius: 12000,
  // Distance from center - at the arm tip
  distanceFromCenter: 40000,
  // Vertical offset - slightly above disk plane
  yOffset: 2000,
};

// Whirlpool glow texture: warm cream core → pink HII → blue outer
const createWhirlpoolGlowTexture = () => {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

  // Warm cream core → pink/red tones → blue-gray outer
  gradient.addColorStop(0, 'rgba(255, 248, 220, 0.95)');     // Cream white center
  gradient.addColorStop(0.06, 'rgba(255, 235, 180, 0.88)');  // Warm cream
  gradient.addColorStop(0.12, 'rgba(255, 220, 150, 0.75)');  // Golden cream
  gradient.addColorStop(0.20, 'rgba(220, 200, 160, 0.55)');  // Muted gold
  gradient.addColorStop(0.30, 'rgba(255, 150, 180, 0.42)');  // Pink (HII regions)
  gradient.addColorStop(0.42, 'rgba(200, 120, 160, 0.32)');  // Dusty pink
  gradient.addColorStop(0.55, 'rgba(140, 160, 200, 0.22)');  // Blue-gray
  gradient.addColorStop(0.70, 'rgba(100, 140, 190, 0.14)');  // Muted blue
  gradient.addColorStop(0.85, 'rgba(80, 120, 170, 0.07)');   // Fading blue
  gradient.addColorStop(1, 'rgba(60, 100, 150, 0)');         // Transparent

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

// Companion galaxy glow texture: warm yellow-orange (older stars)
const createCompanionGlowTexture = () => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

  gradient.addColorStop(0, 'rgba(255, 240, 200, 0.95)');
  gradient.addColorStop(0.15, 'rgba(255, 220, 160, 0.75)');
  gradient.addColorStop(0.35, 'rgba(240, 180, 120, 0.50)');
  gradient.addColorStop(0.55, 'rgba(200, 150, 100, 0.30)');
  gradient.addColorStop(0.75, 'rgba(150, 120, 90, 0.15)');
  gradient.addColorStop(1, 'rgba(100, 80, 60, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

// Crisp dot texture
const createDotTexture = () => {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.75)');
  gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.18)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

export const WhirlpoolGalaxy = ({ visualScale }: WhirlpoolGalaxyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const companionGroupRef = useRef<THREE.Group>(null);
  const bridgeGroupRef = useRef<THREE.Group>(null);
  const centerWorldPos = useRef(new THREE.Vector3());
  const rotationTimeRef = useRef(0);

  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);
  const setSelectedObject = useCosmosStore((s) => s.setSelectedObject);
  const isInStarSystem = useCosmosStore((s) => s.isInStarSystem);
  const timeSpeed = useCosmosStore((s) => s.timeSpeed);

  const gs = UNITS.KM_PER_LY * visualScale;
  
  // Position: Whirlpool is in constellation Canes Venatici
  const whirlpoolPosition = useMemo<[number, number, number]>(() => [
    WHIRLPOOL.distanceFromMilkyWay * gs * 0.85,
    WHIRLPOOL.distanceFromMilkyWay * gs * 0.25,
    -WHIRLPOOL.distanceFromMilkyWay * gs * 0.45,
  ], [gs]);

  const whirlpoolObject = useMemo(() => getObjectById('whirlpool'), []);

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (whirlpoolObject) setSelectedObject(whirlpoolObject);
  }, [whirlpoolObject, setSelectedObject]);

  const dotTexture = useMemo(() => createDotTexture(), []);
  const glowTexture = useMemo(() => createWhirlpoolGlowTexture(), []);
  const companionGlowTexture = useMemo(() => createCompanionGlowTexture(), []);

  // Calculate the arm tip angle at normalized radius = 1.0 (edge)
  // This is where the companion should be positioned
  const getArmTipAngle = useCallback((time: number) => {
    const rt = 1.0; // At the edge
    // Use same spiral formula as stars - hard turn from center
    const logSpiral = Math.pow(rt, 0.5); // Square root gives hard turn at center
    const spinAngle = logSpiral * WHIRLPOOL.spinTurns * Math.PI * 2;
    const branchAngle = 0; // First arm
    
    // Add rotation based on time (same as shader)
    const omega = 1.0;
    const rotationAngle = time * omega;
    
    return branchAngle + spinAngle + rotationAngle;
  }, []);

  // Generate spiral arm stars - Whirlpool's distinctive tight, well-defined arms
  // with prominent pink HII regions and blue young stars
  const starsGeo = useMemo(() => {
    const { branches, spinTurns } = WHIRLPOOL;
    const maxRadius = WHIRLPOOL.diskRadius * gs;
    const starCount = 600000; // More stars to fill gaps

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();

    const k = 5.0; // Higher concentration toward center
    const denom = 1 - Math.exp(-k);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;

      const u = Math.random();
      const t = -Math.log(1 - u * denom) / k;
      
      const innerRadius = maxRadius * 0.015;
      const radius = innerRadius + t * (maxRadius - innerRadius);
      const rt = radius / maxRadius;

      const branchIndex = Math.floor(Math.random() * branches);
      const branchAngle = (branchIndex / branches) * Math.PI * 2;
      
      // Hard turn spiral - sqrt gives very tight winding at center that opens outward
      // This matches the Whirlpool's distinctive tight inner spiral
      const spiralFactor = Math.pow(rt, 0.5); // Square root = hard turn at center
      const spinAngle = spiralFactor * spinTurns * Math.PI * 2;

      // Very wide arms to fill space between them - almost continuous
      const armWidth = 0.18 + rt * 0.25;
      const armJitter = (Math.random() + Math.random() + Math.random() - 1.5) * armWidth;

      // Heavy inter-arm stars - nearly continuous disk with spiral enhancement
      const isInterArm = Math.random() < 0.72;
      const interArmJitter = isInterArm ? (Math.random() - 0.5) * (0.65 + rt * 0.6) : 0;

      const angle = branchAngle + spinAngle + armJitter + interArmJitter;

      const radialSpread = (0.06 + rt * 0.1) * maxRadius;
      const radialJitter = (Math.random() + Math.random() - 1) * radialSpread;
      const finalRadius = radius + radialJitter;

      positions[i3] = Math.cos(angle) * finalRadius;

      const thickness = 0.012 + rt * 0.03;
      const yJitter = (Math.random() + Math.random() + Math.random() - 1.5) * maxRadius * thickness;
      positions[i3 + 1] = yJitter;

      positions[i3 + 2] = Math.sin(angle) * finalRadius;

      // Whirlpool colors: cream core, pink HII regions, blue-gray outer disk
      const rand = Math.random();
      // Check if star is near arm center for HII region coloring
      const nearArmCenter = Math.abs(armJitter) < armWidth * 0.4;

      if (rt < 0.12) {
        // Core: warm cream/yellow
        if (rand < 0.7) {
          // Cream/warm white
          color.setHSL(0.12 + Math.random() * 0.04, 0.35 + Math.random() * 0.15, 0.85 + Math.random() * 0.1);
        } else {
          // Light gold
          color.setHSL(0.1 + Math.random() * 0.05, 0.5 + Math.random() * 0.2, 0.75 + Math.random() * 0.12);
        }
      } else if (rt < 0.25) {
        // Inner disk: transitioning from cream to mixed
        if (rand < 0.4) {
          // Cream/gold
          color.setHSL(0.11 + Math.random() * 0.04, 0.45 + Math.random() * 0.2, 0.7 + Math.random() * 0.12);
        } else if (rand < 0.7) {
          // Blue stars
          color.setHSL(0.56 + Math.random() * 0.1, 0.6 + Math.random() * 0.25, 0.55 + Math.random() * 0.15);
        } else if (nearArmCenter && rand < 0.85) {
          // Pink HII regions (on arm centers)
          color.setHSL(0.92 + Math.random() * 0.06, 0.85 + Math.random() * 0.12, 0.58 + Math.random() * 0.12);
        } else {
          // White
          color.setHSL(0.6 + Math.random() * 0.05, 0.2 + Math.random() * 0.1, 0.8 + Math.random() * 0.1);
        }
      } else if (rt < 0.5) {
        // Middle disk: prominent pink HII regions along arms, blue stars
        if (nearArmCenter && rand < 0.35) {
          // Pink/magenta HII (stronger on arm centers)
          color.setHSL(0.93 + Math.random() * 0.05, 0.88 + Math.random() * 0.1, 0.55 + Math.random() * 0.12);
        } else if (rand < 0.55) {
          // Blue young stars
          color.setHSL(0.55 + Math.random() * 0.12, 0.75 + Math.random() * 0.2, 0.52 + Math.random() * 0.15);
        } else if (rand < 0.72) {
          // Red/crimson (deep HII)
          color.setHSL(0.98 + Math.random() * 0.04, 0.8 + Math.random() * 0.15, 0.48 + Math.random() * 0.12);
        } else if (rand < 0.88) {
          // Cyan-blue
          color.setHSL(0.52 + Math.random() * 0.08, 0.7 + Math.random() * 0.2, 0.5 + Math.random() * 0.12);
        } else {
          // White-blue
          color.setHSL(0.58 + Math.random() * 0.06, 0.35 + Math.random() * 0.15, 0.72 + Math.random() * 0.12);
        }
      } else if (rt < 0.75) {
        // Outer disk: blue-gray with pink HII spots
        if (nearArmCenter && rand < 0.28) {
          // Pink HII regions
          color.setHSL(0.94 + Math.random() * 0.04, 0.82 + Math.random() * 0.15, 0.52 + Math.random() * 0.12);
        } else if (rand < 0.55) {
          // Blue
          color.setHSL(0.56 + Math.random() * 0.1, 0.7 + Math.random() * 0.2, 0.48 + Math.random() * 0.15);
        } else if (rand < 0.75) {
          // Blue-gray
          color.setHSL(0.58 + Math.random() * 0.08, 0.45 + Math.random() * 0.2, 0.52 + Math.random() * 0.12);
        } else if (rand < 0.9) {
          // Cyan
          color.setHSL(0.5 + Math.random() * 0.08, 0.65 + Math.random() * 0.2, 0.5 + Math.random() * 0.1);
        } else {
          // Faint red
          color.setHSL(0.0 + Math.random() * 0.03, 0.7 + Math.random() * 0.2, 0.45 + Math.random() * 0.1);
        }
      } else {
        // Outer edge: fainter blue-gray
        if (rand < 0.6) {
          // Blue-gray
          color.setHSL(0.57 + Math.random() * 0.1, 0.5 + Math.random() * 0.25, 0.45 + Math.random() * 0.15);
        } else if (rand < 0.85) {
          // Faint blue
          color.setHSL(0.55 + Math.random() * 0.12, 0.6 + Math.random() * 0.2, 0.42 + Math.random() * 0.12);
        } else {
          // Pink traces
          color.setHSL(0.95 + Math.random() * 0.04, 0.65 + Math.random() * 0.2, 0.45 + Math.random() * 0.1);
        }
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    return geo;
  }, [gs]);

  // Core bulge - warm cream/yellow
  const coreGeo = useMemo(() => {
    const coreCount = 75000;
    const positions = new Float32Array(coreCount * 3);
    const colors = new Float32Array(coreCount * 3);
    const color = new THREE.Color();
    const coreRadius = WHIRLPOOL.bulgeRadius * gs;

    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;

      const r = Math.pow(Math.random(), 1.4) * coreRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const t = r / coreRadius;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.45; // Flattened bulge
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Core: warm cream to light gold
      const rand = Math.random();
      if (t < 0.4) {
        // Inner core: bright cream
        color.setHSL(0.12 + Math.random() * 0.03, 0.3 + Math.random() * 0.1, 0.9 + Math.random() * 0.08);
      } else if (rand < 0.6) {
        // Cream-gold
        color.setHSL(0.1 + Math.random() * 0.04, 0.45 + Math.random() * 0.15, 0.78 + Math.random() * 0.1);
      } else if (rand < 0.85) {
        // Gold
        color.setHSL(0.08 + Math.random() * 0.05, 0.55 + Math.random() * 0.2, 0.68 + Math.random() * 0.12);
      } else {
        // Slight orange
        color.setHSL(0.06 + Math.random() * 0.04, 0.6 + Math.random() * 0.15, 0.6 + Math.random() * 0.12);
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    return geo;
  }, [gs]);

  // Halo stars
  const haloGeo = useMemo(() => {
    const haloCount = 25000;
    const positions = new Float32Array(haloCount * 3);
    const colors = new Float32Array(haloCount * 3);
    const color = new THREE.Color();
    const haloRadius = WHIRLPOOL.diskRadius * gs * 1.2;

    for (let i = 0; i < haloCount; i++) {
      const i3 = i * 3;

      const r = (0.35 + Math.pow(Math.random(), 0.7) * 0.65) * haloRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.5;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Halo: faint blue-gray and cream
      const rand = Math.random();
      if (rand < 0.5) {
        color.setHSL(0.58 + Math.random() * 0.1, 0.35 + Math.random() * 0.2, 0.5 + Math.random() * 0.15);
      } else if (rand < 0.8) {
        color.setHSL(0.12 + Math.random() * 0.06, 0.3 + Math.random() * 0.15, 0.55 + Math.random() * 0.15);
      } else {
        color.setHSL(0.55 + Math.random() * 0.08, 0.25 + Math.random() * 0.15, 0.6 + Math.random() * 0.12);
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    return geo;
  }, [gs]);

  // Dust lanes - diffuse dark regions blended throughout spiral arms
  const dustLanesGeo = useMemo(() => {
    const { branches, spinTurns } = WHIRLPOOL;
    const maxRadius = WHIRLPOOL.diskRadius * gs;
    const dustCount = 120000; // Fewer but larger particles

    const positions = new Float32Array(dustCount * 3);
    const colors = new Float32Array(dustCount * 3);
    const color = new THREE.Color();

    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;

      // Distribute throughout the arms - stay within disk
      const t = 0.15 + Math.pow(Math.random(), 0.9) * 0.6; // Max 75% radius
      const radius = t * maxRadius;
      const rt = radius / maxRadius;

      const branchIndex = Math.floor(Math.random() * branches);
      const branchAngle = (branchIndex / branches) * Math.PI * 2;
      
      // Use same hard turn spiral as stars
      const spiralFactor = Math.pow(rt, 0.5);
      const spinAngle = spiralFactor * spinTurns * Math.PI * 2;

      // Blend throughout arms - very wide spread
      const trailingOffset = (Math.random() - 0.5) * 0.12;
      
      // Very wide lane spread to blend naturally with arm stars
      const laneWidth = 0.08 + rt * 0.12;
      const laneJitter = (Math.random() + Math.random() + Math.random() - 1.5) * laneWidth;

      const angle = branchAngle + spinAngle + trailingOffset + laneJitter;

      positions[i3] = Math.cos(angle) * radius;
      
      const thickness = 0.012;
      const yJitter = (Math.random() - 0.5) * maxRadius * thickness;
      positions[i3 + 1] = yJitter;
      
      positions[i3 + 2] = Math.sin(angle) * radius;

      // Softer dust colors - more transparent browns
      const dustVariation = Math.random();
      if (dustVariation < 0.4) {
        // Dark reddish-brown
        color.setHSL(0.03 + Math.random() * 0.03, 0.5 + Math.random() * 0.2, 0.06 + Math.random() * 0.04);
      } else if (dustVariation < 0.7) {
        // Medium brown
        color.setHSL(0.05 + Math.random() * 0.03, 0.4 + Math.random() * 0.2, 0.08 + Math.random() * 0.04);
      } else {
        // Faint brown
        color.setHSL(0.04 + Math.random() * 0.02, 0.35 + Math.random() * 0.15, 0.05 + Math.random() * 0.03);
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    return geo;
  }, [gs]);

  // Companion galaxy NGC 5195 - smaller irregular galaxy
  const companionGeo = useMemo(() => {
    const count = 50000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const compRadius = NGC5195.radius * gs;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Irregular/elliptical distribution
      const r = Math.pow(Math.random(), 1.1) * compRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const t = r / compRadius;

      // Slightly stretched shape
      positions[i3] = r * Math.sin(phi) * Math.cos(theta) * 1.2;
      positions[i3 + 1] = r * Math.cos(phi) * 0.7;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // NGC 5195: older stellar population - warm yellow/orange
      const rand = Math.random();
      if (t < 0.3) {
        // Bright center: cream-yellow
        color.setHSL(0.11 + Math.random() * 0.03, 0.4 + Math.random() * 0.15, 0.82 + Math.random() * 0.1);
      } else if (rand < 0.5) {
        // Yellow-gold
        color.setHSL(0.1 + Math.random() * 0.05, 0.55 + Math.random() * 0.2, 0.65 + Math.random() * 0.15);
      } else if (rand < 0.8) {
        // Orange-gold (older stars)
        color.setHSL(0.07 + Math.random() * 0.04, 0.6 + Math.random() * 0.2, 0.55 + Math.random() * 0.15);
      } else {
        // Light orange
        color.setHSL(0.05 + Math.random() * 0.04, 0.5 + Math.random() * 0.2, 0.6 + Math.random() * 0.12);
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    return geo;
  }, [gs]);

  // Tidal bridge geometry - connects arm tip to companion with color/density transition
  // Uses normalized coordinates (0-1) that will be transformed by the bridge group
  const tidalBridgeGeo = useMemo(() => {
    const count = 50000; // Dense bridge
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    // Bridge is generated as a straight strip from (0,0,0) to (1,0,0)
    // and then positioned/rotated in the render to connect arm tip to companion
    const bridgeLength = 1.0;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Use exponential distribution - more stars near arm tip and near companion
      const rawT = Math.random();
      const t = rawT < 0.5 ? Math.pow(rawT * 2, 1.5) * 0.5 : 0.5 + Math.pow((rawT - 0.5) * 2, 0.7) * 0.5;
      
      // Wider at ends, narrower in middle (normalized spread)
      const spread = 0.08 + Math.abs(t - 0.5) * 0.15;

      // Generate along X axis from 0 to bridgeLength
      const x = t * bridgeLength;
      const y = (Math.random() - 0.5) * spread * 0.3;
      const z = (Math.random() - 0.5) * spread;
      
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // Color transition: blue/pink at arm end → yellow/orange near companion
      const rand = Math.random();
      if (t < 0.4) {
        // Near arm tip: blue and pink like the spiral arms
        if (rand < 0.45) {
          // Blue stars
          color.setHSL(0.56 + Math.random() * 0.1, 0.6 + Math.random() * 0.25, 0.5 + Math.random() * 0.15);
        } else if (rand < 0.75) {
          // Pink HII
          color.setHSL(0.94 + Math.random() * 0.05, 0.65 + Math.random() * 0.2, 0.5 + Math.random() * 0.12);
        } else {
          // Dust
          color.setHSL(0.03 + Math.random() * 0.03, 0.5 + Math.random() * 0.2, 0.2 + Math.random() * 0.1);
        }
      } else if (t < 0.7) {
        // Middle: transitional colors
        if (rand < 0.35) {
          // Blue fading
          color.setHSL(0.55 + Math.random() * 0.1, 0.45 + Math.random() * 0.2, 0.45 + Math.random() * 0.12);
        } else if (rand < 0.55) {
          // Pink fading
          color.setHSL(0.95 + Math.random() * 0.04, 0.5 + Math.random() * 0.2, 0.45 + Math.random() * 0.1);
        } else if (rand < 0.75) {
          // Cream transitioning
          color.setHSL(0.1 + Math.random() * 0.04, 0.4 + Math.random() * 0.15, 0.55 + Math.random() * 0.12);
        } else {
          // Dust
          color.setHSL(0.04 + Math.random() * 0.03, 0.5 + Math.random() * 0.2, 0.15 + Math.random() * 0.1);
        }
      } else {
        // Near companion: warm yellow/orange like NGC 5195
        if (rand < 0.4) {
          // Yellow-cream
          color.setHSL(0.11 + Math.random() * 0.04, 0.45 + Math.random() * 0.2, 0.65 + Math.random() * 0.12);
        } else if (rand < 0.7) {
          // Orange-gold
          color.setHSL(0.08 + Math.random() * 0.04, 0.55 + Math.random() * 0.2, 0.55 + Math.random() * 0.12);
        } else if (rand < 0.85) {
          // Light gold
          color.setHSL(0.1 + Math.random() * 0.03, 0.4 + Math.random() * 0.15, 0.7 + Math.random() * 0.1);
        } else {
          // Dust
          color.setHSL(0.04 + Math.random() * 0.02, 0.45 + Math.random() * 0.2, 0.2 + Math.random() * 0.1);
        }
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    return geo;
  }, []);

  // Calculate bridge length for scaling
  const bridgeLength = useMemo(() => {
    const armTipRadius = WHIRLPOOL.diskRadius * gs * 0.98;
    const companionDist = NGC5195.distanceFromCenter * gs;
    return companionDist - armTipRadius + 5000 * gs; // Bridge from arm tip to companion
  }, [gs]);

  // Update companion position to match arm rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.getWorldPosition(centerWorldPos.current);
      const pos: [number, number, number] = [
        centerWorldPos.current.x,
        centerWorldPos.current.y,
        centerWorldPos.current.z,
      ];
      setObjectWorldPosition('whirlpool', pos);
    }

    // Update rotation time (same as DifferentialRotationMaterial)
    if (!isInStarSystem) {
      rotationTimeRef.current += delta * 0.00625 * timeSpeed;
    }

    // Update companion position to follow arm tip
    const armAngle = getArmTipAngle(rotationTimeRef.current);
    const companionDist = NGC5195.distanceFromCenter * gs;
    const armTipRadius = WHIRLPOOL.diskRadius * gs * 0.98;
    
    if (companionGroupRef.current) {
      companionGroupRef.current.position.x = Math.cos(armAngle) * companionDist;
      companionGroupRef.current.position.y = NGC5195.yOffset * gs;
      companionGroupRef.current.position.z = Math.sin(armAngle) * companionDist;
    }
    
    // Update bridge position and rotation to connect arm tip to companion
    if (bridgeGroupRef.current) {
      // Position bridge at arm tip
      bridgeGroupRef.current.position.x = Math.cos(armAngle) * armTipRadius;
      bridgeGroupRef.current.position.y = 0;
      bridgeGroupRef.current.position.z = Math.sin(armAngle) * armTipRadius;
      
      // Rotate bridge to point toward companion
      bridgeGroupRef.current.rotation.y = -armAngle;
    }
  });

  const diskR = WHIRLPOOL.diskRadius * gs;
  const compR = NGC5195.radius * gs;

  return (
    <group ref={groupRef} position={whirlpoolPosition}>
      {/* Apply slight inclination - nearly face-on */}
      <group rotation={[WHIRLPOOL.inclination, 0.1, 0]}>
        {/* Halo stars */}
        <DifferentialRotationPoints
          key="whirlpool-halo"
          geometry={haloGeo}
          size={gs * 35}
          map={dotTexture}
          opacity={0.28}
          maxRadius={diskR * 1.2}
          rotationMultiplier={0.7}
          differentialStrength={0.08}
          renderOrder={1}
        />

        {/* Main spiral arms */}
        <DifferentialRotationPoints
          key="whirlpool-arms"
          geometry={starsGeo}
          size={gs * 52}
          map={dotTexture}
          opacity={0.35}
          maxRadius={diskR}
          rotationMultiplier={1}
          differentialStrength={0.06}
          renderOrder={2}
        />

        {/* Dust lanes - larger, softer particles blended with arms */}
        <DifferentialRotationPoints
          key="whirlpool-dust"
          geometry={dustLanesGeo}
          size={gs * 140}
          map={dotTexture}
          opacity={0.28}
          maxRadius={diskR}
          rotationMultiplier={1}
          differentialStrength={0.06}
          renderOrder={0}
        />

        {/* Core bulge */}
        <DifferentialRotationPoints
          key="whirlpool-core"
          geometry={coreGeo}
          size={gs * 80}
          map={dotTexture}
          opacity={0.5}
          maxRadius={WHIRLPOOL.bulgeRadius * gs}
          rotationMultiplier={1.4}
          differentialStrength={0.1}
          renderOrder={3}
        />


        {/* Center glow */}
        <sprite renderOrder={4} frustumCulled={false} scale={[diskR * 2.0, diskR * 2.0, 1]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            side={THREE.DoubleSide}
            toneMapped
          />
        </sprite>

        {/* Companion galaxy NGC 5195 - position updated in useFrame */}
        <group ref={companionGroupRef}>
          <points frustumCulled={false} renderOrder={2}>
            <bufferGeometry attach="geometry" {...companionGeo} />
            <pointsMaterial
              size={gs * 45}
              map={dotTexture}
              vertexColors
              transparent
              opacity={0.55}
              blending={THREE.NormalBlending}
              depthWrite={false}
              sizeAttenuation
            />
          </points>

          {/* Companion glow */}
          <sprite renderOrder={3} frustumCulled={false} scale={[compR * 2.5, compR * 2.5, 1]}>
            <spriteMaterial
              map={companionGlowTexture}
              transparent
              opacity={0.55}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={false}
              side={THREE.DoubleSide}
              toneMapped
            />
          </sprite>
        </group>
      </group>

      {/* Click target */}
      <mesh 
        onClick={handleClick}
        onPointerDown={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[diskR * 1.3, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};
