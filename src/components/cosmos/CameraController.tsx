import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from './store/useCosmosStore';

const UNIFIED_SCALE = 0.001;

export const CameraController = () => {
  const { camera, controls } = useThree();
  const selectedObject = useCosmosStore((state) => state.selectedObject);
  const objectWorldPositions = useCosmosStore((state) => state.objectWorldPositions);

  const isAnimating = useRef(false);
  const animationProgress = useRef(0);
  const animationTriggerId = useRef<string | null>(null);

  const startPosition = useRef(new THREE.Vector3());
  const endPosition = useRef(new THREE.Vector3());

  const startTarget = useRef(new THREE.Vector3());
  const endTarget = useRef(new THREE.Vector3());

  const flyToDistance = useRef(1000);
  const cameraOffset = useRef(new THREE.Vector3());

  // Trigger animation when selectedObject changes
  useEffect(() => {
    if (!selectedObject || !controls) return;

    const orbitControls = controls as any;
    if (!orbitControls.target) return;

    // Skip if we already triggered for this object
    if (animationTriggerId.current === selectedObject.id && isAnimating.current) return;
    animationTriggerId.current = selectedObject.id;

    // Start fly-to animation
    isAnimating.current = true;
    animationProgress.current = 0;

    // Store current camera position/target
    startPosition.current.copy(camera.position);
    startTarget.current.copy(orbitControls.target);

    // Desired distance based on visual size
    const visualSize = selectedObject.size * UNIFIED_SCALE;
    flyToDistance.current = Math.max(visualSize * 5, 50);

    // Get live world position or fallback to static position
    const livePos = objectWorldPositions[selectedObject.id];
    const targetPos: [number, number, number] = livePos ?? selectedObject.position;
    
    // Set target to object center
    endTarget.current.set(targetPos[0], targetPos[1], targetPos[2]);
    
    // Calculate camera position - offset from target
    cameraOffset.current.set(
      flyToDistance.current * 0.5,
      flyToDistance.current * 0.3,
      flyToDistance.current
    );
    
    endPosition.current.copy(endTarget.current).add(cameraOffset.current);
  }, [selectedObject, camera, controls, objectWorldPositions]);

  useFrame((_, delta) => {
    if (!controls) return;
    const orbitControls = controls as any;
    if (!orbitControls.target) return;

    if (isAnimating.current) {
      // Smooth easing animation
      animationProgress.current += delta * 1.2;

      if (animationProgress.current >= 1) {
        animationProgress.current = 1;
        isAnimating.current = false;
      }

      // Ease in-out cubic
      const t = animationProgress.current;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // Get current live position during animation
      if (selectedObject) {
        const livePos = objectWorldPositions[selectedObject.id];
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

    // After fly-to: continuously follow the selected object
    if (selectedObject) {
      const livePos = objectWorldPositions[selectedObject.id];
      if (livePos) {
        const targetVec = new THREE.Vector3(livePos[0], livePos[1], livePos[2]);
        const currentTarget = orbitControls.target as THREE.Vector3;
        
        // Calculate how much the object has moved
        const delta = new THREE.Vector3().subVectors(targetVec, currentTarget);
        
        // Smoothly follow the object - move both camera and target together
        const followSpeed = 0.1;
        const movement = delta.multiplyScalar(followSpeed);
        
        orbitControls.target.add(movement);
        camera.position.add(movement);
        orbitControls.update();
      }
    }
  });

  return null;
};
