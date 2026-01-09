import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';

interface MilkyWayGalaxyProps {
  visualScale: number;
  showYouAreHere?: boolean;
}

// Milky Way parameters
const MILKY_WAY = {
  diskRadius: 52500,
  bulgeRadius: 10000,
  sunDistance: 26000,
  sunAngle: Math.PI * 0.72,
  branches: 4,
  spinTurns: 1.8, // how many turns the arms make from center to edge
};

// Simple crisp dot texture
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
  return tex;
};

// Galaxy glow texture with color gradient: yellow (center) → orange → purple → blue → fade
const createGalaxyGlowTexture = () => {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Create radial gradient with color progression
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  
  // Yellow center → Orange → Purple → Blue → Fade to transparent
  gradient.addColorStop(0, 'rgba(255, 220, 80, 0.9)');      // Bright yellow center
  gradient.addColorStop(0.12, 'rgba(255, 180, 40, 0.7)');   // Yellow-orange
  gradient.addColorStop(0.25, 'rgba(255, 120, 30, 0.5)');   // Orange
  gradient.addColorStop(0.4, 'rgba(200, 80, 140, 0.35)');   // Orange-purple
  gradient.addColorStop(0.55, 'rgba(140, 70, 200, 0.25)');  // Purple
  gradient.addColorStop(0.7, 'rgba(80, 100, 220, 0.15)');   // Purple-blue
  gradient.addColorStop(0.85, 'rgba(50, 80, 180, 0.08)');   // Blue
  gradient.addColorStop(1, 'rgba(30, 50, 150, 0)');         // Fade to transparent

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
};

export const MilkyWayGalaxy = ({ visualScale, showYouAreHere = true }: MilkyWayGalaxyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseRef2 = useRef<THREE.Mesh>(null);
  const markerGroupRef = useRef<THREE.Group>(null);
  
  const gs = UNITS.KM_PER_LY * visualScale;
  
  const galaxyOffset = useMemo(() => new THREE.Vector3(
    -Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs,
    0,
    -Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs
  ), [gs]);
  
  const dotTexture = useMemo(() => createDotTexture(), []);
  const glowTexture = useMemo(() => createGalaxyGlowTexture(), []);
  
  // Generate ONLY stars - crisp dots with colors matching glow regions
  // Density decreases exponentially with distance from center
  const starsGeo = useMemo(() => {
    const { branches, spinTurns } = MILKY_WAY;
    const maxRadius = MILKY_WAY.diskRadius * gs;
    const starCount = 280000;

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();

    // Exponential radial falloff (higher = denser center, sparser edge)
    // t in [0..1], with PDF ~ exp(-k*t)
    const k = 5.0;
    const denom = 1 - Math.exp(-k);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;

      // Exponential distribution for radius fraction
      const u = Math.random();
      const t = -Math.log(1 - u * denom) / k;
      const radius = t * maxRadius;

      // Pick an arm
      const branchIndex = Math.floor(Math.random() * branches);
      const branchAngle = (branchIndex / branches) * Math.PI * 2;

      // Turn the arms as radius increases
      const spinAngle = t * spinTurns * Math.PI * 2;

      // Arm thickness in radians
      const armWidth = 0.06 + t * 0.12;
      const armJitter = (Math.random() + Math.random() + Math.random() - 1.5) * armWidth;

      // Inter-arm fill
      const isInterArm = Math.random() < 0.35;
      const interArmJitter = isInterArm ? (Math.random() - 0.5) * (0.8 + t * 0.6) : 0;

      const angle = branchAngle + spinAngle + armJitter + interArmJitter;

      positions[i3] = Math.cos(angle) * radius;

      // Thicker vertical distribution
      const thickness = 0.045 * (1 - t) + 0.015;
      const yJitter = (Math.random() + Math.random() + Math.random() - 1.5) * maxRadius * thickness;
      positions[i3 + 1] = yJitter;

      positions[i3 + 2] = Math.sin(angle) * radius;

      // Color gradient matching glow regions: white center → yellow → orange → purple → blue → dark blue
      if (t < 0.05) {
        // White/cream center
        color.setHSL(0.14, 0.15, 0.95 + Math.random() * 0.05);
      } else if (t < 0.12) {
        // Yellow
        color.setHSL(0.14 + Math.random() * 0.02, 0.8, 0.7 + Math.random() * 0.15);
      } else if (t < 0.25) {
        // Orange
        color.setHSL(0.08 + Math.random() * 0.03, 0.85, 0.65 + Math.random() * 0.15);
      } else if (t < 0.42) {
        // Orange to purple transition
        color.setHSL(0.95 + Math.random() * 0.08, 0.7, 0.6 + Math.random() * 0.15);
      } else if (t < 0.58) {
        // Purple
        color.setHSL(0.78 + Math.random() * 0.06, 0.65, 0.55 + Math.random() * 0.15);
      } else if (t < 0.75) {
        // Blue
        color.setHSL(0.62 + Math.random() * 0.05, 0.7, 0.55 + Math.random() * 0.15);
      } else {
        // Dark blue (outer)
        color.setHSL(0.6 + Math.random() * 0.04, 0.75, 0.45 + Math.random() * 0.15);
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [gs]);
  
  // Core bulge stars - denser center with golden color
  const coreGeo = useMemo(() => {
    const coreCount = 90000;
    const positions = new Float32Array(coreCount * 3);
    const colors = new Float32Array(coreCount * 3);
    const color = new THREE.Color();
    const coreRadius = MILKY_WAY.bulgeRadius * gs * 0.8;

    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;

      const r = Math.pow(Math.random(), 1.25) * coreRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const t = r / coreRadius; // 0 at center, 1 at edge

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.55;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Color matches glow: white center → golden
      if (t < 0.25) {
        color.setHSL(0.12 + Math.random() * 0.02, 0.25, 0.92 + Math.random() * 0.08);
      } else if (t < 0.6) {
        color.setHSL(0.11 + Math.random() * 0.03, 0.55, 0.85 + Math.random() * 0.12);
      } else {
        color.setHSL(0.08 + Math.random() * 0.04, 0.6, 0.8 + Math.random() * 0.12);
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [gs]);

  // Extra "volume" stars above/below disk - colored by region
  const volumeGeo = useMemo(() => {
    const count = 70000;
    const maxRadius = MILKY_WAY.diskRadius * gs;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const t = Math.pow(Math.random(), 0.85);
      const radius = (0.15 + t * 0.85) * maxRadius;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 2] = Math.sin(angle) * radius;

      const ySpread = (0.12 + (1 - t) * 0.22) * maxRadius;
      positions[i3 + 1] = (Math.random() + Math.random() + Math.random() - 1.5) * ySpread * 0.08;

      // Match star colors to glow regions
      const regionT = 0.15 + t * 0.85; // corresponds to radius from center
      if (regionT < 0.35) {
        color.setHSL(0.06 + Math.random() * 0.04, 0.4, 0.7 + Math.random() * 0.15);
      } else if (regionT < 0.55) {
        color.setHSL(0.92 + Math.random() * 0.06, 0.35, 0.65 + Math.random() * 0.15);
      } else if (regionT < 0.75) {
        color.setHSL(0.72 + Math.random() * 0.08, 0.38, 0.6 + Math.random() * 0.15);
      } else {
        color.setHSL(0.58 + Math.random() * 0.08, 0.45, 0.55 + Math.random() * 0.15);
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [gs]);
  
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    
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
    
    if (markerGroupRef.current) {
      const markerWorldPos = new THREE.Vector3();
      markerGroupRef.current.getWorldPosition(markerWorldPos);
      const distance = camera.position.distanceTo(markerWorldPos);
      const scale = Math.max(1, distance * 0.025);
      markerGroupRef.current.scale.setScalar(scale);
    }
  });
  
  const baseMarkerSize = gs * 300;
  const bulgeR = MILKY_WAY.bulgeRadius * gs;
  const diskR = MILKY_WAY.diskRadius * gs;
  
  return (
    <group ref={groupRef} position={galaxyOffset}>
      {/* Core stars - bright golden center */}
      <points geometry={coreGeo}>
        <pointsMaterial
          size={gs * 100}
          map={dotTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </points>

      {/* Main stars - spiral structure */}
      <points geometry={starsGeo}>
        <pointsMaterial
          size={gs * 60}
          map={dotTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </points>

      {/* Volume stars - add height so it feels "full" */}
      <points geometry={volumeGeo}>
        <pointsMaterial
          size={gs * 55}
          map={dotTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </points>

      {/* Single smooth gradient glow: yellow → orange → purple → blue → fade */}
      <sprite renderOrder={-10} scale={[diskR * 2.2, diskR * 2.2, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </sprite>
      {showYouAreHere && (
        <group 
          ref={markerGroupRef}
          position={[
            Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs,
            0,
            Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs
          ]}
        >
          <mesh>
            <sphereGeometry args={[baseMarkerSize, 16, 16]} />
            <meshBasicMaterial color="#00ff44" />
          </mesh>
          
          <mesh>
            <sphereGeometry args={[baseMarkerSize * 1.5, 16, 16]} />
            <meshBasicMaterial
              color="#00ff44"
              transparent
              opacity={0.5}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          <mesh>
            <sphereGeometry args={[baseMarkerSize * 3, 16, 16]} />
            <meshBasicMaterial
              color="#00ff44"
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
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
