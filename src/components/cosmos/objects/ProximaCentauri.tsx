import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Stars } from '@react-three/drei';
import { useCosmosStore } from '../store/useCosmosStore';
import { UNITS } from '../types';

interface ProximaCentauriProps {
  position?: [number, number, number];
  visualScale?: number;
}

// Red dwarf glow texture - deep red with subtle orange tones
const createRedDwarfGlowTexture = () => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  
  // Warm red center → Deep red → Fade
  gradient.addColorStop(0, 'rgba(255, 200, 180, 1)');       // Warm white-pink center
  gradient.addColorStop(0.08, 'rgba(255, 160, 140, 0.9)');  // Light red
  gradient.addColorStop(0.18, 'rgba(255, 120, 100, 0.7)');  // Red
  gradient.addColorStop(0.35, 'rgba(255, 80, 60, 0.45)');   // Deep red
  gradient.addColorStop(0.55, 'rgba(200, 50, 40, 0.25)');   // Dark red
  gradient.addColorStop(0.75, 'rgba(150, 30, 30, 0.1)');    // Very dark red
  gradient.addColorStop(1, 'rgba(100, 20, 20, 0)');         // Fade to transparent

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
};

// Proxima Centauri's real diameter is about 214,550 km (0.154 solar radii)
const PROXIMA_DIAMETER = 214550;

export const ProximaCentauri = ({ visualScale = 0.001 }: ProximaCentauriProps) => {
  const starRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const worldPos = useRef(new THREE.Vector3());
  
  const glowTexture = useMemo(() => createRedDwarfGlowTexture(), []);
  
  const setSelectedObject = useCosmosStore(state => state.setSelectedObject);
  const setHoveredObject = useCosmosStore(state => state.setHoveredObject);
  const setObjectWorldPosition = useCosmosStore(state => state.setObjectWorldPosition);

  // Position at 4.24 light-years from Sun, with offset matching celestialObjects data
  // Matches: [4.24 * UNITS.KM_PER_LY, 0.5 * UNITS.KM_PER_LY, 0]
  const position: [number, number, number] = [
    4.24 * UNITS.KM_PER_LY,
    0.5 * UNITS.KM_PER_LY,
    0
  ];

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (starRef.current) {
      starRef.current.rotation.y += 0.0005; // Slower rotation for red dwarf
    }
    if (coronaRef.current) {
      coronaRef.current.scale.setScalar(1 + Math.sin(time * 1.5) * 0.015);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(time * 0.3) * 0.03);
    }

    // Update world position for camera targeting
    if (groupRef.current) {
      groupRef.current.getWorldPosition(worldPos.current);
      setObjectWorldPosition('proxima-centauri', [worldPos.current.x, worldPos.current.y, worldPos.current.z]);
    }
  }, -1);

  // Use the same unified scale as everything else - consistent with Sun
  const starSize = PROXIMA_DIAMETER * visualScale;

  const proximaObject = {
    id: 'proxima-centauri',
    name: { en: 'Proxima Centauri', fr: 'Proxima du Centaure' },
    type: 'star' as const,
    position: position,
    size: PROXIMA_DIAMETER, // Real diameter in km for camera distance calc
    color: '#ffcccb',
    distanceFromEarth: 4.24,
    distanceUnit: 'ly' as const,
    category: 'stars' as const,
    facts: {
      en: ['Closest star to the Sun', 'Red dwarf star', 'Has at least 2 exoplanets'],
      fr: ['Étoile la plus proche du Soleil', 'Naine rouge', 'Au moins 2 exoplanètes'],
    },
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setSelectedObject(proximaObject);
  };

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHoveredObject(proximaObject);
  };

  const handlePointerOut = () => {
    setHoveredObject(null);
  };

  // Position in scene units (same as Sun)
  const scenePosition: [number, number, number] = [
    position[0] * visualScale,
    position[1] * visualScale,
    position[2] * visualScale
  ];

  return (
    <group ref={groupRef} position={scenePosition}>
      {/* Regional background stars around Proxima - like solar system has background stars */}
      <Stars 
        radius={starSize * 500} 
        depth={starSize * 400} 
        count={3000} 
        factor={starSize * 50} 
        saturation={0.3} 
        fade 
        speed={0.2} 
      />

      {/* Star core - red dwarf surface */}
      <mesh 
        ref={starRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[starSize, 64, 64]} />
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
              // Animated stellar surface - more subdued for red dwarf
              vec2 uv = vUv * 6.0;
              float n = noise(uv) * 0.5 + noise(uv * 2.0) * 0.25 + noise(uv * 4.0) * 0.125;
              
              // Deep red with subtle variations
              vec3 coreColor = vec3(1.0, 0.7, 0.65);
              vec3 coolColor = vec3(0.9, 0.4, 0.35);
              vec3 surfaceColor = mix(coolColor, coreColor, n);
              
              // Red dwarfs are dimmer than the Sun but still bright
              surfaceColor *= 2.0;
              
              gl_FragColor = vec4(surfaceColor, 1.0);
            }
          `}
        />
      </mesh>

      {/* Inner corona - subtle red glow */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[starSize * 1.08, 64, 64]} />
        <meshBasicMaterial
          color="#FF9999"
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* Middle glow layer */}
      <mesh>
        <sphereGeometry args={[starSize * 1.2, 48, 48]} />
        <meshBasicMaterial
          color="#FF7777"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow - soft red */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[starSize * 1.5, 32, 32]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          uniforms={{
            glowColor: { value: new THREE.Color('#CC5555') },
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
              gl_FragColor = vec4(glowColor, intensity * 0.7);
            }
          `}
        />
      </mesh>

      {/* Far outer glow */}
      <mesh>
        <sphereGeometry args={[starSize * 2.0, 32, 32]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          uniforms={{
            glowColor: { value: new THREE.Color('#AA3333') },
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

      {/* Sprite-based gradient glow - like Sun */}
      <sprite renderOrder={-5} scale={[starSize * 8, starSize * 8, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </sprite>

      {/* Point light - red dwarf emits less light than Sun but still significant */}
      <pointLight
        intensity={2}
        distance={0}
        decay={1}
        color="#FFCCCC"
      />
    </group>
  );
};
