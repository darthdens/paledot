import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from './store/useCosmosStore';

export const CameraController = () => {
  const { camera, controls } = useThree();
  const selectedObject = useCosmosStore((state) => state.selectedObject);
  const getObjectWorldPosition = useCosmosStore((state) => state.getObjectWorldPosition);

  const isAnimating = useRef(false);
  const animationProgress = useRef(0);

  const startPosition = useRef(new THREE.Vector3());
  const endPosition = useRef(new THREE.Vector3());

  const startTarget = useRef(new THREE.Vector3());
  const endTarget = useRef(new THREE.Vector3());

  const viewDirection = useRef(new THREE.Vector3(0.5, 0.3, 1).normalize());
  const flyToDistance = useRef(1e7);
  const followDelta = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!selectedObject || !controls) return;

    const orbitControls = controls as any;
    if (!orbitControls.target) return;

    // Start fly-to animation
    isAnimating.current = true;
    animationProgress.current = 0;

    // Store current camera position/target
    startPosition.current.copy(camera.position);
    startTarget.current.copy(orbitControls.target);

    // Direction from target -> camera (keeps the current viewing angle)
    viewDirection.current.subVectors(startPosition.current, startTarget.current);
    if (viewDirection.current.lengthSq() === 0) viewDirection.current.set(0.5, 0.3, 1);
    viewDirection.current.normalize();

    // Desired distance based on visual size
    const visualSize = selectedObject.size * 300; // matches TexturedPlanet visualScale
    flyToDistance.current = Math.max(visualSize * 4, 1e7);

    // Initial target for the selected object (use live world position when available)
    const liveTarget = getObjectWorldPosition(selectedObject.id) ?? selectedObject.position;
    endTarget.current.set(...liveTarget);
    endPosition.current
      .copy(endTarget.current)
      .addScaledVector(viewDirection.current, flyToDistance.current);
  }, [selectedObject, camera, controls, getObjectWorldPosition]);

  useFrame((_, delta) => {
    if (!controls) return;
    const orbitControls = controls as any;
    if (!orbitControls.target) return;

    // While an object is selected, keep target in sync with its live world position.
    if (selectedObject) {
      const liveTarget = getObjectWorldPosition(selectedObject.id) ?? selectedObject.position;
      endTarget.current.set(...liveTarget);

      // Keep end position consistent while animating (so we end up nicely framed)
      endPosition.current
        .copy(endTarget.current)
        .addScaledVector(viewDirection.current, flyToDistance.current);
    }

    if (isAnimating.current) {
      // Smooth easing animation
      animationProgress.current += delta * 0.8;

      if (animationProgress.current >= 1) {
        animationProgress.current = 1;
        isAnimating.current = false;
      }

      // Ease in-out cubic
      const t = animationProgress.current;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      camera.position.lerpVectors(startPosition.current, endPosition.current, eased);
      orbitControls.target.lerpVectors(startTarget.current, endTarget.current, eased);
      orbitControls.update();
      return;
    }

    // After fly-to: gently "follow" moving bodies so they stay centered.
    if (selectedObject) {
      followDelta.current
        .subVectors(endTarget.current, orbitControls.target)
        .multiplyScalar(0.2);

      orbitControls.target.add(followDelta.current);
      camera.position.add(followDelta.current);
      orbitControls.update();
    }
  });

  return null;
};
