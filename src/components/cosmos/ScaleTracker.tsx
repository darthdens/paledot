import { useFrame, useThree } from '@react-three/fiber';
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
    
    // Convert camera distance from scene units back to km
    const distanceKm = camera.position.length() / UNIFIED_SCALE;
    setCameraDistance(distanceKm);
    
    // Also store for ScaleBar UI
    (window as any).__cosmosScaleDistance = distanceKm;
  });
  
  return null;
};
