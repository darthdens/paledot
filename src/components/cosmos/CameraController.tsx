import { bodyFlyToDistance, bodyClearance, isSolidBody, portraitFramingFactor } from '@/features/left-behind/lib/bodyScale';
import { celestialObjects } from './data/celestialObjects';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from './store/useCosmosStore';
import { UNITS } from './types';

const UNIFIED_SCALE = 0.001;

export const CameraController = () => {
  const { camera, controls, size, scene, gl } = useThree();
  const selectedObject = useCosmosStore((state) => state.selectedObject);
  const currentScale = useCosmosStore((state) => state.currentScale);
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
  const tourOffset = useRef(new THREE.Vector3());

  // Follow smoothing (avoid jitter + avoid per-frame allocations)
  const smoothedTarget = useRef(new THREE.Vector3());
  const tmpTarget = useRef(new THREE.Vector3());
  const tmpDelta = useRef(new THREE.Vector3());

  // Dev-only access to the live scene (not a second imported store) for acceptance checks.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const host = window as typeof window & { __cosmosCheck?: unknown };
    host.__cosmosCheck = {
      state: () => useCosmosStore.getState(),
      finishFlight: () => {
        if (!controls || !isAnimating.current) return;
        const orbit = controls as unknown as { target: THREE.Vector3; update: () => void };
        camera.position.copy(endPosition.current);
        orbit.target.copy(endTarget.current);
        animationProgress.current = 1;
        isAnimating.current = false;
        orbit.update();
      },
      snapshot: () => {
        const orbit = controls as unknown as { target?: THREE.Vector3 } | null;
        const radii: Record<string, number> = {};
        scene.traverse(node => {
          if (node instanceof THREE.Mesh && node.name.startsWith('body-') && node.geometry instanceof THREE.SphereGeometry) {
            radii[node.name.slice(5)] = node.geometry.parameters.radius;
          }
        });
        return { camera: camera.position.toArray(), target: orbit?.target?.toArray(), near: camera.near, radii, selected: useCosmosStore.getState().selectedObject?.id };
      },
    };
    return () => { delete host.__cosmosCheck; };
  }, [camera, controls, scene]);

  useFrame(() => { gl.domElement.setAttribute('data-scene-ready', 'true'); });

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

    const space = tourCameraTarget.space ?? 'km';

    if (space === 'scene') {
      // Positions are already in scene units (e.g., from live world positions)
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
      // Positions are in real km - scale them to scene units
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

    // Capture the intended tour offset so we can keep the stop centered even if the scene rotates/moves.
    if (tourCameraTarget.followObjectId && tourCameraTarget.offset) {
      tourOffset.current.set(
        tourCameraTarget.offset[0],
        tourCameraTarget.offset[1],
        tourCameraTarget.offset[2]
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
      // For stars, size is in km but they're very far - need appropriate viewing distance
      // For galaxies, size is in light-years - view from closer for better visibility
      // For deepSpace, positions and sizes are in light-years
      // For other objects, size is in km
      let visualSize = selectedObject.size * UNIFIED_SCALE;
      
      if (selectedObject.category === 'deepSpace') {
        // Deep space objects: these are VIEWPOINTS, not objects to look at
        // Camera positions itself at the object's position and looks at the ORIGIN (center of universe)
        visualSize = selectedObject.size * UNITS.KM_PER_LY * UNIFIED_SCALE;
        // Distance based on structure size - larger structures need more distance
        const sizeMultiplier = selectedObject.id === 'observable-universe' ? 1.5 : 0.8;
        flyToDistance.current = Math.max(visualSize * sizeMultiplier, 1e12);
      } else if (selectedObject.category === 'nebulae') {
        // Nebula size is in light-years - use a much larger viewing distance
        visualSize = selectedObject.size * UNITS.KM_PER_LY * UNIFIED_SCALE;
        flyToDistance.current = Math.max(visualSize * 3, 1e9);
      } else if (selectedObject.category === 'galaxies') {
        // Galaxy size is in light-years - view from close (0.4x size) to fill the screen
        visualSize = selectedObject.size * UNIFIED_SCALE;
        flyToDistance.current = Math.max(visualSize * 0.4, 1e8);
      } else if (isSolidBody(selectedObject)) {
        flyToDistance.current = bodyFlyToDistance(selectedObject.size) * portraitFramingFactor(size.width / size.height);
      } else {
        flyToDistance.current = Math.max(visualSize * 5, 50);
      }

      // Use live world position when available (for moving solar-system bodies and stars)
      // Positions in celestialObjects: solarSystem in km, stars/nebulae in light-years, galaxies in km, deepSpace in light-years
      const fallbackPos: [number, number, number] =
        selectedObject.category === 'solarSystem' || selectedObject.category === 'galaxies'
          ? [
              selectedObject.position[0] * UNIFIED_SCALE,
              selectedObject.position[1] * UNIFIED_SCALE,
              selectedObject.position[2] * UNIFIED_SCALE,
            ]
          : selectedObject.category === 'nebulae' || selectedObject.category === 'stars' || selectedObject.category === 'deepSpace'
            ? [
                // Stars, nebulae, and deepSpace positions are in light-years
                selectedObject.position[0] * UNITS.KM_PER_LY * UNIFIED_SCALE,
                selectedObject.position[1] * UNITS.KM_PER_LY * UNIFIED_SCALE,
                selectedObject.position[2] * UNITS.KM_PER_LY * UNIFIED_SCALE,
              ]
            : selectedObject.position;

      const targetPos = liveTargetPos ?? fallbackPos;

      // For deep space viewpoints: camera goes TO the position and LOOKS AT origin (center of universe)
      if (selectedObject.category === 'deepSpace') {
        // Camera position IS the object's defined position (the viewpoint)
        endPosition.current.set(targetPos[0], targetPos[1], targetPos[2]);
        // Look at the origin (center of our universe where Milky Way is)
        endTarget.current.set(0, 0, 0);
      } else {
        // For regular objects: look at the object
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
      }
    };

    const getLivePos = () => useCosmosStore.getState().objectWorldPositions[selectedObject.id];
    const currentLivePos = getLivePos();

    // For objects whose world position can change due to scene motion (orbits/galactic rotation),
    // wait until we have a runtime world position to avoid flying to stale static coordinates.
    const needsLivePos =
      selectedObject.category === 'solarSystem' ||
      selectedObject.category === 'stars' ||
      selectedObject.category === 'nebulae';
    if (needsLivePos && !currentLivePos) {
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
    return undefined;
  }, [selectedObject, camera, controls, isTouring, size.width, size.height]);

  useFrame((_, delta) => {
    if (!controls) return;
    const orbitControls = controls as any;
    if (!orbitControls.target) return;

    const ensureBodyClearance = () => {
      const positions = useCosmosStore.getState().objectWorldPositions;
      for (const body of celestialObjects) {
        if (!isSolidBody(body)) continue;
        const position = positions[body.id];
        if (!position) continue;
        tmpTarget.current.set(...position);
        tmpDelta.current.subVectors(camera.position, tmpTarget.current);
        const clearance = bodyClearance(body.size, camera.near);
        if (tmpDelta.current.length() < clearance) {
          if (tmpDelta.current.lengthSq() === 0) tmpDelta.current.set(0, 0, 1);
          camera.position.copy(tmpTarget.current).add(tmpDelta.current.setLength(clearance));
        }
      }
      orbitControls.minDistance = selectedObject && isSolidBody(selectedObject) ? bodyClearance(selectedObject.size, camera.near) : 0.001;
    };

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

      // Track moving/rotating targets during animation so the stop stays centered
      if (selectedObject) {
        const shouldTrackTourTarget =
          isTourAnimation.current &&
          isTouring &&
          tourCameraTarget?.followObjectId;

        if (shouldTrackTourTarget) {
          const followId = tourCameraTarget?.followObjectId;
          const livePos = followId ? useCosmosStore.getState().objectWorldPositions[followId] : undefined;
          if (livePos) {
            endTarget.current.set(livePos[0], livePos[1], livePos[2]);
            endPosition.current.copy(endTarget.current).add(tourOffset.current);
          }
        } else if (
          !isTourAnimation.current &&
          (selectedObject.category === 'solarSystem' ||
            selectedObject.category === 'stars' ||
            selectedObject.category === 'nebulae')
        ) {
          const livePos = useCosmosStore.getState().objectWorldPositions[selectedObject.id];
          if (livePos) {
            endTarget.current.set(livePos[0], livePos[1], livePos[2]);
            endPosition.current.copy(endTarget.current).add(cameraOffset.current);
          }
        }
      }

      orbitControls.target.lerpVectors(startTarget.current, endTarget.current, eased);

      // Huge jumps (e.g. edge of the universe -> Earth): a straight lerp stays light-years away
      // until the very last frame and then snaps. Interpolate the viewing distance in log space instead.
      const startOff = tmpDelta.current.subVectors(startPosition.current, startTarget.current);
      const endOff = tmpTarget.current.subVectors(endPosition.current, endTarget.current);
      const d0 = startOff.length();
      const d1 = endOff.length();
      if (d0 > 0 && d1 > 0 && (d0 / d1 > 100 || d1 / d0 > 100)) {
        const dist = Math.exp(Math.log(d0) + (Math.log(d1) - Math.log(d0)) * eased);
        startOff.normalize().lerp(endOff.normalize(), eased);
        if (startOff.lengthSq() < 1e-12) startOff.copy(endOff);
        startOff.normalize().multiplyScalar(dist);
        camera.position.copy(orbitControls.target).add(startOff);
      } else {
        camera.position.lerpVectors(startPosition.current, endPosition.current, eased);
      }
      ensureBodyClearance();
      orbitControls.update();
      return;
    }

    // During tour: keep the current stop centered even if the scene rotates/moves.
    if (isTouring && tourCameraTarget?.followObjectId) {
      const livePos = useCosmosStore.getState().objectWorldPositions[tourCameraTarget.followObjectId];
      if (livePos) {
        const currentTarget = orbitControls.target as THREE.Vector3;

        tmpTarget.current.set(livePos[0], livePos[1], livePos[2]);
        tmpDelta.current.subVectors(tmpTarget.current, currentTarget);

        currentTarget.copy(tmpTarget.current);
        camera.position.add(tmpDelta.current);

        ensureBodyClearance();
        orbitControls.update();
      }
      return;
    }

    ensureBodyClearance();

    // After fly-to: continuously follow the selected object (keep it centered)
    // Follow objects that can move due to orbits/galactic rotation
    if (
      selectedObject &&
      isFollowing &&
      !isTouring &&
      (selectedObject.category === 'solarSystem' ||
        selectedObject.category === 'stars' ||
        selectedObject.category === 'nebulae')
    ) {
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

        ensureBodyClearance();
        orbitControls.update();
      }
    }
  });

  return null;
};
