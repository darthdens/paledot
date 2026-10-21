import { useRef, ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from './store/useCosmosStore';

// Fade duration in seconds
const FADE_DURATION = 1.2;

interface GalaxyFadeWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that fades all galaxy-related content (MilkyWay, Nebulae)
 * smoothly when entering/exiting star systems.
 * 
 * Uses a group with material opacity manipulation for smooth transitions.
 */
export const GalaxyFadeWrapper = ({ children }: GalaxyFadeWrapperProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentOpacity = useRef(0);

  const isInStarSystem = useCosmosStore((s) => s.isInStarSystem);
  
  // Target opacity: 0 when in star system, 1 when outside
  const targetOpacity = isInStarSystem ? 0 : 1;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Smooth opacity transition
    const diff = targetOpacity - currentOpacity.current;
    const step = delta / FADE_DURATION;
    
    if (Math.abs(diff) > 0.001) {
      currentOpacity.current += Math.sign(diff) * Math.min(Math.abs(diff), step);
    } else {
      currentOpacity.current = targetOpacity;
    }

    const opacity = currentOpacity.current;
    
    // Note: We don't set visible=false because that disables raycasting (clicks)
    // Instead we just fade opacity to 0 which still allows interaction

    // Traverse and update all materials
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Points || child instanceof THREE.Mesh || child instanceof THREE.Sprite) {
        const material = child.material;
        
        if (Array.isArray(material)) {
          material.forEach((mat) => updateMaterialOpacity(mat, opacity));
        } else if (material) {
          updateMaterialOpacity(material, opacity);
        }
      }
    });
  });

  return <group ref={groupRef}>{children}</group>;
};

// Store original opacities to scale from
const originalOpacities = new WeakMap<THREE.Material, number>();

function updateMaterialOpacity(material: THREE.Material, fadeOpacity: number) {
  // Store original opacity on first encounter
  if (!originalOpacities.has(material)) {
    const baseMat = material as THREE.MeshBasicMaterial | THREE.PointsMaterial | THREE.SpriteMaterial | THREE.ShaderMaterial;
    const originalOpacity = baseMat.opacity ?? 1;
    originalOpacities.set(material, originalOpacity);
  }

  const originalOpacity = originalOpacities.get(material) ?? 1;
  
  // For shader materials, check for uOpacity uniform
  if (material instanceof THREE.ShaderMaterial && material.uniforms?["uOpacity"]) {
    material.uniforms["uOpacity"].value = fadeOpacity;
    return;
  }

  // For standard materials, scale the original opacity
  const baseMat = material as THREE.MeshBasicMaterial | THREE.PointsMaterial | THREE.SpriteMaterial;
  if ('opacity' in baseMat) {
    baseMat.opacity = originalOpacity * fadeOpacity;
  }
}
