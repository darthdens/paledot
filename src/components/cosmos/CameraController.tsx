import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from './store/useCosmosStore';

export const CameraController = () => {
  const { camera } = useThree();
  const targetPosition = useCosmosStore(state => state.targetPosition);
  const selectedObject = useCosmosStore(state => state.selectedObject);
  
  const isAnimating = useRef(false);
  const animationProgress = useRef(0);
  const startPosition = useRef(new THREE.Vector3());
  const endPosition = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3());
  const endLookAt = useRef(new THREE.Vector3());

  useEffect(() => {
    if (selectedObject) {
      // Start fly-to animation
      isAnimating.current = true;
      animationProgress.current = 0;
      
      startPosition.current.copy(camera.position);
      
      // Calculate end position: offset from object based on its size
      const distance = Math.max(selectedObject.size * 800, 5e7);
      endPosition.current.set(
        selectedObject.position[0] + distance * 0.3,
        selectedObject.position[1] + distance * 0.2,
        selectedObject.position[2] + distance
      );
      
      // Calculate look-at points
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      startLookAt.current.copy(camera.position).add(direction.multiplyScalar(1000));
      endLookAt.current.set(...selectedObject.position);
    }
  }, [selectedObject, camera]);

  useFrame((_, delta) => {
    if (isAnimating.current) {
      // Smooth easing animation
      animationProgress.current += delta * 0.5; // Animation speed
      
      if (animationProgress.current >= 1) {
        animationProgress.current = 1;
        isAnimating.current = false;
      }
      
      // Ease in-out cubic
      const t = animationProgress.current;
      const eased = t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      // Interpolate position
      camera.position.lerpVectors(
        startPosition.current,
        endPosition.current,
        eased
      );
      
      // Interpolate look-at
      const lookAt = new THREE.Vector3().lerpVectors(
        startLookAt.current,
        endLookAt.current,
        eased
      );
      camera.lookAt(lookAt);
    }
  });

  return null;
};
