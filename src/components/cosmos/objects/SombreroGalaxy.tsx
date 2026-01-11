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

// Sombrero glow texture - SMOOTH GLOBAL glow extending to full edges
// This is the ambient glow that spans the entire galaxy
const createSombreroGlowTexture = () => {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const centerX = size / 2;
  const centerY = size / 2;
  
  // Clear with transparent
  ctx.clearRect(0, 0, size, size);
  
  // Smooth radial gradient - extends to full edges
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
  
  // Warm cream/golden glow - smooth and global
  gradient.addColorStop(0, 'rgba(255, 252, 245, 0.85)');
  gradient.addColorStop(0.1, 'rgba(255, 248, 235, 0.7)');
  gradient.addColorStop(0.25, 'rgba(255, 240, 215, 0.5)');
  gradient.addColorStop(0.4, 'rgba(255, 225, 190, 0.32)');
  gradient.addColorStop(0.55, 'rgba(250, 210, 165, 0.18)');
  gradient.addColorStop(0.7, 'rgba(240, 195, 145, 0.1)');
  gradient.addColorStop(0.85, 'rgba(225, 175, 125, 0.04)');
  gradient.addColorStop(1, 'rgba(210, 160, 115, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
  ctx.fill();

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

  // Central bulge - SOMBRERO shape: shorter, especially at bottom
  // Top ~50% lower, bottom much lower
  const bulgeGeo = useMemo(() => {
    const count = 500000; // Very high density at core to hide vertical bar
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const maxR = SOMBRERO.bulgeRadius * gs * 0.8; // More centered
    const maxHeightTop = SOMBRERO.bulgeRadius * gs * 0.22; // 50% lower top
    const maxHeightBottom = SOMBRERO.bulgeRadius * gs * 0.12; // Much lower bottom

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Very concentrated toward center
      const r = Math.pow(Math.random(), 2.0) * maxR;
      const theta = Math.random() * Math.PI * 2;
      const rt = r / maxR;

      positions[i3] = r * Math.cos(theta);
      positions[i3 + 2] = r * Math.sin(theta);
      
      // SOMBRERO SHAPE with asymmetric top/bottom
      let heightEnvelope: number;
      if (rt < 0.15) {
        heightEnvelope = 1.0;
      } else if (rt < 0.4) {
        const localT = (rt - 0.15) / 0.25;
        heightEnvelope = 1.0 - 0.12 * localT * localT;
      } else {
        const localT = (rt - 0.4) / 0.6;
        heightEnvelope = 0.88 * Math.pow(1 - localT, 1.3);
      }
      
      // Asymmetric: top vs bottom
      const yRand = Math.random();
      let yPos: number;
      if (yRand < 0.5) {
        // Top half - shorter
        yPos = Math.random() * maxHeightTop * heightEnvelope;
      } else {
        // Bottom half - much shorter
        yPos = -Math.random() * maxHeightBottom * heightEnvelope;
      }
      positions[i3 + 1] = yPos;

      // Colors: bright white center → cream/golden
      if (rt < 0.08) {
        color.setHSL(0.12 + Math.random() * 0.02, 0.03, 0.99 + Math.random() * 0.01);
      } else if (rt < 0.2) {
        color.setHSL(0.11 + Math.random() * 0.02, 0.05, 0.95 + Math.random() * 0.03);
      } else if (rt < 0.45) {
        color.setHSL(0.1 + Math.random() * 0.02, 0.1, 0.89 + Math.random() * 0.06);
      } else {
        color.setHSL(0.09 + Math.random() * 0.02, 0.16, 0.8 + Math.random() * 0.1);
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

  // Disk stars - thicker disk, density: HIGH center → fades to middle → HIGH at edges
  const diskGeo = useMemo(() => {
    const count = 400000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const maxRadius = SOMBRERO.diskRadius * gs;
    const diskThickness = maxRadius * 0.012; // Thicker disk

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Distribution: HIGH at center → fades to almost none → HIGH at edges
      const rand = Math.random();
      let radius: number;
      
      if (rand < 0.45) {
        // Center region - very high density
        const t = Math.pow(Math.random(), 1.8);
        radius = t * maxRadius * 0.3;
      } else if (rand < 0.55) {
        // Middle region - sparse (fades away)
        const t = Math.random();
        radius = maxRadius * 0.3 + t * maxRadius * 0.35;
      } else {
        // Outer region - high density (edges)
        const t = Math.pow(Math.random(), 0.5);
        radius = maxRadius * 0.65 + t * maxRadius * 0.35;
      }
      
      const rt = radius / maxRadius;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = (Math.random() * 2 - 1) * diskThickness;
      positions[i3 + 2] = Math.sin(angle) * radius;

      // Colors: brighter at center, fades, then dimmer at edges
      if (rt < 0.25) {
        color.setHSL(0.1 + Math.random() * 0.02, 0.12, 0.85 + Math.random() * 0.1);
      } else if (rt < 0.55) {
        color.setHSL(0.09 + Math.random() * 0.03, 0.2, 0.72 + Math.random() * 0.1);
      } else {
        color.setHSL(0.08 + Math.random() * 0.03, 0.26, 0.65 + Math.random() * 0.1);
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
    const count = 80000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const maxRadius = SOMBRERO.diskRadius * gs;
    const laneY = -maxRadius * 0.003;
    const laneThickness = maxRadius * 0.004;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const innerRadius = maxRadius * 0.1;
      const t = Math.pow(Math.random(), 0.5);
      const radius = innerRadius + t * (maxRadius * 0.95 - innerRadius);
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = laneY + (Math.random() * 2 - 1) * laneThickness;
      positions[i3 + 2] = Math.sin(angle) * radius;

      // Dark brown colors
      const rand = Math.random();
      if (rand < 0.6) {
        color.setHSL(0.04 + Math.random() * 0.02, 0.65, 0.06 + Math.random() * 0.03);
      } else {
        color.setHSL(0.03 + Math.random() * 0.02, 0.7, 0.1 + Math.random() * 0.04);
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

  // Dark gas cloud - HUGE THICK cloud around the galaxy edges
  const darkGasGeo = useMemo(() => {
    const count = 500000; // Even denser
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const maxRadius = SOMBRERO.diskRadius * gs;
    const cloudThickness = maxRadius * 0.06; // Much thicker cloud

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Concentrate at outer edges
      const t = Math.pow(Math.random(), 0.4);
      const innerRadius = maxRadius * 0.55;
      const radius = innerRadius + t * (maxRadius * 1.08 - innerRadius);
      const rt = (radius - innerRadius) / (maxRadius - innerRadius);
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      
      // Much thicker spread - like a massive cloud
      const heightSpread = cloudThickness * (0.4 + rt * 1.2);
      positions[i3 + 1] = (Math.random() * 2 - 1) * heightSpread;
      
      positions[i3 + 2] = Math.sin(angle) * radius;

      // Dark colors
      const rand = Math.random();
      if (rand < 0.35) {
        color.setHSL(0.0 + Math.random() * 0.02, 0.6 + Math.random() * 0.2, 0.045 + Math.random() * 0.025);
      } else if (rand < 0.55) {
        color.setHSL(0.6 + Math.random() * 0.1, 0.5 + Math.random() * 0.25, 0.035 + Math.random() * 0.025);
      } else if (rand < 0.75) {
        color.setHSL(0.04 + Math.random() * 0.02, 0.5 + Math.random() * 0.15, 0.05 + Math.random() * 0.025);
      } else {
        color.setHSL(0.05 + Math.random() * 0.05, 0.2, 0.018 + Math.random() * 0.012);
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
      setObjectWorldPosition('sombrero', pos);
    }
  });

  const diskR = SOMBRERO.diskRadius * gs;
  const bulgeR = SOMBRERO.bulgeRadius * gs;

  return (
    <group ref={groupRef} position={sombreroPosition}>
      {/* Apply near edge-on orientation */}
      <group rotation={[Math.PI / 2 - SOMBRERO.inclination, 0.3, 0]}>
        
        {/* Disk stars - high density to edges */}
        <DifferentialRotationPoints
          geometry={diskGeo}
          size={gs * 40}
          map={dotTexture}
          opacity={0.85}
          maxRadius={diskR}
          rotationMultiplier={1}
          renderOrder={2}
        />

        {/* Central bulge - flat disk */}
        <DifferentialRotationPoints
          geometry={bulgeGeo}
          size={gs * 50}
          map={dotTexture}
          opacity={0.9}
          maxRadius={bulgeR}
          rotationMultiplier={1.1}
          renderOrder={3}
        />

        {/* Dust lane */}
        <DifferentialRotationPoints
          geometry={dustLaneGeo}
          size={gs * 35}
          map={dotTexture}
          opacity={0.4}
          maxRadius={diskR}
          rotationMultiplier={1}
          renderOrder={4}
        />

        {/* Dark gas rim - dark red/blue/black particles */}
        <DifferentialRotationPoints
          geometry={darkGasGeo}
          size={gs * 45}
          map={dotTexture}
          opacity={0.4}
          maxRadius={diskR * 1.1}
          rotationMultiplier={0.85}
          renderOrder={5}
        />

      </group>

      {/* Global smooth glow - SPRITE (billboard) so it looks good from all angles */}
      <sprite renderOrder={1} frustumCulled={false} scale={[diskR * 2.5, diskR * 2.5, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          toneMapped
        />
      </sprite>

      {/* Mid edge glow - softer outline */}
      <sprite renderOrder={0} frustumCulled={false} scale={[diskR * 2.9, diskR * 2.9, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          toneMapped
        />
      </sprite>

      {/* Outer edge glow - faint halo */}
      <sprite renderOrder={-1} frustumCulled={false} scale={[diskR * 3.4, diskR * 3.4, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          toneMapped
        />
      </sprite>

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
