import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from './store/useCosmosStore';
import { useRef } from 'react';

const UNIFIED_SCALE = 0.001;

export const ScaleTracker = () => {
  const { camera } = useThree();
  const setCameraDistance = useCosmosStore(state => state.setCameraDistance);
  const lastUpdate = useRef(0);
  
  useFrame(() => {
    // Throttle updates to every 100ms for performance
    const now = Date.now();
    if (now - lastUpdate.current < 100) return;
    lastUpdate.current = now;

    const cam = camera as unknown as THREE.PerspectiveCamera;

    // Convert camera distance from scene units back to km
    const distanceScene = cam.position.length();
    const distanceKm = distanceScene / UNIFIED_SCALE;
    setCameraDistance(distanceKm);

    // Adaptive near/far planes for z-buffer precision at any scale
    // Use logarithmic depth buffer behavior by keeping near/far ratio manageable
    // The key is to keep far/near ratio under ~1e6 for good z-precision
    
    // Calculate optimal near plane based on distance
    // At close distances (solar system), use small near plane
    // At extreme distances (interstellar), use larger near plane
    const minNear = 0.1;
    const maxNear = distanceScene / 1e4; // At 5e10 distance, near = 5e6
    const desiredNear = Math.max(minNear, Math.min(maxNear, distanceScene / 1e5));
    
    // Far plane should be far enough to see distant objects
    // but keep far/near ratio under 1e6 for z-precision
    const desiredFar = Math.max(1e12, desiredNear * 1e6);

    const farChanged = Math.abs(cam.far - desiredFar) / Math.max(cam.far, 1) > 0.25;
    const nearChanged = Math.abs(cam.near - desiredNear) / Math.max(cam.near, 1) > 0.25;

    if (farChanged || nearChanged) {
      cam.far = desiredFar;
      cam.near = desiredNear;
      cam.updateProjectionMatrix();
    }

    // Also store for ScaleBar UI
    (window as any).__cosmosScaleDistance = distanceKm;
  });
  
  return null;
};
