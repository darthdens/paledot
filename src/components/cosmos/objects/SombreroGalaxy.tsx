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

// Sombrero glow texture - LENS shaped like the top of a sombrero hat
// Flat and wide at center, curving up/down like an eye/lens shape
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
  
  // Draw lens/eye shape by using ellipse - wide horizontally, narrow vertically
  // This creates the sombrero hat top shape
  const radiusX = size * 0.48; // Wide
  const radiusY = size * 0.22; // Narrow - lens shape
  
  // Multiple gradient layers for the lens glow
  // Layer 1: Bright inner core
  const innerGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radiusY * 0.5);
  innerGrad.addColorStop(0, 'rgba(255, 255, 250, 1)');
  innerGrad.addColorStop(0.5, 'rgba(255, 250, 235, 0.95)');
  innerGrad.addColorStop(1, 'rgba(255, 240, 210, 0.85)');
  
  ctx.save();
  ctx.scale(radiusX / radiusY, 1); // Scale to create ellipse
  ctx.beginPath();
  ctx.arc(centerX * radiusY / radiusX, centerY, radiusY, 0, Math.PI * 2);
  ctx.restore();
  ctx.fillStyle = innerGrad;
  ctx.fill();
  
  // Layer 2: Mid glow - the main hat bulge
  const midGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radiusY * 0.8);
  midGrad.addColorStop(0, 'rgba(255, 248, 230, 0.9)');
  midGrad.addColorStop(0.3, 'rgba(255, 238, 205, 0.7)');
  midGrad.addColorStop(0.6, 'rgba(255, 225, 180, 0.45)');
  midGrad.addColorStop(1, 'rgba(245, 205, 155, 0.2)');
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.scale(radiusX / radiusY, 1);
  ctx.beginPath();
  ctx.arc(centerX * radiusY / radiusX, centerY, radiusY, 0, Math.PI * 2);
  ctx.restore();
  ctx.fillStyle = midGrad;
  ctx.fill();
  
  // Layer 3: Outer glow - fading edges
  const outerGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radiusY);
  outerGrad.addColorStop(0, 'rgba(255, 235, 200, 0.5)');
  outerGrad.addColorStop(0.4, 'rgba(250, 218, 170, 0.3)');
  outerGrad.addColorStop(0.7, 'rgba(240, 200, 150, 0.15)');
  outerGrad.addColorStop(0.9, 'rgba(225, 180, 130, 0.05)');
  outerGrad.addColorStop(1, 'rgba(210, 165, 115, 0)');
  
  ctx.save();
  ctx.scale(radiusX / radiusY, 1);
  ctx.beginPath();
  ctx.arc(centerX * radiusY / radiusX, centerY, radiusY, 0, Math.PI * 2);
  ctx.restore();
  ctx.fillStyle = outerGrad;
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

  // Central bulge - FLAT disk of stars, NOT spherical
  // The "sombrero hat" effect comes from the GLOW, not from stars going up/down
  const bulgeGeo = useMemo(() => {
    const count = 120000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const maxR = SOMBRERO.bulgeRadius * gs;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // FLAT distribution - concentrated toward center
      const r = Math.pow(Math.random(), 1.2) * maxR;
      const theta = Math.random() * Math.PI * 2;
      const rt = r / maxR;

      positions[i3] = r * Math.cos(theta);
      // Very thin - minimal vertical spread
      positions[i3 + 1] = (Math.random() * 2 - 1) * maxR * 0.015;
      positions[i3 + 2] = r * Math.sin(theta);

      // Colors: bright white center → cream
      if (rt < 0.15) {
        color.setHSL(0.12 + Math.random() * 0.02, 0.06, 0.96 + Math.random() * 0.04);
      } else if (rt < 0.35) {
        color.setHSL(0.11 + Math.random() * 0.02, 0.1, 0.90 + Math.random() * 0.06);
      } else if (rt < 0.6) {
        color.setHSL(0.1 + Math.random() * 0.02, 0.18, 0.82 + Math.random() * 0.08);
      } else {
        color.setHSL(0.09 + Math.random() * 0.02, 0.25, 0.72 + Math.random() * 0.1);
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

  // Disk stars - HIGH density at center, LOWER in middle, HIGH again at edges
  const diskGeo = useMemo(() => {
    const count = 350000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const maxRadius = SOMBRERO.diskRadius * gs;
    const diskThickness = maxRadius * 0.005;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Bimodal distribution: high at center, low in middle, high at edges
      const rand = Math.random();
      let radius: number;
      
      if (rand < 0.35) {
        // Inner region - high density (center)
        const t = Math.pow(Math.random(), 1.5);
        radius = t * maxRadius * 0.35;
      } else if (rand < 0.55) {
        // Middle region - lower density
        const t = Math.random();
        radius = maxRadius * 0.35 + t * maxRadius * 0.35;
      } else {
        // Outer region - high density (edges)
        const t = Math.pow(Math.random(), 0.6);
        radius = maxRadius * 0.7 + t * maxRadius * 0.3;
      }
      
      const rt = radius / maxRadius;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = (Math.random() * 2 - 1) * diskThickness;
      positions[i3 + 2] = Math.sin(angle) * radius;

      // Disk colors: brighter at center, golden in middle, slightly dimmer at edges
      if (rt < 0.25) {
        color.setHSL(0.1 + Math.random() * 0.02, 0.15, 0.82 + Math.random() * 0.1);
      } else if (rt < 0.6) {
        color.setHSL(0.09 + Math.random() * 0.03, 0.22, 0.72 + Math.random() * 0.1);
      } else {
        color.setHSL(0.08 + Math.random() * 0.03, 0.28, 0.68 + Math.random() * 0.1);
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

  // Dark gas rim - colorful: dark reds, dark blues, browns, more visible
  const darkGasGeo = useMemo(() => {
    const count = 250000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const maxRadius = SOMBRERO.diskRadius * gs;
    const rimThickness = maxRadius * 0.02;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Concentrate at outer edges
      const t = Math.pow(Math.random(), 0.3);
      const innerRadius = maxRadius * 0.6;
      const radius = innerRadius + t * (maxRadius * 1.02 - innerRadius);
      const rt = (radius - innerRadius) / (maxRadius - innerRadius);
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      
      const heightSpread = rimThickness * (0.25 + rt * 0.75);
      positions[i3 + 1] = (Math.random() * 2 - 1) * heightSpread;
      
      positions[i3 + 2] = Math.sin(angle) * radius;

      // More colorful: dark reds, dark blues, rust browns - slightly brighter to be visible
      const rand = Math.random();
      if (rand < 0.3) {
        // Dark red - slightly more saturated and visible
        color.setHSL(0.0 + Math.random() * 0.02, 0.7 + Math.random() * 0.2, 0.06 + Math.random() * 0.04);
      } else if (rand < 0.5) {
        // Dark blue - more visible
        color.setHSL(0.6 + Math.random() * 0.1, 0.6 + Math.random() * 0.25, 0.05 + Math.random() * 0.04);
      } else if (rand < 0.7) {
        // Dark rust/brown
        color.setHSL(0.04 + Math.random() * 0.02, 0.6 + Math.random() * 0.15, 0.07 + Math.random() * 0.04);
      } else if (rand < 0.85) {
        // Dark purple hints
        color.setHSL(0.8 + Math.random() * 0.1, 0.5 + Math.random() * 0.2, 0.04 + Math.random() * 0.03);
      } else {
        // Near black
        color.setHSL(0.05 + Math.random() * 0.05, 0.3, 0.02 + Math.random() * 0.02);
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
          opacity={0.92}
          maxRadius={diskR}
          rotationMultiplier={1}
          renderOrder={4}
        />

        {/* Dark gas rim - dark red/blue/black particles */}
        <DifferentialRotationPoints
          geometry={darkGasGeo}
          size={gs * 45}
          map={dotTexture}
          opacity={0.88}
          maxRadius={diskR * 1.1}
          rotationMultiplier={0.85}
          renderOrder={5}
        />

        {/* Central glow - LENS shaped like sombrero hat top */}
        {/* Wide horizontally, narrow vertically - creates the iconic shape */}
        <mesh renderOrder={1} rotation={[0, 0, 0]}>
          <planeGeometry args={[diskR * 1.6, bulgeR * 1.4]} />
          <meshBasicMaterial
            map={glowTexture}
            transparent
            opacity={1}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
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
