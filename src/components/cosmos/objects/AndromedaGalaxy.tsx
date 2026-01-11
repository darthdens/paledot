import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { getObjectById } from '../data/celestialObjects';
import { DifferentialRotationPoints } from './DifferentialRotationMaterial';

interface AndromedaGalaxyProps {
  visualScale: number;
}

// Andromeda galaxy parameters - based on real data
// Distance: 2.537 million light-years from Milky Way
// Diameter: ~220,000 light-years (about 2x Milky Way's ~100,000 ly based on reference images)
// Inclination: ~77° from face-on (appears nearly edge-on)
// Has two prominent spiral arms with distinctive dust rings
// 
// Scale reference: If Milky Way were a tennis ball, Andromeda would be 5.6 feet away
// and slightly larger (about 1.5-2x the size)
const ANDROMEDA = {
  diskRadius: 110000, // Half of 220,000 ly diameter (larger than Milky Way's 52,500 ly radius)
  bulgeRadius: 20000, // Larger bulge than Milky Way
  branches: 2, // Two main spiral arms
  spinTurns: 1.4, // Tighter spiral
  inclination: (77 * Math.PI) / 180, // 77° inclination
  distanceFromMilkyWay: 2.537e6, // 2.537 million light-years (accurate)
};

// Andromeda glow texture: white/blue center → orange dust ring → blue outer haze
const createAndromedaGlowTexture = () => {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

  // White-blue core → orange dust ring → blue outer haze
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');     // Bright white center
  gradient.addColorStop(0.08, 'rgba(200, 220, 255, 0.85)');  // White-blue
  gradient.addColorStop(0.15, 'rgba(150, 180, 255, 0.7)');   // Light blue
  gradient.addColorStop(0.25, 'rgba(100, 150, 255, 0.5)');   // Blue
  gradient.addColorStop(0.35, 'rgba(255, 180, 80, 0.4)');    // Orange dust ring
  gradient.addColorStop(0.45, 'rgba(255, 200, 100, 0.35)');  // Golden
  gradient.addColorStop(0.55, 'rgba(180, 140, 100, 0.25)');  // Brown-orange
  gradient.addColorStop(0.7, 'rgba(80, 120, 200, 0.15)');    // Blue haze
  gradient.addColorStop(0.85, 'rgba(60, 100, 180, 0.08)');   // Fading blue
  gradient.addColorStop(1, 'rgba(40, 80, 160, 0)');          // Transparent

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

// Simple crisp dot texture (same as MilkyWay)
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

export const AndromedaGalaxy = ({ visualScale }: AndromedaGalaxyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const centerWorldPos = useRef(new THREE.Vector3());

  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);
  const setSelectedObject = useCosmosStore((s) => s.setSelectedObject);

  const gs = UNITS.KM_PER_LY * visualScale;
  
  // Position: Andromeda is roughly in the direction of constellation Andromeda
  // We'll place it offset in 3D space at the correct distance
  const andromedaPosition = useMemo<[number, number, number]>(() => [
    ANDROMEDA.distanceFromMilkyWay * gs * 0.7,  // X component
    ANDROMEDA.distanceFromMilkyWay * gs * 0.15, // Slight Y offset
    ANDROMEDA.distanceFromMilkyWay * gs * 0.7,  // Z component
  ], [gs]);

  const andromedaObject = useMemo(() => getObjectById('andromeda'), []);

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (andromedaObject) setSelectedObject(andromedaObject);
  }, [andromedaObject, setSelectedObject]);

  const dotTexture = useMemo(() => createDotTexture(), []);
  const glowTexture = useMemo(() => createAndromedaGlowTexture(), []);

  // Generate spiral arm stars with Andromeda's characteristic colors
  // Blue young stars in arms, orange/golden dust lanes, white/blue core
  const starsGeo = useMemo(() => {
    const { branches, spinTurns } = ANDROMEDA;
    const maxRadius = ANDROMEDA.diskRadius * gs;
    const starCount = 450000; // Increased star count for fuller galaxy

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();

    const k = 4.5;
    const denom = 1 - Math.exp(-k);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;

      const u = Math.random();
      const t = -Math.log(1 - u * denom) / k;

      const innerRadius = maxRadius * 0.02;
      const radius = innerRadius + t * (maxRadius - innerRadius);
      const rt = radius / maxRadius;

      const branchIndex = Math.floor(Math.random() * branches);
      const branchAngle = (branchIndex / branches) * Math.PI * 2;

      const spinAngle = rt * spinTurns * Math.PI * 2;

      // Wider arm spread for more stars around arms
      const armWidth = 0.12 + rt * 0.20;
      const armJitter = (Math.random() + Math.random() + Math.random() - 1.5) * armWidth;

      // More inter-arm stars (45% chance instead of 30%)
      const isInterArm = Math.random() < 0.45;
      const interArmJitter = isInterArm ? (Math.random() - 0.5) * (1.0 + rt * 0.7) : 0;

      const angle = branchAngle + spinAngle + armJitter + interArmJitter;

      // More radial spread for fuller arms
      const radialSpread = (0.06 + rt * 0.12) * maxRadius;
      const radialJitter = (Math.random() + Math.random() - 1) * radialSpread;
      const finalRadius = radius + radialJitter;

      positions[i3] = Math.cos(angle) * finalRadius;

      const thickness = 0.015 + rt * 0.025;
      const yJitter = (Math.random() + Math.random() + Math.random() - 1.5) * maxRadius * thickness;
      positions[i3 + 1] = yJitter;

      positions[i3 + 2] = Math.sin(angle) * finalRadius;

      // Andromeda colors: white/blue center → orange dust lanes → vibrant blue outer arms
      const rand = Math.random();

      if (rt < 0.12) {
        // Core: bright white and blue
        if (rand < 0.6) {
          // White
          color.setHSL(0.6 + Math.random() * 0.05, 0.15 + Math.random() * 0.1, 0.85 + Math.random() * 0.1);
        } else {
          // Light blue
          color.setHSL(0.58 + Math.random() * 0.06, 0.6 + Math.random() * 0.2, 0.75 + Math.random() * 0.12);
        }
      } else if (rt < 0.25) {
        // Inner region: blue with some white
        if (rand < 0.7) {
          // Blue - more saturated
          color.setHSL(0.58 + Math.random() * 0.08, 0.75 + Math.random() * 0.2, 0.58 + Math.random() * 0.12);
        } else {
          // White-blue
          color.setHSL(0.6 + Math.random() * 0.04, 0.4 + Math.random() * 0.15, 0.75 + Math.random() * 0.1);
        }
      } else if (rt < 0.45) {
        // Dust ring region: orange/golden mixed with blue
        if (rand < 0.45) {
          // Orange/golden dust
          color.setHSL(0.08 + Math.random() * 0.06, 0.9 + Math.random() * 0.1, 0.52 + Math.random() * 0.12);
        } else if (rand < 0.85) {
          // Vibrant blue stars in arms
          color.setHSL(0.56 + Math.random() * 0.1, 0.85 + Math.random() * 0.15, 0.55 + Math.random() * 0.12);
        } else {
          // Cyan-blue (hot young stars)
          color.setHSL(0.52 + Math.random() * 0.06, 0.9 + Math.random() * 0.1, 0.6 + Math.random() * 0.1);
        }
      } else if (rt < 0.7) {
        // Outer arms: predominantly vibrant blue young stars
        if (rand < 0.8) {
          // Vibrant blue - high saturation, good brightness
          color.setHSL(0.55 + Math.random() * 0.12, 0.9 + Math.random() * 0.1, 0.55 + Math.random() * 0.15);
        } else if (rand < 0.92) {
          // Cyan-blue (very hot young stars)
          color.setHSL(0.5 + Math.random() * 0.08, 0.95, 0.6 + Math.random() * 0.1);
        } else {
          // Orange remnants (fewer)
          color.setHSL(0.06 + Math.random() * 0.05, 0.85 + Math.random() * 0.1, 0.5 + Math.random() * 0.1);
        }
      } else {
        // Outer halo: vibrant blue young stars (star-forming regions at edges)
        if (rand < 0.85) {
          // Bright vibrant blue
          color.setHSL(0.55 + Math.random() * 0.1, 0.92 + Math.random() * 0.08, 0.5 + Math.random() * 0.15);
        } else {
          // Cyan highlights
          color.setHSL(0.5 + Math.random() * 0.06, 0.95, 0.58 + Math.random() * 0.12);
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

  // Core bulge - white/blue, larger than Milky Way's
  const coreGeo = useMemo(() => {
    const coreCount = 100000;
    const positions = new Float32Array(coreCount * 3);
    const colors = new Float32Array(coreCount * 3);
    const color = new THREE.Color();
    const coreRadius = ANDROMEDA.bulgeRadius * gs * 0.9;

    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;

      const r = Math.pow(Math.random(), 1.2) * coreRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const t = r / coreRadius;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.5; // Slightly flattened
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Core: white to light blue (older metal-rich stars)
      const rand = Math.random();
      if (t < 0.3) {
        // Very center: bright white
        color.setHSL(0.6 + Math.random() * 0.05, 0.1 + Math.random() * 0.1, 0.9 + Math.random() * 0.08);
      } else if (rand < 0.5) {
        // White-blue
        color.setHSL(0.58 + Math.random() * 0.06, 0.25 + Math.random() * 0.15, 0.78 + Math.random() * 0.12);
      } else if (rand < 0.8) {
        // Light blue
        color.setHSL(0.58 + Math.random() * 0.08, 0.45 + Math.random() * 0.2, 0.65 + Math.random() * 0.15);
      } else {
        // Slight orange tint (old stars)
        color.setHSL(0.08 + Math.random() * 0.04, 0.4 + Math.random() * 0.2, 0.6 + Math.random() * 0.15);
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
    const count = 15000;
    const maxRadius = ANDROMEDA.diskRadius * gs * 0.5;
    const maxHeight = ANDROMEDA.diskRadius * gs * 0.15;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const t = Math.pow(Math.random(), 2);
      const innerRadius = maxRadius * 0.05;
      const radius = innerRadius + t * (maxRadius - innerRadius);
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 2] = Math.sin(angle) * radius;

      const rt = radius / maxRadius;
      const heightScale = 0.3 + rt * 0.7;
      const y = (Math.random() * 2 - 1) * maxHeight * heightScale;
      positions[i3 + 1] = y;

      // Halo: older stars, mostly white/yellow with some blue stragglers
      const rand = Math.random();
      if (rand < 0.5) {
        // White-yellow
        color.setHSL(0.12 + Math.random() * 0.06, 0.3 + Math.random() * 0.2, 0.65 + Math.random() * 0.15);
      } else if (rand < 0.8) {
        // Light orange
        color.setHSL(0.08 + Math.random() * 0.05, 0.5 + Math.random() * 0.2, 0.55 + Math.random() * 0.15);
      } else {
        // Blue stragglers
        color.setHSL(0.58 + Math.random() * 0.08, 0.6 + Math.random() * 0.2, 0.55 + Math.random() * 0.15);
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
      setObjectWorldPosition('andromeda', pos);
    }
    
    // Differential star rotation is now handled by DifferentialRotationPoints shader
  });

  const diskR = ANDROMEDA.diskRadius * gs;

  return (
    <group ref={groupRef} position={andromedaPosition}>
      {/* Apply 77° inclination - tilt around X axis */}
      <group rotation={[ANDROMEDA.inclination, 0.3, 0]}>
        {/* Stars with differential rotation - inner stars rotate faster */}
        
        {/* Halo stars - render first (back) */}
        <DifferentialRotationPoints
          geometry={haloGeo}
          size={gs * 40}
          map={dotTexture}
          opacity={0.3}
          maxRadius={diskR * 1.2}
          rotationMultiplier={0.8}
          renderOrder={1}
        />

        {/* Main spiral arms */}
        <DifferentialRotationPoints
          geometry={starsGeo}
          size={gs * 55}
          map={dotTexture}
          opacity={0.35}
          maxRadius={diskR}
          rotationMultiplier={1}
          renderOrder={2}
        />

        {/* Core bulge - render on top */}
        <DifferentialRotationPoints
          geometry={coreGeo}
          size={gs * 90}
          map={dotTexture}
          opacity={0.5}
          maxRadius={ANDROMEDA.bulgeRadius * gs}
          rotationMultiplier={1.5}
          renderOrder={3}
        />

        {/* Center glow (billboard) - topmost */}
        <sprite renderOrder={4} frustumCulled={false} scale={[diskR * 2.4, diskR * 2.4, 1]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            side={THREE.DoubleSide}
            toneMapped
          />
        </sprite>
      </group>

      {/* Click target (no label - just for selection) */}
      <mesh 
        onClick={handleClick}
        onPointerDown={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[diskR * 1.2, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};
