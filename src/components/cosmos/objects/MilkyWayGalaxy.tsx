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

// Big smooth glow texture (used on sprites) - avoids hard layer edges
const createGlowTexture = () => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  gradient.addColorStop(0.08, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(0.22, 'rgba(255, 255, 255, 0.28)');
  gradient.addColorStop(0.45, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(0.75, 'rgba(255, 255, 255, 0.03)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

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
  const glowTexture = useMemo(() => createGlowTexture(), []);
  
  // Generate ONLY stars - crisp dots with colors
  const starsGeo = useMemo(() => {
    const { branches, spinTurns } = MILKY_WAY;
    const maxRadius = MILKY_WAY.diskRadius * gs;
    const starCount = 260000;

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;

      // Radius - slightly center-heavy
      const t = Math.pow(Math.random(), 0.55);
      const radius = t * maxRadius;

      // Pick an arm (random, not i%branches) so it doesn't look "striped"
      const branchIndex = Math.floor(Math.random() * branches);
      const branchAngle = (branchIndex / branches) * Math.PI * 2;

      // Turn the arms as radius increases
      const spinAngle = t * spinTurns * Math.PI * 2;

      // Arm thickness in radians (narrower near core, wider outward)
      const armWidth = (0.06 + t * 0.12);
      const armJitter = (Math.random() + Math.random() + Math.random() - 1.5) * armWidth;

      // Inter-arm fill (keeps it "full")
      const isInterArm = Math.random() < 0.35;
      const interArmJitter = isInterArm ? (Math.random() - 0.5) * (0.8 + t * 0.6) : 0;

      const angle = branchAngle + spinAngle + armJitter + interArmJitter;

      positions[i3] = Math.cos(angle) * radius;

      // Thicker vertical distribution (what you asked for):
      // near center thicker, outer disk thinner
      const thickness = (0.045 * (1 - t) + 0.015);
      const yJitter = (Math.random() + Math.random() + Math.random() - 1.5) * maxRadius * thickness;
      positions[i3 + 1] = yJitter;

      positions[i3 + 2] = Math.sin(angle) * radius;

      // Color gradient: core gold → pink → purple → blue
      if (t < 0.12) {
        color.setHSL(0.11 + Math.random() * 0.02, 0.7, 0.86 + Math.random() * 0.14);
      } else if (t < 0.25) {
        color.setHSL(0.08 + Math.random() * 0.04, 0.6, 0.8 + Math.random() * 0.15);
      } else if (t < 0.4) {
        color.setHSL(0.95 + Math.random() * 0.05, 0.52, 0.74 + Math.random() * 0.16);
      } else if (t < 0.6) {
        color.setHSL(0.8 + Math.random() * 0.08, 0.48, 0.7 + Math.random() * 0.16);
      } else if (t < 0.8) {
        color.setHSL(0.68 + Math.random() * 0.08, 0.42, 0.64 + Math.random() * 0.16);
      } else {
        color.setHSL(0.58 + Math.random() * 0.08, 0.42, 0.6 + Math.random() * 0.16);
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
  
  // Core bulge stars - denser center
  const coreGeo = useMemo(() => {
    const coreCount = 80000;
    const positions = new Float32Array(coreCount * 3);
    const colors = new Float32Array(coreCount * 3);
    const color = new THREE.Color();
    const coreRadius = MILKY_WAY.bulgeRadius * gs * 0.75;

    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;

      const r = Math.pow(Math.random(), 1.25) * coreRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      // thicker bulge in Y than the disk
      positions[i3 + 1] = r * Math.cos(phi) * 0.55;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      color.setHSL(0.10 + Math.random() * 0.03, 0.65, 0.86 + Math.random() * 0.14);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [gs]);

  // Extra "volume" stars above/below disk (makes it feel full)
  const volumeGeo = useMemo(() => {
    const count = 60000;
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

      // mostly faint blue/purple/white
      const huePick = Math.random();
      if (huePick < 0.5) color.setHSL(0.62 + Math.random() * 0.08, 0.25, 0.55 + Math.random() * 0.18);
      else if (huePick < 0.85) color.setHSL(0.78 + Math.random() * 0.08, 0.22, 0.55 + Math.random() * 0.18);
      else color.setHSL(0.12 + Math.random() * 0.06, 0.18, 0.6 + Math.random() * 0.18);

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

      {/* Smooth glow layers (no flicker, less visible "bands") */}
      <mesh renderOrder={-10}>
        <sphereGeometry args={[diskR * 0.95, 48, 48]} />
        <meshBasicMaterial
          color="#4E7BAA"
          transparent
          opacity={0.03}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <mesh renderOrder={-9}>
        <sphereGeometry args={[diskR * 0.8, 48, 48]} />
        <meshBasicMaterial
          color="#5C6DB8"
          transparent
          opacity={0.035}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <mesh renderOrder={-8}>
        <sphereGeometry args={[diskR * 0.65, 48, 48]} />
        <meshBasicMaterial
          color="#7A60B8"
          transparent
          opacity={0.045}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <mesh renderOrder={-7}>
        <sphereGeometry args={[diskR * 0.5, 48, 48]} />
        <meshBasicMaterial
          color="#B76DAA"
          transparent
          opacity={0.055}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <mesh renderOrder={-6}>
        <sphereGeometry args={[diskR * 0.38, 48, 48]} />
        <meshBasicMaterial
          color="#D58B8B"
          transparent
          opacity={0.065}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <mesh renderOrder={-5}>
        <sphereGeometry args={[bulgeR * 1.35, 32, 32]} />
        <meshBasicMaterial
          color="#DDAA66"
          transparent
          opacity={0.11}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <mesh renderOrder={-4}>
        <sphereGeometry args={[bulgeR * 0.9, 32, 32]} />
        <meshBasicMaterial
          color="#FFCC77"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <mesh renderOrder={-3}>
        <sphereGeometry args={[bulgeR * 0.45, 32, 32]} />
        <meshBasicMaterial
          color="#FFEEAA"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <mesh renderOrder={-2}>
        <sphereGeometry args={[bulgeR * 0.14, 32, 32]} />
        <meshBasicMaterial
          color="#FFFFEE"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
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
