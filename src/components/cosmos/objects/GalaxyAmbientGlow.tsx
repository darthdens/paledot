import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

/**
 * A fullscreen ambient glow that simulates diffuse light from the galaxy,
 * always visible regardless of camera orientation.
 */
export const GalaxyAmbientGlow = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const dirRef = useRef(new THREE.Vector3());

  const currentScale = useCosmosStore((s) => s.currentScale);

  // Only show at galaxy-scale views
  const visible =
    currentScale === 'stellar' ||
    currentScale === 'milkyWay' ||
    currentScale === 'localGroup' ||
    currentScale === 'universe';

  const gradientTexture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Match the galaxy center palette: yellow → orange → purple → blue → fade
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 220, 80, 0.18)');
    gradient.addColorStop(0.18, 'rgba(255, 180, 40, 0.14)');
    gradient.addColorStop(0.35, 'rgba(255, 120, 30, 0.11)');
    gradient.addColorStop(0.55, 'rgba(140, 70, 200, 0.085)');
    gradient.addColorStop(0.75, 'rgba(80, 100, 220, 0.06)');
    gradient.addColorStop(1, 'rgba(30, 50, 150, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame(({ camera }) => {
    const m = meshRef.current;
    if (!m) return;

    // Always face the camera and stay in front of it
    m.quaternion.copy(camera.quaternion);

    // Position it far away but safely within the far plane
    dirRef.current.set(0, 0, -1).applyQuaternion(camera.quaternion);
    m.position.copy(camera.position).addScaledVector(dirRef.current, 1e10);
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} renderOrder={-100}>
      <planeGeometry args={[1e12, 1e12]} />
      <meshBasicMaterial
        map={gradientTexture}
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
};
