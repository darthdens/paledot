import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SunProps {
  position?: [number, number, number];
  scale?: number;
}

export const Sun = ({ position = [0, 0, 0], scale = 1 }: SunProps) => {
  const sunRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.001;
    }
    if (coronaRef.current) {
      coronaRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.02);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(time * 0.5) * 0.05);
    }
  });

  const sunSize = 696340 * scale;

  return (
    <group position={position}>
      {/* Sun core */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[sunSize, 64, 64]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>

      {/* Corona effect */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[sunSize * 1.1, 32, 32]} />
        <meshBasicMaterial
          color="#FF8C00"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[sunSize * 1.3, 32, 32]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          uniforms={{
            glowColor: { value: new THREE.Color('#FF6600') },
          }}
          vertexShader={`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            uniform vec3 glowColor;
            void main() {
              float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              gl_FragColor = vec4(glowColor, intensity * 0.6);
            }
          `}
        />
      </mesh>

      {/* Point light from sun */}
      <pointLight
        intensity={2}
        distance={sunSize * 100}
        decay={2}
        color="#FFF5E1"
      />
    </group>
  );
};
