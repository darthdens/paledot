import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EarthProps {
  position?: [number, number, number];
}

export const Earth = ({ position = [0, 0, 0] }: EarthProps) => {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.06;
    }
  });

  return (
    <group position={position}>
      {/* Earth sphere */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[6371, 64, 64]} />
        <meshStandardMaterial
          color="#6b93d6"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[6400, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[6600, 32, 32]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          uniforms={{
            glowColor: { value: new THREE.Color('#4da6ff') },
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
              float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              gl_FragColor = vec4(glowColor, intensity * 0.5);
            }
          `}
        />
      </mesh>

      {/* Continents effect using simple colored patches */}
      <mesh rotation={[0, 0, 0.4]}>
        <sphereGeometry args={[6372, 32, 32]} />
        <meshStandardMaterial
          color="#228B22"
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
};
