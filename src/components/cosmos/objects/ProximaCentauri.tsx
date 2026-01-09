import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';
import { UNITS } from '../types';

interface ProximaCentauriProps {
  visualScale?: number;
}

// Red dwarf glow texture - cooler, redder than the Sun
const createRedDwarfGlowTexture = () => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  
  // Red dwarf colors: pink-white center → salmon → red → fade
  gradient.addColorStop(0, 'rgba(255, 220, 210, 1)');       // Warm white-pink center
  gradient.addColorStop(0.08, 'rgba(255, 200, 190, 0.9)');  // Light salmon
  gradient.addColorStop(0.18, 'rgba(255, 160, 150, 0.7)');  // Salmon
  gradient.addColorStop(0.35, 'rgba(255, 120, 110, 0.45)'); // Coral
  gradient.addColorStop(0.55, 'rgba(220, 80, 70, 0.25)');   // Red
  gradient.addColorStop(0.75, 'rgba(180, 60, 50, 0.1)');    // Deep red
  gradient.addColorStop(1, 'rgba(150, 40, 30, 0)');         // Fade to transparent

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
};

// Proxima Centauri diameter: ~214,550 km (about 0.154 solar radii)
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

  // Scale factor for light-year based coordinates (matching Nebula and MilkyWayGalaxy)
  const gs = UNITS.KM_PER_LY * visualScale;
  
  // Position: 4.24 light years away (position in light-years, scaled to scene units)
  const position: [number, number, number] = [
    4.24 * gs,
    0.5 * gs,
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
      glowRef.current.scale.setScalar(1 + Math.sin(time * 0.4) * 0.04);
    }

    // Update world position for camera targeting
    if (groupRef.current) {
      groupRef.current.getWorldPosition(worldPos.current);
      setObjectWorldPosition('proxima-centauri', [worldPos.current.x, worldPos.current.y, worldPos.current.z]);
    }
  }, -1);

  // Visual boost for visibility at stellar distances (similar to nebula approach)
  // Real size is 214,550 km, but at 4.24 ly away it would be invisible
  // Apply 500x boost to make it visible when flying to it
  const starSize = PROXIMA_DIAMETER * visualScale * 500;

  const starObject = {
    id: 'proxima-centauri',
    name: { en: 'Proxima Centauri', fr: 'Proxima du Centaure' },
    type: 'star' as const,
    position: position,
    size: PROXIMA_DIAMETER,
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
    setSelectedObject(starObject);
  };

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHoveredObject(starObject);
  };

  const handlePointerOut = () => {
    setHoveredObject(null);
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Star core - red dwarf surface with subtle texture */}
      <mesh 
        ref={starRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[starSize, 48, 48]} />
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
              // Subtle surface variation for red dwarf
              vec2 uv = vUv * 6.0;
              float n = noise(uv) * 0.5 + noise(uv * 2.0) * 0.25 + noise(uv * 4.0) * 0.125;
              
              // Red dwarf colors - cooler, redder
              vec3 coreColor = vec3(1.0, 0.85, 0.82);  // Warm pink-white
              vec3 coolColor = vec3(0.95, 0.55, 0.5);   // Salmon-red
              vec3 surfaceColor = mix(coolColor, coreColor, n);
              
              // Less bright than the Sun (red dwarfs are dimmer)
              surfaceColor *= 1.8;
              
              gl_FragColor = vec4(surfaceColor, 1.0);
            }
          `}
        />
      </mesh>

      {/* Inner corona - soft pink */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[starSize * 1.06, 48, 48]} />
        <meshBasicMaterial
          color="#FFB0A8"
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* Middle glow layer - coral */}
      <mesh>
        <sphereGeometry args={[starSize * 1.15, 32, 32]} />
        <meshBasicMaterial
          color="#FF8878"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow - reddish */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[starSize * 1.4, 32, 32]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          uniforms={{
            glowColor: { value: new THREE.Color('#E05040') },
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

      {/* Far outer glow - deep red, very soft */}
      <mesh>
        <sphereGeometry args={[starSize * 1.8, 24, 24]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          uniforms={{
            glowColor: { value: new THREE.Color('#B03020') },
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
              gl_FragColor = vec4(glowColor, intensity * 0.35);
            }
          `}
        />
      </mesh>

      {/* Sprite-based gradient glow */}
      <sprite renderOrder={-5} scale={[starSize * 6, starSize * 6, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </sprite>

      {/* Dimmer point light (red dwarfs are much less luminous) */}
      <pointLight
        intensity={2}
        distance={0}
        decay={1}
        color="#FFD0C8"
      />
    </group>
  );
};
