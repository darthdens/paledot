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
  diskRadius: 52500,           // ~105,000 ly diameter
  bulgeRadius: 10000,          // Central bulge
  barLength: 27000,            // Central bar length
  barWidth: 4500,
  sunDistance: 26000,          // Sun's distance from center
  sunAngle: Math.PI * 0.72,    // Position in Orion-Cygnus arm
  branches: 4,                 // Number of spiral arms
  spin: 1.2,                   // How much the arms spin outward
  randomness: 0.35,            // Particle scatter
};

// Create soft glowing particle texture
const createGlowTexture = () => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  return new THREE.CanvasTexture(canvas);
};

// Create ultra-soft cloud texture for nebula glow
const createNebulaTexture = () => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.25)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  return new THREE.CanvasTexture(canvas);
};

// Color palette inspired by techinz.dev galaxy
const getGalaxyColor = (normalizedRadius: number, inArm: boolean): THREE.Color => {
  const color = new THREE.Color();
  
  // Core: bright golden-orange (#FFE4A0)
  // Inner: warm pink/salmon (#FFAA88 → #DD88AA)
  // Middle: lavender/purple (#AA77CC → #8866BB)
  // Outer: cool blue/teal (#6688CC → #4488AA)
  
  if (normalizedRadius < 0.08) {
    // Bright golden core
    const brightness = 0.95 + Math.random() * 0.05;
    color.setHSL(0.12 + Math.random() * 0.02, 0.7 + Math.random() * 0.2, brightness);
  } else if (normalizedRadius < 0.18) {
    // Golden-orange transition
    const brightness = 0.85 + Math.random() * 0.1;
    color.setHSL(0.10 + Math.random() * 0.03, 0.65 + Math.random() * 0.2, brightness);
  } else if (normalizedRadius < 0.3) {
    // Warm pink/salmon
    const brightness = 0.75 + Math.random() * 0.15;
    color.setHSL(0.97 + Math.random() * 0.04, 0.55 + Math.random() * 0.25, brightness);
  } else if (normalizedRadius < 0.45) {
    // Pink to lavender transition
    const brightness = 0.7 + Math.random() * 0.15;
    const t = (normalizedRadius - 0.3) / 0.15;
    const hue = 0.92 - t * 0.1; // pink → purple
    color.setHSL(hue + Math.random() * 0.03, 0.5 + Math.random() * 0.2, brightness);
  } else if (normalizedRadius < 0.65) {
    // Lavender/purple
    const brightness = 0.65 + Math.random() * 0.15;
    color.setHSL(0.78 + Math.random() * 0.06, 0.45 + Math.random() * 0.2, brightness);
  } else if (normalizedRadius < 0.82) {
    // Purple to blue transition
    const brightness = 0.6 + Math.random() * 0.15;
    const t = (normalizedRadius - 0.65) / 0.17;
    const hue = 0.75 - t * 0.1; // purple → blue
    color.setHSL(hue + Math.random() * 0.04, 0.4 + Math.random() * 0.2, brightness);
  } else {
    // Outer blue/teal
    const brightness = 0.55 + Math.random() * 0.15;
    color.setHSL(0.58 + Math.random() * 0.08, 0.4 + Math.random() * 0.25, brightness);
  }
  
  // Arm cores are slightly brighter
  if (inArm) {
    color.offsetHSL(0, 0.05, 0.08);
  }
  
  return color;
};

export const MilkyWayGalaxy = ({ visualScale, showYouAreHere = true }: MilkyWayGalaxyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseRef2 = useRef<THREE.Mesh>(null);
  const markerGroupRef = useRef<THREE.Group>(null);
  
  const gs = UNITS.KM_PER_LY * visualScale; // galaxy scale
  
  // Offset galaxy so Sun (at origin) is at correct position
  const galaxyOffset = useMemo(() => new THREE.Vector3(
    -Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs,
    0,
    -Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs
  ), [gs]);
  
  // Create textures once
  const glowTexture = useMemo(() => createGlowTexture(), []);
  const nebulaTexture = useMemo(() => createNebulaTexture(), []);
  
  // Generate galaxy particles - inspired by techinz.dev smooth style
  const { starsGeo, nebulaGeo, coreGeo } = useMemo(() => {
    const { branches, spin, randomness } = MILKY_WAY;
    const maxRadius = MILKY_WAY.diskRadius * gs;
    
    // === STARS (main spiral structure) ===
    const starCount = 180000;
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Radius with concentration toward center
      const radiusPow = Math.pow(Math.random(), 0.5);
      const radius = radiusPow * maxRadius;
      const normalizedR = radiusPow;
      
      // Spiral arm structure
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = radius * spin / maxRadius;
      
      // Add randomness - more spread between arms, tighter in arms
      const inArm = Math.random() > 0.35;
      const randX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * randomness * radius / maxRadius;
      const randY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * randomness * 0.08;
      const randZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * randomness * radius / maxRadius;
      
      // Extra spread for inter-arm particles
      const interArmSpread = inArm ? 0 : (Math.random() - 0.5) * Math.PI / 2;
      
      const angle = branchAngle + spinAngle + randX + interArmSpread;
      
      starPos[i3] = Math.cos(angle) * radius;
      starPos[i3 + 1] = randY * maxRadius * 0.02; // Very thin disk
      starPos[i3 + 2] = Math.sin(angle) * radius;
      
      // Color gradient
      const color = getGalaxyColor(normalizedR, inArm);
      starCol[i3] = color.r;
      starCol[i3 + 1] = color.g;
      starCol[i3 + 2] = color.b;
      
      // Size varies - smaller toward edge
      starSizes[i] = (1 - normalizedR * 0.5) * (0.5 + Math.random() * 0.5);
    }
    
    // === NEBULA CLOUDS (smooth gassy effect) ===
    const nebulaCount = 120000;
    const nebulaPos = new Float32Array(nebulaCount * 3);
    const nebulaCol = new Float32Array(nebulaCount * 3);
    
    for (let i = 0; i < nebulaCount; i++) {
      const i3 = i * 3;
      
      // More uniform distribution for smooth coverage
      const radiusPow = Math.pow(Math.random(), 0.4);
      const radius = radiusPow * maxRadius;
      const normalizedR = radiusPow;
      
      // Looser spiral for gas
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = radius * spin * 0.8 / maxRadius;
      
      // Wider spread for nebula
      const randAngle = (Math.random() - 0.5) * Math.PI * 0.6;
      const angle = branchAngle + spinAngle + randAngle;
      
      nebulaPos[i3] = Math.cos(angle) * radius;
      nebulaPos[i3 + 1] = (Math.random() - 0.5) * maxRadius * 0.015;
      nebulaPos[i3 + 2] = Math.sin(angle) * radius;
      
      // Nebula uses same color palette but slightly more saturated
      const color = getGalaxyColor(normalizedR, false);
      color.offsetHSL(0, 0.1, -0.1);
      nebulaCol[i3] = color.r;
      nebulaCol[i3 + 1] = color.g;
      nebulaCol[i3 + 2] = color.b;
    }
    
    // === CORE (bright central bulge) ===
    const coreCount = 50000;
    const corePos = new Float32Array(coreCount * 3);
    const coreCol = new Float32Array(coreCount * 3);
    
    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;
      
      // Concentrated toward center
      const r = Math.pow(Math.random(), 1.5) * MILKY_WAY.bulgeRadius * gs * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Flattened spheroid
      corePos[i3] = r * Math.sin(phi) * Math.cos(theta);
      corePos[i3 + 1] = r * Math.cos(phi) * 0.25;
      corePos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      
      // Bright golden colors
      const dist = r / (MILKY_WAY.bulgeRadius * gs * 0.8);
      const brightness = 0.9 + (1 - dist) * 0.1;
      const color = new THREE.Color();
      color.setHSL(0.11 + Math.random() * 0.03, 0.6 + Math.random() * 0.2, brightness);
      
      coreCol[i3] = color.r;
      coreCol[i3 + 1] = color.g;
      coreCol[i3 + 2] = color.b;
    }
    
    // Build geometries
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starsGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    starsGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    
    const nebulaGeo = new THREE.BufferGeometry();
    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
    nebulaGeo.setAttribute('color', new THREE.BufferAttribute(nebulaCol, 3));
    
    const coreGeo = new THREE.BufferGeometry();
    coreGeo.setAttribute('position', new THREE.BufferAttribute(corePos, 3));
    coreGeo.setAttribute('color', new THREE.BufferAttribute(coreCol, 3));
    
    return { starsGeo, nebulaGeo, coreGeo };
  }, [gs]);
  
  // Animate marker
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
  
  return (
    <group ref={groupRef} position={galaxyOffset}>
      {/* Central core - bright golden bulge */}
      <points geometry={coreGeo}>
        <pointsMaterial
          size={gs * 150}
          map={glowTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Main stars - spiral structure */}
      <points geometry={starsGeo}>
        <pointsMaterial
          size={gs * 80}
          map={glowTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Nebula clouds - smooth gassy glow */}
      <points geometry={nebulaGeo}>
        <pointsMaterial
          size={gs * 2500}
          map={nebulaTexture}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Core glow layers - golden center */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.6, 32, 32]} />
        <meshBasicMaterial
          color="#FFE8C0"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.35, 32, 32]} />
        <meshBasicMaterial
          color="#FFDD99"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.15, 32, 32]} />
        <meshBasicMaterial
          color="#FFEECC"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.05, 32, 32]} />
        <meshBasicMaterial
          color="#FFFFF0"
          transparent
          opacity={0.8}
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
          {/* Core dot */}
          <mesh>
            <sphereGeometry args={[baseMarkerSize, 16, 16]} />
            <meshBasicMaterial color="#00ff44" />
          </mesh>
          
          {/* Inner glow */}
          <mesh>
            <sphereGeometry args={[baseMarkerSize * 1.5, 16, 16]} />
            <meshBasicMaterial
              color="#00ff44"
              transparent
              opacity={0.5}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Outer glow */}
          <mesh>
            <sphereGeometry args={[baseMarkerSize * 3, 16, 16]} />
            <meshBasicMaterial
              color="#00ff44"
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Pulse ring 1 */}
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
          
          {/* Pulse ring 2 */}
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
