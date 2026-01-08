import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';

interface OortCloudProps {
  visualScale: number;
}

// Oort Cloud parameters
const OORT_CLOUD = {
  // Inner edge (Hills cloud) starts around 2,000-5,000 AU
  innerRadius: 2000 * UNITS.KM_PER_AU,
  // Outer edge extends to about 100,000-200,000 AU (nearly halfway to Alpha Centauri)
  outerRadius: 100000 * UNITS.KM_PER_AU,
  // Estimated 100 billion to 2 trillion objects
  // We'll render a representative sample
};

export const OortCloud = ({ visualScale }: OortCloudProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Generate Oort Cloud particles - spherical shell distribution
  const { positions, colors, sizes } = useMemo(() => {
    const particleCount = 8000; // Enough to suggest the structure
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const color = new THREE.Color();
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Spherical distribution with density falling off with distance
      // More objects in the inner regions (Hills cloud)
      const t = Math.pow(Math.random(), 0.3); // Bias toward inner regions
      const radius = (OORT_CLOUD.innerRadius + t * (OORT_CLOUD.outerRadius - OORT_CLOUD.innerRadius)) * visualScale;
      
      // Random point on sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi);
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // Icy objects - bluish white to gray
      const hue = 0.55 + Math.random() * 0.1; // Blue-cyan
      const saturation = 0.1 + Math.random() * 0.2;
      const lightness = 0.5 + Math.random() * 0.3;
      color.setHSL(hue, saturation, lightness);
      
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      // Very small - these are tiny icy bodies
      sizes[i] = (0.2 + Math.random() * 0.5) * visualScale * 5000;
    }
    
    return { positions, colors, sizes };
  }, [visualScale]);
  
  // Slow rotation to give sense of movement
  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.001;
    }
  });
  
  return (
    <group>
      {/* Oort Cloud particles */}
      <points ref={pointsRef}>
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
              gl_PointSize = size * (200.0 / -mvPosition.z);
              gl_PointSize = clamp(gl_PointSize, 0.3, 20.0);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            void main() {
              float r = distance(gl_PointCoord, vec2(0.5));
              if (r > 0.5) discard;
              float alpha = 1.0 - smoothstep(0.2, 0.5, r);
              gl_FragColor = vec4(vColor, alpha * 0.4);
            }
          `}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Faint spherical boundary indicator - inner edge */}
      <mesh>
        <sphereGeometry args={[OORT_CLOUD.innerRadius * visualScale, 64, 32]} />
        <meshBasicMaterial
          color="#4488aa"
          transparent
          opacity={0.02}
          wireframe
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};
