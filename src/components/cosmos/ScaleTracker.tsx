import { landedPins } from '@/features/left-behind/lib/pinRegistry';
import { closeViewNear, bodyRadius } from '@/features/left-behind/lib/bodyScale';
import { celestialObjects } from './data/celestialObjects';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from './store/useCosmosStore';
import { useRef } from 'react';
import { useLeftBehindStore } from '@/features/left-behind/state/useLeftBehindStore';

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
    const targetDistance = target ? cam.position.distanceTo(target) : distanceScene;
    // Following NASA hardware: allow metre-scale close-ups by tying near to the target distance.
    const followId = useLeftBehindStore.getState().followTargetId;
    // Near plane as far out as safely possible: depth precision scales with it, and a tiny near plane made
    // landed-machine close-ups shimmer. Keep it under 5% of the target distance and half the ground clearance.
    const pin = followId ? landedPins.get(followId) : undefined;
    const altitude = pin ? Math.max(1e-10, groundClearance(cam.position, pin)) : Infinity;
    const desiredNear = followId ? Math.max(1e-10, Math.min(targetDistance * 0.05, altitude * 0.5)) : closeViewNear(distanceScene, targetDistance);

    const farChanged = Math.abs(cam.far - desiredFar) / Math.max(cam.far, 1) > 0.25;
    const nearChanged = Math.abs(cam.near - desiredNear) / Math.max(cam.near, 1e-12) > 0.25;

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

/** Height of the camera above the landed pin's local ground plane (scene units). */
function groundClearance(p: THREE.Vector3, pin: { world: [number, number, number]; normal: [number, number, number]; body: string }) {
  // Altitude above the body's sphere (centre implied by the pin), so far-side views don't collapse the near plane.
  const body = celestialObjects.find(o => o.id === pin.body);
  const r = body ? bodyRadius(body.size) : 0;
  const cx = pin.world[0] - pin.normal[0] * r, cy = pin.world[1] - pin.normal[1] * r, cz = pin.world[2] - pin.normal[2] * r;
  return Math.hypot(p.x - cx, p.y - cy, p.z - cz) - r;
}
