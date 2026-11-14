import { closeViewNear } from '@/features/left-behind/lib/bodyScale';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from './store/useCosmosStore';
import { useRef } from 'react';

const UNIFIED_SCALE = 0.001;

export const ScaleTracker = () => {
  const { camera, controls } = useThree();
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

    // Keep far/near planes adaptive so solar-system structures (e.g. Oort Cloud)
    // don't get clipped when zooming way out.
    const desiredFar = Math.max(1e12, distanceScene * 100);
    const target = (controls as { target?: THREE.Vector3 } | null)?.target;
    const desiredNear = closeViewNear(distanceScene, target ? cam.position.distanceTo(target) : distanceScene);

    const farChanged = Math.abs(cam.far - desiredFar) / Math.max(cam.far, 1) > 0.25;
    const nearChanged = Math.abs(cam.near - desiredNear) / Math.max(cam.near, 1) > 0.25;

    if (farChanged || nearChanged) {
      cam.far = desiredFar;
      cam.near = Math.min(desiredNear, desiredFar / 1000);
      cam.updateProjectionMatrix();
    }

    // Also store for ScaleBar UI
    (window as any).__cosmosScaleDistance = distanceKm;
  });
  
  return null;
};
