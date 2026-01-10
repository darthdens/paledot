import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { getObjectById } from '../data/celestialObjects';
import { DifferentialRotationPoints } from './DifferentialRotationMaterial';

interface SombreroGalaxyProps {
  visualScale: number;
}

// Sombrero Galaxy (M104) parameters - based on real data
// Distance: 29.3 million light-years from Earth
// Diameter: ~50,000 light-years
// Key features: Large bright bulge, thin disk with dark dust lane, nearly edge-on view
const SOMBRERO = {
  diskRadius: 25000, // Half of 50,000 ly diameter
  bulgeRadius: 12000, // Large central bulge
  dustLaneThickness: 600, // Thin prominent dust lane
  inclination: (6 * Math.PI) / 180, // 6° from edge-on (84° from face-on)
  distanceFromMilkyWay: 29.3e6, // 29.3 million light-years
};

// Sombrero glow texture - bright white/cream center fading outward
const createSombreroGlowTexture = () => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.1, 'rgba(255, 250, 235, 0.9)');
  gradient.addColorStop(0.25, 'rgba(255, 240, 210, 0.7)');
  gradient.addColorStop(0.4, 'rgba(255, 225, 180, 0.45)');
  gradient.addColorStop(0.6, 'rgba(240, 200, 150, 0.2)');
  gradient.addColorStop(0.8, 'rgba(220, 180, 140, 0.08)');
  gradient.addColorStop(1, 'rgba(200, 170, 140, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

// Simple dot texture
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

export const SombreroGalaxy = ({ visualScale }: SombreroGalaxyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const centerWorldPos = useRef(new THREE.Vector3());

  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);
  const setSelectedObject = useCosmosStore((s) => s.setSelectedObject);

  const gs = UNITS.KM_PER_LY * visualScale;
  
  // Position in different direction than other galaxies
  const sombreroPosition = useMemo<[number, number, number]>(() => [
    SOMBRERO.distanceFromMilkyWay * gs * 0.5,
    SOMBRERO.distanceFromMilkyWay * gs * -0.3,
    SOMBRERO.distanceFromMilkyWay * gs * 0.82,
  ], [gs]);

  const sombreroObject = useMemo(() => getObjectById('sombrero'), []);

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (sombreroObject) setSelectedObject(sombreroObject);
  }, [sombreroObject, setSelectedObject]);

  const dotTexture = useMemo(() => createDotTexture(), []);
  const glowTexture = useMemo(() => createSombreroGlowTexture(), []);

  // Central bulge - smaller core of stars, glow handles the visual spread
  const bulgeGeo = useMemo(() => {
    const count = 80000; // Reduced - glow handles the spread
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const maxR = SOMBRERO.bulgeRadius * gs * 0.6; // Smaller core

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Spheroidal distribution, flattened slightly
      const r = Math.pow(Math.random(), 1.6) * maxR;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const t = r / maxR;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.65; // Slightly flattened
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Colors: bright white center → cream
      if (t < 0.2) {
        color.setHSL(0.12 + Math.random() * 0.02, 0.06, 0.96 + Math.random() * 0.04);
      } else if (t < 0.45) {
        color.setHSL(0.11 + Math.random() * 0.02, 0.1, 0.90 + Math.random() * 0.06);
      } else if (t < 0.7) {
        color.setHSL(0.1 + Math.random() * 0.02, 0.15, 0.82 + Math.random() * 0.08);
      } else {
        color.setHSL(0.09 + Math.random() * 0.02, 0.22, 0.72 + Math.random() * 0.1);
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

  // Disk stars - thin disk surrounding the bulge
  const diskGeo = useMemo(() => {
    const count = 200000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const maxRadius = SOMBRERO.diskRadius * gs;
    const diskThickness = maxRadius * 0.008;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Exponential disk profile
      const k = 3.5;
      const u = Math.random();
      const t = -Math.log(1 - u * (1 - Math.exp(-k))) / k;
      
      const innerRadius = maxRadius * 0.15;
      const radius = innerRadius + t * (maxRadius - innerRadius);
      const rt = radius / maxRadius;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = (Math.random() * 2 - 1) * diskThickness * (1 + rt * 0.3);
      positions[i3 + 2] = Math.sin(angle) * radius;

      // Disk colors: cream/golden with some white
      const rand = Math.random();
      if (rt < 0.3) {
        color.setHSL(0.1 + Math.random() * 0.03, 0.2, 0.75 + Math.random() * 0.12);
      } else if (rand < 0.3) {
        color.setHSL(0.11 + Math.random() * 0.03, 0.12, 0.8 + Math.random() * 0.1);
      } else {
        color.setHSL(0.09 + Math.random() * 0.03, 0.3, 0.65 + Math.random() * 0.15);
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

  // Dark dust lane - the iconic feature
  const dustLaneGeo = useMemo(() => {
    const count = 60000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const maxRadius = SOMBRERO.diskRadius * gs;
    const laneY = -SOMBRERO.dustLaneThickness * gs * 0.15;
    const laneThickness = SOMBRERO.dustLaneThickness * gs * 0.5;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const innerRadius = maxRadius * 0.12;
      const t = Math.pow(Math.random(), 0.6);
      const radius = innerRadius + t * (maxRadius * 0.92 - innerRadius);
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      
      const yOffset = laneY + (Math.random() * 2 - 1) * laneThickness;
      const clump = Math.sin(angle * 6 + radius * 0.00012) * laneThickness * 0.3;
      positions[i3 + 1] = yOffset + clump;
      
      positions[i3 + 2] = Math.sin(angle) * radius;

      // Dark brown colors
      const rand = Math.random();
      if (rand < 0.5) {
        color.setHSL(0.04 + Math.random() * 0.02, 0.65, 0.08 + Math.random() * 0.04);
      } else if (rand < 0.8) {
        color.setHSL(0.03 + Math.random() * 0.02, 0.7, 0.12 + Math.random() * 0.05);
      } else {
        color.setHSL(0.05 + Math.random() * 0.02, 0.6, 0.18 + Math.random() * 0.06);
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

  // Dark gas/dust around the disk edges - creates the dark halo effect
  const darkGasGeo = useMemo(() => {
    const count = 80000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const maxRadius = SOMBRERO.diskRadius * gs;
    const diskThickness = maxRadius * 0.025;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Concentrate around outer disk edges
      const t = Math.pow(Math.random(), 0.4);
      const innerRadius = maxRadius * 0.4;
      const radius = innerRadius + t * (maxRadius * 1.05 - innerRadius);
      const rt = radius / maxRadius;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      
      // Spread around disk plane, more at edges
      const heightSpread = diskThickness * (0.5 + rt * 1.5);
      positions[i3 + 1] = (Math.random() * 2 - 1) * heightSpread;
      
      positions[i3 + 2] = Math.sin(angle) * radius;

      // Very dark colors - almost black gas
      const rand = Math.random();
      if (rand < 0.6) {
        // Near black
        color.setHSL(0.05 + Math.random() * 0.03, 0.4, 0.03 + Math.random() * 0.02);
      } else if (rand < 0.85) {
        // Very dark brown
        color.setHSL(0.04 + Math.random() * 0.02, 0.5, 0.05 + Math.random() * 0.03);
      } else {
        // Slightly lighter edge dust
        color.setHSL(0.05 + Math.random() * 0.02, 0.45, 0.08 + Math.random() * 0.04);
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

  // Stellar halo - reduced since glow handles most of the visual
  const haloGeo = useMemo(() => {
    const count = 15000;
    const maxRadius = SOMBRERO.bulgeRadius * gs * 0.6;
    const maxHeight = SOMBRERO.bulgeRadius * gs * 0.4;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const t = Math.pow(Math.random(), 1.8);
      const radius = t * maxRadius;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 2] = Math.sin(angle) * radius;

      const rt = radius / maxRadius;
      const y = (Math.random() * 2 - 1) * maxHeight * (0.4 + rt * 0.6);
      positions[i3 + 1] = y;

      // Halo: golden/cream
      color.setHSL(0.09 + Math.random() * 0.04, 0.25 + Math.random() * 0.12, 0.6 + Math.random() * 0.15);

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
      setObjectWorldPosition('sombrero', pos);
    }
  });

  const diskR = SOMBRERO.diskRadius * gs;
  const bulgeR = SOMBRERO.bulgeRadius * gs;

  return (
    <group ref={groupRef} position={sombreroPosition}>
      {/* Apply near edge-on orientation */}
      <group rotation={[Math.PI / 2 - SOMBRERO.inclination, 0.3, 0]}>
        
        {/* Halo - background */}
        <DifferentialRotationPoints
          geometry={haloGeo}
          size={gs * 35}
          map={dotTexture}
          opacity={0.3}
          maxRadius={bulgeR}
          rotationMultiplier={0.6}
          renderOrder={1}
        />

        {/* Disk stars with differential rotation */}
        <DifferentialRotationPoints
          geometry={diskGeo}
          size={gs * 45}
          map={dotTexture}
          opacity={0.8}
          maxRadius={diskR}
          rotationMultiplier={1}
          renderOrder={2}
        />

        {/* Dust lane */}
        <DifferentialRotationPoints
          geometry={dustLaneGeo}
          size={gs * 40}
          map={dotTexture}
          opacity={0.9}
          maxRadius={diskR}
          rotationMultiplier={1}
          renderOrder={4}
        />

        {/* Central bulge with slower rotation */}
        <DifferentialRotationPoints
          geometry={bulgeGeo}
          size={gs * 55}
          map={dotTexture}
          opacity={0.9}
          maxRadius={bulgeR}
          rotationMultiplier={1.2}
          renderOrder={3}
        />

        {/* Dark gas around disk edges */}
        <DifferentialRotationPoints
          geometry={darkGasGeo}
          size={gs * 50}
          map={dotTexture}
          opacity={0.85}
          maxRadius={diskR}
          rotationMultiplier={0.9}
          renderOrder={5}
        />

        {/* Large center glow - extends to disk edges like in the reference images */}
        <sprite renderOrder={6} frustumCulled={false} scale={[diskR * 2.2, diskR * 2.2, 1]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
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
