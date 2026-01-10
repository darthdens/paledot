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
// Distance: ~23 million light-years from Milky Way
// Diameter: ~76,000 light-years (similar to Milky Way)
// Distinctive features: 
// - Grand-design spiral with 2 very well-defined arms
// - Warm cream/yellow central bulge
// - Prominent pink HII (star-forming) regions along arms
// - Interacting with companion galaxy NGC 5195
// - Nearly face-on orientation (~20° inclination)
const WHIRLPOOL = {
  diskRadius: 38000, // Half of 76,000 ly diameter
  bulgeRadius: 5000, // Prominent central bulge
  branches: 2, // Two beautifully defined spiral arms
  spinTurns: 1.4, // Total spiral turns (logarithmic, so tighter at base)
  inclination: (20 * Math.PI) / 180, // ~20° inclination (nearly face-on)
  distanceFromMilkyWay: 23e6, // 23 million light-years
};

// Companion galaxy NGC 5195 parameters - positioned at the end of one spiral arm
const NGC5195 = {
  radius: 10000, // Smaller irregular companion
  // Position directly at the northern arm tip
  offsetX: 38000,
  offsetY: 4000,
  offsetZ: 8000,
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
  const centerWorldPos = useRef(new THREE.Vector3());

  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);
  const setSelectedObject = useCosmosStore((s) => s.setSelectedObject);

  const gs = UNITS.KM_PER_LY * visualScale;
  
  // Position: Whirlpool is in constellation Canes Venatici, different direction from Local Group galaxies
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

  // Generate spiral arm stars - Whirlpool's distinctive tight, well-defined arms
  // with prominent pink HII regions and blue young stars
  const starsGeo = useMemo(() => {
    const { branches, spinTurns } = WHIRLPOOL;
    const maxRadius = WHIRLPOOL.diskRadius * gs;
    const starCount = 480000; // Increased for denser arms and inter-arm region

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
      // Logarithmic spiral - tighter at base, opens up gradually
      // This creates the tight winding near the core that opens outward
      const logSpiral = Math.log(1 + rt * 3) / Math.log(4); // Logarithmic scaling
      const spinAngle = logSpiral * spinTurns * Math.PI * 2;

      // Arms very tight near core, widen slightly outward
      const armWidth = 0.04 + rt * 0.12;
      const armJitter = (Math.random() + Math.random() + Math.random() - 1.5) * armWidth;

      // Moderate inter-arm stars
      const isInterArm = Math.random() < 0.35;
      const interArmJitter = isInterArm ? (Math.random() - 0.5) * (0.25 + rt * 0.35) : 0;

      const angle = branchAngle + spinAngle + armJitter + interArmJitter;

      const radialSpread = (0.03 + rt * 0.06) * maxRadius;
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

  // Dust lanes - dark regions along the inner edge of spiral arms
  const dustLanesGeo = useMemo(() => {
    const { branches, spinTurns } = WHIRLPOOL;
    const maxRadius = WHIRLPOOL.diskRadius * gs;
    const dustCount = 180000;

    const positions = new Float32Array(dustCount * 3);
    const colors = new Float32Array(dustCount * 3);
    const color = new THREE.Color();

    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;

      // Distribute along the inner/trailing edge of spiral arms
      const t = 0.12 + Math.pow(Math.random(), 0.7) * 0.75;
      const radius = t * maxRadius;
      const rt = radius / maxRadius;

      const branchIndex = Math.floor(Math.random() * branches);
      // Offset to the trailing edge of each arm (where dust lanes appear)
      const branchAngle = (branchIndex / branches) * Math.PI * 2 - 0.1;
      
      // Use same logarithmic spiral as stars
      const logSpiral = Math.log(1 + rt * 3) / Math.log(4);
      const spinAngle = logSpiral * spinTurns * Math.PI * 2;

      // Very tight lane along arm edge
      const laneWidth = 0.025 + rt * 0.04;
      const laneJitter = (Math.random() + Math.random() - 1) * laneWidth;

      const angle = branchAngle + spinAngle + laneJitter;

      positions[i3] = Math.cos(angle) * radius;
      
      const thickness = 0.006;
      const yJitter = (Math.random() - 0.5) * maxRadius * thickness;
      positions[i3 + 1] = yJitter;
      
      positions[i3 + 2] = Math.sin(angle) * radius;

      // Darker, more visible dust - reddish-brown to black
      const dustVariation = Math.random();
      if (dustVariation < 0.5) {
        // Dark reddish-brown
        color.setHSL(0.03 + Math.random() * 0.02, 0.6 + Math.random() * 0.2, 0.04 + Math.random() * 0.03);
      } else if (dustVariation < 0.8) {
        // Very dark brown
        color.setHSL(0.05 + Math.random() * 0.02, 0.5 + Math.random() * 0.2, 0.03 + Math.random() * 0.02);
      } else {
        // Near black
        color.setHSL(0.0, 0.2 + Math.random() * 0.15, 0.015 + Math.random() * 0.015);
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

  // Tidal bridge between M51 and NGC 5195 - direct connection
  const tidalBridgeGeo = useMemo(() => {
    const count = 18000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    // Bridge starts from outer disk edge toward companion
    const startX = WHIRLPOOL.diskRadius * gs * 0.75;
    const startZ = WHIRLPOOL.diskRadius * gs * 0.2;
    const endX = NGC5195.offsetX * gs;
    const endY = NGC5195.offsetY * gs;
    const endZ = NGC5195.offsetZ * gs;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const t = Math.random();
      const spread = 0.15 + t * 0.25; // Widens toward companion

      // Curved path with some spiral continuation
      const curve = Math.sin(t * Math.PI) * 0.3;
      
      positions[i3] = startX + (endX - startX) * t + (Math.random() - 0.5) * spread * WHIRLPOOL.diskRadius * gs;
      positions[i3 + 1] = endY * t + (Math.random() - 0.5) * spread * WHIRLPOOL.diskRadius * gs * 0.3;
      positions[i3 + 2] = startZ + (endZ - startZ) * t + curve * WHIRLPOOL.diskRadius * gs + (Math.random() - 0.5) * spread * WHIRLPOOL.diskRadius * gs;

      // Bridge: mixed blue and reddish (disturbed gas + stars)
      const rand = Math.random();
      if (rand < 0.4) {
        color.setHSL(0.58 + Math.random() * 0.1, 0.5 + Math.random() * 0.25, 0.45 + Math.random() * 0.15);
      } else if (rand < 0.7) {
        color.setHSL(0.95 + Math.random() * 0.05, 0.5 + Math.random() * 0.25, 0.45 + Math.random() * 0.15);
      } else {
        color.setHSL(0.1 + Math.random() * 0.05, 0.4 + Math.random() * 0.2, 0.5 + Math.random() * 0.15);
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

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.getWorldPosition(centerWorldPos.current);
      const pos: [number, number, number] = [
        centerWorldPos.current.x,
        centerWorldPos.current.y,
        centerWorldPos.current.z,
      ];
      setObjectWorldPosition('whirlpool', pos);
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
          opacity={0.88}
          maxRadius={diskR}
          rotationMultiplier={1}
          differentialStrength={0.06}
          renderOrder={2}
        />

        {/* Dust lanes between arms - using DifferentialRotationPoints to rotate with galaxy */}
        <DifferentialRotationPoints
          key="whirlpool-dust"
          geometry={dustLanesGeo}
          size={gs * 75}
          map={dotTexture}
          opacity={0.85}
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
          opacity={0.95}
          maxRadius={WHIRLPOOL.bulgeRadius * gs}
          rotationMultiplier={1.4}
          differentialStrength={0.1}
          renderOrder={3}
        />

        {/* Tidal bridge to companion */}
        <points frustumCulled={false} renderOrder={1}>
          <bufferGeometry attach="geometry" {...tidalBridgeGeo} />
          <pointsMaterial
            size={gs * 30}
            map={dotTexture}
            vertexColors
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            sizeAttenuation
          />
        </points>

        {/* Center glow */}
        <sprite renderOrder={4} frustumCulled={false} scale={[diskR * 2.0, diskR * 2.0, 1]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            opacity={0.82}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </sprite>

        {/* Companion galaxy NGC 5195 */}
        <group position={[NGC5195.offsetX * gs, NGC5195.offsetY * gs, NGC5195.offsetZ * gs]}>
          <points frustumCulled={false} renderOrder={2}>
            <bufferGeometry attach="geometry" {...companionGeo} />
            <pointsMaterial
              size={gs * 45}
              map={dotTexture}
              vertexColors
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              sizeAttenuation
            />
          </points>

          {/* Companion glow */}
          <sprite renderOrder={3} frustumCulled={false} scale={[compR * 2.5, compR * 2.5, 1]}>
            <spriteMaterial
              map={companionGlowTexture}
              transparent
              opacity={0.75}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={false}
              side={THREE.DoubleSide}
              toneMapped={false}
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
