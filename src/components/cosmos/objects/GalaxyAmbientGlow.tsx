import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

/**
 * A fullscreen ambient glow that simulates diffuse light from the galaxy,
 * always visible regardless of camera orientation.
 */
export const GalaxyAmbientGlow = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentScale = useCosmosStore((s) => s.currentScale);
  
  // Only show at galaxy-scale views
  const visible = currentScale === 'stellar' || currentScale === 'milkyWay' || currentScale === 'localGroup' || currentScale === 'universe';
  
  const gradientTexture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Create a radial gradient from center (warm galaxy colors) to edges (fade out)
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    
    // Subtle warm glow matching galaxy center colors
    gradient.addColorStop(0, 'rgba(255, 200, 120, 0.12)');
    gradient.addColorStop(0.3, 'rgba(255, 150, 80, 0.08)');
    gradient.addColorStop(0.5, 'rgba(180, 100, 160, 0.05)');
    gradient.addColorStop(0.7, 'rgba(100, 80, 180, 0.03)');
    gradient.addColorStop(1, 'rgba(50, 60, 120, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);
  
  useFrame(({ camera }) => {
    if (meshRef.current) {
      // Always face the camera and stay in front of it
      meshRef.current.quaternion.copy(camera.quaternion);
      
      // Position it far away but within the far plane
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      meshRef.current.position.copy(camera.position).add(direction.multiplyScalar(1e10));
    }
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
      />
    </mesh>
  );
};
