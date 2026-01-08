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
  diskRadius: 52500, // ~105,000 ly diameter
  bulgeRadius: 10000,
  // Sun's position from galactic center
  sunDistance: 26000, // ~26,000 ly from center
  sunAngle: Math.PI * 0.75, // Orion-Cygnus arm position
};

export const MilkyWayGalaxy = ({ visualScale, showYouAreHere = true }: MilkyWayGalaxyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  
  const galaxyScale = UNITS.KM_PER_LY * visualScale;
  
  // Calculate offset so Sun (at scene origin) is at correct galactic position
  // Galaxy center should be at -sunPosition from origin
  const galaxyOffset = useMemo(() => {
    const x = -Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * galaxyScale;
    const z = -Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * galaxyScale;
    return new THREE.Vector3(x, 0, z);
  }, [galaxyScale]);
  
  // Generate galaxy particles
  const geometry = useMemo(() => {
    const count = 60000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const rand = Math.random();
      
      // 15% bulge, 85% disk with spiral arms
      if (rand < 0.15) {
        // Central bulge - ellipsoidal
        const r = Math.pow(Math.random(), 0.6) * MILKY_WAY.bulgeRadius * galaxyScale;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = r * Math.cos(phi) * 0.4; // Flattened
        positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        
        // Yellow/orange old stars
        color.setHSL(0.1 + Math.random() * 0.05, 0.5, 0.7 + Math.random() * 0.2);
      } else {
        // Disk with 4 spiral arms
        const armIndex = Math.floor(Math.random() * 4);
        const armStartAngle = (armIndex * Math.PI) / 2;
        
        // Radial position with exponential falloff
        const t = Math.pow(Math.random(), 0.6);
        const r = (2000 + t * (MILKY_WAY.diskRadius - 2000)) * galaxyScale;
        
        // Logarithmic spiral
        const windingFactor = 0.25;
        const spiralAngle = armStartAngle + Math.log(r / (2000 * galaxyScale) + 1) / windingFactor;
        
        // Spread around arm
        const armWidth = 4000 * galaxyScale * (0.3 + 0.7 * t);
        const spread = (Math.random() - 0.5) * armWidth;
        const angleOffset = spread / (r + 1000);
        
        // Some inter-arm stars
        const interArm = Math.random() < 0.25 ? (Math.random() - 0.5) * 0.4 : 0;
        
        const finalAngle = spiralAngle + angleOffset + interArm;
        
        positions[i3] = Math.cos(finalAngle) * r;
        positions[i3 + 1] = (Math.random() - 0.5) * 300 * galaxyScale * Math.exp(-t * 2);
        positions[i3 + 2] = Math.sin(finalAngle) * r;
        
        // Color: blue in arms, white elsewhere
        const inArmCore = Math.abs(spread) < armWidth * 0.3;
        if (inArmCore && Math.random() < 0.2) {
          color.setHSL(0.6, 0.7, 0.8); // Blue star-forming
        } else {
          color.setHSL(0.15 + Math.random() * 0.1, 0.3, 0.75 + Math.random() * 0.2);
        }
      }
      
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [galaxyScale]);
  
  // Animate pulse
  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const t = clock.getElapsedTime();
      const phase = (t * 0.5) % 1;
      pulseRef.current.scale.setScalar(1 + phase * 2);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.8;
    }
  });
  
  const markerSize = galaxyScale * 300;
  
  return (
    <group ref={groupRef} position={galaxyOffset}>
      {/* Stars */}
      <points geometry={geometry}>
        <pointsMaterial
          size={galaxyScale * 80}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Central bulge glow */}
      <mesh>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * galaxyScale * 0.6, 32, 32]} />
        <meshBasicMaterial
          color="#ffe8c0"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Disk glow */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[MILKY_WAY.diskRadius * galaxyScale, 64]} />
        <meshBasicMaterial
          color="#c8d8ff"
          transparent
          opacity={0.03}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* "You Are Here" marker - at Sun's position relative to galaxy center */}
      {showYouAreHere && (
        <group position={[
          Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * galaxyScale,
          0,
          Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * galaxyScale
        ]}>
          {/* Bright marker */}
          <mesh>
            <sphereGeometry args={[markerSize, 12, 12]} />
            <meshBasicMaterial color="#00ff88" />
          </mesh>
          
          {/* Glow */}
          <mesh>
            <sphereGeometry args={[markerSize * 3, 12, 12]} />
            <meshBasicMaterial
              color="#00ff88"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Pulse ring */}
          <mesh ref={pulseRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[markerSize * 0.8, markerSize * 1.2, 24]} />
            <meshBasicMaterial
              color="#00ff88"
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};
