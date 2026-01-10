import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { getObjectById } from '../data/celestialObjects';
import { DifferentialRotationPoints } from './DifferentialRotationMaterial';

interface TriangulumGalaxyProps {
  visualScale: number;
}

// Triangulum Galaxy (M33) parameters - based on real astronomical data
// Distance: 2.73 million light-years from Milky Way
// Diameter: ~60,000 light-years (about half the size of Milky Way)
// Distinctive features (visual): blue-purple core, FOUR arms with ~one spiral turn, yellow-green outer regions, pink HII regions
const TRIANGULUM = {
  diskRadius: 30000, // Half of 60,000 ly diameter (do not change size)
  bulgeRadius: 4000, // Smaller bulge than Andromeda
  branches: 4, // Four main arms
  spinTurns: 0.55, // Gentle curl: four arms that barely form a spiral
  inclination: (55 * Math.PI) / 180, // ~55° inclination
  distanceFromMilkyWay: 2.73e6, // 2.73 million light-years
};

// Triangulum glow texture: blue-purple center → yellow-green outer (matching reference)
const createTriangulumGlowTexture = () => {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

  // Blue-purple core → pink → yellow-green outer arms
  gradient.addColorStop(0, 'rgba(200, 180, 255, 0.95)');     // Light purple-white center
  gradient.addColorStop(0.08, 'rgba(150, 140, 255, 0.85)');  // Purple-blue
  gradient.addColorStop(0.15, 'rgba(120, 140, 255, 0.7)');   // Blue-purple
  gradient.addColorStop(0.25, 'rgba(100, 150, 255, 0.55)');  // Blue
  gradient.addColorStop(0.35, 'rgba(255, 150, 180, 0.4)');   // Pink (HII regions)
  gradient.addColorStop(0.45, 'rgba(200, 200, 100, 0.35)');  // Yellow-green transition
  gradient.addColorStop(0.55, 'rgba(180, 200, 80, 0.28)');   // Yellow-green
  gradient.addColorStop(0.7, 'rgba(150, 180, 60, 0.18)');    // Green-yellow
  gradient.addColorStop(0.85, 'rgba(120, 160, 50, 0.08)');   // Fading green
  gradient.addColorStop(1, 'rgba(100, 140, 40, 0)');         // Transparent

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

export const TriangulumGalaxy = ({ visualScale }: TriangulumGalaxyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const centerWorldPos = useRef(new THREE.Vector3());

  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);
  const setSelectedObject = useCosmosStore((s) => s.setSelectedObject);

  const gs = UNITS.KM_PER_LY * visualScale;
  
  // Position: Triangulum forms a triangle with Milky Way (origin) and Andromeda
  // Andromeda is at: [2.537e6 * 0.7, 2.537e6 * 0.15, 2.537e6 * 0.7] (northeast-ish)
  // Triangulum should be offset to form the triangle - it's actually close to Andromeda in the sky
  // but at a different angle from Earth's perspective
  const triangulumPosition = useMemo<[number, number, number]>(() => [
    TRIANGULUM.distanceFromMilkyWay * gs * 0.3,   // Slightly positive X (between MW and Andromeda direction)
    TRIANGULUM.distanceFromMilkyWay * gs * 0.05,  // Slight Y offset
    TRIANGULUM.distanceFromMilkyWay * gs * 0.95,  // More along Z axis (different angle)
  ], [gs]);

  const triangulumObject = useMemo(() => getObjectById('triangulum'), []);

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (triangulumObject) setSelectedObject(triangulumObject);
  }, [triangulumObject, setSelectedObject]);

  const dotTexture = useMemo(() => createDotTexture(), []);
  const glowTexture = useMemo(() => createTriangulumGlowTexture(), []);

  // Generate spiral arm stars with Triangulum's characteristic colors
  // Blue young stars, prominent pink HII regions, white-blue core
  const starsGeo = useMemo(() => {
    const { branches, spinTurns } = TRIANGULUM;
    const maxRadius = TRIANGULUM.diskRadius * gs;
    const starCount = 300000; // Smaller galaxy, fewer stars

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();

    const k = 4.0;
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

      // Keep the arms mostly arm-like; only curl noticeably near the edge
      const spiralT = Math.pow(rt, 2.6);
      const spinAngle = spiralT * spinTurns * Math.PI * 2;

      // Keep arms crisp (avoid "too many spirals" look)
      // This jitter is in ANGLE space, so keep it small.
      const armWidth = 0.03 + rt * 0.05;
      const armJitter = (Math.random() + Math.random() + Math.random() - 1.5) * armWidth;

      // Minimal inter-arm fill so the four arms read clearly
      const isInterArm = Math.random() < 0.12;
      const interArmJitter = isInterArm ? (Math.random() - 0.5) * (0.18 + rt * 0.12) : 0;

      const angle = branchAngle + spinAngle + armJitter + interArmJitter;

      const radialSpread = (0.03 + rt * 0.06) * maxRadius;
      const radialJitter = (Math.random() + Math.random() - 1) * radialSpread;
      // Prevent stars from spilling past the intended disk size (keeps perceived size consistent)
      const finalRadius = THREE.MathUtils.clamp(radius + radialJitter, innerRadius, maxRadius);

      positions[i3] = Math.cos(angle) * finalRadius;

      const thickness = 0.015 + rt * 0.04;
      const yJitter = (Math.random() + Math.random() + Math.random() - 1.5) * maxRadius * thickness;
      positions[i3 + 1] = yJitter;

      positions[i3 + 2] = Math.sin(angle) * finalRadius;

      // Triangulum colors: blue-purple core, yellow-green outer arms, pink HII regions throughout
      const rand = Math.random();

      if (rt < 0.15) {
        // Core: blue-purple (matching reference image)
        if (rand < 0.5) {
          // Blue-purple
          color.setHSL(0.7 + Math.random() * 0.1, 0.5 + Math.random() * 0.3, 0.7 + Math.random() * 0.15);
        } else if (rand < 0.8) {
          // Light blue
          color.setHSL(0.58 + Math.random() * 0.08, 0.5 + Math.random() * 0.25, 0.75 + Math.random() * 0.12);
        } else {
          // White
          color.setHSL(0.6 + Math.random() * 0.1, 0.15 + Math.random() * 0.15, 0.88 + Math.random() * 0.08);
        }
      } else if (rt < 0.35) {
        // Inner region: blue with pink HII regions
        if (rand < 0.5) {
          // Blue
          color.setHSL(0.58 + Math.random() * 0.1, 0.7 + Math.random() * 0.2, 0.5 + Math.random() * 0.15);
        } else if (rand < 0.75) {
          // Purple-blue
          color.setHSL(0.68 + Math.random() * 0.08, 0.6 + Math.random() * 0.2, 0.5 + Math.random() * 0.12);
        } else {
          // Pink HII region
          color.setHSL(0.92 + Math.random() * 0.06, 0.85 + Math.random() * 0.1, 0.55 + Math.random() * 0.1);
        }
      } else if (rt < 0.6) {
        // Middle region: transition - blue, yellow-green, pink
        if (rand < 0.35) {
          // Blue
          color.setHSL(0.55 + Math.random() * 0.1, 0.65 + Math.random() * 0.2, 0.45 + Math.random() * 0.15);
        } else if (rand < 0.55) {
          // Yellow-green (prominent in reference)
          color.setHSL(0.18 + Math.random() * 0.08, 0.85 + Math.random() * 0.1, 0.5 + Math.random() * 0.12);
        } else if (rand < 0.75) {
          // Pink/magenta HII
          color.setHSL(0.92 + Math.random() * 0.06, 0.8 + Math.random() * 0.15, 0.55 + Math.random() * 0.1);
        } else {
          // Orange-yellow
          color.setHSL(0.1 + Math.random() * 0.06, 0.9 + Math.random() * 0.1, 0.52 + Math.random() * 0.1);
        }
      } else {
        // Outer region: predominantly yellow-green with pink HII
        if (rand < 0.45) {
          // Yellow-green (very prominent in outer arms)
          color.setHSL(0.2 + Math.random() * 0.1, 0.8 + Math.random() * 0.15, 0.5 + Math.random() * 0.12);
        } else if (rand < 0.7) {
          // Yellow-orange
          color.setHSL(0.12 + Math.random() * 0.08, 0.85 + Math.random() * 0.1, 0.52 + Math.random() * 0.1);
        } else if (rand < 0.85) {
          // Pink HII
          color.setHSL(0.92 + Math.random() * 0.06, 0.75 + Math.random() * 0.2, 0.5 + Math.random() * 0.12);
        } else {
          // Green tint
          color.setHSL(0.28 + Math.random() * 0.08, 0.6 + Math.random() * 0.2, 0.45 + Math.random() * 0.1);
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

  // Core bulge - smaller and bluer than Andromeda
  const coreGeo = useMemo(() => {
    const coreCount = 60000;
    const positions = new Float32Array(coreCount * 3);
    const colors = new Float32Array(coreCount * 3);
    const color = new THREE.Color();
    const coreRadius = TRIANGULUM.bulgeRadius * gs;

    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;

      const r = Math.pow(Math.random(), 1.3) * coreRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const t = r / coreRadius;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.4; // Flatter core
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Core: white-blue stars
      const rand = Math.random();
      if (t < 0.5) {
        // Inner: bright white-blue
        color.setHSL(0.6 + Math.random() * 0.05, 0.25 + Math.random() * 0.15, 0.88 + Math.random() * 0.08);
      } else if (rand < 0.7) {
        // Light blue
        color.setHSL(0.58 + Math.random() * 0.06, 0.4 + Math.random() * 0.2, 0.75 + Math.random() * 0.12);
      } else {
        // Blue
        color.setHSL(0.56 + Math.random() * 0.08, 0.6 + Math.random() * 0.2, 0.6 + Math.random() * 0.15);
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
    const haloCount = 30000;
    const positions = new Float32Array(haloCount * 3);
    const colors = new Float32Array(haloCount * 3);
    const color = new THREE.Color();
    const haloRadius = TRIANGULUM.diskRadius * gs * 1.3;

    for (let i = 0; i < haloCount; i++) {
      const i3 = i * 3;

      const r = (0.4 + Math.pow(Math.random(), 0.6) * 0.6) * haloRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.6;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Halo: faint blue and white
      const rand = Math.random();
      if (rand < 0.6) {
        color.setHSL(0.6 + Math.random() * 0.08, 0.3 + Math.random() * 0.2, 0.5 + Math.random() * 0.2);
      } else {
        color.setHSL(0.55 + Math.random() * 0.1, 0.2 + Math.random() * 0.15, 0.6 + Math.random() * 0.15);
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
      setObjectWorldPosition('triangulum', pos);
    }
  });

  const diskR = TRIANGULUM.diskRadius * gs;

  return (
    <group ref={groupRef} position={triangulumPosition}>
      {/* Apply 55° inclination - more face-on than Andromeda */}
      <group rotation={[TRIANGULUM.inclination, -0.2, 0]}>
        {/* Stars with differential rotation */}
        
        {/* Halo stars */}
        <DifferentialRotationPoints
          geometry={haloGeo}
          size={gs * 35}
          map={dotTexture}
          opacity={0.25}
          maxRadius={diskR * 1.3}
          rotationMultiplier={0.7}
          renderOrder={1}
        />

        {/* Main spiral arms */}
        <DifferentialRotationPoints
          geometry={starsGeo}
          size={gs * 50}
          map={dotTexture}
          opacity={0.85}
          maxRadius={diskR}
          rotationMultiplier={1}
          renderOrder={2}
        />

        {/* Core bulge */}
        <DifferentialRotationPoints
          geometry={coreGeo}
          size={gs * 75}
          map={dotTexture}
          opacity={0.95}
          maxRadius={TRIANGULUM.bulgeRadius * gs}
          rotationMultiplier={1.5}
          renderOrder={3}
        />

        {/* Center glow */}
        <sprite renderOrder={4} frustumCulled={false} scale={[diskR * 2.2, diskR * 2.2, 1]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </sprite>
      </group>

      {/* Click target */}
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
