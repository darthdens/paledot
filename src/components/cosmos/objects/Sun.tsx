import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

interface SunProps {
  position?: [number, number, number];
  visualScale?: number;
}

// Sun's real diameter is 1,392,700 km
const SUN_DIAMETER = 1392700;

export const Sun = ({ position = [0, 0, 0], visualScale = 80 }: SunProps) => {
  const sunRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const worldPos = useRef(new THREE.Vector3());
  
  const setSelectedObject = useCosmosStore(state => state.setSelectedObject);
  const setHoveredObject = useCosmosStore(state => state.setHoveredObject);
  const setObjectWorldPosition = useCosmosStore(state => state.setObjectWorldPosition);

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
    
    // Update world position for camera targeting
    if (groupRef.current) {
      groupRef.current.getWorldPosition(worldPos.current);
      setObjectWorldPosition('sun', [worldPos.current.x, worldPos.current.y, worldPos.current.z]);
    }
  });

  // Use the same unified scale as everything else - no caps needed when using true proportions
  const sunSize = SUN_DIAMETER * visualScale;

  const sunObject = {
    id: 'sun',
    name: { en: 'Sun', fr: 'Soleil' },
    type: 'star' as const,
    position: position as [number, number, number],
    size: SUN_DIAMETER,
    color: '#FDB813',
    distanceFromEarth: 149597870.7,
    distanceUnit: 'AU' as const,
    category: 'solarSystem' as const,
    facts: {
      en: ['G-type main-sequence star', 'Contains 99.86% of solar system mass', 'Surface temperature: 5,500°C'],
      fr: ['Étoile naine jaune de type G', 'Contient 99,86% de la masse du système solaire', 'Température de surface: 5 500°C'],
    },
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setSelectedObject(sunObject);
  };

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHoveredObject(sunObject);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHoveredObject(null);
    document.body.style.cursor = 'default';
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Sun core */}
      <mesh 
        ref={sunRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
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
