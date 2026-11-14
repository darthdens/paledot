import { bodyFlyToDistance, bodyClearance, isSolidBody, portraitFramingFactor } from '@/features/left-behind/lib/bodyScale';
import { celestialObjects } from './data/celestialObjects';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from './store/useCosmosStore';
import { UNITS } from './types';
import { bodyRadius } from '@/features/left-behind/lib/bodyScale';
import { trueSpanUnits } from '@/features/left-behind/lib/nasaModels';
import { useSimClock } from '@/features/left-behind/state/useSimClock';
import { landedPins } from '@/features/left-behind/lib/pinRegistry';
import { useLeftBehindStore } from '@/features/left-behind/state/useLeftBehindStore';
import { getHardware } from '@/features/left-behind/data/dataClient';

const UNIFIED_SCALE = 0.001;

export const CameraController = () => {
  const { camera, controls, size, scene, gl } = useThree();
  const selectedObject = useCosmosStore((state) => state.selectedObject);
  const currentScale = useCosmosStore((state) => state.currentScale);
  const isFollowing = useCosmosStore((state) => state.isFollowing);
  const tourCameraTarget = useCosmosStore((state) => state.tourCameraTarget);
  const isTouring = useCosmosStore((state) => state.isTouring);
  const hardwareId = useLeftBehindStore(state => state.followTargetId);

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
      simClock: useSimClock,
      viewPin: (id: string, radii = 1) => {
        const orbit = controls as unknown as { target: THREE.Vector3; update: () => void } | null;
        const pin = landedPins.get(id), body = pin && celestialObjects.find(o => o.id === pin.body);
        if (!orbit || !pin || !body) return false;
        orbit.target.set(...pin.world);
        camera.position.set(...pin.normal).multiplyScalar(bodyRadius(body.size) * radii).add(orbit.target); orbit.update();
        return true;
      },
      zoomTo: (distance: number) => {
        const orbit = controls as unknown as { target: THREE.Vector3; update: () => void } | null;
        if (!orbit) return;
        const dir = camera.position.clone().sub(orbit.target).normalize();
        camera.position.copy(orbit.target).addScaledVector(dir, distance); orbit.update();
      },
      snapshot: () => {
        const orbit = controls as unknown as { target?: THREE.Vector3 } | null;
        const radii: Record<string, number> = {};
        scene.traverse(node => {
          if (node instanceof THREE.Mesh && node.name.startsWith('body-') && node.geometry instanceof THREE.SphereGeometry) {
            radii[node.name.slice(5)] = node.geometry.parameters.radius;
          }
        });
        return { camera: camera.position.toArray(), target: orbit?.target?.toArray(), near: camera.near, radii, selected: useCosmosStore.getState().selectedObject?.id, animating: isAnimating.current, trigger: animationTriggerId.current, progress: animationProgress.current, minDistance: (controls as unknown as { minDistance?: number } | null)?.minDistance, span: trueSpanUnits.get(useLeftBehindStore.getState().selectedHardwareId ?? "") };
      },
    };
    return () => { delete host.__cosmosCheck; };
  }, [camera, controls, scene]);

  useFrame(() => { gl.domElement.setAttribute('data-scene-ready', 'true'); });

  useEffect(() => {
    // Planet navigation and the original tour take precedence over a machine follow.
    if (selectedObject || isTouring) useLeftBehindStore.getState().selectHardware(null);
  }, [selectedObject, isTouring]);
  useEffect(() => {
    if (!hardwareId || !controls || isTouring) return;
    const orbit = controls as unknown as { target: THREE.Vector3 };
    let cancelled = false;
    void getHardware().then(hardware => {
      if (cancelled) return;
      const live = useCosmosStore.getState().objectWorldPositions[`hw:${hardwareId}`];
      if (!live) return;
      const machine = hardware.machines.find(m => m.trajectories.some(t => t.id === hardwareId));
      // Frame the machine at its true size so it fills the view; fall back to the data's follow distance.
      const span = trueSpanUnits.get(hardwareId);
      const distance = span ? span * 2.2 : (machine?.followDistanceKm ?? 5000000) * UNIFIED_SCALE;
      startPosition.current.copy(camera.position); startTarget.current.copy(orbit.target);
      endTarget.current.set(...live); cameraOffset.current.set(distance*.5,distance*.3,distance);
      endPosition.current.copy(endTarget.current).add(cameraOffset.current);
      isTourAnimation.current = false; animationProgress.current = 0;
      isAnimating.current = true; animationTriggerId.current = `hw:${hardwareId}`;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        camera.position.copy(endPosition.current); orbit.target.copy(endTarget.current); isAnimating.current = false;
      }
    }).catch(() => { /* Static-data failure must not disturb normal navigation. */ });
    return () => { cancelled = true; if (animationTriggerId.current === `hw:${hardwareId}`) isAnimating.current = false; };
  }, [hardwareId, controls, camera, isTouring]);
  // "View on the surface": low and oblique over the landed pin, so the ground and horizon fill the view.
  const surfaceViewNonce = useLeftBehindStore(state => state.surfaceViewNonce);
  useEffect(() => {
    if (import.meta.env.DEV) console.log('SVDBG', surfaceViewNonce, hardwareId, !!controls, isTouring);
    if (!surfaceViewNonce || !hardwareId || !controls || isTouring) return;
    let cancelled = false;
    // Queued behind the follow flight's own data read, so that flight can't override the surface view.
    void getHardware().then(() => { if (!cancelled) surfaceView(hardwareId); }).catch(() => {});
    return () => { cancelled = true; };
  }, [surfaceViewNonce]); // eslint-disable-line react-hooks/exhaustive-deps
  const surfaceView = (hardwareId: string) => {
    const pin = landedPins.get(hardwareId);
    const body = pin && celestialObjects.find(o => o.id === pin.body);
    if (import.meta.env.DEV) console.log('SVDBG2', !!pin, !!body);
    if (!pin || !body) return;
    const orbit = controls as unknown as { target: THREE.Vector3 };
    // Eye level beside the machine (a few of its own sizes away), so it stands on the horizon at true scale.
    const span = trueSpanUnits.get(hardwareId) ?? 3e-6;
    const height = span * 0.6;
    const normal = new THREE.Vector3(...pin.normal);
    const side = new THREE.Vector3(0, 1, 0).cross(normal); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
    side.multiplyScalar(span * 3 / (height * 1.5));
    startPosition.current.copy(camera.position); startTarget.current.copy(orbit.target);
    endTarget.current.set(...pin.world); cameraOffset.current.copy(normal).multiplyScalar(height).addScaledVector(side, height * 1.5);
    endPosition.current.copy(endTarget.current).add(cameraOffset.current);
    isTourAnimation.current = false; animationProgress.current = 0;
    isAnimating.current = true; animationTriggerId.current = `hw:${hardwareId}`;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      camera.position.copy(endPosition.current); orbit.target.copy(endTarget.current); isAnimating.current = false;
    }
  };

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
    // On a landed machine, "up" is the local ground normal so the horizon is level; elsewhere world up.
    const upPin = hardwareId && !isTouring ? landedPins.get(hardwareId) : undefined;
    if (upPin) camera.up.set(...upPin.normal);
    else if (camera.up.y !== 1) camera.up.set(0, 1, 0);

    const ensureBodyClearance = () => {
      const positions = useCosmosStore.getState().objectWorldPositions;
      for (const body of celestialObjects) {
        if (!isSolidBody(body)) continue;
        const position = positions[body.id];
        if (!position) continue;
        tmpTarget.current.set(...position);
        // Published body positions are throttled (~0.1 s) and lag a moving Moon/Mars by many km; near a landed
        // machine use the centre implied by its pin (same frame), or the camera gets shoved off the surface.
        const pin = hardwareId ? landedPins.get(hardwareId) : undefined;
        if (pin && pin.body === body.id) tmpTarget.current.set(...pin.world).addScaledVector(tmpDelta.current.set(...pin.normal), -bodyRadius(body.size));
        tmpDelta.current.subVectors(camera.position, tmpTarget.current);
        // Landed hardware sits on the surface, so following it only keeps the camera above ground.
        // Not tied to camera.near: near is derived from this clearance while following, which used to lock the camera ~10 km up.
        const clearance = hardwareId ? bodyRadius(body.size) * 1.000001 : bodyClearance(body.size, camera.near);
        if (tmpDelta.current.length() < clearance) {
          if (tmpDelta.current.lengthSq() === 0) tmpDelta.current.set(0, 0, 1);
          camera.position.copy(tmpTarget.current).add(tmpDelta.current.setLength(clearance));
        }
      }
      // Following hardware: allow zooming down to its true size (the generic 1 km floor hid it).
      orbitControls.minDistance = hardwareId ? (trueSpanUnits.get(hardwareId) ?? 1e-5) * 0.8
        : selectedObject && isSolidBody(selectedObject) ? bodyClearance(selectedObject.size, camera.near) : 0.001;
    };

    if (isAnimating.current) {
      if (hardwareId && !isTouring) {
        const live = useCosmosStore.getState().objectWorldPositions[`hw:${hardwareId}`];
        if (live) { endTarget.current.set(...live); endPosition.current.copy(endTarget.current).add(cameraOffset.current); }
        else { isAnimating.current = false; useLeftBehindStore.getState().selectHardware(null); return; }
      }
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

    // Following hardware: check clearance only after the camera has moved with the machine this frame;
    // checking first compared last frame's camera with this frame's (moved) Moon/Mars and shoved it skywards.
    if (!(hardwareId && !isTouring)) ensureBodyClearance();

    if (hardwareId && !isTouring) {
      const live = useCosmosStore.getState().objectWorldPositions[`hw:${hardwareId}`];
      if (!live) { useLeftBehindStore.getState().selectHardware(null); return; }
      tmpTarget.current.set(...live); tmpDelta.current.subVectors(tmpTarget.current, orbitControls.target);
      orbitControls.target.copy(tmpTarget.current); camera.position.add(tmpDelta.current);
      ensureBodyClearance();
      // Zoom down to the hardware's true size (with a small margin), never inside it.
      orbitControls.minDistance = (trueSpanUnits.get(hardwareId) ?? 1e-5) * 0.8;
      orbitControls.update(); return;
    }

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
