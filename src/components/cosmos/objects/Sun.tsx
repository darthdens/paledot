import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

interface SunProps {
  position?: [number, number, number];
  visualScale?: number;
}

// Sun glow texture with color gradient: bright white center → yellow → orange → fade
const createSunGlowTexture = () => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  
  // Bright white center → Yellow → Orange → Fade
  gradient.addColorStop(0, 'rgba(255, 255, 240, 1)');       // Bright white-yellow center
  gradient.addColorStop(0.08, 'rgba(255, 245, 180, 0.9)');  // Warm white
  gradient.addColorStop(0.18, 'rgba(255, 220, 100, 0.7)');  // Yellow
  gradient.addColorStop(0.35, 'rgba(255, 180, 50, 0.45)');  // Yellow-orange
  gradient.addColorStop(0.55, 'rgba(255, 130, 30, 0.25)');  // Orange
  gradient.addColorStop(0.75, 'rgba(255, 100, 20, 0.1)');   // Deep orange
  gradient.addColorStop(1, 'rgba(255, 80, 0, 0)');          // Fade to transparent

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
};

// Outer glow texture - softer, more natural
const createOuterGlowTexture = () => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  
  // More subtle, natural gradient
  gradient.addColorStop(0, 'rgba(255, 240, 200, 0.6)');
  gradient.addColorStop(0.1, 'rgba(255, 210, 130, 0.4)');
  gradient.addColorStop(0.25, 'rgba(255, 180, 80, 0.2)');
  gradient.addColorStop(0.45, 'rgba(255, 140, 50, 0.08)');
  gradient.addColorStop(0.7, 'rgba(255, 100, 30, 0.02)');
  gradient.addColorStop(1, 'rgba(255, 80, 20, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
};

// Corona rays texture - soft rays emanating from center
const createCoronaRaysTexture = () => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const centerX = size / 2;
  const centerY = size / 2;

  // Soft radial rays
  for (let i = 0; i < 48; i++) {
    const angle = (i / 48) * Math.PI * 2;
    const length = size / 2 * (0.6 + Math.random() * 0.4);
    
    const gradient = ctx.createLinearGradient(
      centerX, centerY,
      centerX + Math.cos(angle) * length,
      centerY + Math.sin(angle) * length
    );
    
    gradient.addColorStop(0, 'rgba(255, 230, 180, 0.25)');
    gradient.addColorStop(0.4, 'rgba(255, 190, 100, 0.08)');
    gradient.addColorStop(1, 'rgba(255, 150, 60, 0)');

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle - 0.04) * length,
      centerY + Math.sin(angle - 0.04) * length
    );
    ctx.lineTo(
      centerX + Math.cos(angle + 0.04) * length,
      centerY + Math.sin(angle + 0.04) * length
    );
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
};

// Sun's real diameter is 1,392,700 km
const SUN_DIAMETER = 1392700;

export const Sun = ({ position = [0, 0, 0], visualScale = 80 }: SunProps) => {
  const sunRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const coronaRaysRef = useRef<THREE.Sprite>(null);
  const outerGlowRef = useRef<THREE.Sprite>(null);
  const groupRef = useRef<THREE.Group>(null);
  const worldPos = useRef(new THREE.Vector3());
  
  const glowTexture = useMemo(() => createSunGlowTexture(), []);
  const outerGlowTexture = useMemo(() => createOuterGlowTexture(), []);
  const coronaRaysTexture = useMemo(() => createCoronaRaysTexture(), []);
  
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
    // Animate corona rays - slow rotation and pulsing
    if (coronaRaysRef.current) {
      coronaRaysRef.current.material.rotation += 0.0003;
      coronaRaysRef.current.material.opacity = 0.35 + Math.sin(time * 0.8) * 0.1;
    }
    // Animate outer glow - gentle pulse
    if (outerGlowRef.current) {
      const pulseScale = 1 + Math.sin(time * 0.3) * 0.03;
      outerGlowRef.current.scale.setScalar(pulseScale);
    }

    // Update world position for camera targeting
    if (groupRef.current) {
      groupRef.current.getWorldPosition(worldPos.current);
      setObjectWorldPosition('sun', [worldPos.current.x, worldPos.current.y, worldPos.current.z]);
    }
  }, -1);

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
  };

  const handlePointerOut = () => {
    setHoveredObject(null);
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

      {/* Core glow sprite - bright center */}
      <sprite renderOrder={-5} scale={[sunSize * 5, sunSize * 5, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </sprite>

      {/* Medium glow sprite - extended corona */}
      <sprite ref={outerGlowRef} renderOrder={-6} scale={[sunSize * 10, sunSize * 10, 1]}>
        <spriteMaterial
          map={outerGlowTexture}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </sprite>

      {/* Corona rays - animated pulsing */}
      <sprite ref={coronaRaysRef} renderOrder={-7} scale={[sunSize * 14, sunSize * 14, 1]}>
        <spriteMaterial
          map={coronaRaysTexture}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </sprite>

      {/* Large outer glow sprite - far reaching halo */}
      <sprite renderOrder={-8} scale={[sunSize * 20, sunSize * 20, 1]}>
        <spriteMaterial
          map={outerGlowTexture}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </sprite>

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
