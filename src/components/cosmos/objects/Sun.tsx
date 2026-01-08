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
      {/* Sun core - bright emissive */}
      <mesh 
        ref={sunRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[sunSize, 64, 64]} />
        <shaderMaterial
          uniforms={{
            time: { value: 0 },
          }}
          vertexShader={`
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
              vUv = uv;
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float time;
            varying vec2 vUv;
            varying vec3 vNormal;
            
            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }
            
            float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              float a = hash(i);
              float b = hash(i + vec2(1.0, 0.0));
              float c = hash(i + vec2(0.0, 1.0));
              float d = hash(i + vec2(1.0, 1.0));
              return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }
            
            void main() {
              // Animated solar surface
              vec2 uv = vUv * 8.0;
              float n = noise(uv) * 0.5 + noise(uv * 2.0) * 0.25 + noise(uv * 4.0) * 0.125;
              
              // Bright yellow-orange core
              vec3 coreColor = vec3(1.0, 0.95, 0.7);
              vec3 hotColor = vec3(1.0, 0.8, 0.3);
              vec3 surfaceColor = mix(hotColor, coreColor, n);
              
              // Make it very bright (HDR-like)
              surfaceColor *= 2.5;
              
              gl_FragColor = vec4(surfaceColor, 1.0);
            }
          `}
        />
      </mesh>

      {/* Inner corona - bright yellow */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[sunSize * 1.08, 64, 64]} />
        <meshBasicMaterial
          color="#FFE566"
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>

      {/* Middle glow layer */}
      <mesh>
        <sphereGeometry args={[sunSize * 1.2, 48, 48]} />
        <meshBasicMaterial
          color="#FFCC00"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow - large and soft */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[sunSize * 1.5, 32, 32]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          uniforms={{
            glowColor: { value: new THREE.Color('#FF8800') },
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
              float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 1.5);
              gl_FragColor = vec4(glowColor, intensity * 0.8);
            }
          `}
        />
      </mesh>

      {/* Far outer glow - very soft and large */}
      <mesh>
        <sphereGeometry args={[sunSize * 2.0, 32, 32]} />
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
              float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              gl_FragColor = vec4(glowColor, intensity * 0.4);
            }
          `}
        />
      </mesh>

      {/* Strong point light from sun */}
      <pointLight
        intensity={8}
        distance={0}
        decay={1}
        color="#FFF8E7"
      />
    </group>
  );
};
