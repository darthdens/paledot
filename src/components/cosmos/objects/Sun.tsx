import { useSimClock } from '@/features/left-behind/state/useSimClock';
import { bodyRadius, UNIFIED_SCALE } from '@/features/left-behind/lib/bodyScale';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Select } from '@react-three/postprocessing';
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

// Sunlight colour: the Sun's ~5772 K photosphere seen from space is near-white with a faint warm tint.
export const SUNLIGHT_COLOR = '#FFF6EC';

const PHOTO_VS = `
  varying vec3 vObj; varying vec3 vN; varying vec3 vV;
  void main() {
    vObj = normalize(position);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// Photosphere: Worley-cell granulation (~1,000 km cells, as observed) plus faint supergranulation,
// wavelength-dependent limb darkening (limb is darker and redder), faded by screen size to avoid shimmer.
const PHOTO_FS = `
  uniform float uTime;
  varying vec3 vObj; varying vec3 vN; varying vec3 vV;
  vec3 h3(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
    return fract(sin(p) * 43758.5453);
  }
  // returns F2-F1 style edge metric: 0 at cell walls (dark lanes), ~1 in cell centres
  float worley(vec3 p, float seed) {
    vec3 i = floor(p); vec3 f = fract(p);
    float d1 = 8.0, d2 = 8.0;
    for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
      vec3 g = vec3(float(x), float(y), float(z));
      vec3 o = h3(i + g + seed * 17.13);
      float d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
    return clamp((d2 - d1) * 1.6, 0.0, 1.0);
  }
  float granules(vec3 p, float t) {
    float k = floor(t), w = fract(t);
    return mix(worley(p, k), worley(p, k + 1.0), smoothstep(0.0, 1.0, w));
  }
  void main() {
    vec3 n = normalize(vN);
    float mu = clamp(dot(n, normalize(vV)), 0.0, 1.0);
    // Linear limb darkening, I(mu) = 1 - u(1 - mu), with u larger at shorter wavelengths
    vec3 u = vec3(0.50, 0.62, 0.74);
    vec3 limb = 1.0 - u * (1.0 - mu);

    // Granulation: unit sphere * 600 -> cells ~1,150 km across on the real Sun
    vec3 pg = vObj * 600.0;
    float px = length(fwidth(pg));            // cells per pixel
    float gFade = 1.0 - smoothstep(0.25, 0.8, px);
    float g = granules(pg, uTime / 480.0);
    float gran = mix(1.0, 0.72 + 0.4 * g, gFade * 0.9);

    // Supergranulation: ~30,000 km, very subtle
    vec3 ps = vObj * 22.0;
    float sFade = 1.0 - smoothstep(0.25, 0.8, length(fwidth(ps)));
    float sg = worley(ps, 3.0);
    float sup = mix(1.0, 0.94 + 0.08 * sg, sFade);

    vec3 base = vec3(1.0, 0.96, 0.90);         // warm white photosphere
    vec3 col = base * limb * gran * sup;
    gl_FragColor = vec4(col * 3.2, 1.0);       // HDR so bloom picks it up
  }
`;

// Sun's real diameter is 1,392,700 km
const SUN_DIAMETER = 1392700;

export const Sun = ({ position = [0, 0, 0], visualScale = UNIFIED_SCALE }: SunProps) => {
  const sunRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Sprite>(null);
  const groupRef = useRef<THREE.Group>(null);
  const worldPos = useRef(new THREE.Vector3());
  
  const photoMatRef = useRef<THREE.ShaderMaterial>(null);
  const photoUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const glowTexture = useMemo(() => createSunGlowTexture(), []);
  const outerGlowTexture = useMemo(() => createOuterGlowTexture(), []);
  
  const setSelectedObject = useCosmosStore(state => state.setSelectedObject);
  const setHoveredObject = useCosmosStore(state => state.setHoveredObject);
  const setObjectWorldPosition = useCosmosStore(state => state.setObjectWorldPosition);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (sunRef.current) {
      const clock = useSimClock.getState();
      sunRef.current.rotation.y += (2 * Math.PI / (609.12 * 3600)) * delta * (clock.isPlaying ? Math.min(clock.rate,86400) : 0);
    }
    if (photoMatRef.current) {
      // Granules evolve on the simulation clock (real lifetime ~5-10 min); wrapped to keep float precision
      photoUniforms.uTime.value = (useSimClock.getState().simDate / 1000) % 4.8e5;
    }
    if (coronaRef.current) {
      coronaRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.02);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1);
    }
    // Animate outer glow - gentle pulse
    if (outerGlowRef.current) {
      const pulseScale = 1;
      outerGlowRef.current.scale.setScalar(pulseScale);
    }

    // Update world position for camera targeting
    if (groupRef.current) {
      groupRef.current.getWorldPosition(worldPos.current);
      setObjectWorldPosition('sun', [worldPos.current.x, worldPos.current.y, worldPos.current.z]);
    }
  }, -1);

  // Use the same unified scale as everything else - no caps needed when using true proportions
  const sunSize = bodyRadius(SUN_DIAMETER);

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
    <Select enabled>
      <group ref={groupRef} position={position}>
      {/* Sun core - bright emissive */}
      <mesh 
        name="body-sun"
        ref={sunRef}
        renderOrder={0}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[sunSize, 64, 64]} />
        <shaderMaterial ref={photoMatRef} uniforms={photoUniforms} vertexShader={PHOTO_VS} fragmentShader={PHOTO_FS} />
      </mesh>

      {/* Inner corona: thin view-dependent glow just above the limb (not a solid shell) */}
      <mesh renderOrder={1}>
        <sphereGeometry args={[sunSize * 1.15, 64, 64]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          vertexShader={`
            varying vec3 vN; varying vec3 vV;
            void main() {
              vec4 wp = modelMatrix * vec4(position, 1.0);
              vN = normalize(mat3(modelMatrix) * normal);
              vV = normalize(cameraPosition - wp.xyz);
              gl_Position = projectionMatrix * viewMatrix * wp;
            }
          `}
          fragmentShader={`
            varying vec3 vN; varying vec3 vV;
            void main() {
              // Back faces: |dot| ~1 at the centre, ~0 at the shell edge
              float r = 1.0 - abs(dot(vN, vV));
              // Brightest right at the solar limb, falling off steeply outwards
              float a = pow(1.0 - r, 6.0) * 0.9;
              gl_FragColor = vec4(vec3(1.0, 0.97, 0.92) * a, a);
            }
          `}
        />
      </mesh>

      {/* Outer glow - large and soft */}
      <mesh ref={glowRef} renderOrder={3}>
        <sphereGeometry args={[sunSize * 1.5, 32, 32]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          uniforms={{
            glowColor: { value: new THREE.Color('#FFD9A0') },
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
              float d = max(0.0, 0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)));
              float intensity = pow(d, 1.5);
              gl_FragColor = vec4(glowColor, intensity * 0.8);
            }
          `}
        />
      </mesh>

      {/* Far outer glow - very soft and large */}
      <mesh renderOrder={4}>
        <sphereGeometry args={[sunSize * 2.0, 32, 32]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          uniforms={{
            glowColor: { value: new THREE.Color('#FFC27A') },
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
              float d = max(0.0, 0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)));
              float intensity = pow(d, 2.0);
              gl_FragColor = vec4(glowColor, intensity * 0.4);
            }
          `}
        />
      </mesh>

      {/* Core glow sprite - bright center (reduced) */}
      <sprite renderOrder={12} scale={[sunSize * 6, sunSize * 6, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={true}
        />
      </sprite>

      {/* Medium glow sprite - extended corona (reduced) */}
      <sprite ref={outerGlowRef} renderOrder={11} scale={[sunSize * 12, sunSize * 12, 1]}>
        <spriteMaterial
          map={outerGlowTexture}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={true}
        />
      </sprite>

      {/* Large outer glow sprite - far reaching halo (reduced) */}
      <sprite renderOrder={10} scale={[sunSize * 24, sunSize * 24, 1]}>
        <spriteMaterial
          map={outerGlowTexture}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={true}
        />
      </sprite>

      {/* Point light from sun - reduced intensity */}
      <pointLight
        intensity={12}
        distance={0}
        decay={1}
        color={SUNLIGHT_COLOR}
      />
      </group>
    </Select>
  );
};
