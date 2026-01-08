import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';

interface MilkyWayGalaxyProps {
  visualScale: number;
  showYouAreHere?: boolean;
}

// Milky Way parameters based on current astronomical data
const MILKY_WAY = {
  diskRadius: 52500,           // ~105,000 ly diameter
  bulgeRadius: 10000,          // Central bulge
  barLength: 27000,            // Central bar length
  barWidth: 5000,
  sunDistance: 26000,          // Sun's distance from center
  sunAngle: Math.PI * 0.72,    // Position in Orion-Cygnus arm
  
  // 4 major spiral arms
  arms: [
    { name: 'Perseus', angle: 0, hue: 0.6 },
    { name: 'Sagittarius-Carina', angle: Math.PI / 2, hue: 0.58 },
    { name: 'Scutum-Centaurus', angle: Math.PI, hue: 0.62 },
    { name: 'Norma-Outer', angle: 1.5 * Math.PI, hue: 0.55 },
  ],
};

export const MilkyWayGalaxy = ({ visualScale, showYouAreHere = true }: MilkyWayGalaxyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  
  const gs = UNITS.KM_PER_LY * visualScale; // galaxy scale
  
  // Offset galaxy so Sun (at origin) is at correct position
  const galaxyOffset = useMemo(() => new THREE.Vector3(
    -Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs,
    0,
    -Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs
  ), [gs]);
  
  // Generate detailed galaxy particle systems
  const { bulgeGeo, diskGeo, dustGeo, nebulaGeo, clusterGeo } = useMemo(() => {
    const color = new THREE.Color();
    
    // === CENTRAL BULGE & BAR (warm golden core) ===
    const bulgeCount = 15000;
    const bulgePos = new Float32Array(bulgeCount * 3);
    const bulgeCol = new Float32Array(bulgeCount * 3);
    
    for (let i = 0; i < bulgeCount; i++) {
      const i3 = i * 3;
      const rand = Math.random();
      
      if (rand < 0.4) {
        // Central bar
        const barPos = (Math.random() - 0.5) * MILKY_WAY.barLength * gs;
        const barW = (Math.random() - 0.5) * MILKY_WAY.barWidth * gs * Math.pow(Math.random(), 0.5);
        const barAngle = 0.45; // Bar tilted ~25 degrees
        
        bulgePos[i3] = barPos * Math.cos(barAngle) - barW * Math.sin(barAngle);
        bulgePos[i3 + 1] = (Math.random() - 0.5) * 400 * gs;
        bulgePos[i3 + 2] = barPos * Math.sin(barAngle) + barW * Math.cos(barAngle);
      } else {
        // Spheroidal bulge
        const r = Math.pow(Math.random(), 0.5) * MILKY_WAY.bulgeRadius * gs;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        bulgePos[i3] = r * Math.sin(phi) * Math.cos(theta);
        bulgePos[i3 + 1] = r * Math.cos(phi) * 0.35;
        bulgePos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      }
      
      // Golden/orange colors for old Population II stars
      const dist = Math.sqrt(bulgePos[i3] ** 2 + bulgePos[i3 + 2] ** 2) / (MILKY_WAY.bulgeRadius * gs);
      color.setHSL(
        0.08 + dist * 0.03,           // Orange → yellow-white outward
        0.7 - dist * 0.3,              // More saturated at center
        0.6 + Math.random() * 0.35     // Bright
      );
      bulgeCol[i3] = color.r;
      bulgeCol[i3 + 1] = color.g;
      bulgeCol[i3 + 2] = color.b;
    }
    
    // === SPIRAL DISK (blue-white stars) ===
    const diskCount = 50000;
    const diskPos = new Float32Array(diskCount * 3);
    const diskCol = new Float32Array(diskCount * 3);
    
    for (let i = 0; i < diskCount; i++) {
      const i3 = i * 3;
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      // Radial position - exponential disk profile
      const t = Math.pow(Math.random(), 0.55);
      const r = (3000 + t * (MILKY_WAY.diskRadius - 3000)) * gs;
      
      // Logarithmic spiral
      const winding = 0.28;
      const spiralAngle = arm.angle + Math.log(r / (3000 * gs) + 0.1) / winding;
      
      // Arm width increases outward
      const armWidth = (2500 + t * 2500) * gs;
      const spreadGaussian = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const spread = spreadGaussian * armWidth;
      
      // 30% inter-arm population
      const interArm = Math.random() < 0.3;
      const extraSpread = interArm ? (Math.random() - 0.5) * armWidth * 2.5 : 0;
      
      const finalAngle = spiralAngle + (spread + extraSpread) / (r + 1);
      
      diskPos[i3] = Math.cos(finalAngle) * r;
      diskPos[i3 + 1] = (Math.random() - 0.5) * 250 * gs * Math.exp(-t * 1.5);
      diskPos[i3 + 2] = Math.sin(finalAngle) * r;
      
      // Color based on arm position
      const inCore = Math.abs(spreadGaussian) < 0.3 && !interArm;
      if (inCore && Math.random() < 0.25) {
        // Young blue OB stars in arm cores
        color.setHSL(0.6 + Math.random() * 0.05, 0.8, 0.8 + Math.random() * 0.15);
      } else if (inCore && Math.random() < 0.15) {
        // White-blue main sequence
        color.setHSL(0.55, 0.4, 0.85 + Math.random() * 0.1);
      } else {
        // General stellar pop (white/cream)
        color.setHSL(0.12 + Math.random() * 0.08, 0.15 + Math.random() * 0.2, 0.75 + Math.random() * 0.2);
      }
      diskCol[i3] = color.r;
      diskCol[i3 + 1] = color.g;
      diskCol[i3 + 2] = color.b;
    }
    
    // === DUST LANES (dark reddish-brown) ===
    const dustCount = 8000;
    const dustPos = new Float32Array(dustCount * 3);
    const dustCol = new Float32Array(dustCount * 3);
    
    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      const t = Math.pow(Math.random(), 0.5);
      const r = (4000 + t * 35000) * gs;
      
      // Dust lanes on inner edge of spiral arms
      const winding = 0.28;
      const spiralAngle = arm.angle + Math.log(r / (3000 * gs) + 0.1) / winding;
      const laneOffset = -0.08; // Inner edge offset
      
      const spread = (Math.random() - 0.5) * 1500 * gs;
      const finalAngle = spiralAngle + laneOffset + spread / (r + 1);
      
      dustPos[i3] = Math.cos(finalAngle) * r;
      dustPos[i3 + 1] = (Math.random() - 0.5) * 80 * gs;
      dustPos[i3 + 2] = Math.sin(finalAngle) * r;
      
      // Dark reddish-brown dust
      color.setHSL(0.05 + Math.random() * 0.05, 0.6, 0.15 + Math.random() * 0.1);
      dustCol[i3] = color.r;
      dustCol[i3 + 1] = color.g;
      dustCol[i3 + 2] = color.b;
    }
    
    // === NEBULAE / HII REGIONS (pink/magenta emission) ===
    const nebulaCount = 3000;
    const nebulaPos = new Float32Array(nebulaCount * 3);
    const nebulaCol = new Float32Array(nebulaCount * 3);
    
    for (let i = 0; i < nebulaCount; i++) {
      const i3 = i * 3;
      const armIdx = Math.floor(Math.random() * 4);
      const arm = MILKY_WAY.arms[armIdx];
      
      const t = 0.1 + Math.random() * 0.7; // Mostly mid-disk
      const r = (5000 + t * 30000) * gs;
      
      const winding = 0.28;
      const spiralAngle = arm.angle + Math.log(r / (3000 * gs) + 0.1) / winding;
      const spread = (Math.random() - 0.5) * 2000 * gs;
      
      nebulaPos[i3] = Math.cos(spiralAngle + spread / r) * r;
      nebulaPos[i3 + 1] = (Math.random() - 0.5) * 150 * gs;
      nebulaPos[i3 + 2] = Math.sin(spiralAngle + spread / r) * r;
      
      // Pink/magenta HII emission + some blue reflection nebulae
      if (Math.random() < 0.7) {
        color.setHSL(0.9 + Math.random() * 0.1, 0.7 + Math.random() * 0.2, 0.5 + Math.random() * 0.2);
      } else {
        color.setHSL(0.58 + Math.random() * 0.08, 0.6, 0.6 + Math.random() * 0.2);
      }
      nebulaCol[i3] = color.r;
      nebulaCol[i3 + 1] = color.g;
      nebulaCol[i3 + 2] = color.b;
    }
    
    // === STAR CLUSTERS (bright dense points) ===
    const clusterCount = 1500;
    const clusterPos = new Float32Array(clusterCount * 3);
    const clusterCol = new Float32Array(clusterCount * 3);
    
    for (let i = 0; i < clusterCount; i++) {
      const i3 = i * 3;
      
      // Globular clusters in halo + open clusters in disk
      if (Math.random() < 0.3) {
        // Globular clusters - spherical halo distribution
        const r = (5000 + Math.random() * 60000) * gs;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        clusterPos[i3] = r * Math.sin(phi) * Math.cos(theta);
        clusterPos[i3 + 1] = r * Math.cos(phi) * 0.6;
        clusterPos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        
        // Old yellow clusters
        color.setHSL(0.12, 0.5, 0.9);
      } else {
        // Open clusters in spiral arms
        const armIdx = Math.floor(Math.random() * 4);
        const arm = MILKY_WAY.arms[armIdx];
        const t = Math.pow(Math.random(), 0.6);
        const r = (4000 + t * 35000) * gs;
        
        const winding = 0.28;
        const spiralAngle = arm.angle + Math.log(r / (3000 * gs) + 0.1) / winding;
        const spread = (Math.random() - 0.5) * 1500 * gs;
        
        clusterPos[i3] = Math.cos(spiralAngle + spread / r) * r;
        clusterPos[i3 + 1] = (Math.random() - 0.5) * 100 * gs;
        clusterPos[i3 + 2] = Math.sin(spiralAngle + spread / r) * r;
        
        // Young blue-white clusters
        color.setHSL(0.55 + Math.random() * 0.1, 0.5, 0.95);
      }
      clusterCol[i3] = color.r;
      clusterCol[i3 + 1] = color.g;
      clusterCol[i3 + 2] = color.b;
    }
    
    // Build geometries
    const bulgeGeo = new THREE.BufferGeometry();
    bulgeGeo.setAttribute('position', new THREE.BufferAttribute(bulgePos, 3));
    bulgeGeo.setAttribute('color', new THREE.BufferAttribute(bulgeCol, 3));
    
    const diskGeo = new THREE.BufferGeometry();
    diskGeo.setAttribute('position', new THREE.BufferAttribute(diskPos, 3));
    diskGeo.setAttribute('color', new THREE.BufferAttribute(diskCol, 3));
    
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol, 3));
    
    const nebulaGeo = new THREE.BufferGeometry();
    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
    nebulaGeo.setAttribute('color', new THREE.BufferAttribute(nebulaCol, 3));
    
    const clusterGeo = new THREE.BufferGeometry();
    clusterGeo.setAttribute('position', new THREE.BufferAttribute(clusterPos, 3));
    clusterGeo.setAttribute('color', new THREE.BufferAttribute(clusterCol, 3));
    
    return { bulgeGeo, diskGeo, dustGeo, nebulaGeo, clusterGeo };
  }, [gs]);
  
  const pulseRef2 = useRef<THREE.Mesh>(null);
  const markerGroupRef = useRef<THREE.Group>(null);
  
  // Animate pulse and scale marker based on camera distance
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    
    // Pulse animation - faster and more noticeable
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
    
    // Scale marker group based on camera distance so it's always visible
    if (markerGroupRef.current) {
      const markerWorldPos = new THREE.Vector3();
      markerGroupRef.current.getWorldPosition(markerWorldPos);
      const distance = camera.position.distanceTo(markerWorldPos);
      // Scale more aggressively to stay visible at extreme distances
      const scale = Math.max(1, distance * 0.025);
      markerGroupRef.current.scale.setScalar(scale);
    }
  });
  
  const baseMarkerSize = gs * 300;
  
  return (
    <group ref={groupRef} position={galaxyOffset}>
      {/* Central bulge - warm golden glow */}
      <points geometry={bulgeGeo}>
        <pointsMaterial
          size={gs * 100}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Main disk stars */}
      <points geometry={diskGeo}>
        <pointsMaterial
          size={gs * 60}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Dust lanes - subtractive look */}
      <points geometry={dustGeo}>
        <pointsMaterial
          size={gs * 200}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.4}
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Nebulae - pink/magenta emission */}
      <points geometry={nebulaGeo}>
        <pointsMaterial
          size={gs * 180}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Star clusters - bright points */}
      <points geometry={clusterGeo}>
        <pointsMaterial
          size={gs * 120}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Core glow layers */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.8, 32, 32]} />
        <meshBasicMaterial
          color="#ffcc66"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.4, 32, 32]} />
        <meshBasicMaterial
          color="#ffaa44"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * gs * 0.15, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Faint disk halo glow */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[MILKY_WAY.bulgeRadius * gs, MILKY_WAY.diskRadius * gs * 1.1, 128]} />
        <meshBasicMaterial
          color="#aaccff"
          transparent
          opacity={0.02}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* "You Are Here" marker - clean pulsing dot */}
      {showYouAreHere && (
        <group 
          ref={markerGroupRef}
          position={[
            Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs,
            0,
            Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs
          ]}
        >
          {/* Core dot - bright green */}
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
          
          {/* Pulse ring 2 (offset) */}
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
