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
  barLength: 27000, // Central bar ~27,000 ly long
  barWidth: 5000,
  
  // Sun's position (from galactic center)
  sunDistanceFromCenter: 26000, // ~26,000 ly from center
  sunAngle: Math.PI * 0.75, // Position in Orion-Cygnus arm (between Perseus and Sagittarius)
  sunHeight: 65, // ~65 ly above galactic plane
  
  // Spiral arm parameters - Milky Way has 4 major arms
  arms: [
    { name: 'Perseus', startAngle: 0, color: '#a8c4e8' },
    { name: 'Sagittarius-Carina', startAngle: Math.PI / 2, color: '#9bb8dc' },
    { name: 'Scutum-Centaurus', startAngle: Math.PI, color: '#8eacd0' },
    { name: 'Norma-Outer', startAngle: (3 * Math.PI) / 2, color: '#81a0c4' },
  ],
  armWindingTightness: 0.22, // How tightly wound (lower = tighter)
  armWidth: 3500,
};

export const MilkyWayGalaxy = ({ visualScale, showYouAreHere = true }: MilkyWayGalaxyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const youAreHereRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  
  // Scale factor for galaxy visualization
  const galaxyScale = UNITS.KM_PER_LY * visualScale;
  
  // Sun's position in 3D space
  const sunPosition = useMemo(() => {
    const x = Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistanceFromCenter * galaxyScale;
    const z = Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistanceFromCenter * galaxyScale;
    const y = MILKY_WAY.sunHeight * galaxyScale;
    return new THREE.Vector3(x, y, z);
  }, [galaxyScale]);
  
  // Generate realistic galaxy particle system
  const { positions, colors, sizes } = useMemo(() => {
    const starCount = 80000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    const color = new THREE.Color();
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const rand = Math.random();
      
      // Distribution: 20% bulge/bar, 80% disk
      const isBulge = rand < 0.12;
      const isBar = rand >= 0.12 && rand < 0.20;
      
      if (isBulge) {
        // Central bulge - ellipsoidal, denser toward center
        const r = Math.pow(Math.random(), 0.7) * MILKY_WAY.bulgeRadius * galaxyScale;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = r * Math.cos(phi) * 0.5; // Flattened
        positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        
        // Bulge is yellow/orange (old population II stars)
        color.setHSL(0.08 + Math.random() * 0.04, 0.6 + Math.random() * 0.2, 0.7 + Math.random() * 0.25);
        sizes[i] = (0.6 + Math.random() * 0.4) * galaxyScale * 150;
        
      } else if (isBar) {
        // Central bar structure
        const barPos = (Math.random() - 0.5) * MILKY_WAY.barLength * galaxyScale;
        const barWidth = (Math.random() - 0.5) * MILKY_WAY.barWidth * galaxyScale;
        const barAngle = Math.PI * 0.15; // Bar is tilted ~15-30 degrees
        
        positions[i3] = barPos * Math.cos(barAngle) - barWidth * Math.sin(barAngle);
        positions[i3 + 1] = (Math.random() - 0.5) * 500 * galaxyScale;
        positions[i3 + 2] = barPos * Math.sin(barAngle) + barWidth * Math.cos(barAngle);
        
        color.setHSL(0.1 + Math.random() * 0.03, 0.5 + Math.random() * 0.2, 0.65 + Math.random() * 0.25);
        sizes[i] = (0.5 + Math.random() * 0.3) * galaxyScale * 120;
        
      } else {
        // Disk stars following logarithmic spiral arms
        const armIndex = Math.floor(Math.random() * 4);
        const arm = MILKY_WAY.arms[armIndex];
        
        // Logarithmic spiral: theta = a * ln(r/r0)
        // Or parametric: r = r0 * e^(b*theta)
        const t = Math.pow(Math.random(), 0.5); // Bias toward outer regions for visibility
        const r = (3000 + t * (MILKY_WAY.diskRadius - 3000)) * galaxyScale;
        
        // Logarithmic spiral equation
        const spiralAngle = arm.startAngle + Math.log(r / (3000 * galaxyScale)) / MILKY_WAY.armWindingTightness;
        
        // Add spread around the arm - Gaussian-like distribution
        const spreadFactor = 1 - Math.exp(-r / (MILKY_WAY.diskRadius * galaxyScale * 0.3));
        const armSpread = MILKY_WAY.armWidth * galaxyScale * spreadFactor;
        const gaussianSpread = (Math.random() + Math.random() + Math.random() - 1.5) * armSpread * 0.7;
        const angleSpread = gaussianSpread / (r + 1);
        
        const finalAngle = spiralAngle + angleSpread;
        
        // Add some inter-arm stars (30% of disk stars)
        const isInterArm = Math.random() < 0.3;
        const radialSpread = isInterArm 
          ? (Math.random() - 0.5) * armSpread * 3 
          : (Math.random() - 0.5) * armSpread * 0.5;
        
        positions[i3] = Math.cos(finalAngle) * (r + radialSpread);
        
        // Disk thickness decreases with radius (exponential)
        const heightScale = Math.exp(-r / (MILKY_WAY.diskRadius * galaxyScale * 0.4));
        positions[i3 + 1] = (Math.random() - 0.5) * MILKY_WAY.diskThickness * galaxyScale * heightScale;
        
        positions[i3 + 2] = Math.sin(finalAngle) * (r + radialSpread);
        
        // Color based on position
        const distFromArm = Math.abs(gaussianSpread) / armSpread;
        if (distFromArm < 0.3 && Math.random() < 0.15) {
          // Young blue stars in arm cores (star-forming regions)
          color.setHSL(0.58 + Math.random() * 0.08, 0.7 + Math.random() * 0.3, 0.75 + Math.random() * 0.2);
          sizes[i] = (0.4 + Math.random() * 0.5) * galaxyScale * 100;
        } else if (distFromArm < 0.5 && Math.random() < 0.1) {
          // Pink/red nebular regions
          color.setHSL(0.95 + Math.random() * 0.1, 0.6 + Math.random() * 0.3, 0.6 + Math.random() * 0.2);
          sizes[i] = (0.3 + Math.random() * 0.3) * galaxyScale * 80;
        } else {
          // General stellar population (white/yellow)
          color.setHSL(0.12 + Math.random() * 0.08, 0.2 + Math.random() * 0.3, 0.7 + Math.random() * 0.3);
          sizes[i] = (0.2 + Math.random() * 0.4) * galaxyScale * 60;
        }
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
      const scale = 1 + Math.sin(t * 2) * 0.15;
      youAreHereRef.current.scale.setScalar(scale);
      
      // Expanding pulse ring
      const pulsePhase = (t * 0.8) % 1;
      const pulseScale = 1 + pulsePhase * 3;
      const pulseOpacity = (1 - pulsePhase) * 0.6;
      pulseRef.current.scale.setScalar(pulseScale);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = pulseOpacity;
    }
  });
  
  const markerSize = galaxyScale * 400;
  
  return (
    <group ref={groupRef}>
      {/* Galaxy particle system */}
      <points>
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
            varying float vSize;
            void main() {
              vColor = color;
              vSize = size;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (400.0 / -mvPosition.z);
              gl_PointSize = clamp(gl_PointSize, 0.5, 80.0);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying float vSize;
            void main() {
              float r = distance(gl_PointCoord, vec2(0.5));
              if (r > 0.5) discard;
              
              // Soft glow falloff
              float alpha = 1.0 - smoothstep(0.0, 0.5, r);
              alpha = pow(alpha, 1.5);
              
              // Brighter core
              float core = 1.0 - smoothstep(0.0, 0.15, r);
              vec3 finalColor = vColor + core * 0.3;
              
              gl_FragColor = vec4(finalColor, alpha * 0.85);
            }
          `}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Central bulge glow layers */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * galaxyScale * 0.5, 32, 32]} />
        <meshBasicMaterial
          color="#fff4d6"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[MILKY_WAY.bulgeRadius * galaxyScale * 0.25, 32, 32]} />
        <meshBasicMaterial
          color="#ffe8b0"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Disk glow plane */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[MILKY_WAY.diskRadius * galaxyScale * 2.2, MILKY_WAY.diskRadius * galaxyScale * 2.2]} />
        <shaderMaterial
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          uniforms={{
            diskRadius: { value: MILKY_WAY.diskRadius * galaxyScale },
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            uniform float diskRadius;
            void main() {
              vec2 center = vec2(0.5, 0.5);
              float dist = distance(vUv, center) * 2.0;
              
              // Exponential disk profile
              float brightness = exp(-dist * 2.5) * 0.15;
              
              // Add spiral hint
              vec2 pos = vUv - center;
              float angle = atan(pos.y, pos.x);
              float spiral = sin(angle * 4.0 - dist * 8.0) * 0.5 + 0.5;
              brightness += spiral * exp(-dist * 3.0) * 0.03;
              
              vec3 color = mix(vec3(0.9, 0.85, 0.7), vec3(0.7, 0.8, 1.0), dist);
              
              gl_FragColor = vec4(color, brightness);
            }
          `}
        />
      </mesh>
      
      {/* "You Are Here" marker at Sun's position */}
      {showYouAreHere && (
        <group position={sunPosition}>
          {/* Main marker - bright core */}
          <mesh ref={youAreHereRef}>
            <sphereGeometry args={[markerSize, 16, 16]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0.95} />
          </mesh>
          
          {/* Outer glow */}
          <mesh>
            <sphereGeometry args={[markerSize * 2, 16, 16]} />
            <meshBasicMaterial
              color="#00ff88"
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Pulse ring */}
          <mesh ref={pulseRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[markerSize * 0.9, markerSize * 1.3, 32]} />
            <meshBasicMaterial
              color="#00ff88"
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Vertical beacon for visibility */}
          <mesh>
            <cylinderGeometry args={[markerSize * 0.08, markerSize * 0.08, markerSize * 30, 8]} />
            <meshBasicMaterial
              color="#00ff88"
              transparent
              opacity={0.25}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};
