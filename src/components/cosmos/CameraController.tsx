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
import { getTour } from './data/tours';
import { encounterView, flightDuration, flightFrame, flightLength, lookBackView, pinOffset, spaceOffset, type Anchor, type CameraView } from '@/features/left-behind/lib/tourCamera';
import { getEphemeris } from '@/features/left-behind/engine/runtime';
import { getLoadedTrajectory } from '@/features/left-behind/engine/trajectory';
import { isEphemerisBody } from '@/features/left-behind/engine/ephemeris';
import { eclipticKmToScene } from '@/features/left-behind/lib/units';

const UNIFIED_SCALE = 0.001;

export const CameraController = () => {
  const { camera, controls, size, scene, gl } = useThree();
  const selectedObject = useCosmosStore((state) => state.selectedObject);
  const currentScale = useCosmosStore((state) => state.currentScale);
  const isFollowing = useCosmosStore((state) => state.isFollowing);
  const tourCameraTarget = useCosmosStore((state) => state.tourCameraTarget);
  // Left Behind tours drive the camera through the normal machine follow, so only the original tour counts as touring here.
  const isTouring = useCosmosStore((state) => state.isTouring && state.activeTourId === 'begin-at-earth');
  const followNonce = useLeftBehindStore(state => state.followNonce);
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
  // Machine follows and Left Behind tours: a followed view plus an optional flight between two views.
  type HwFlight = { start: CameraView; end: CameraView; duration: number; t: number; hop: { from: string; to: string } | null; tour: boolean };
  const hwFlight = useRef<HwFlight | null>(null);
  const followView = useRef<CameraView | null>(null);
  const followNormal = useRef<THREE.Vector3 | null>(null);
  const tmpUp = useRef(new THREE.Vector3());

  /** Live world point of an anchor, same frame as the drawn scene (planets straight from the ephemeris). */
  const anchorPoint = (anchor: Anchor, out: THREE.Vector3) => {
    if (anchor.kind === 'fixed') return out.copy(anchor.point);
    if (anchor.kind === 'body') {
      const km = getEphemeris()?.positionsAt(useSimClock.getState().simDate)[anchor.id];
      if (km) return out.set(...eclipticKmToScene(...km));
      const p = useCosmosStore.getState().objectWorldPositions[anchor.id];
      return p ? out.set(...p) : null;
    }
    const p = useCosmosStore.getState().objectWorldPositions[`hw:${anchor.id}`];
    return p ? out.set(...p) : null;
  };
  const pinOf = (anchor: Anchor) => anchor.kind === 'hw' ? landedPins.get(anchor.id) : undefined;

  /** The current camera expressed against the view being followed, so a flight starts exactly where we are. */
  const captureView = (orbit: { target: THREE.Vector3 }): CameraView => {
    let anchor: Anchor = followView.current?.anchor ?? { kind: 'fixed', point: orbit.target.clone() };
    let point = anchorPoint(anchor, new THREE.Vector3());
    if (!point) { anchor = { kind: 'fixed', point: orbit.target.clone() }; point = orbit.target.clone(); }
    return { anchor, rel: orbit.target.clone().sub(point), offset: camera.position.clone().sub(orbit.target) };
  };

  const viewPose = (view: CameraView) => {
    const point = anchorPoint(view.anchor, new THREE.Vector3());
    return point ? { target: point.add(view.rel), offset: view.offset } : null;
  };

  const startHwFlight = (start: CameraView, end: CameraView, tour: boolean) => {
    const orbit = controls as unknown as { target: THREE.Vector3; update: () => void };
    const s = viewPose(start), e = viewPose(end);
    if (!s || !e) return;
    const fromPin = pinOf(start.anchor), toPin = pinOf(end.anchor);
    const hop = fromPin && toPin && fromPin.body === toPin.body && start.anchor.kind === 'hw' && end.anchor.kind === 'hw' && start.anchor.id !== end.anchor.id
      ? { from: start.anchor.id, to: end.anchor.id } : null;
    const sphere = hop && toPin ? { centre: new THREE.Vector3(...toPin.centre), radius: 0 } : undefined;
    const duration = flightDuration(flightLength({ startTarget: s.target, endTarget: e.target, startOffset: s.offset, endOffset: e.offset, sphere })) * (tour ? 1 : 0.45);
    followView.current = end;
    followNormal.current = toPin ? new THREE.Vector3(...toPin.normal) : null;
    isAnimating.current = false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hwFlight.current = null;
      orbit.target.copy(e.target); camera.position.copy(e.target).add(e.offset); orbit.update();
      return;
    }
    hwFlight.current = { start, end, duration: Math.max(1, duration), t: 0, hop, tour };
  };

  // Follow smoothing (avoid jitter + avoid per-frame allocations)
  const smoothedTarget = useRef(new THREE.Vector3());
  const tmpTarget = useRef(new THREE.Vector3());
  const tmpDelta = useRef(new THREE.Vector3());

  // Dev-only access to the live scene (not a second imported store) for acceptance checks.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const host = window as typeof window & { __cosmosCheck?: unknown };
    host.__cosmosCheck = {
      scene,
      state: () => useCosmosStore.getState(),
      finishFlight: () => {
        if (hwFlight.current) { hwFlight.current.t = 1; return; }
        if (!controls || !isAnimating.current) return;
        const orbit = controls as unknown as { target: THREE.Vector3; update: () => void };
        camera.position.copy(endPosition.current);
        orbit.target.copy(endTarget.current);
        animationProgress.current = 1;
        isAnimating.current = false;
        orbit.update();
      },
      simClock: useSimClock,
      leftBehind: useLeftBehindStore,
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
        return { camera: camera.position.toArray(), target: orbit?.target?.toArray(), near: camera.near, radii, selected: useCosmosStore.getState().selectedObject?.id, animating: isAnimating.current || !!hwFlight.current, flight: hwFlight.current ? { t: hwFlight.current.t, duration: hwFlight.current.duration, hop: !!hwFlight.current.hop } : null, trigger: animationTriggerId.current, progress: animationProgress.current, minDistance: (controls as unknown as { minDistance?: number } | null)?.minDistance, span: trueSpanUnits.get(useLeftBehindStore.getState().selectedHardwareId ?? "") };
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
    let retry: ReturnType<typeof setTimeout> | undefined;
    const prepareFlight = () => {
    void getHardware().then(hardware => {
      if (cancelled) return;
      const live = useCosmosStore.getState().objectWorldPositions[`hw:${hardwareId}`];
      if (!live) { retry = setTimeout(prepareFlight, 100); return; }
      const machine = hardware.machines.find(m => m.trajectories.some(t => t.id === hardwareId));
      // Frame the machine at its true size so it fills the view; fall back to the data's follow distance.
      const span = trueSpanUnits.get(hardwareId);
      // Landed machines without a true size (e.g. the lunar rovers) still close in on their pin (~50 m), like the others.
      const override = useLeftBehindStore.getState().followDistanceKm;
      const distance = override ? override * UNIFIED_SCALE : span ? span * 2.2 : landedPins.has(hardwareId) ? 5e-5 : (machine?.followDistanceKm ?? 5000000) * UNIFIED_SCALE;
      const state = useCosmosStore.getState();
      const tour = state.isTouring && state.activeTourId !== 'begin-at-earth';
      const stop = tour ? getTour(state.activeTourId).stops[state.tourIndex] : undefined;
      const narrative = stop && stop.follow === `hw:${hardwareId}` ? stop : undefined;
      const pin = landedPins.get(hardwareId);
      const machinePoint = new THREE.Vector3(...live);
      let end: CameraView = { anchor: { kind: 'hw', id: hardwareId }, rel: new THREE.Vector3(), offset: pin ? pinOffset(new THREE.Vector3(...pin.normal), distance) : spaceOffset(distance) };
      const bodyId = narrative?.viewBodyId;
      if (narrative?.viewMode === 'encounter' && bodyId && isEphemerisBody(bodyId) && bodyId !== 'moon') {
        const track = getLoadedTrajectory(hardwareId);
        const body = celestialObjects.find(o => o.id === bodyId);
        const from = narrative.date && narrative.date !== 'now' ? Date.parse(narrative.date) : useSimClock.getState().simDate;
        const until = narrative.playUntil ? Date.parse(narrative.playUntil) : from + 2 * 86400000;
        const view = track && body ? encounterView(track, bodyId, bodyRadius(body.size), from, until) : null;
        if (view) end = { anchor: { kind: 'body', id: bodyId }, rel: view.rel, offset: view.offset };
      } else if (narrative?.viewMode === 'look-back') {
        const sun = useCosmosStore.getState().objectWorldPositions['sun'] ?? [0, 0, 0];
        const view = lookBackView(machinePoint, new THREE.Vector3(...sun), distance);
        if (view) end = { anchor: { kind: 'hw', id: hardwareId }, rel: view.rel, offset: view.offset };
      }
      startHwFlight(captureView(orbit), end, tour);
    }).catch(() => { /* Static-data failure must not disturb normal navigation. */ });
    };
    // Wait one scene frame for the new date's positions instead of reading stale world coordinates.
    retry = setTimeout(prepareFlight, 0);
    return () => { cancelled = true; clearTimeout(retry); hwFlight.current = null; };
  }, [hardwareId, controls, camera, isTouring, followNonce]);
  // "View on the surface": low and oblique over the landed pin, so the ground and horizon fill the view.
  const surfaceViewNonce = useLeftBehindStore(state => state.surfaceViewNonce);
  useEffect(() => {
    if (!surfaceViewNonce || !hardwareId || !controls || isTouring) return;
    let cancelled = false;
    // Queued behind the follow flight's own data read, so that flight can't override the surface view.
    void getHardware().then(() => { if (!cancelled) surfaceView(hardwareId); }).catch(() => {});
    return () => { cancelled = true; };
  }, [surfaceViewNonce]); // eslint-disable-line react-hooks/exhaustive-deps
  const surfaceView = (hardwareId: string) => {
    const pin = landedPins.get(hardwareId);
    const body = pin && celestialObjects.find(o => o.id === pin.body);
    if (!pin || !body) return;
    const orbit = controls as unknown as { target: THREE.Vector3 };
    // Eye level beside the machine (a few of its own sizes away), so it stands on the horizon at true scale.
    const span = trueSpanUnits.get(hardwareId) ?? 3e-6;
    const height = span * 0.6;
    const normal = new THREE.Vector3(...pin.normal);
    const side = new THREE.Vector3(0, 1, 0).cross(normal); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
    side.multiplyScalar(span * 3 / (height * 1.5));
    const offset = normal.clone().multiplyScalar(height).addScaledVector(side, height * 1.5);
    startHwFlight(captureView(orbit), { anchor: { kind: 'hw', id: hardwareId }, rel: new THREE.Vector3(), offset }, false);
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
    const following = !!hardwareId && !isTouring;
    if (!following) { hwFlight.current = null; followView.current = null; followNormal.current = null; }
    // On a landed machine, "up" is the local ground normal so the horizon is level; elsewhere world up.
    // While following, "up" turns gradually: a sudden change rolls the whole view in one frame.
    if (following) {
      const viewAnchor = followView.current?.anchor;
      const upPin = viewAnchor ? pinOf(viewAnchor) : landedPins.get(hardwareId);
      const desired = tmpUp.current.set(0, 1, 0);
      if (upPin) desired.set(...upPin.normal);
      const blend = 1 - Math.exp(-delta * 3);
      const next = camera.up.clone().lerp(desired, blend);
      const look = tmpDelta.current.subVectors(orbitControls.target, camera.position);
      if (next.lengthSq() > 1e-8) { next.normalize(); if (look.lengthSq() === 0 || Math.abs(next.dot(look.normalize())) < 0.995) camera.up.copy(next); }
    } else if (camera.up.y !== 1) camera.up.set(0, 1, 0);

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
        if (pin && pin.body === body.id) tmpTarget.current.set(...pin.centre);
        tmpDelta.current.subVectors(camera.position, tmpTarget.current);
        // Landed hardware sits on the surface, so following it only keeps the camera above ground.
        // Not tied to camera.near: near is derived from this clearance while following, which used to lock the camera ~10 km up.
        // On the real terrain (site DTM / global relief) under the camera, 1.5 m above the ground.
        const clearance = pin && pin.body === body.id ? pin.groundAt(camera.position.x, camera.position.y, camera.position.z) + 1.5e-6
          : hardwareId ? bodyRadius(body.size) * 1.000001 : bodyClearance(body.size, camera.near);
        if (tmpDelta.current.length() < clearance) {
          if (tmpDelta.current.lengthSq() === 0) tmpDelta.current.set(0, 0, 1);
          camera.position.copy(tmpTarget.current).add(tmpDelta.current.setLength(clearance));
        }
      }
      // Following hardware: allow zooming down to its true size (the generic 1 km floor hid it).
      orbitControls.minDistance = hardwareId ? (trueSpanUnits.get(hardwareId) ?? 1e-5) * 0.8
        : selectedObject && isSolidBody(selectedObject) ? bodyClearance(selectedObject.size, camera.near) : 0.001;
    };

    if (following && hwFlight.current) {
      const f = hwFlight.current;
      f.t = Math.min(1, f.t + delta / f.duration);
      const s0 = viewPose(f.start), e0 = viewPose(f.end);
      if (!e0) { if (!useCosmosStore.getState().isTouring) { hwFlight.current = null; } return; }
      const s1 = s0 ?? e0;
      const toPin = f.hop ? landedPins.get(f.hop.to) : undefined;
      const sphere = toPin ? { centre: new THREE.Vector3(...toPin.centre), radius: 0 } : undefined;
      const frame = flightFrame({ t: f.t, startTarget: s1.target, endTarget: e0.target, startOffset: s1.offset, endOffset: e0.offset, sphere });
      orbitControls.target.copy(frame.target);
      camera.position.copy(frame.target).add(frame.offset);
      if (frame.up) camera.up.copy(frame.up);
      if (f.t >= 1) hwFlight.current = null;
      ensureBodyClearance(); orbitControls.update(); return;
    }

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

    // Following hardware: check clearance only after the camera has moved with the machine this frame;
    // checking first compared last frame's camera with this frame's (moved) Moon/Mars and shoved it skywards.
    if (!(hardwareId && !isTouring)) ensureBodyClearance();

    if (following) {
      const live = useCosmosStore.getState().objectWorldPositions[`hw:${hardwareId}`];
      if (!live) { if (!useCosmosStore.getState().isTouring) useLeftBehindStore.getState().selectHardware(null); return; }
      // Before the first flight is prepared, follow the machine itself.
      const view = followView.current ?? { anchor: { kind: 'hw', id: hardwareId } as Anchor, rel: new THREE.Vector3(), offset: new THREE.Vector3() };
      const point = anchorPoint(view.anchor, tmpTarget.current);
      if (!point) return;
      point.add(view.rel);
      // Translate with the view's anchor (exact same-frame positions), leaving the user free to orbit and zoom.
      tmpDelta.current.subVectors(point, orbitControls.target);
      orbitControls.target.copy(point); camera.position.add(tmpDelta.current);
      // Landed machines turn with their body: carry the camera round with the ground.
      const pin = pinOf(view.anchor);
      if (pin && followNormal.current) {
        const normal = new THREE.Vector3(...pin.normal);
        const turn = new THREE.Quaternion().setFromUnitVectors(followNormal.current, normal);
        camera.position.sub(point).applyQuaternion(turn).add(point);
        followNormal.current.copy(normal);
      }
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
