import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';

interface MilkyWayGalaxyProps {
  visualScale: number;
  showYouAreHere?: boolean;
}

// Milky Way accurate parameters (in light-years)
const MILKY_WAY = {
  // Galaxy dimensions
  diskRadius: 52500, // ~105,000 ly diameter
  diskThickness: 1000, // Thin disk ~1,000 ly
  bulgeRadius: 10000, // Central bulge ~20,000 ly diameter
  bulgeHeight: 6000, // Bulge is more spherical
  
  // Sun's position (from galactic center)
  sunDistanceFromCenter: 26000, // ~26,000 ly from center
  sunAngle: Math.PI * 0.6, // Position in Orion-Cygnus arm
  sunHeight: 65, // ~65 ly above galactic plane
  
  // Spiral arm parameters (4 main arms)
  arms: [
    { name: 'Perseus', startAngle: 0, color: '#88a4d0' },
    { name: 'Sagittarius-Carina', startAngle: Math.PI / 2, color: '#94b8d4' },
    { name: 'Scutum-Centaurus', startAngle: Math.PI, color: '#7c9bc4' },
    { name: 'Norma-Outer', startAngle: (3 * Math.PI) / 2, color: '#8fb0d8' },
  ],
  armWindingNumber: 2, // How tightly wound the arms are
  armWidth: 3500, // Width of each arm
};

export const MilkyWayGalaxy = ({ visualScale, showYouAreHere = true }: MilkyWayGalaxyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const youAreHereRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  // Scale factor for galaxy visualization
  // Galaxy is ~100,000 ly across, we want it visible when zoomed out
  const galaxyScale = UNITS.KM_PER_LY * visualScale;
  
  // Sun's position in 3D space (at galactic coordinates)
  const sunPosition = useMemo(() => {
    const x = Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistanceFromCenter * galaxyScale;
    const z = Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistanceFromCenter * galaxyScale;
    const y = MILKY_WAY.sunHeight * galaxyScale;
    return new THREE.Vector3(x, y, z);
  }, [galaxyScale]);
  
  // Generate galaxy particle system
  const { positions, colors, sizes } = useMemo(() => {
    const starCount = 50000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    const color = new THREE.Color();
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Determine if this is a bulge star or disk star
      const isBulge = Math.random() < 0.15;
      
      if (isBulge) {
        // Central bulge - more spherical distribution
        const r = Math.pow(Math.random(), 0.5) * MILKY_WAY.bulgeRadius * galaxyScale;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = r * Math.cos(phi) * 0.6; // Flatten slightly
        positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        
        // Bulge is yellower/redder (older stars)
        color.setHSL(0.12 + Math.random() * 0.05, 0.4 + Math.random() * 0.3, 0.7 + Math.random() * 0.3);
        sizes[i] = (0.8 + Math.random() * 0.5) * galaxyScale * 100;
      } else {
        // Disk stars - follow spiral arm pattern
        const armIndex = Math.floor(Math.random() * 4);
        const arm = MILKY_WAY.arms[armIndex];
        
        // Logarithmic spiral: r = a * e^(b*theta)
        const t = Math.pow(Math.random(), 0.7); // Bias toward center
        const r = (2000 + t * (MILKY_WAY.diskRadius - 2000)) * galaxyScale;
        const armAngle = arm.startAngle + (r / (MILKY_WAY.diskRadius * galaxyScale)) * Math.PI * MILKY_WAY.armWindingNumber;
        
        // Add spread around the arm
        const spread = (Math.random() - 0.5) * MILKY_WAY.armWidth * galaxyScale;
        const angleSpread = spread / r;
        
        const finalAngle = armAngle + angleSpread;
        const radialSpread = (Math.random() - 0.5) * MILKY_WAY.armWidth * 0.5 * galaxyScale;
        
        positions[i3] = Math.cos(finalAngle) * (r + radialSpread);
        positions[i3 + 1] = (Math.random() - 0.5) * MILKY_WAY.diskThickness * galaxyScale * Math.exp(-r / (MILKY_WAY.diskRadius * galaxyScale * 0.5));
        positions[i3 + 2] = Math.sin(finalAngle) * (r + radialSpread);
        
        // Disk stars - bluer in arms (young stars), mix of colors
        const inArm = Math.abs(spread) < MILKY_WAY.armWidth * galaxyScale * 0.3;
        if (inArm && Math.random() < 0.3) {
          // Young blue stars in arms
          color.setHSL(0.6 + Math.random() * 0.1, 0.7 + Math.random() * 0.3, 0.8 + Math.random() * 0.2);
        } else {
          // Mix of star types
          color.setHSL(0.1 + Math.random() * 0.15, 0.3 + Math.random() * 0.4, 0.7 + Math.random() * 0.3);
        }
        sizes[i] = (0.3 + Math.random() * 0.7) * galaxyScale * 80;
      }
      
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    return { positions, colors, sizes };
  }, [galaxyScale]);
  
  // Animate "You Are Here" pulse
  useFrame(({ clock }) => {
    if (youAreHereRef.current && pulseRef.current) {
      const t = clock.getElapsedTime();
      
      // Gentle breathing animation
      const scale = 1 + Math.sin(t * 2) * 0.2;
      youAreHereRef.current.scale.setScalar(scale);
      
      // Expanding pulse ring
      const pulseScale = 1 + (t % 2) * 2;
      const pulseOpacity = 1 - (t % 2) / 2;
      pulseRef.current.scale.setScalar(pulseScale);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = pulseOpacity * 0.5;
    }
    
    // Slow galaxy rotation (cosmetic, not physically accurate)
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.00002;
    }
  });
  
  // Custom shader for glow effect
  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color('#fff8e7') },
        intensity: { value: 1.5 },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float r = distance(gl_PointCoord, vec2(0.5));
          if (r > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, r);
          gl_FragColor = vec4(vColor, alpha * 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);
  
  const markerSize = galaxyScale * 500; // Visible marker at galaxy scale
  
  return (
    <group ref={groupRef}>
      {/* Galaxy particle system */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={positions}
            count={positions.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={colors}
            count={colors.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={sizes}
            count={sizes.length}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={`
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            void main() {
              vColor = color;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_PointSize = clamp(gl_PointSize, 1.0, 100.0);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            void main() {
              float r = distance(gl_PointCoord, vec2(0.5));
              if (r > 0.5) discard;
              float alpha = 1.0 - smoothstep(0.1, 0.5, r);
              gl_FragColor = vec4(vColor, alpha * 0.8);
            }
          `}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Central bulge glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * galaxyScale * 0.3, 32, 32]} />
        <meshBasicMaterial
          color="#fff8dc"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* "You Are Here" marker at Sun's position */}
      {showYouAreHere && (
        <group position={sunPosition}>
          {/* Main marker */}
          <mesh ref={youAreHereRef}>
            <sphereGeometry args={[markerSize, 16, 16]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0.9} />
          </mesh>
          
          {/* Pulse ring */}
          <mesh ref={pulseRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[markerSize * 0.8, markerSize * 1.2, 32]} />
            <meshBasicMaterial
              color="#00ff88"
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Vertical beam for visibility */}
          <mesh>
            <cylinderGeometry args={[markerSize * 0.1, markerSize * 0.1, markerSize * 20, 8]} />
            <meshBasicMaterial
              color="#00ff88"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};
