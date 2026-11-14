import { bodyRadius, UNIFIED_SCALE } from '@/features/left-behind/lib/bodyScale';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Select } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';
import { getObjectById } from '../data/celestialObjects';
import { PHOTO_VS, makePhotoFS } from './Sun';
import { useSimClock } from '@/features/left-behind/state/useSimClock';

// Proxima is a ~3,000 K red dwarf: deep orange-red, with stronger reddening toward the limb.
const PROXIMA_FS = makePhotoFS('vec3(1.0, 0.20, 0.07)', 'vec3(0.55, 0.80, 0.95)', 'vec3(1.0, 0.38, 0.20)');

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
  // Transparent over the disc so the halo never whitens the star's face
  gradient.addColorStop(0, 'rgba(255, 90, 40, 0)');
  gradient.addColorStop(0.11, 'rgba(255, 90, 40, 0)');
  gradient.addColorStop(0.13, 'rgba(255, 100, 50, 0.8)');
  gradient.addColorStop(0.22, 'rgba(255, 90, 50, 0.5)');
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

/**
 * NOTE: This component renders Proxima locally at (0,0,0).
 * The parent (ProximaSystem) is responsible for positioning + world-position tracking.
 */
export const ProximaCentauri = ({ visualScale = 0.001 }: ProximaCentauriProps) => {
  const starRef = useRef<THREE.Mesh>(null);

  const matRef = useRef<THREE.ShaderMaterial>(null);
  const spriteRef = useRef<THREE.Sprite>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const wp = useMemo(() => new THREE.Vector3(), []);
  const glowTexture = useMemo(() => createRedDwarfGlowTexture(), []);
  const proxima = useMemo(() => getObjectById('proxima-centauri'), []);

  const setSelectedObject = useCosmosStore((state) => state.setSelectedObject);
  const setHoveredObject = useCosmosStore((state) => state.setHoveredObject);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    void time;
    if (starRef.current) starRef.current.rotation.y += 0.0005;
    if (matRef.current) uniforms.uTime.value = (useSimClock.getState().simDate / 1000) % 4.8e5;
    if (starRef.current) {
      starRef.current.getWorldPosition(wp);
      const d = state.camera.position.distanceTo(wp) / starSize;
      const far = THREE.MathUtils.smoothstep(d, 2.5, 20);
      if (spriteRef.current) { (spriteRef.current.material as THREE.SpriteMaterial).opacity = 0.8 * far; spriteRef.current.visible = far > 0.001; }
      if (shellRef.current) shellRef.current.visible = d > 1.4;
    }
  });

  // Physical stellar radius; glow layers remain relative to it.
  const starSize = bodyRadius(PROXIMA_DIAMETER);

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (proxima) setSelectedObject(proxima);
  };

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (proxima) setHoveredObject(proxima);
  };

  const handlePointerOut = () => {
    setHoveredObject(null);
  };

  return (
    <Select enabled>
      <group>
      {/* Star core - red dwarf surface with subtle texture */}
      <mesh 
        name="body-proxima-centauri"
        ref={starRef} 
        renderOrder={0}
        onClick={handleClick} 
        onPointerOver={handlePointerOver} 
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[starSize, 48, 48]} />
        <shaderMaterial ref={matRef} uniforms={uniforms} vertexShader={PHOTO_VS} fragmentShader={PROXIMA_FS} />
      </mesh>

      {/* Thin glow hugging the limb */}
      <mesh ref={shellRef} renderOrder={1}>
        <sphereGeometry args={[starSize * 1.15, 48, 48]} />
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
              float r = 1.0 - abs(dot(vN, vV));
              float a = pow(1.0 - r, 4.0) * 1.2;
              gl_FragColor = vec4(vec3(1.0, 0.32, 0.12) * a, a);
            }
          `}
        />
      </mesh>

      {/* Sprite-based gradient glow */}
      <sprite ref={spriteRef} renderOrder={10} scale={[starSize * 8, starSize * 8, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={true}
        />
      </sprite>

      {/* Dimmer point light */}
      <pointLight intensity={1} distance={0} decay={1} color="#FFB08A" />
      </group>
    </Select>
  );
};
