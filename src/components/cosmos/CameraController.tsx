import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from './store/useCosmosStore';
import { UNITS } from './types';

const UNIFIED_SCALE = 0.001;

export const CameraController = () => {
  const { camera, controls } = useThree();
  const selectedObject = useCosmosStore((state) => state.selectedObject);
  const isFollowing = useCosmosStore((state) => state.isFollowing);
  const tourCameraTarget = useCosmosStore((state) => state.tourCameraTarget);
  const isTouring = useCosmosStore((state) => state.isTouring);

  const isAnimating = useRef(false);
  const animationProgress = useRef(0);
  const animationTriggerId = useRef<string | null>(null);
  const isTourAnimation = useRef(false);

  const startPosition = useRef(new THREE.Vector3());
  const endPosition = useRef(new THREE.Vector3());

  const startTarget = useRef(new THREE.Vector3());
  const endTarget = useRef(new THREE.Vector3());

  const flyToDistance = useRef(1000);
  const cameraOffset = useRef(new THREE.Vector3());

  // Follow smoothing (avoid jitter + avoid per-frame allocations)
  const smoothedTarget = useRef(new THREE.Vector3());
  const tmpTarget = useRef(new THREE.Vector3());
  const tmpDelta = useRef(new THREE.Vector3());

  // Handle tour camera target changes
  useEffect(() => {
    if (!tourCameraTarget || !controls || !isTouring) return;

    const orbitControls = controls as any;
    if (!orbitControls.target) return;

    // Start tour fly-to animation
    isTourAnimation.current = true;
    isAnimating.current = true;
    animationProgress.current = 0;
    animationTriggerId.current = `tour-${Date.now()}`;

    // Store current camera position/target
    startPosition.current.copy(camera.position);
    startTarget.current.copy(orbitControls.target);

    // Check if the position values are in scene units (small) or km (large)
    // If values are already small (< 1e6), they're in scene units from live positions
    // If values are large, they're in km and need scaling
    const positionMagnitude = Math.sqrt(
      tourCameraTarget.position[0] ** 2 +
      tourCameraTarget.position[1] ** 2 +
      tourCameraTarget.position[2] ** 2
    );
    
    const isAlreadyScaled = positionMagnitude < 1e9; // Live positions are already in scene units
    
    if (isAlreadyScaled) {
      // Positions are already in scene units (from live world positions)
      endPosition.current.set(
        tourCameraTarget.position[0],
        tourCameraTarget.position[1],
        tourCameraTarget.position[2]
      );
      endTarget.current.set(
        tourCameraTarget.lookAt[0],
        tourCameraTarget.lookAt[1],
        tourCameraTarget.lookAt[2]
      );
    } else {
      // Tour positions are in real km - scale them to scene units
      endPosition.current.set(
        tourCameraTarget.position[0] * UNIFIED_SCALE,
        tourCameraTarget.position[1] * UNIFIED_SCALE,
        tourCameraTarget.position[2] * UNIFIED_SCALE
      );
      endTarget.current.set(
        tourCameraTarget.lookAt[0] * UNIFIED_SCALE,
        tourCameraTarget.lookAt[1] * UNIFIED_SCALE,
        tourCameraTarget.lookAt[2] * UNIFIED_SCALE
      );
    }

    // Initialize follow smoothing
    smoothedTarget.current.copy(orbitControls.target);
  }, [tourCameraTarget, camera, controls, isTouring]);

  // Handle object selection (non-tour)
  useEffect(() => {
    if (!selectedObject || !controls || isTouring) return;

    const orbitControls = controls as any;
    if (!orbitControls.target) return;

    const startFlyTo = (liveTargetPos?: [number, number, number]) => {
      // Skip if we already triggered for this object
      if (animationTriggerId.current === selectedObject.id && isAnimating.current) return;
      animationTriggerId.current = selectedObject.id;

      // Start fly-to animation
      isTourAnimation.current = false;
      isAnimating.current = true;
      animationProgress.current = 0;

      // Store current camera position/target
      startPosition.current.copy(camera.position);
      startTarget.current.copy(orbitControls.target);

      // Desired distance based on visual size
      // For nebulae (category 'nebulae'), size is in light-years, need larger distance
      // For other objects, size is in km
      let visualSize = selectedObject.size * UNIFIED_SCALE;
      
      if (selectedObject.category === 'nebulae') {
        // Nebula size is in light-years - use a much larger viewing distance
        visualSize = selectedObject.size * UNITS.KM_PER_LY * UNIFIED_SCALE;
        flyToDistance.current = Math.max(visualSize * 3, 1e9);
      } else {
        flyToDistance.current = Math.max(visualSize * 5, 50);
      }

      // Use live world position when available (for moving solar-system bodies)
      const fallbackPos: [number, number, number] =
        selectedObject.category === 'solarSystem'
          ? [
              selectedObject.position[0] * UNIFIED_SCALE,
              selectedObject.position[1] * UNIFIED_SCALE,
              selectedObject.position[2] * UNIFIED_SCALE,
            ]
          : selectedObject.category === 'nebulae'
            ? [
                selectedObject.position[0] * UNITS.KM_PER_LY * UNIFIED_SCALE,
                selectedObject.position[1] * UNITS.KM_PER_LY * UNIFIED_SCALE,
                selectedObject.position[2] * UNITS.KM_PER_LY * UNIFIED_SCALE,
              ]
            : selectedObject.position;

      const targetPos = liveTargetPos ?? fallbackPos;

      // Set target to object center
      endTarget.current.set(targetPos[0], targetPos[1], targetPos[2]);

      // Initialize follow smoothing from the current target to avoid an initial "snap"
      smoothedTarget.current.copy(orbitControls.target);

      // Calculate camera position - offset from target
      cameraOffset.current.set(
        flyToDistance.current * 0.5,
        flyToDistance.current * 0.3,
        flyToDistance.current
      );

      endPosition.current.copy(endTarget.current).add(cameraOffset.current);
    };

    const getLivePos = () => useCosmosStore.getState().objectWorldPositions[selectedObject.id];
    const currentLivePos = getLivePos();

    // For solar system bodies, wait until we have a runtime world position to avoid repeated re-fly.
    if (selectedObject.category === 'solarSystem' && !currentLivePos) {
      let done = false;
      const unsubscribe = useCosmosStore.subscribe((state) => {
        if (done) return;
        const pos = state.objectWorldPositions[selectedObject.id];
        if (!pos) return;
        done = true;
        startFlyTo(pos);
      });

      return () => unsubscribe();
    }

    startFlyTo(currentLivePos);
  }, [selectedObject, camera, controls, isTouring]);

  useFrame((_, delta) => {
    if (!controls) return;
    const orbitControls = controls as any;
    if (!orbitControls.target) return;

    if (isAnimating.current) {
      // Slower animation speed for tour (more cinematic), faster for object selection
      const animSpeed = isTourAnimation.current ? 0.4 : 1.2;
      animationProgress.current += delta * animSpeed;

      if (animationProgress.current >= 1) {
        animationProgress.current = 1;
        isAnimating.current = false;
      }

      // Ease in-out cubic
      const t = animationProgress.current;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // For non-tour animations, track moving objects during animation
      if (!isTourAnimation.current && selectedObject) {
        const livePos = useCosmosStore.getState().objectWorldPositions[selectedObject.id];
        if (livePos) {
          endTarget.current.set(livePos[0], livePos[1], livePos[2]);
          endPosition.current.copy(endTarget.current).add(cameraOffset.current);
        }
      }

      camera.position.lerpVectors(startPosition.current, endPosition.current, eased);
      orbitControls.target.lerpVectors(startTarget.current, endTarget.current, eased);
      orbitControls.update();
      return;
    }

    // After fly-to: continuously follow the selected object (keep it centered)
    // Don't follow during tour - let the user see the full scene
    if (selectedObject && isFollowing && !isTouring) {
      const livePos = useCosmosStore.getState().objectWorldPositions[selectedObject.id];
      if (livePos) {
        const currentTarget = orbitControls.target as THREE.Vector3;

        // Get the exact live position - no smoothing for perfect tracking
        tmpTarget.current.set(livePos[0], livePos[1], livePos[2]);

        // Calculate how much the object moved since last frame
        tmpDelta.current.subVectors(tmpTarget.current, currentTarget);

        // Move both target and camera by exactly the same amount
        // This keeps the object perfectly centered with no lag
        currentTarget.copy(tmpTarget.current);
        camera.position.add(tmpDelta.current);

        orbitControls.update();
      }
    }
  });

  return null;
};
