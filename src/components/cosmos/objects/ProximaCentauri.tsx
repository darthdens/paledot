import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

interface ProximaCentauriProps {
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
// Place at a manageable distance beyond the Oort Cloud for navigation
// Oort Cloud outer edge is ~15 trillion km = 15e9 scene units at 0.001 scale
// We place Proxima at 50 billion scene units - far beyond Oort but reachable
const PROXIMA_DISTANCE_SCENE = 5e10;

// Visual star size - proportional to Sun but scaled for visibility at distance
const STAR_SIZE = 1e7; // 10 million scene units for good visibility

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

  // Position in scene units
  const position: [number, number, number] = [
    PROXIMA_DISTANCE_SCENE,
    PROXIMA_DISTANCE_SCENE * 0.05, // Slight Y offset
    PROXIMA_DISTANCE_SCENE * 0.02  // Slight Z offset
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

  const proximaObject = {
    id: 'proxima-centauri',
    name: { en: 'Proxima Centauri', fr: 'Proxima du Centaure' },
    type: 'star' as const,
    position: position, // Already in scene units
    size: STAR_SIZE, // Use visual size for camera distance calc
    color: '#ffcccb',
    distanceFromEarth: 4.24,
    distanceUnit: 'ly' as const,
    category: 'stars' as const,
    sceneUnits: true, // Flag to tell CameraController position is already in scene units
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

  return (
    <group ref={groupRef} position={position}>
      {/* Star core - red dwarf surface */}
      <mesh 
        ref={starRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[STAR_SIZE, 48, 48]} />
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
              
              // Red dwarfs are dimmer than the Sun
              surfaceColor *= 1.8;
              
              gl_FragColor = vec4(surfaceColor, 1.0);
            }
          `}
        />
      </mesh>

      {/* Inner corona - subtle red glow */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[STAR_SIZE * 1.1, 48, 48]} />
        <meshBasicMaterial
          color="#FF8888"
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* Middle glow layer */}
      <mesh>
        <sphereGeometry args={[STAR_SIZE * 1.25, 32, 32]} />
        <meshBasicMaterial
          color="#FF6666"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow - soft red */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[STAR_SIZE * 1.6, 32, 32]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          uniforms={{
            glowColor: { value: new THREE.Color('#CC4444') },
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
              float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 1.5);
              gl_FragColor = vec4(glowColor, intensity * 0.6);
            }
          `}
        />
      </mesh>

      {/* Far outer glow */}
      <mesh>
        <sphereGeometry args={[STAR_SIZE * 2.2, 24, 24]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          uniforms={{
            glowColor: { value: new THREE.Color('#992222') },
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
              float intensity = pow(0.45 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              gl_FragColor = vec4(glowColor, intensity * 0.3);
            }
          `}
        />
      </mesh>

      {/* Sprite-based gradient glow */}
      <sprite renderOrder={-5} scale={[STAR_SIZE * 6, STAR_SIZE * 6, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </sprite>

      {/* Dim point light - red dwarfs emit much less light than the Sun */}
      <pointLight
        intensity={0.5}
        distance={0}
        decay={1}
        color="#FFCCCC"
      />
    </group>
  );
};