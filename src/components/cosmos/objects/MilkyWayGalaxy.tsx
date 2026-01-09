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
  spin: 1.8,
};

// Simple crisp dot texture
const createDotTexture = () => {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  return new THREE.CanvasTexture(canvas);
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
  
  // Generate ONLY stars - simple dots with colors
  const starsGeo = useMemo(() => {
    const { branches, spin } = MILKY_WAY;
    const maxRadius = MILKY_WAY.diskRadius * gs;
    const starCount = 250000;
    
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Radius - concentrated toward center
      const t = Math.pow(Math.random(), 0.55);
      const radius = t * maxRadius;
      
      // Spiral arm angle
      const branchIndex = i % branches;
      const branchAngle = (branchIndex / branches) * Math.PI * 2;
      const spinAngle = radius * spin / maxRadius;
      
      // Randomness for natural look
      const randomOffset = (Math.random() - 0.5) * 0.4 * (1 - t * 0.5);
      
      // Some stars between arms (30%)
      const interArm = Math.random() < 0.3;
      const extraOffset = interArm ? (Math.random() - 0.5) * 1.2 : 0;
      
      const angle = branchAngle + spinAngle + randomOffset + extraOffset;
      
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = (Math.random() - 0.5) * maxRadius * 0.012; // Very thin
      positions[i3 + 2] = Math.sin(angle) * radius;
      
      // Color based on distance from center
      // Core: golden → Middle: pink/purple → Outer: blue
      if (t < 0.12) {
        // Golden core
        color.setHSL(0.11 + Math.random() * 0.02, 0.7, 0.85 + Math.random() * 0.15);
      } else if (t < 0.25) {
        // Orange-gold transition
        color.setHSL(0.08 + Math.random() * 0.04, 0.6, 0.8 + Math.random() * 0.15);
      } else if (t < 0.4) {
        // Pink/salmon
        color.setHSL(0.95 + Math.random() * 0.05, 0.5, 0.75 + Math.random() * 0.15);
      } else if (t < 0.6) {
        // Purple/lavender
        color.setHSL(0.8 + Math.random() * 0.08, 0.45, 0.7 + Math.random() * 0.15);
      } else if (t < 0.8) {
        // Blue-purple
        color.setHSL(0.68 + Math.random() * 0.08, 0.4, 0.65 + Math.random() * 0.15);
      } else {
        // Blue outer
        color.setHSL(0.58 + Math.random() * 0.08, 0.4, 0.6 + Math.random() * 0.15);
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
    const coreCount = 60000;
    const positions = new Float32Array(coreCount * 3);
    const colors = new Float32Array(coreCount * 3);
    const color = new THREE.Color();
    const coreRadius = MILKY_WAY.bulgeRadius * gs * 0.7;
    
    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;
      
      const r = Math.pow(Math.random(), 1.2) * coreRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.3; // Flattened
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      
      // Bright golden
      color.setHSL(0.10 + Math.random() * 0.03, 0.65, 0.88 + Math.random() * 0.12);
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
        />
      </points>
      
      {/* GLOW SPHERES - large gradients replacing gas clouds */}
      {/* Outer blue glow */}
      <mesh>
        <sphereGeometry args={[diskR * 0.9, 64, 64]} />
        <meshBasicMaterial
          color="#5577AA"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Mid purple glow */}
      <mesh>
        <sphereGeometry args={[diskR * 0.55, 64, 64]} />
        <meshBasicMaterial
          color="#8866AA"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Inner pink glow */}
      <mesh>
        <sphereGeometry args={[diskR * 0.35, 64, 64]} />
        <meshBasicMaterial
          color="#CC8899"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Core orange glow */}
      <mesh>
        <sphereGeometry args={[bulgeR * 1.2, 32, 32]} />
        <meshBasicMaterial
          color="#DDAA66"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Core golden glow */}
      <mesh>
        <sphereGeometry args={[bulgeR * 0.6, 32, 32]} />
        <meshBasicMaterial
          color="#FFCC77"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Core bright center */}
      <mesh>
        <sphereGeometry args={[bulgeR * 0.25, 32, 32]} />
        <meshBasicMaterial
          color="#FFEEAA"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Core white hot */}
      <mesh>
        <sphereGeometry args={[bulgeR * 0.08, 32, 32]} />
        <meshBasicMaterial
          color="#FFFFEE"
          transparent
          opacity={0.7}
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
