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
  // Transparent over the disc itself (sprite is 6 radii wide -> disc edge at 0.167) so the halo never whitens the Sun's face
  gradient.addColorStop(0, 'rgba(255, 170, 60, 0)');
  gradient.addColorStop(0.15, 'rgba(255, 170, 60, 0)');
  gradient.addColorStop(0.17, 'rgba(255, 170, 60, 0.8)');
  gradient.addColorStop(0.25, 'rgba(255, 150, 50, 0.5)');
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

// Star point seen from the outer Solar System: bright golden core with a short soft falloff.
const createStarPointTexture = () => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 240, 200, 1)');
  gradient.addColorStop(0.08, 'rgba(255, 215, 140, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 170, 70, 0.45)');
  gradient.addColorStop(0.45, 'rgba(255, 130, 40, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 100, 20, 0)');
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
  gradient.addColorStop(0, 'rgba(255, 150, 60, 0.35)');
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

export const PHOTO_VS = `
  varying vec3 vObj; varying vec3 vN; varying vec3 vV;
  void main() {
    vObj = normalize(position);
    // View space (matrix built on the CPU in double precision) stays exact even light-years from the origin
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

// Photosphere: Worley-cell granulation (~1,000 km cells, as observed) plus faint supergranulation,
// wavelength-dependent limb darkening (limb is darker and redder), faded by screen size to avoid shimmer.
export const makePhotoFS = (base: string, limbU: string, centre: string) => `
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
    float mu = dot(n, normalize(vV));
    if (!(mu == mu)) mu = 1.0;               // guard against NaN at extreme distances
    mu = clamp(mu, 0.15, 1.0);
    // Linear limb darkening, I(mu) = 1 - u(1 - mu), with u larger at shorter wavelengths
    vec3 u = ${limbU};
    vec3 limb = 1.0 - u * (1.0 - mu);

    // Granulation: unit sphere * 600 -> cells ~1,150 km across on the real Sun
    vec3 pg = vObj * 600.0;
    float px = length(fwidth(pg));            // cells per pixel
    float gFade = 1.0 - smoothstep(0.06, 0.25, px);
    float g = granules(pg, uTime / 480.0);
    float gran = mix(1.0, 0.6 + 0.5 * g, gFade);

    // Supergranulation: ~30,000 km, very subtle
    vec3 ps = vObj * 22.0;
    float sFade = 1.0 - smoothstep(0.06, 0.25, length(fwidth(ps)));
    float sg = worley(ps, 3.0);
    float sup = mix(1.0, 0.94 + 0.08 * sg, sFade);

    vec3 base = ${base};         // familiar golden-orange look (filtered-photo style, not true colour)
    vec3 col = base * limb * gran * sup;
    // Keep output within displayable range so the colour never clips to white
    vec3 core = mix(col, ${centre}, pow(mu, 4.0) * 0.45);
    gl_FragColor = vec4(min(core, vec3(1.0)), 1.0);       // HDR so bloom picks it up
  }
`;
const PHOTO_FS = makePhotoFS('vec3(1.0, 0.55, 0.12)', 'vec3(0.45, 0.70, 0.90)', 'vec3(1.0, 0.78, 0.38)');

// Sun's real diameter is 1,392,700 km
const SUN_DIAMETER = 1392700;

export const Sun = ({ position = [0, 0, 0], visualScale = UNIFIED_SCALE }: SunProps) => {
  const sunRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Sprite>(null);
  const groupRef = useRef<THREE.Group>(null);
  const worldPos = useRef(new THREE.Vector3());
  
  const s1 = useRef<THREE.Sprite>(null), s2 = useRef<THREE.Sprite>(null), s3 = useRef<THREE.Sprite>(null);
  const coronaShellRef = useRef<THREE.Mesh>(null);
  const starRef = useRef<THREE.Sprite>(null);
  const photoMatRef = useRef<THREE.ShaderMaterial>(null);
  const photoUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const glowTexture = useMemo(() => createSunGlowTexture(), []);
  const outerGlowTexture = useMemo(() => createOuterGlowTexture(), []);
  const starPointTexture = useMemo(() => createStarPointTexture(), []);
  
  const setSelectedObject = useCosmosStore(state => state.setSelectedObject);
  const setHoveredObject = useCosmosStore(state => state.setHoveredObject);
  const setObjectWorldPosition = useCosmosStore(state => state.setObjectWorldPosition);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (sunRef.current) {
      const clock = useSimClock.getState();
      sunRef.current.rotation.y += (2 * Math.PI / (609.12 * 3600)) * delta * (clock.isPlaying ? Math.min(clock.rate,86400) : 0);
    }
    // Halo is a far-view effect (how eyes/cameras see a bright point). Fade it out smoothly up close
    // so camera-facing quads never cross the near plane and pop.
    if (groupRef.current) {
      groupRef.current.getWorldPosition(worldPos.current);
      const d = state.camera.position.distanceTo(worldPos.current) / sunSize;
      const far = THREE.MathUtils.smoothstep(d, 2.5, 20);
      const sp = [[s1, 0.9], [s2, 0.5], [s3, 0.28]] as const;
      for (const [r, o] of sp) if (r.current) { (r.current.material as THREE.SpriteMaterial).opacity = o * far; r.current.visible = far > 0.001; }
      if (coronaShellRef.current) coronaShellRef.current.visible = d > 1.4;
      // Beyond the giant planets the halo shrinks below a pixel, yet the Sun is still by far the brightest star:
      // a fixed-pixel-size star point keeps it visible (e.g. Voyager 1's look back), fading out past ~1,000 AU.
      if (starRef.current) {
        const point = THREE.MathUtils.smoothstep(d, 1000, 4000) * (1 - THREE.MathUtils.smoothstep(d, 1e5, 2e5));
        (starRef.current.material as THREE.SpriteMaterial).opacity = point;
        starRef.current.visible = point > 0.001;
      }
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
      <mesh ref={coronaShellRef} renderOrder={1}>
        <sphereGeometry args={[sunSize * 1.15, 64, 64]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          vertexShader={`
            varying vec3 vN; varying vec3 vV;
            void main() {
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vN = normalize(normalMatrix * normal);
              vV = normalize(-mv.xyz);
              gl_Position = projectionMatrix * mv;
            }
          `}
          fragmentShader={`
            varying vec3 vN; varying vec3 vV;
            void main() {
              // Back faces: |dot| ~1 at the centre, ~0 at the shell edge
              float r = 1.0 - abs(dot(vN, vV));
              // Brightest right at the solar limb, falling off steeply outwards
              float a = pow(1.0 - r, 4.0) * 1.3;
              gl_FragColor = vec4(vec3(1.0, 0.6, 0.2) * a, a);
            }
          `}
        />
      </mesh>

      {/* Core glow sprite - bright center (reduced) */}
      <sprite ref={s1} renderOrder={12} scale={[sunSize * 6, sunSize * 6, 1]}>
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
      <sprite ref={s2} renderOrder={11} scale={[sunSize * 12, sunSize * 12, 1]}>
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
      <sprite ref={s3} renderOrder={10} scale={[sunSize * 24, sunSize * 24, 1]}>
        <spriteMaterial
          map={outerGlowTexture}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={true}
        />
      </sprite>

      {/* Distant star point: constant size on screen, only far from the Sun */}
      <sprite ref={starRef} renderOrder={13} scale={[0.045, 0.045, 1]} visible={false}>
        <spriteMaterial map={starPointTexture} transparent opacity={0} sizeAttenuation={false} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={true} />
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
